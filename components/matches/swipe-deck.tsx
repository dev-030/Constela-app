import { MatchProfile } from "@/api/matching";
import Swipe, { SwipeDirection, SwipeHandle } from "@/components/swipe";
import React, { forwardRef, Ref } from "react";
import { DeckStatus } from "./deck-status";

interface SwipeDeckProps {
  matches: MatchProfile[];
  feedKey?: number;
  /**
   * True when we should show the centered spinner instead of the deck.
   * Covers the initial load AND any subsequent refetch while we don't yet
   * have cached results to display.
   */
  isLoading: boolean;
  /** True when the most recent fetch returned an error. */
  isError: boolean;
  locked?: boolean;
  onSwipe: (profile: MatchProfile, direction: SwipeDirection) => void;
  onActiveIndexChange: () => void;
  onRetry: () => void;
}

/**
 * SwipeDeck
 * ---------
 * Wraps the imperative <Swipe /> component and decides which status view to
 * render when the deck is empty / loading / errored. Priority:
 *   1. loading spinner
 *   2. error (with retry)
 *   3. empty (with refresh)
 *   4. swipe deck
 *
 * This ordering is important: on a failed refetch the deck may be empty,
 * but we want the user to see the *error* — not "No matches found".
 */
export const SwipeDeck = forwardRef(function SwipeDeck(
  {
    matches,
    feedKey,
    isLoading,
    isError,
    locked,
    onSwipe,
    onActiveIndexChange,
    onRetry,
  }: SwipeDeckProps,
  ref: React.ForwardedRef<SwipeHandle>
) {
  if (isLoading) {
    return <DeckStatus kind="loading" />;
  }

  if (isError) {
    return <DeckStatus kind="error" onRetry={onRetry} />;
  }

  if (matches.length === 0) {
    return <DeckStatus kind="empty" onRetry={onRetry} />;
  }

  return (
    <Swipe
      key={feedKey}
      ref={ref}
      profiles={matches}
      locked={locked}
      onSwipe={onSwipe}
      onActiveIndexChange={onActiveIndexChange}
    />
  );
});