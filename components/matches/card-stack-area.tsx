import { StyleSheet, View } from "react-native";
import { ActionButtons } from "./action-buttons";
import { SwipeDeck } from "./swipe-deck";
import { UndoButton } from "./undo-button";
import { MatchProfile } from "@/api/matching";
import { SwipeDirection, SwipeHandle } from "@/components/swipe";
import { Ref } from "react";

interface CardStackAreaProps {
  matches: MatchProfile[];
  feedKey?: number;
  isLoading: boolean;
  isError: boolean;
  swipeRef: Ref<SwipeHandle>;
  canUndo: boolean;
  isLocked: boolean;
  swipePending: boolean;
  onSwipe: (profile: MatchProfile, direction: SwipeDirection) => void;
  onActiveIndexChange: () => void;
  onUndo: () => void;
  onReject: () => void;
  onSuper: () => void;
  onLike: () => void;
  onRetry: () => void;
}

/* keep the prop list explicit — `swipePending` is only forwarded to the
 * action-buttons so the like tap is disabled while the mutation is in
 * flight; it intentionally doesn't gate the deck. */

/**
 * CardStackArea
 * -------------
 * The colored panel that holds the swipe deck, undo button, and the row of
 * action buttons (reject / super / like). It is purely presentational — all
 * state and side-effects live in `useMatchesFeed`.
 */
export function CardStackArea({
  matches,
  feedKey,
  isLoading,
  isError,
  swipeRef,
  canUndo,
  isLocked,
  swipePending,
  onSwipe,
  onActiveIndexChange,
  onUndo,
  onReject,
  onSuper,
  onLike,
  onRetry,
}: CardStackAreaProps) {

  return (
    <View style={[styles.area, { backgroundColor: "transparent" }]}>
      <View style={{ flex: 1, width: "100%", marginVertical: 20 }}>
        <SwipeDeck
          ref={swipeRef}
          matches={matches}
          feedKey={feedKey}
          isLoading={isLoading}
          isError={isError}
          locked={isLocked}
          onSwipe={onSwipe}
          onActiveIndexChange={onActiveIndexChange}
          onRetry={onRetry}
        />
      </View>

      <View style={{ alignItems: "center", width: "100%" }}>
        <ActionButtons
          onReject={onReject}
          onSuper={onSuper}
          onLike={onLike}
          disabled={matches.length === 0 || isLoading || isLocked}
          likePending={swipePending}
          onUndo={onUndo}
          canUndo={canUndo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
  },
});
