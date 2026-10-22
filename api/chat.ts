import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface ChatRoom {
  id: string;
  name: string;
  member_count: number;
  member_avatars: string[];
  is_joined: boolean;
}

import type { MessageReactionSummary } from "@/utils/message-reactions";

export interface ChatMessage {
  id: string;
  room: string;
  sender: string;
  sender_name: string;
  sender_photo: string;
  content: string;
  timestamp: string;
  is_pending?: boolean;
  reply_to?: string | null;
  reply_to_info?: {
    id: string;
    content: string;
    sender_id: string;
    sender_name: string;
  } | null;
  reactions?: MessageReactionSummary[];
}

export interface JoinRoomResponse {
  message: string;
  room_id: string;
  member_count: number;
}

export const fetchChatRooms = async (search = '') => {
  const trimmed = search.trim();
  const url = trimmed
    ? `/api/chat/rooms/?search=${encodeURIComponent(trimmed)}`
    : '/api/chat/rooms/';
  const response = await apiClient.get<ChatRoom[]>(url);
  return response.data;
};

export const useChatRoomsQuery = (search: string = '', enabled = true) => {
  return useQuery({
    queryKey: ['chatRooms', search],
    queryFn: () => fetchChatRooms(search),
    staleTime: 60 * 1000,
    enabled,
    retryOnMount: false,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });
};

export const useChatRoomQuery = (roomId: string) => {
  return useQuery({
    queryKey: ['chatRoom', roomId],
    queryFn: async () => {
      const response = await apiClient.get<ChatRoom>(`/api/chat/rooms/${roomId}/`);
      return response.data;
    },
    enabled: !!roomId,
  });
};

export const useJoinRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiClient.post<JoinRoomResponse>(
        `/api/chat/rooms/${roomId}/join/`
      );
      return response.data;
    },
    onSuccess: (result, roomId) => {
      queryClient.setQueriesData<ChatRoom[]>({ queryKey: ['chatRooms'] }, (rooms) =>
        rooms?.map((room) =>
          room.id === roomId
            ? { ...room, is_joined: true, member_count: result.member_count }
            : room
        )
      );
      queryClient.setQueryData<ChatRoom>(['chatRoom', roomId], (room) =>
        room
          ? { ...room, is_joined: true, member_count: result.member_count }
          : queryClient
              .getQueryData<ChatRoom[]>(['chatRooms', ''])
              ?.find((cachedRoom) => cachedRoom.id === roomId)
      );
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoom'] });
      queryClient.invalidateQueries({ queryKey: ['roomMessages'] });
    },
  });
};

export const useLeaveRoomMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await apiClient.post<JoinRoomResponse>(
        `/api/chat/rooms/${roomId}/leave/`
      );
      return response.data;
    },
    onSuccess: (result, roomId) => {
      queryClient.setQueriesData<ChatRoom[]>({ queryKey: ['chatRooms'] }, (rooms) =>
        rooms?.map((room) =>
          room.id === roomId
            ? { ...room, is_joined: false, member_count: result.member_count }
            : room
        )
      );
      queryClient.setQueryData<ChatRoom>(['chatRoom', roomId], (room) =>
        room ? { ...room, is_joined: false, member_count: result.member_count } : room
      );
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoom'] });
      queryClient.invalidateQueries({ queryKey: ['roomMessages'] });
    },
  });
};

export const ROOM_HISTORY_PAGE_SIZE = 50;

export const useRoomMessagesQuery = (roomId: string) => {
  return useQuery({
    queryKey: ['roomMessages', roomId],
    queryFn: async () => {
      const response = await apiClient.get<ChatMessage[]>(
        `/api/chat/rooms/${roomId}/messages/`
      );
      const raw = response.data ?? [];
      if (raw.length > 1) {
        const firstTime = new Date(raw[0].timestamp).getTime();
        const lastTime = new Date(raw[raw.length - 1].timestamp).getTime();
        // If server returns oldest-first, reverse so newest is at index 0
        if (firstTime < lastTime) {
          return raw.reverse();
        }
      }
      return raw;
    },
    enabled: !!roomId,
    staleTime: 0,
  });
};

export const isPremiumRequiredError = (err: any): boolean => {
  return err?.response?.status === 403;
};
