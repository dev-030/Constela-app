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
}

export const useThreadsQuery = (type: ThreadType) => {
  return useQuery({
    queryKey: ['messageThreads', type],
    queryFn: async () => {
      const response = await apiClient.get<MessageThread[]>(
        `/api/messages/threads/?type=${type}`
      );
      return response.data;
    },
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
    mutationFn: async (content: string) => {
      const response = await apiClient.post<DirectMessage>('/api/chat/direct/', {
        receiver: recipientProfileId,
        content,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['directHistory', recipientProfileId],
      });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
  });
};