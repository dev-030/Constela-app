/** Prefetch common data once, then gated data only when local access allows it. */
import { fetchChatRooms } from '@/api/chat';
import { fetchFriendSuggestions, fetchPendingFriendRequests } from '@/api/friends';
import {
  fetchMatchAnalysis,
  fetchPerfectMatchPage,
  type PerfectMatchFilters,
} from '@/api/matching';
import { fetchThreads } from '@/api/messages';
import { canAccessCommunity, type UserProfile } from '@/api/profile';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export function usePrefetchOnAppStart(profile: UserProfile | null) {
  const queryClient = useQueryClient();
  const prefetched = useRef(new Set<string>());

  useEffect(() => {
    if (!profile?.id) return;
    const baseKey = `${profile.id}:base`;
    const communityKey = `${profile.id}:community`;
    const analysisKey = `${profile.id}:analysis`;
    const needsBase = !prefetched.current.has(baseKey);
    const needsCommunity = canAccessCommunity(profile) && !prefetched.current.has(communityKey);
    const needsAnalysis = Boolean(profile.access?.has_match_analysis ?? profile.has_match_analysis) &&
      !prefetched.current.has(analysisKey);
    if (!needsBase && !needsCommunity && !needsAnalysis) return;

    const timer = setTimeout(() => {
      const matchFilters: PerfectMatchFilters & { page_size: number } = { page_size: 10 };
      const prefetches: Promise<unknown>[] = [];

      if (needsBase) {
        prefetched.current.add(baseKey);
        prefetches.push(
          queryClient.prefetchQuery({
            queryKey: ['messageThreads', 'dating'],
            queryFn: () => fetchThreads('dating'),
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['messageThreads', 'friends'],
            queryFn: () => fetchThreads('friends'),
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchInfiniteQuery({
            queryKey: ['perfectMatchInfinite', matchFilters],
            queryFn: ({ pageParam }) => fetchPerfectMatchPage(matchFilters, pageParam as number),
            initialPageParam: 1,
            getNextPageParam: (lastPage: Awaited<ReturnType<typeof fetchPerfectMatchPage>>) =>
              lastPage.next ? lastPage.page + 1 : undefined,
            staleTime: 30 * 1000,
          }),
          queryClient.prefetchInfiniteQuery({
            queryKey: ['friendSuggestions', {}],
            queryFn: ({ pageParam }) => fetchFriendSuggestions({}, pageParam as number),
            initialPageParam: 0,
            getNextPageParam: (
              lastPage: Awaited<ReturnType<typeof fetchFriendSuggestions>>,
              pages: Awaited<ReturnType<typeof fetchFriendSuggestions>>[],
            ) => (lastPage.next ? pages.length * 20 : undefined),
            staleTime: 60 * 1000,
          }),
          queryClient.prefetchQuery({
            queryKey: ['pendingFriendRequests'],
            queryFn: fetchPendingFriendRequests,
            staleTime: 30 * 1000,
          }),
        );
      }
      if (needsCommunity) {
        prefetched.current.add(communityKey);
        prefetches.push(queryClient.prefetchQuery({
          queryKey: ['chatRooms', ''],
          queryFn: () => fetchChatRooms(),
          staleTime: 60 * 1000,
          retry: false,
        }));
      }
      if (needsAnalysis) {
        prefetched.current.add(analysisKey);
        prefetches.push(queryClient.prefetchQuery({
          queryKey: ['matchAnalysis'],
          queryFn: fetchMatchAnalysis,
          staleTime: 5 * 60 * 1000,
          retry: false,
        }));
      }
      void Promise.allSettled(prefetches);
    }, 400);

    return () => clearTimeout(timer);
  }, [profile, queryClient]);
}
