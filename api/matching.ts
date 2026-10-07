import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from './client';
import type { QuotaSnapshot } from './profile';
import { useProfileStore } from '@/store/profileStore';
export interface MatchProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  bio: string;
  tags: string[];
  photo: string;
  compatibility_score: number;
  distance: number | null;
  has_superliked_me?: boolean;
  is_verified?: boolean;
}

export interface PerfectMatchFilters {
  age_min?: number;
  age_max?: number;
  gender?: string;
  height_min?: number;
  height_max?: number;
  marital_status?: string;
  city?: string;
  country?: string;
  looking_for?: string;
  spoken_languages?: string;
  distance_max?: number;
  neurotype?: string;
  // Premium-only:
  education_level?: string;
  smoking?: boolean;
  alcohol?: boolean;
  pets?: boolean;
  sport?: string;
  eating_habits?: string;
  second_degree_humor?: boolean;
  interests?: string;
  emotional_needs?: string;
  soothe_methods?: string;
  recharge_methods?: string;
  exhaust_triggers?: string;
}

export interface SwipeActionResponse {
  status: 'liked' | 'matched' | 'disliked' | 'undone';
  is_mutual_match: boolean;
  quota?: QuotaSnapshot;
}

type SwipeActionVariables = {
  targetId: string;
  action: 'liked' | 'disliked' | 'superliked' | 'undo';
  previousQuota?: QuotaSnapshot;
  // Snapshot of the profile being swiped on, used for instant thread injection on match
  profileSnapshot?: { id: string; name: string; photo: string; username?: string };
};

export function reserveLocalLikeQuota(): { allowed: boolean; previousQuota?: QuotaSnapshot } {
  const quota = useProfileStore.getState().profile?.access?.quotas.likes;
  if (!quota || quota.remaining == null) return { allowed: true };
  const depleted =
    quota.remaining <= 0 &&
    (!quota.resets_at || new Date(quota.resets_at).getTime() > Date.now());
  if (depleted) return { allowed: false };

  useProfileStore.getState().updateQuota('likes', {
    ...quota,
    used: quota.used + 1,
    remaining: Math.max(0, quota.remaining - 1),
  });
  return { allowed: true, previousQuota: quota };
}

export interface PerfectMatchResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: MatchProfile[];
  limit_reached: boolean;
  quota: QuotaSnapshot;
}

export const fetchPerfectMatchPage = async (
  filters: PerfectMatchFilters & { page?: number; page_size?: number },
  page: number,
) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...filters, page })) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const response = await apiClient.get<PerfectMatchResponse>(
    `/api/matching/perfect-match/?${params.toString()}`,
  );
  return response.data;
};

export const usePerfectMatchQuery = (
  filters: PerfectMatchFilters & { page?: number; page_size?: number } = {}
) => {
  return useQuery({
    queryKey: ['perfectMatch', filters],
    queryFn: () => fetchPerfectMatchPage(filters, filters.page ?? 1),
    staleTime: 30 * 1000,
  });
};

// Infinite-scroll variant for the swipe deck — appends new pages as the user
// swipes through the current stack. Filters are passed on every page request.
export const useInfinitePerfectMatchQuery = (
  filters: PerfectMatchFilters & { page_size?: number } = {}
) => {
  return useInfiniteQuery({
    queryKey: ['perfectMatchInfinite', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPerfectMatchPage(filters, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    staleTime: 30 * 1000,
  });
};

export const fetchMatchAnalysis = async () => {
  const response = await apiClient.get<{ results: MatchProfile[] }>('/api/matching/analysis/');
  return response.data.results;
};

export const useMatchAnalysisQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['matchAnalysis'],
    queryFn: fetchMatchAnalysis,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 0, // Don't retry on 403 Forbidden
    enabled,
  });
};
export const useSwipeActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, action }: SwipeActionVariables) => {
      const response = await apiClient.post<SwipeActionResponse>(
        `/api/matching/${targetId}/action/`,
        { action }
      );
      return response.data;
    },
    onMutate: ({ action }) => {
      if (action !== 'liked' && action !== 'superliked') return;
      const reservation = reserveLocalLikeQuota();
      return { previousQuota: reservation.previousQuota };
    },
    onSuccess: (data, _variables) => {
      if (data.status === 'matched') {
        // Force an immediate background fetch of the Dating inbox so fresh data
        // is ready before the user navigates to Messages.
        queryClient.invalidateQueries({ queryKey: ['messageThreads', 'dating'] });
        queryClient.refetchQueries({ queryKey: ['messageThreads', 'dating'], type: 'all' });
      }
      // Swipe succeeded — keep local optimistic quota untouched!
      queryClient.invalidateQueries({ queryKey: ['perfectMatch'] });
      queryClient.invalidateQueries({ queryKey: ['perfectMatchInfinite'] });
      queryClient.invalidateQueries({ queryKey: ['mutualMatches'] });
      queryClient.invalidateQueries({ queryKey: ['likesSent'] });
      queryClient.invalidateQueries({ queryKey: ['matchAnalysis'] });
    },

    onError: (error: any, _variables, context) => {
      const status = error?.response?.status;
      const quota = error?.response?.data?.quota;

      if (status === 429 && quota) {
        // Daily limit reached confirmed by backend
        useProfileStore.getState().updateQuota('likes', quota, true);
      } else if (context?.previousQuota) {
        // Network or server failure (other than limit): revert local optimistic deduction!
        useProfileStore.getState().updateQuota('likes', context.previousQuota, true);
      }
    },
  });
};

