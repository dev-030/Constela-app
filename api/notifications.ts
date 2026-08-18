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
