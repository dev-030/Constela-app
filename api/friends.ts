import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Suggestion {
  id: string;
  username?: string;
  name: string;
  age?: number;
  tags?: string[];
  bio?: string;
  photo: string;
}

export interface FriendRequest {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  username?: string;
  name?: string;
  age?: number;
  tags?: string[];
  bio?: string;
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

export interface SuggestionsResponse {
  results: Suggestion[];
  next: boolean;
  total: number;
}

export const fetchFriendSuggestions = async (
  filters: FriendSuggestionsFilters = {},
  offset = 0,
  limit = 20,
): Promise<SuggestionsResponse> => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  const response = await apiClient.get<SuggestionsResponse>(`/api/friends/suggestions/?${params.toString()}`);
  return response.data;
};

export const fetchPendingFriendRequests = async () => {
  const response = await apiClient.get<FriendRequest[]>('/api/friends/requests/');
  return response.data;
};

export const useInfiniteFriendSuggestionsQuery = (filters: FriendSuggestionsFilters = {}, limit = 20) => {
  return useInfiniteQuery({
    queryKey: ['friendSuggestions', filters],
    queryFn: ({ pageParam = 0 }) => fetchFriendSuggestions(filters, pageParam, limit),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.next) {
        return allPages.length * limit;
      }
      return undefined;
    },
    staleTime: 60 * 1000,
  });
};

export const usePendingFriendRequestsQuery = () => {
  return useQuery({
    queryKey: ['pendingFriendRequests'],
    queryFn: fetchPendingFriendRequests,
    staleTime: 30 * 1000,
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
      queryClient.invalidateQueries({ queryKey: ['sentFriendRequests'] });
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
    onMutate: async (friendshipId) => {
      await queryClient.cancelQueries({ queryKey: ['pendingFriendRequests'] });
      const previous = queryClient.getQueryData<FriendRequest[]>(['pendingFriendRequests']);
      queryClient.setQueryData<FriendRequest[]>(
        ['pendingFriendRequests'],
        (requests = []) => requests.filter((request) => request.id !== friendshipId),
      );
      return { previous };
    },
    onError: (_error, _friendshipId, context) => {
      queryClient.setQueryData(['pendingFriendRequests'], context?.previous);
    },
    onSuccess: () => {
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
    onMutate: async (friendshipId) => {
      await queryClient.cancelQueries({ queryKey: ['pendingFriendRequests'] });
      const previous = queryClient.getQueryData<FriendRequest[]>(['pendingFriendRequests']);
      queryClient.setQueryData<FriendRequest[]>(
        ['pendingFriendRequests'],
        (requests = []) => requests.filter((request) => request.id !== friendshipId),
      );
      return { previous };
    },
    onError: (_error, _friendshipId, context) => {
      queryClient.setQueryData(['pendingFriendRequests'], context?.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
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
    onMutate: async (friendshipId) => {
      await queryClient.cancelQueries({ queryKey: ['sentFriendRequests'] });
      const previous = queryClient.getQueryData<FriendRequest[]>(['sentFriendRequests']);
      queryClient.setQueryData<FriendRequest[]>(
        ['sentFriendRequests'],
        (requests = []) => requests.filter((request) => request.id !== friendshipId),
      );
      return { previous };
    },
    onError: (_error, _friendshipId, context) => {
      queryClient.setQueryData(['sentFriendRequests'], context?.previous);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
    },
  });
};
