import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  body: string;
  type: string;
  data?: {
    sender_photo?: string | null;
    [key: string]: any;
  };
  is_read: boolean;
  created_at: string;
}

export interface NotificationsResponse {
  results: Notification[];
  next: boolean;
  total: number;
}

export const useInfiniteNotificationsQuery = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 0 }): Promise<NotificationsResponse> => {
      const response = await apiClient.get<NotificationsResponse>(`/api/notifications/?limit=${limit}&offset=${pageParam}`);
      return response.data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length * limit;
      }
      return undefined;
    },
  });
};

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async (): Promise<number> => {
      const response = await apiClient.get('/api/notifications/unread-count/');
      return response.data?.count || 0;
    },
    // Poll every 30 seconds to keep the badge up to date
    refetchInterval: 30000,
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useMarkNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/api/notifications/read-all/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
