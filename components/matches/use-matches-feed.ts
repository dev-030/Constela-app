import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  MatchProfile,
  useInfinitePerfectMatchQuery,
  useSwipeActionMutation,
} from "@/api/matching";
import { useProfileStore } from "@/store/profileStore";
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
  const { profile } = useProfileStore();

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
  } = useInfinitePerfectMatchQuery({ page_size: 10 });

  const swipeAction = useSwipeActionMutation();

  // Debug trace — fires while the perfect-match query is in flight so we can
  // confirm the network call is actually happening in the JS logs.
  useEffect(() => {
    if (isLoading || isPending || isFetching) {
      console.log("querying find matches");
    }
  }, [isLoading, isPending, isFetching]);

  const swipeRef = useRef<SwipeHandle>(null);
  const [canUndo, setCanUndo] = useState(false);

  const matches: MatchProfile[] = useMemo(
    () => pages?.pages.flatMap((p) => p.results) ?? [],
    [pages]
  );

  // Keep the deck topped up as the user swipes through results.
  useEffect(() => {
    if (
      hasNextPage &&
      !isFetchingNextPage &&
      matches.length > 0 &&
      matches.length <= LOW_STACK_THRESHOLD
    ) {
      fetchNextPage();
    }
  }, [matches.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const recordSwipe = (
    target: MatchProfile,
    direction: SwipeDirection
  ) => {
    // "super" is currently treated as a like — the API doesn't define a
    // separate super-like verb, so premium users still send "liked".
    const action: "liked" | "disliked" =
      direction === "left" ? "disliked" : "liked";

    swipeAction.mutate(
      { targetId: target.id, action },
      {
        onSuccess: (res) => {
          if (res.is_mutual_match) {
            Alert.alert(
              "It\u2019s a Match! \uD83C\uDF89",
              `You and ${target.username} liked each other!`
            );
          }
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Something went wrong. Please try again.";

          if (status === 403) {
            Alert.alert("Limit Reached", message);
          } else if (status === 404) {
            Alert.alert(
              "Already decided",
              "You've already responded to this profile."
            );
          } else {
            Alert.alert("Swipe failed", message);
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
    if (action === "reject") swipeRef.current.swipe("left");
    else if (action === "super") swipeRef.current.swipe("super");
    else swipeRef.current.swipe("right");
  };

  const handleUndo = () => {
    swipeRef.current?.undo();
  };

  const handleActiveIndexChange = () => {
    setCanUndo(
      (swipeRef.current?.canUndo ?? false) && matches.length > 0
    );
  };

  const displayName = profile?.username ?? "there";
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
    isLoading: showLoading,
    isError,
    isFetchingNextPage,
    refetch,
    // swipe
    swipeRef,
    canUndo,
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