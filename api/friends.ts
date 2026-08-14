import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Suggestion {
  id: string;
  username: string;
  age: number;
  tags: string[];
  bio: string;
  photo: string;
}

export interface FriendRequest {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  username?: string;
  name?: string;
  photo: string;
  subtitle: string;
  mutual_friends_count: number;
  location: string;
}

export interface FriendSuggestionsFilters {
  search?: string;
  age_min?: number;
  age_max?: number;
  gender?: string;
}

export const useFriendSuggestionsQuery = (filters: FriendSuggestionsFilters = {}) => {
  return useQuery({
    queryKey: ['friendSuggestions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      }
      const queryString = params.toString();
      const url = `/api/friends/suggestions/${queryString ? `?${queryString}` : ''}`;
      const response = await apiClient.get<Suggestion[]>(url);
      return response.data;
    },
  });
};

export const usePendingFriendRequestsQuery = () => {
  return useQuery({
    queryKey: ['pendingFriendRequests'],
    queryFn: async () => {
      const response = await apiClient.get<FriendRequest[]>('/api/friends/requests/');
      return response.data;
    },
  });
};

export const useSentFriendRequestsQuery = () => {
  return useQuery({
    queryKey: ['sentFriendRequests'],
    queryFn: async () => {
      const response = await apiClient.get<FriendRequest[]>('/api/friends/sent_requests/');
      return response.data;
    },
  });
};

export const useSendFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post('/api/friends/send_request/', {
        user_id: userId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
    },
  });
};

export const useAcceptFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const response = await apiClient.post(`/api/friends/${friendshipId}/accept/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
};

export const useDeclineFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const response = await apiClient.post(`/api/friends/${friendshipId}/decline/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
    },
  });
};

export const useCancelFriendRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const response = await apiClient.delete(`/api/friends/${friendshipId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
    },
  });
};