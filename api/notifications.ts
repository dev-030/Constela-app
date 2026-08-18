import { useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Notification {
  id: string;
  recipient: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const response = await apiClient.get('/api/notifications/');
      return response.data;
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
