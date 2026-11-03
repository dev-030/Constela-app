import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface Suggestion {
  id: string;
  username?: string;
  name: string;
  age?: number;
  tags?: string[];
  bio?: string;
  bio_interests?: string[];
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
    mutationFn: async (request: string | FriendRequest) => {
      const id = typeof request === 'string' ? request : request.id;
      const response = await apiClient.post(`/api/friends/${id}/accept/`);
      return response.data;
    },
    onMutate: async (request) => {
      const id = typeof request === 'string' ? request : request.id;
      await queryClient.cancelQueries({ queryKey: ['pendingFriendRequests'] });
      const previous = queryClient.getQueryData<FriendRequest[]>(['pendingFriendRequests']);
      queryClient.setQueryData<FriendRequest[]>(
        ['pendingFriendRequests'],
        (requests = []) => requests.filter((r) => r.id !== id),
      );
      return { previous };
    },
    onError: (_error, _request, context) => {
      queryClient.setQueryData(['pendingFriendRequests'], context?.previous);
    },
    onSuccess: () => {
      // Force an immediate background fetch — not just invalidate — so the
      // Friends inbox has fresh data ready before the user navigates there.
      queryClient.invalidateQueries({ queryKey: ['messageThreads', 'friends'] });
      queryClient.refetchQueries({ queryKey: ['messageThreads', 'friends'], type: 'all' });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      queryClient.invalidateQueries({ queryKey: ['pendingFriendRequests'] });
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
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
    },
  });
};

export interface FriendContact {
  friendship_id: string;
  id: string;
  name: string;
  username?: string;
  age?: number;
  bio?: string;
  bio_interests?: string[];
  photo?: string | null;
  location?: string;
  created_at?: string;
}

export const fetchMyFriends = async (search?: string): Promise<FriendContact[]> => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await apiClient.get<FriendContact[]>(`/api/friends/my_friends/${params}`);
  return response.data;
};

export const useMyFriendsQuery = (search?: string) => {
  return useQuery({
    queryKey: ['myFriends', search || ''],
    queryFn: () => fetchMyFriends(search),
    staleTime: 30 * 1000,
  });
};
