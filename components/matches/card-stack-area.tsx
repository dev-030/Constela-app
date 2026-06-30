import { useColor } from "@/hooks/useColor";
import { StyleSheet, View } from "react-native";
import { ActionButtons } from "./action-buttons";
import { SwipeDeck } from "./swipe-deck";
import { UndoButton } from "./undo-button";
import { MatchProfile } from "@/api/matching";
import { SwipeDirection, SwipeHandle } from "@/components/swipe";
import { Ref } from "react";

interface CardStackAreaProps {
  matches: MatchProfile[];
  isLoading: boolean;
  isError: boolean;
  swipeRef: Ref<SwipeHandle>;
  canUndo: boolean;
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
  isLoading,
  isError,
  swipeRef,
  canUndo,
  swipePending,
  onSwipe,
  onActiveIndexChange,
  onUndo,
  onReject,
  onSuper,
  onLike,
  onRetry,
}: CardStackAreaProps) {
  const primary = useColor("primary");

  return (
    <View style={[styles.area, { backgroundColor: primary + "14" }]}>
      <UndoButton disabled={!canUndo} onPress={onUndo} />

      <SwipeDeck
        ref={swipeRef}
        matches={matches}
        isLoading={isLoading}
        isError={isError}
        onSwipe={onSwipe}
        onActiveIndexChange={onActiveIndexChange}
        onRetry={onRetry}
      />

      <ActionButtons
        onReject={onReject}
        onSuper={onSuper}
        onLike={onLike}
        disabled={matches.length === 0 || isLoading}
        likePending={swipePending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    flex: 1,
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 18,
    alignItems: "center",
    justifyContent: "space-between",
  },
});