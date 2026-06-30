import { MatchProfile } from "@/api/matching";
import Swipe, { SwipeDirection, SwipeHandle } from "@/components/swipe";
import { Ref } from "react";
import { DeckStatus } from "./deck-status";

interface SwipeDeckProps {
  ref: Ref<SwipeHandle>;
  matches: MatchProfile[];
  /**
   * True when we should show the centered spinner instead of the deck.
   * Covers the initial load AND any subsequent refetch while we don't yet
   * have cached results to display.
   */
  isLoading: boolean;
  /** True when the most recent fetch returned an error. */
  isError: boolean;
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
export function SwipeDeck({
  matches,
  isLoading,
  isError,
  onSwipe,
  onActiveIndexChange,
  onRetry,
  ref,
}: SwipeDeckProps) {
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
      ref={ref}
      profiles={matches}
      onSwipe={onSwipe}
      onActiveIndexChange={onActiveIndexChange}
    />
  );
}