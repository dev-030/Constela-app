import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './client';

export interface MatchProfile {
  id: string;
  username: string;
  age: number;
  gender: string;
  city: string;
  country: string;
  bio: string;
  tags: string[];
  photo: string;
  compatibility_score: number;
  distance: number | null;
}

export interface MatchResponse {
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: string | null;
  previous: string | null;
  results: MatchProfile[];
}

export const usePerfectMatchQuery = (filters: Record<string, any> = {}) => {
  return useQuery({
    queryKey: ['perfectMatch', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      }
      const response = await apiClient.get<MatchResponse>(`/api/matching/perfect-match/?${params.toString()}`);
      return response.data;
    },
  });
};

export const useSwipeActionMutation = () => {
  return useMutation({
    mutationFn: async ({ targetId, action }: { targetId: string; action: 'liked' | 'disliked' }) => {
      const response = await apiClient.post(`/api/matching/${targetId}/action/`, { action });
      return response.data;
    },
  });
};
