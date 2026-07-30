import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export type ThreadType = 'dating' | 'friends';

export interface ThreadProfile {
  id: string;
  username: string;
  photo: string;
}

export interface MessageThread {
  profile: ThreadProfile;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface DirectMessage {
  id: string;
  sender: string;
  receiver: string;
  sender_name: string;
  receiver_name: string;
  sender_photo: string;
  receiver_photo: string;
  content: string;
  timestamp: string;
  read_at: string | null;
  image_url?: string | null;
  reply_to?: string | null;
  reply_to_info?: {
    id: string;
    content: string;
    image_url: string | null;
    sender_id: string;
    sender_name: string;
  } | null;
}

export const useThreadsQuery = (type: ThreadType) => {
  return useQuery({
    queryKey: ['messageThreads', type],
    queryFn: async () => {
      const response = await apiClient.get<MessageThread[]>(
        `/api/chat/direct/threads/?type=${type}`
      );
      return response.data;
    },
    gcTime: 5 * 60 * 1000,    // keep cache for 5 min after unmount
    staleTime: 30 * 1000,      // consider fresh for 30s; invalidateQueries still forces refetch
  });
};

export const useDirectHistoryQuery = (recipientProfileId: string) => {
  return useQuery({
    queryKey: ['directHistory', recipientProfileId],
    queryFn: async () => {
      const response = await apiClient.get<DirectMessage[]>(
        `/api/chat/direct/history/${recipientProfileId}/`
      );
      return response.data;
    },
    enabled: !!recipientProfileId,
  });
};

export const useSendDirectMessageMutation = (recipientProfileId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; image_url?: string; reply_to?: string }) => {
      const response = await apiClient.post<DirectMessage>('/api/chat/direct/', {
        receiver: recipientProfileId,
        content: payload.content,
        image_url: payload.image_url,
        reply_to_id: payload.reply_to,
      });
      return response.data;
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData(['directHistory', recipientProfileId], (oldData: any) => {
        if (!oldData) return [newMsg];
        if (oldData.some((m: any) => String(m.id) === String(newMsg.id))) return oldData;
        return [newMsg, ...oldData];
      });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
  });
};