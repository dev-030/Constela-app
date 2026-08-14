import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface ChatRoom {
  id: string;
  name: string;
  member_count: number;
  member_avatars: string[];
  is_joined: boolean;
}

export interface ChatMessage {
  id: string;
  room: string;
  sender: string;
  sender_name: string;
  sender_photo: string;
  content: string;
  timestamp: string;
}

export interface JoinRoomResponse {
  message: string;
  room_id: string;
  member_count: number;
}

export const useChatRoomsQuery = (search: string = '') => {
  return useQuery({
    queryKey: ['chatRooms', search],
    queryFn: async () => {
      const trimmed = search.trim();
      const url = trimmed
        ? `/api/chat/rooms/?search=${encodeURIComponent(trimmed)}`
        : '/api/chat/rooms/';
      const response = await apiClient.get<ChatRoom[]>(url);
      return response.data;
    },
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
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
      queryClient.invalidateQueries({ queryKey: ['chatRoom'] });
      queryClient.invalidateQueries({ queryKey: ['roomMessages'] });
    },
  });
};

export const useRoomMessagesQuery = (roomId: string) => {
  return useQuery({
    queryKey: ['roomMessages', roomId],
    queryFn: async () => {
      const response = await apiClient.get<ChatMessage[]>(
        `/api/chat/rooms/${roomId}/messages/`
      );
      return response.data;
    },
    enabled: !!roomId,
  });
};

export const useSendRoomMessageMutation = (roomId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const response = await apiClient.post<ChatMessage>(
        `/api/chat/rooms/${roomId}/send/`,
        { content }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roomMessages', roomId] });
    },
  });
};

export const isPremiumRequiredError = (err: any): boolean => {
  return err?.response?.status === 403;
};