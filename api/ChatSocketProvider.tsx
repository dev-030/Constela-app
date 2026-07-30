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
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

const WS_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8001')
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws');

type TypingCallback = (senderId: string, isTyping: boolean) => void;

interface ChatSocketContextValue {
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  sendDirectMessage: (
    recipientId: string,
    content: string,
    imageUrl?: string,
    replyToId?: string,
  ) => void;
  sendRoomMessage: (roomId: string, content: string) => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  sendTyping: (recipientId: string, isTyping: boolean) => void;
  onTyping: (cb: TypingCallback) => () => void;
  setActiveRecipientId: (id: string | null) => void;
  sendMarkRead: (partnerId: string) => void;
  sendMessageReaction: (messageId: string, reaction: string | null, recipientId: string) => void;
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
});

export function ChatSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

  const ws = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const isMounted = useRef(true);

  // Tracks which inbox/chat screen is currently open/focused
  const activeRecipientIdRef = useRef<string | null>(null);

  // Registry of typing callbacks subscribed by screens
  const typingCallbacks = useRef<Set<TypingCallback>>(new Set());

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
        setOnlineUsers((prev) => {
          const next = { ...prev };
          data.online_ids.forEach((id: string) => {
            next[id] = true;
          });
          return next;
        });
        return;
      }

      if (data.type === 'status_update') {
        const { profile_id, status } = data;
        console.log(`[ChatSocket] status_update profile_id=${profile_id} status=${status}`);
        setOnlineUsers((prev) => ({
          ...prev,
          [profile_id]: status === 'online',
        }));
        return;
      }

      if (data.type === 'direct_message') {
        const newMsg = data.message;
        const myProfile = useProfileStore.getState().profile;
        if (!myProfile) return;

        const myId = String(myProfile.id);
        const senderId = String(newMsg.sender);
        const receiverId = String(newMsg.receiver);

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

        // Inject into chat history cache — deduplicate by id
        queryClient.setQueryData(
          ['directHistory', otherPersonId],
          (oldData: any[] | undefined) => {
            if (!oldData) return [newMsg];
            if (oldData.some((m) => String(m.id) === String(newMsg.id))) return oldData;
            return [newMsg, ...oldData];
          }
        );

        const lastMsgText = newMsg.image_url
          ? (newMsg.content ? `📷 Photo: ${newMsg.content}` : "📷 Photo")
          : (newMsg.content || "");

        // Surgically update the threads list cache for BOTH tab types.
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
              if (!oldThreads) return [updatedThread];
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
              return [updatedThread, ...oldThreads];
            }
          );
        }
        return;
      }

      if (data.type === 'room_message') {
        const newMsg = data.message;
        const roomId = String(newMsg.room);

        queryClient.setQueryData(
          ['roomMessages', roomId],
          (oldData: any[] | undefined) => {
            if (!oldData) return [newMsg];
            // If the exact same real id is already in cache, skip
            if (oldData.some((m: any) => String(m.id) === String(newMsg.id))) return oldData;
            // Remove any optimistic temp message with matching sender+content to avoid duplication
            const withoutTemp = oldData.filter(
              (m: any) =>
                !(
                  String(m.id).startsWith('temp-') &&
                  String(m.sender) === String(newMsg.sender) &&
                  m.content === newMsg.content
                )
            );
            // The FlatList is inverted so newest messages go to the front of the array
            return [newMsg, ...withoutTemp];
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
      }
    },
    [queryClient, sendMarkRead]
  );

  const connect = useCallback(() => {
    if (!accessToken) return;
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) return;

    const url = `${WS_BASE_URL}/ws/chat/?token=${accessToken}`;
    console.log('[ChatSocket] Connecting to', url);

    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      if (!isMounted.current) return;
      console.log('[ChatSocket] Connected ✅');
      setIsConnected(true);
      reconnectDelay.current = 1000;
    };

    socket.onmessage = (e) => {
      if (!isMounted.current) return;
      try {
        const data = JSON.parse(e.data);
        handleMessage(data);
      } catch (err) {
        console.error('[ChatSocket] Parse error', err);
      }
    };

    socket.onerror = (e) => {
      console.error('[ChatSocket] Error', e);
    };

    socket.onclose = (e) => {
      if (!isMounted.current) return;
      console.log('[ChatSocket] Closed', e.code, e.reason);
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
      ws.current?.close();
      ws.current = null;
    };
  }, [accessToken, connect]);

  // ----- Public API -----

  const sendDirectMessage = useCallback(
    (
      recipientId: string,
      content: string,
      imageUrl?: string,
      replyToId?: string,
    ) => {
      if (ws.current?.readyState !== WebSocket.OPEN) {
        console.warn('[ChatSocket] Cannot send — socket not open');
        return;
      }
      ws.current.send(
        JSON.stringify({
          type: 'direct_message',
          recipient_id: recipientId,
          content: content || '',
          image_url: imageUrl ?? null,
          reply_to_id: replyToId ?? null,
        })
      );
    },
    []
  );

  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(
      JSON.stringify({ type: 'typing', recipient_id: recipientId, is_typing: isTyping })
    );
  }, []);

  const sendRoomMessage = useCallback((roomId: string, content: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'room_message', room_id: roomId, content }));
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'enter_room', room_id: roomId }));
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: 'leave_room', room_id: roomId }));
  }, []);

  const onTyping = useCallback((cb: TypingCallback) => {
    typingCallbacks.current.add(cb);
    return () => {
      typingCallbacks.current.delete(cb);
    };
  }, []);

  const setActiveRecipientId = useCallback((id: string | null) => {
    console.log(`[ChatSocket] setActiveRecipientId: ${id}`);
    activeRecipientIdRef.current = id;
    if (id) {
      // Mark read immediately upon opening
      sendMarkRead(id);

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
  }, [sendMarkRead, queryClient]);

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
