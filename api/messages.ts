import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { QuotaSnapshot } from './profile';
import { useProfileStore } from '@/store/profileStore';

export type ThreadType = 'dating' | 'friends';

export interface ThreadProfile {
  id: string;
  name: string;
  username?: string;
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
  image_url_expires_at?: string | null;
  audio_url?: string | null;
  audio_url_expires_at?: string | null;
  audio_duration?: number | null;
  reaction?: string | null;
  sender_id?: string;
  reply_to?: string | null;
  reply_to_info?: {
    id: string;
    content: string;
    image_url: string | null;
    image_url_expires_at?: string | null;
    audio_url?: string | null;
    sender_id: string;
    sender_name: string;
  } | null;
}

export const fetchThreads = async (type: ThreadType) => {
  const response = await apiClient.get<MessageThread[]>(
    `/api/chat/direct/threads/?type=${type}`,
  );
  return response.data;
};

export const useThreadsQuery = (type: ThreadType) => {
  return useQuery({
    queryKey: ['messageThreads', type],
    queryFn: () => fetchThreads(type),
    gcTime: 5 * 60 * 1000,    // keep cache for 5 min after unmount
    staleTime: 30 * 1000,      // consider fresh for 30s; invalidateQueries still forces refetch
  });
};

export const useDirectHistoryQuery = (recipientProfileId: string) => {
  return useQuery(directHistoryQueryOptions(recipientProfileId));
};

export const fetchDirectHistory = async (recipientProfileId: string, prefetch = false) => {
  const response = await apiClient.get<DirectMessage[]>(
    `/api/chat/direct/history/${recipientProfileId}/`,
    { params: prefetch ? { prefetch: 1 } : undefined },
  );
  return response.data;
};

export const directHistoryQueryOptions = (recipientProfileId: string, prefetch = false) =>
  queryOptions({
    queryKey: ['directHistory', recipientProfileId],
    queryFn: () => fetchDirectHistory(recipientProfileId, prefetch),
    enabled: !!recipientProfileId,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

export const useSendDirectMessageMutation = (recipientProfileId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { content: string; image_url?: string; audio_url?: string; audio_duration?: number; reply_to?: string }) => {
      const response = await apiClient.post<DirectMessage & { quota?: QuotaSnapshot }>('/api/chat/direct/', {
        receiver: recipientProfileId,
        content: payload.content,
        image_url: payload.image_url,
        audio_url: payload.audio_url,
        audio_duration: payload.audio_duration,
        reply_to_id: payload.reply_to,
      });
      return response.data;
    },
    onSuccess: (newMsg) => {
      const { quota, ...message } = newMsg;
      if (quota) useProfileStore.getState().updateQuota('personal_messages', quota);
      queryClient.setQueryData(['directHistory', recipientProfileId], (oldData: any) => {
        if (!oldData) return [message];
        if (oldData.some((m: any) => String(m.id) === String(message.id))) return oldData;
        return [message, ...oldData];
      });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    },
  });
};