export const useSaveProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.post(
        `/api/matching/${targetProfileId}/save/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMatches'] });
    },
  });
};

export const useUnsaveProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.post(
        `/api/matching/${targetProfileId}/unsave/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedMatches'] });
    },
  });
};

export interface SavedMatchEntry {
  id: string;
  user: string;
  target_profile: string;
  created_at: string;
}

export const useSavedMatchesQuery = () => {
  return useQuery({
    queryKey: ['savedMatches'],
    queryFn: async () => {
      const response = await apiClient.get<SavedMatchEntry[]>(
        '/api/matching/saved/'
      );
      return response.data;
    },
  });
};

export interface MutualMatchProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  subscription_tier: string;
  neurotype_labels: string[];
  qualities: string[];
  interests: string[];
  recharge_methods: string[];
  soothe_methods: string[];
  sport: string;
  spoken_languages: string[];
  is_verified: boolean;
  photos: {
    id: string;
    image: string;
    is_main: boolean;
    is_verified: boolean;
    uploaded_at: string;
  }[];
}

export interface MutualMatch {
  match_id: string;
  matched_at: string;
  profile: MutualMatchProfile;
}

export const useMutualMatchesQuery = () => {
  return useQuery({
    queryKey: ['mutualMatches'],
    queryFn: async () => {
      const response = await apiClient.get<MutualMatch[]>(
        '/api/matching/matches/'
      );
      return response.data;
    },
  });
};

export interface LikeSentEntry {
  profile: MutualMatchProfile;
  status: 'SENT' | 'MATCHED' | string;
  created_at: string;
}

export const useLikesSentQuery = () => {
  return useQuery({
    queryKey: ['likesSent'],
    queryFn: async () => {
      const response = await apiClient.get<LikeSentEntry[]>(
        '/api/matching/likes-sent/'
      );
      return response.data;
    },
  });
};

export const useLikesReceivedQuery = (enabled = true) => {
  return useQuery({
    queryKey: ['likesReceived'],
    queryFn: async () => {
      const response = await apiClient.get<MutualMatchProfile[]>(
        '/api/matching/likes-received/'
      );
      return response.data;
    },
    enabled,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 403) return false;
      return failureCount < 3;
    },
  });
};

export type ReportReason =
  | 'fake_profile'
  | 'offensive_language'
  | 'harassment'
  | 'sexually_explicit_content'
  | 'impersonation'
  | 'other';

export interface ReportUserRequest {
  reported_user: string;
  reason: ReportReason;
  description?: string;
}

export interface ReportUserResponse {
  id: string;
  reporter: string;
  reported_user: string;
  reason: ReportReason;
  description: string;
  status: string;
  created_at: string;
}

export const useReportUserMutation = () => {
  return useMutation({
    mutationFn: async (data: ReportUserRequest) => {
      const response = await apiClient.post<ReportUserResponse>(
        '/api/reports/create/',
        data
      );
      return response.data;
    },
  });
};

export const useBlockUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.post(
        `/api/blocks/${targetProfileId}/block/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['perfectMatch'] });
      queryClient.invalidateQueries({ queryKey: ['mutualMatches'] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['directHistory'] });
    },
  });
};

export const useUnblockUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.delete(
        `/api/blocks/${targetProfileId}/block/`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });
};

export interface BlockedUserEntry {
  block_id: string;
  profile_id: string;
  username: string;
  blocked_at: string;
}

export const useBlockedUsersQuery = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: async () => {
      const response = await apiClient.get<BlockedUserEntry[]>(
        '/api/blocks/'
      );
      return response.data;
    },
  });
};

export const useBlockStatusQuery = (targetProfileId: string) => {
  return useQuery({
    queryKey: ['blockStatus', targetProfileId],
    queryFn: async () => {
      const response = await apiClient.get<{ profile_id: string; is_blocked: boolean }>(
        `/api/blocks/${targetProfileId}/status/`
      );
      return response.data;
    },
    enabled: !!targetProfileId,
  });
};

export const useUnmatchMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.post(
        `/api/matching/${targetProfileId}/unmatch/`
      );
      return response.data;
    },
    onSuccess: (_, targetProfileId) => {
      queryClient.removeQueries({ queryKey: ['directHistory', targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ['mutualMatches'] });
      queryClient.invalidateQueries({ queryKey: ['likesSent'] });
      queryClient.invalidateQueries({ queryKey: ['likesReceived'] });
      queryClient.invalidateQueries({ queryKey: ['perfectMatch'] });
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['directHistory'] });
      queryClient.invalidateQueries({ queryKey: ['directThreads'] });
    },
  });
};

export const useUnfriendMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (targetProfileId: string) => {
      const response = await apiClient.delete(
        `/api/friends/${targetProfileId}/unfriend/`
      );
      return response.data;
    },
    onSuccess: (_, targetProfileId) => {
      queryClient.removeQueries({ queryKey: ['directHistory', targetProfileId] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['myFriends'] });
      queryClient.refetchQueries({ queryKey: ['myFriends'], type: 'all' });
      queryClient.invalidateQueries({ queryKey: ['friendSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['perfectMatch'] });
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['directHistory'] });
      queryClient.invalidateQueries({ queryKey: ['directThreads'] });
    },
  });
};
