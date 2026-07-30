import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

let WS_URL = process.env.EXPO_PUBLIC_API_URL?.replace('http', 'ws') || 'ws://localhost:8000';
if (Platform.OS === 'android' && WS_URL.includes('localhost')) {
  WS_URL = WS_URL.replace('localhost', '10.0.2.2');
}

export function useChatWebSocket(roomId?: string) {
  const ws = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;

    // Connect to the generic chat websocket endpoint
    const url = `${WS_URL}/ws/chat/?token=${accessToken}`;
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      // If we are currently in a room, send an enter_room event
      if (roomId) {
        ws.current?.send(JSON.stringify({ type: 'enter_room', room_id: roomId }));
      }
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'room_message') {
          const newMsg = data.message;
          const targetRoomId = newMsg.room;
          
          // Optimistically update the react-query cache for that room
          queryClient.setQueryData(['roomMessages', targetRoomId], (oldData: any) => {
            if (!oldData) return [newMsg];
            // Check if we already have it (to prevent duplicates if the sender also gets the WS broadcast)
            if (oldData.some((m: any) => m.id === newMsg.id)) {
              return oldData;
            }
            return [...oldData, newMsg];
          });
        } else if (data.type === 'direct_message') {
          const newMsg = data.message;
          const myProfile = useProfileStore.getState().profile;
          if (myProfile) {
            const senderStr = String(newMsg.sender).toLowerCase();
            const myIdStr = String(myProfile.id).toLowerCase();
            const receiverStr = String(newMsg.receiver).toLowerCase();
            
            const otherProfileId = senderStr === myIdStr ? receiverStr : senderStr;
            
            queryClient.setQueryData(['directHistory', otherProfileId], (oldData: any) => {
              if (!oldData) return [newMsg];
              if (oldData.some((m: any) => String(m.id) === String(newMsg.id))) {
                return oldData;
              }
              return [newMsg, ...oldData];
            });

            // Also update the exact original casing if different
            const originalOtherId = senderStr === myIdStr ? newMsg.receiver : newMsg.sender;
            if (originalOtherId !== otherProfileId) {
                queryClient.setQueryData(['directHistory', originalOtherId], (oldData: any) => {
                  if (!oldData) return [newMsg];
                  if (oldData.some((m: any) => String(m.id) === String(newMsg.id))) return oldData;
                  return [newMsg, ...oldData];
                });
            }

            // Refresh sidebar threads list
            queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
          }
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.current.onerror = (e) => {
      console.log('WebSocket error:', e);
    };

    ws.current.onclose = (e) => {
      console.log('WebSocket Closed:', e.code, e.reason);
    };

    return () => {
      if (roomId && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'leave_room', room_id: roomId }));
      }
      ws.current?.close();
    };
  }, [accessToken, roomId, queryClient]);

  const sendMessage = (content: string) => {
    if (ws.current?.readyState === WebSocket.OPEN && roomId) {
      ws.current.send(
        JSON.stringify({
          type: 'room_message',
          room_id: roomId,
          content,
        })
      );
    }
  };

  const sendDirectMessage = (recipientId: string, content: string, imageUrl?: string, replyToId?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(
        JSON.stringify({
          type: 'direct_message',
          recipient_id: recipientId,
          content,
          image_url: imageUrl,
          reply_to_id: replyToId,
        })
      );
    }
  };

  return { sendMessage, sendDirectMessage };
}
