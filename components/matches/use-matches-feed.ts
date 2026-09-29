import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import {
  MatchProfile,
  reserveLocalLikeQuota,
  useInfinitePerfectMatchQuery,
  useSwipeActionMutation,
} from "@/api/matching";
import { useProfileStore } from "@/store/profileStore";
import { useFilterStore } from "@/store/filterStore";
import { canUndoSwipes, type QuotaSnapshot } from "@/api/profile";
import { SwipeDirection, SwipeHandle } from "@/components/swipe";

const LOW_STACK_THRESHOLD = 3;

/**
 * useMatchesFeed
 * --------------
 * Encapsulates the data flow for the Matches swipe deck:
 *  - infinite paginated feed from /api/matching/perfect-match/
 *  - auto-loads the next page once the stack is low
 *  - exposes a `SwipeHandle` ref so action buttons can drive swipes
 *  - reports swipe results back to the API and surfaces mutual-match alerts
 *  - tracks `canUndo` based on the Swipe component's history
 */
export function useMatchesFeed() {
  const { profile, fetchProfile } = useProfileStore();
  const filters = useFilterStore((state) => state.filters);

  useEffect(() => {
    if (!profile?.access) {
      fetchProfile();
    }
  }, [profile?.access, fetchProfile]);

  const {
    data: pages,
    isLoading,
    isPending,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePerfectMatchQuery({ ...filters, page_size: 10 });

  const swipeAction = useSwipeActionMutation();

  // Debug trace — fires while the perfect-match query is in flight so we can
  // confirm the network call is actually happening in the JS logs.
  useEffect(() => {
    if (isLoading || isPending || isFetching) {
      console.log("querying find matches");
    }
  }, [isLoading, isPending, isFetching]);

  const swipeRef = useRef<SwipeHandle>(null);
  const lastAutoRefetch = useRef(0);
  const [feedKey, setFeedKey] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const likesQuota = profile?.access?.quotas.likes;
  const localLimitReached =
    likesQuota?.remaining != null &&
    likesQuota.remaining <= 0 &&
    (!likesQuota.resets_at || new Date(likesQuota.resets_at).getTime() > Date.now());

  const matches: MatchProfile[] = useMemo(
    () => pages?.pages.flatMap((p) => p.results) ?? [],
    [pages]
  );

  const isLocked = Boolean(localLimitReached);


  // The active remaining cards count is checked inside handleActiveIndexChange

  const recordSwipe = (
    target: MatchProfile,
    direction: SwipeDirection
  ) => {
    const action = direction === "left" ? "disliked" : direction === "super" ? "superliked" : "liked";

    if (action !== "disliked") {
      const currentQuota = useProfileStore.getState().profile?.access?.quotas.likes;
      const isQuotaDepleted =
        currentQuota?.remaining != null &&
        currentQuota.remaining <= 0 &&
        (!currentQuota.resets_at || new Date(currentQuota.resets_at).getTime() > Date.now());
      if (isLocked || isQuotaDepleted) {
        swipeRef.current?.undo();
        Alert.alert(
          "Daily Limit Reached",
          "You've reached your daily like limit. Upgrade your subscription or wait until midnight to like more profiles."
        );
        return;
      }
    }

    swipeAction.mutate(
      { targetId: target.id, action },
      {
        onSuccess: (res) => {
          if (res.is_mutual_match) {
            Alert.alert(
              "It\u2019s a Match! \uD83C\uDF89",
              `You and ${target.name} liked each other!`
            );
          }
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Something went wrong. Please try again.";

          if (status === 404) {
            Alert.alert(
              "Already decided",
              "You've already responded to this profile."
            );
          } else {
            swipeRef.current?.undo();
            if (status === 429 || status === 403) {
              Alert.alert("Limit Reached", message, [
                { text: "OK" }
              ]);
            } else {
              Alert.alert("Swipe failed", message);
            }
          }
        },
      }
    );
  };

  const handleSwipe = (
    profile: MatchProfile,
    direction: SwipeDirection
  ) => {
    recordSwipe(profile, direction);
  };

  const handleActionPress = (action: "reject" | "super" | "like") => {
    if (!swipeRef.current) return;
    if (action !== "reject") {
      const currentQuota = useProfileStore.getState().profile?.access?.quotas.likes;
      const isQuotaDepleted = currentQuota?.remaining != null && currentQuota.remaining <= 0;
      if (isLocked || isQuotaDepleted) {
        Alert.alert(
          "Daily Limit Reached",
          "You've reached your daily like limit. Upgrade your subscription or wait until midnight to like more profiles."
        );
        return;
      }
    }
    if (action === "reject") swipeRef.current.swipe("left");
    else if (action === "super") swipeRef.current.swipe("super");
    else swipeRef.current.swipe("right");
  };

  const handleUndo = () => {
    if (!canUndoSwipes(profile)) {
      Alert.alert(
        "Premium Feature",
        "Upgrade to Premium to rewind your swipes.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/settings/subscription") },
        ]
      );
      return;
    }
    const undoneProfile = swipeRef.current?.undo();
    if (undoneProfile) {
      swipeAction.mutate({ targetId: undoneProfile.id, action: "undo" });
    }
  };

  const handleActiveIndexChange = () => {
    setCanUndo(
      (swipeRef.current?.canUndo ?? false) && matches.length > 0
    );

    // Auto-fetch more cards when we are running low!
    const remaining = swipeRef.current?.remaining ?? matches.length;
    if (remaining <= LOW_STACK_THRESHOLD && !isFetchingNextPage && !isFetching) {
      if (hasNextPage) {
        fetchNextPage();
      } else {
        // If we ran out of pages, refetch from page 1 to trigger recycling or get new signups.
        // Throttle this to prevent infinite loops if the backend truly has 0 results.
        const now = Date.now();
        if (now - lastAutoRefetch.current > 5000) {
          lastAutoRefetch.current = now;
          refetch().then(() => setFeedKey(k => k + 1));
        }
      }
    }
  };

  const displayName = profile?.name ?? "there";
  const tier = profile?.subscription_tier;

  const tierLabel = (() => {
    if (tier === "plus") return "Premium Plus";
    if (tier === "light") return "Premium Light";
    return "Freemium";
  })();

  // Show the centered spinner whenever the query is in flight AND we don't
  // already have results to display. After a successful first fetch the deck
  // stays mounted across refetches so the user keeps swiping.
  const showLoading =
    (isLoading || isPending || (isFetching && matches.length === 0));

  return {
    // data
    matches,
    feedKey,
    isLoading: showLoading,
    isError,
    isFetchingNextPage,
    refetch,
    // swipe
    swipeRef,
    canUndo,
    isLocked,
    handleActiveIndexChange,
    handleSwipe,
    handleActionPress,
    handleUndo,
    swipeAction,
    // profile
    displayName,
    tier,
    tierLabel,
  };
}
