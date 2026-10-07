/**
 * ChatSocketProvider — Global singleton WebSocket for all chat features.
 *
 * Architecture mirrors Payparo's UserConsumer:
 *  - One persistent connection per authenticated user session.
 *  - Handles reconnection with exponential backoff.
 *  - Injects incoming messages directly into React Query cache.
 *  - Exposes sendDirectMessage, sendRoomMessage, sendTyping via context.
 *  - Fires onTyping callbacks so screens can show typing indicators.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { WS_URL } from '@/constants/config';
import { apiClient } from '@/api/client';

type TypingCallback = (senderId: string, isTyping: boolean) => void;

function quotaIsCurrentlyExhausted(quota?: { remaining: number | null; resets_at: string }) {
  return quota?.remaining === 0 && new Date(quota.resets_at).getTime() > Date.now();
}

interface ChatSocketContextValue {
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imageUrl?: string,
    audioUrl?: string,
    audioDuration?: number,
    replyToId?: string,
    audioRef?: string,
    imageRef?: string,
  ) => void;
  sendRoomMessage: (roomId: string, content: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendTyping: (recipientId: string, isTyping: boolean) => void;
  onTyping: (cb: TypingCallback) => () => void;
  setActiveRecipientId: (id: string | null) => void;
  sendMarkRead: (partnerId: string) => void;
  sendMessageReaction: (messageId: string, reaction: string | null, recipientId: string) => void;
  queryPresence: (userId: string) => void;
}

const ChatSocketContext = createContext<ChatSocketContextValue>({
  isConnected: false,
  onlineUsers: {},
  sendDirectMessage: () => {},
  sendRoomMessage: () => {},
  joinRoom: () => {},
  leaveRoom: () => {},
  sendTyping: () => {},
  onTyping: () => () => {},
  setActiveRecipientId: () => {},
  sendMarkRead: () => {},
  sendMessageReaction: () => {},
  queryPresence: () => {},
});

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const profileId = useProfileStore((state) => state.profile?.id);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelay = useRef(1000);
  const isMounted = useRef(true);
  const lastProfileId = useRef<string | undefined>(profileId);

  // Tracks which inbox/chat screen is currently open/focused
  const activeRecipientIdRef = useRef<string | null>(null);

  // Registry of typing callbacks subscribed by screens
  const typingCallbacks = useRef<Set<TypingCallback>>(new Set());

  // Track which community rooms the user is currently viewing so we can re-join on reconnect
  const activeRoomsRef = useRef<Set<string>>(new Set());

  const sendMarkRead = useCallback((partnerId: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    console.log(`[ChatSocket] sendMarkRead to partner=${partnerId}`);
    ws.current.send(
      JSON.stringify({
        type: 'mark_read',
        partner_id: partnerId,
      })
    );
  }, []);

  const handleMessage = useCallback(
    (data: any) => {
      if (data.type === 'pong') return;

      if (data.type === 'initial_presence') {
        console.log('[ChatSocket] initial_presence:', data.online_ids);
        const map: Record<string, boolean> = {};
        (data.online_ids || []).forEach((id: any) => {
          const strId = String(id);
          map[strId] = true;
          map[strId.toLowerCase()] = true;
        });
        setOnlineUsers((prev) => ({ ...prev, ...map }));
        return;
      }

      if (data.type === 'status_update') {
        const { profile_id, status } = data;
        console.log(`[ChatSocket] status_update profile_id=${profile_id} status=${status}`);
        const isOnline = status === 'online';
        const strId = String(profile_id);
        setOnlineUsers((prev) => ({
          ...prev,
          [strId]: isOnline,
          [strId.toLowerCase()]: isOnline,
        }));
        return;
      }

      if (data.type === 'threads_changed') {
        const threadType = data.thread_type === 'friends' ? 'friends' : 'dating';
        void queryClient.invalidateQueries({ queryKey: ['messageThreads', threadType] });
        void queryClient.refetchQueries({ queryKey: ['messageThreads', threadType], type: 'all' });
        if (threadType === 'dating') {
          void queryClient.invalidateQueries({ queryKey: ['mutualMatches'] });
        } else {
          void queryClient.invalidateQueries({ queryKey: ['friends'] });
          void queryClient.invalidateQueries({ queryKey: ['myFriends'] });
          void queryClient.refetchQueries({ queryKey: ['myFriends'], type: 'all' });
          void queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
        }
        return;
      }

      if (data.type === 'subscription_policy_updated') {
        console.log('[ChatSocket] subscription_policy_updated received — refreshing profile & limits');
        void useProfileStore.getState().fetchProfile();
        void queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
        void queryClient.invalidateQueries({ queryKey: ['likesReceived'] });
        return;
      }

      if (data.type === 'direct_message') {
        if (data.quota) {
          useProfileStore.getState().updateQuota('personal_messages', data.quota);
        }
        const newMsg = data.message;
        const tempId = data.temp_id ? String(data.temp_id) : null;
        const myProfile = useProfileStore.getState().profile;
        if (!myProfile) return;

        const myId = String(myProfile.id);
        const senderId = String(newMsg.sender);
        const receiverId = String(newMsg.receiver);

        // Never let a stale or misrouted socket event enter another account's cache.
        if (senderId !== myId && receiverId !== myId) {
          console.warn('[ChatSocket] Ignored DM not belonging to the current account');
          return;
        }

        // The "other" person's ID is the key for the query cache
        const otherPersonId = senderId === myId ? receiverId : senderId;

        console.log(
          `[ChatSocket] DM from=${senderId} to=${receiverId} | cacheKey=directHistory/${otherPersonId}`
        );

        // If Jamil02 is currently viewing Jamil01's chat, mark Jamil01's new message as read immediately
        const isActiveChat = senderId !== myId && activeRecipientIdRef.current === senderId;
        if (isActiveChat) {
          sendMarkRead(senderId);
        }

        // Inject into chat history cache — replace temp in-place to preserve order
        queryClient.setQueryData(
          ['directHistory', otherPersonId],
          (oldData: any[] | undefined) => {
            if (!oldData) return [newMsg];

            // Already have the real message — just strip any lingering temp duplicate
            if (oldData.some((message) => String(message.id) === String(newMsg.id))) {
              return tempId
                ? oldData.filter((message) => String(message.id) !== tempId)
                : oldData;
            }

            // Replace the temp message IN-PLACE so it keeps its position in the list.
            // If we filter-then-prepend instead, the confirmed message jumps to index 0
            // (newest slot), pushing any later optimistic messages above it and causing
            // a visible re-ordering flicker until their echoes also arrive.
            if (tempId) {
              const idx = oldData.findIndex((message) => String(message.id) === tempId);
              if (idx !== -1) {
                const updated = [...oldData];
                updated[idx] = newMsg;
                return updated;
              }
            }

            // No temp found (e.g. incoming message from the other person) — prepend normally
            return [newMsg, ...oldData];
          }
        );

        const lastMsgText = newMsg.image_url
          ? (newMsg.content ? `📷 Photo: ${newMsg.content}` : "📷 Photo")
          : newMsg.audio_url ? "🎤 Voice message" : (newMsg.content || "");

        // Update an existing row only. The server decides whether it belongs in
        // Dating or Friends; inserting it into both leaks conversations across tabs.
        const updatedThread = {
          profile: {
            id: otherPersonId,
            username: senderId === myId ? (newMsg.receiver_name ?? '') : (newMsg.sender_name ?? ''),
            photo:    senderId === myId ? (newMsg.receiver_photo ?? '') : (newMsg.sender_photo ?? ''),
          },
          last_message: lastMsgText,
          last_message_time: newMsg.timestamp,
          unread_count: senderId === myId ? 0 : (isActiveChat ? 0 : 1),
        };

        for (const threadType of ['dating', 'friends'] as const) {
          queryClient.setQueryData(
            ['messageThreads', threadType],
            (oldThreads: any[] | undefined) => {
              if (!oldThreads) return oldThreads;
              const exists = oldThreads.some((t: any) => String(t.profile.id) === otherPersonId);
              if (exists) {
                return oldThreads.map((t: any) =>
                  String(t.profile.id) === otherPersonId
                    ? {
                        ...t,
                        last_message: updatedThread.last_message,
                        last_message_time: updatedThread.last_message_time,
                        unread_count: senderId === myId ? t.unread_count : (isActiveChat ? 0 : t.unread_count + 1)
                      }
                    : t
                );
              }
              return oldThreads;
            }
          );
        }
        return;
      }

      if (data.type === 'room_message') {
        if (data.quota) {
          useProfileStore.getState().updateQuota('community_messages', data.quota);
        }
        const newMsg = data.message;
        const tempId = data.temp_id ? String(data.temp_id) : null;
        const roomId = String(newMsg.room);
        if (!activeRoomsRef.current.has(roomId)) return;

        queryClient.setQueryData(
          ['roomMessages', roomId],
          (oldData: any[] | undefined) => {
            if (!oldData) return [newMsg];

            // Already have the real message — just strip any lingering temp duplicate
            if (oldData.some((message) => String(message.id) === String(newMsg.id))) {
              return tempId
                ? oldData.filter((message) => String(message.id) !== tempId)
                : oldData;
            }

            // Replace the temp message IN-PLACE so it keeps its exact position in the list.
            // This prevents rapid consecutive messages from swapping or jumping.
            if (tempId) {
              const idx = oldData.findIndex((message) => String(message.id) === tempId);
              if (idx !== -1) {
                const updated = [...oldData];
                updated[idx] = newMsg;
                return updated;
              }
            }

            // Fallback match if tempId was not returned in payload: match oldest matching pending message from sender
            const fallbackIdx = oldData.findIndex((message) =>
              String(message.id).startsWith('temp-') &&
              String(message.sender) === String(newMsg.sender) &&
              message.content === newMsg.content
            );
            if (fallbackIdx !== -1) {
              const updated = [...oldData];
              updated[fallbackIdx] = newMsg;
              return updated;
            }

            // No temp found (e.g. incoming message from someone else) — prepend normally
            return [newMsg, ...oldData];
          }
        );
        return;
      }

      if (data.type === 'typing') {
        const { sender_id, is_typing } = data;
        typingCallbacks.current.forEach((cb) => cb(String(sender_id), Boolean(is_typing)));
        return;
      }

      if (data.type === 'read_receipt') {
        const myProfile = useProfileStore.getState().profile;
        if (!myProfile) return;
        const myId = String(myProfile.id);
        const partnerId = data.partner_id || data.reader_id;

        console.log(`[ChatSocket] read_receipt received reader_id=${data.reader_id} partner_id=${partnerId}`);

        // Mark sent messages as read in history query cache
        queryClient.setQueryData(
          ['directHistory', partnerId],
          (oldData: any[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map((msg: any) => {
              if (String(msg.sender) === myId && !msg.read_at) {
                return { ...msg, read_at: new Date().toISOString() };
              }
              return msg;
            });
          }
        );
        return;
      }

      if (data.type === 'message_reaction') {
        const { message_id, reaction } = data;
        const cacheKeys = queryClient.getQueryCache().getAll().map(q => q.queryKey);
        cacheKeys.forEach((key) => {
          if (key[0] === 'directHistory') {
            queryClient.setQueryData(
              key,
              (oldData: any[] | undefined) => {
                if (!oldData) return oldData;
                return oldData.map((msg: any) =>
                  String(msg.id) === String(message_id) ? { ...msg, reaction } : msg
                );
              }
            );
          }
        });
        return;
      }

      if (data.type === 'error') {
        console.warn('[ChatSocket] Server error:', data.message);
        const isQuotaError = data.code === 'DAILY_PERSONAL_MESSAGE_LIMIT_REACHED' || data.code === 'DAILY_COMMUNITY_MESSAGE_LIMIT_REACHED';
        if (data.quota && (data.quota_kind === 'personal_messages' || data.quota_kind === 'community_messages')) {
          useProfileStore.getState().updateQuota(data.quota_kind, data.quota);
        }
        if (isQuotaError) {
          Alert.alert('Daily limit reached', data.message);
        } else if (data.temp_id) {
          Alert.alert('Message not sent', data.message || 'Please try again.');
        }
        if (data.temp_id) {
          queryClient.getQueryCache().getAll().forEach((query) => {
            if (query.queryKey[0] !== 'directHistory' && query.queryKey[0] !== 'roomMessages') return;
            queryClient.setQueryData(query.queryKey, (oldData: any[] | undefined) =>
              oldData?.filter((message) => String(message.id) !== String(data.temp_id))
            );
          });
        }
      }
    },
    [queryClient, sendMarkRead]
  );

  const connect = useCallback(() => {
    if (!accessToken) return;
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) return;

    const url = `${WS_URL}/ws/chat/?token=${accessToken}`;
    console.log('[ChatSocket] Connecting');

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      if (!isMounted.current || ws.current !== socket) return;
      console.log('[ChatSocket] Connected ✅');
      setIsConnected(true);
      reconnectDelay.current = 1000;
      // Re-subscribe to any community rooms that were active before reconnect
      activeRoomsRef.current.forEach((roomId) => {
        socket.send(JSON.stringify({ type: 'enter_room', room_id: roomId }));
      });
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = setInterval(() => {
        if (ws.current === socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    socket.onmessage = (e) => {
      if (!isMounted.current || ws.current !== socket) return;
      try {
        const data = JSON.parse(e.data);
        handleMessage(data);
      } catch (err) {
        console.error('[ChatSocket] Parse error', err);
      }
    };

    socket.onerror = (e) => {
      if (ws.current !== socket) return;
      console.warn('[ChatSocket] Error', e);
    };

    socket.onclose = (e) => {
      // An old account's socket may close after a new one has connected.
      // Ignore it so it cannot clear or reconnect over the current socket.
      if (!isMounted.current || ws.current !== socket) return;
      console.log('[ChatSocket] Closed', e.code, e.reason);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
      setIsConnected(false);
      ws.current = null;

      const delay = Math.min(reconnectDelay.current, 30000);
      reconnectDelay.current = delay * 2;
      console.log(`[ChatSocket] Reconnecting in ${delay}ms…`);
      reconnectTimer.current = setTimeout(() => {
        if (isMounted.current && accessToken) connect();
      }, delay);
    };
  }, [accessToken, handleMessage]);

  useEffect(() => {
    isMounted.current = true;
    if (accessToken) connect();

    return () => {
      isMounted.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
      const socket = ws.current;
      ws.current = null;
      socket?.close();
    };
  }, [accessToken, connect]);

  useEffect(() => {
    setOnlineUsers({});
    activeRecipientIdRef.current = null;
    activeRoomsRef.current.clear();
    if (profileId && lastProfileId.current && profileId !== lastProfileId.current) {
      queryClient.removeQueries({ queryKey: ['directHistory'] });
      queryClient.removeQueries({ queryKey: ['messageThreads'] });
    }
    if (profileId) lastProfileId.current = profileId;
  }, [profileId, queryClient]);

  // ----- Public API -----

  const sendDirectMessage = useCallback(
    (
      recipientId: string,
      content: string,
      imageUrl?: string,
      audioUrl?: string,
      audioDuration?: number,
      replyToId?: string,
      audioRef?: string,
      imageRef?: string,
    ) => {
      const myProfile = useProfileStore.getState().profile;
      const personalQuota = myProfile?.access?.quotas.personal_messages;
      if (quotaIsCurrentlyExhausted(personalQuota)) {
        Alert.alert('Daily limit reached', 'You have used all of today\'s personal messages.');
        return;
      }
      if (personalQuota && personalQuota.remaining != null) {
        useProfileStore.getState().updateQuota('personal_messages', {
          ...personalQuota,
          used: personalQuota.used + 1,
          remaining: Math.max(0, personalQuota.remaining - 1),
        });
      }
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;


      if (myProfile) {
        const history = queryClient.getQueryData<any[]>(['directHistory', recipientId]);
        const repliedMessage = replyToId
          ? history?.find((message) => String(message.id) === String(replyToId))
          : null;
        queryClient.setQueryData(
          ['directHistory', recipientId],
          (oldData: any[] | undefined) => [{
            id: tempId,
            sender: String(myProfile.id),
            receiver: recipientId,
            sender_name: myProfile.name || myProfile.username,
            receiver_name: '',
            sender_photo: myProfile.photos?.find((photo) => photo.is_main)?.image ?? '',
            receiver_photo: '',
            content: content || '',
            timestamp: new Date().toISOString(),
            read_at: null,
            image_url: imageUrl ?? null,
            audio_url: audioUrl ?? null,
            audio_duration: audioDuration ?? null,
            reply_to: replyToId ?? null,
            reply_to_info: repliedMessage ? {
              id: repliedMessage.id,
              content: repliedMessage.content,
              image_url: repliedMessage.image_url ?? null,
              image_url_expires_at: repliedMessage.image_url_expires_at ?? null,
              audio_url: repliedMessage.audio_url ?? null,
              sender_id: repliedMessage.sender,
              sender_name: repliedMessage.sender_name,
            } : null,
          }, ...(oldData ?? [])]
        );
      }

      const payload = {
        type: 'direct_message',
        temp_id: tempId,
        recipient_id: recipientId,
        content: content || '',
        image_url: imageUrl ?? null,
        image_ref: imageRef ?? null,
        audio_url: audioUrl ?? null,
        audio_ref: audioRef ?? null,
        audio_duration: audioDuration ?? null,
        reply_to_id: replyToId ?? null,
      };

      const removeOptimisticMessage = () => {
        queryClient.setQueryData(
          ['directHistory', recipientId],
          (oldData: any[] | undefined) => oldData?.filter((message) => message.id !== tempId)
        );
      };

      try {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(payload));
          return;
        }
      } catch {
        // The HTTP fallback below handles a socket that closed between the check and send.
      }

      console.warn('[ChatSocket] Socket not open — sending through HTTP fallback');
      void apiClient.post('/api/chat/direct/', {
        receiver: recipientId,
        temp_id: tempId,
        content: content || '',
        image_url: imageUrl ?? null,
        image_ref: imageRef ?? null,
        audio_url: audioUrl ?? null,
        audio_ref: audioRef ?? null,
        audio_duration: audioDuration ?? null,
        reply_to_id: replyToId ?? null,
      }).then((response) => {
        const { quota, ...message } = response.data;
        if (quota) useProfileStore.getState().updateQuota('personal_messages', quota);
        queryClient.setQueryData(
          ['directHistory', recipientId],
          (oldData: any[] | undefined) => {
            const data = oldData ?? [];
            if (data.some((item) => String(item.id) === String(message.id))) {
              return data.filter((message) => String(message.id) !== tempId);
            }
            const idx = data.findIndex((message) => String(message.id) === tempId);
            if (idx !== -1) {
              const updated = [...data];
              updated[idx] = message;
              return updated;
            }
            return [message, ...data];
          }
        );
      }).catch((error) => {
        removeOptimisticMessage();
        const response = error?.response?.data;
        if (response?.quota) useProfileStore.getState().updateQuota('personal_messages', response.quota);
        if (response?.code === 'DAILY_PERSONAL_MESSAGE_LIMIT_REACHED') {
          Alert.alert('Daily limit reached', response.error);
        }
        console.warn('[ChatSocket] Message send failed:', error?.message);
      });
    },
    [queryClient]
  );

  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(
      JSON.stringify({ type: 'typing', recipient_id: recipientId, is_typing: isTyping })
    );
  }, []);

  const sendRoomMessage = useCallback((roomId: string, content: string) => {
    const trimmed = content.trim();
    const myProfile = useProfileStore.getState().profile;
    if (!trimmed || !myProfile) return;
    const commQuota = myProfile.access?.quotas.community_messages;
    if (quotaIsCurrentlyExhausted(commQuota)) {
      Alert.alert('Daily limit reached', 'You have used all of today\'s community messages.');
      return;
    }
    if (commQuota && commQuota.remaining != null) {
      useProfileStore.getState().updateQuota('community_messages', {
        ...commQuota,
        used: commQuota.used + 1,
        remaining: Math.max(0, commQuota.remaining - 1),
      });
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const optimisticMessage = {
      id: tempId,
      room: String(roomId),
      sender: String(myProfile.id),
      sender_name: myProfile.name || myProfile.username,
      sender_photo: myProfile.photos?.find((photo) => photo.is_main)?.image ?? '',
      content: trimmed,
      timestamp: new Date().toISOString(),
      is_pending: true,
    };
    queryClient.setQueryData(
      ['roomMessages', roomId],
      (oldData: any[] | undefined) => [optimisticMessage, ...(oldData ?? [])]
    );

    const payload = { type: 'room_message', temp_id: tempId, room_id: String(roomId), content: trimmed };
    const removeOptimisticMessage = () => queryClient.setQueryData(
      ['roomMessages', roomId],
      (oldData: any[] | undefined) => oldData?.filter((message) => String(message.id) !== tempId)
    );

    try {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(payload));
        return;
      }
    } catch {
      // HTTP fallback below handles a socket that closed between the check and send.
    }

    void apiClient.post(`/api/chat/rooms/${roomId}/send/`, { content: trimmed, temp_id: tempId })
      .then((response) => {
        const { quota, ...message } = response.data;
        if (quota) useProfileStore.getState().updateQuota('community_messages', quota);
        queryClient.setQueryData(
          ['roomMessages', roomId],
          (oldData: any[] | undefined) => {
            const data = oldData ?? [];
            if (data.some((item) => String(item.id) === String(message.id))) {
              return data.filter((msg) => String(msg.id) !== tempId);
            }
            const idx = data.findIndex((msg) => String(msg.id) === tempId);
            if (idx !== -1) {
              const updated = [...data];
              updated[idx] = message;
              return updated;
            }
            return [message, ...data];
          }
        );
      })
      .catch((error) => {
        removeOptimisticMessage();
        const response = error?.response?.data;
        if (response?.quota) useProfileStore.getState().updateQuota('community_messages', response.quota);
        if (response?.code === 'DAILY_COMMUNITY_MESSAGE_LIMIT_REACHED') {
          Alert.alert('Daily limit reached', response.error);
        }
      });
  }, [queryClient]);

  const joinRoom = useCallback((roomId: string) => {
    activeRoomsRef.current.add(String(roomId));
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'enter_room', room_id: String(roomId) }));
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    activeRoomsRef.current.delete(String(roomId));
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'leave_room', room_id: String(roomId) }));
  }, []);

  const onTyping = useCallback((cb: TypingCallback) => {
    typingCallbacks.current.add(cb);
    return () => {
      typingCallbacks.current.delete(cb);
    };
  }, []);

  const queryPresence = useCallback((userId: string) => {
    if (!userId || ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'query_presence', user_id: userId }));
  }, []);

  const setActiveRecipientId = useCallback((id: string | null) => {
    console.log(`[ChatSocket] setActiveRecipientId: ${id}`);
    activeRecipientIdRef.current = id;
    if (id) {
      // Mark read immediately upon opening
      sendMarkRead(id);
      // Query current presence for this recipient immediately
      queryPresence(id);

      // Reset local unread_count for this user in threads list cache
      for (const threadType of ['dating', 'friends'] as const) {
        queryClient.setQueryData(
          ['messageThreads', threadType],
          (oldThreads: any[] | undefined) => {
            if (!oldThreads) return oldThreads;
            return oldThreads.map((t: any) =>
              String(t.profile.id) === id ? { ...t, unread_count: 0 } : t
            );
          }
        );
      }
    }
  }, [sendMarkRead, queryPresence, queryClient]);

  const sendMessageReaction = useCallback((messageId: string, reaction: string | null, recipientId: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    console.log(`[ChatSocket] sendMessageReaction msgId=${messageId} reaction=${reaction}`);
    ws.current.send(
      JSON.stringify({
        type: 'message_reaction',
        message_id: messageId,
        reaction: reaction,
        recipient_id: recipientId,
      })
    );
  }, []);

  return (
    <ChatSocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        sendDirectMessage,
        sendRoomMessage,
        joinRoom,
        leaveRoom,
        sendTyping,
        onTyping,
        setActiveRecipientId,
        sendMarkRead,
        sendMessageReaction,
        queryPresence,
      }}
    >
      {children}
    </ChatSocketContext.Provider>
  );
}

/** Use the global chat socket from any component */
export function useChatSocket() {
  return useContext(ChatSocketContext);
}
