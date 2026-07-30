import { useColor } from "@/hooks/useColor";
import { StyleSheet, View, Text } from "react-native";
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

      <View style={{ alignItems: "center", width: "100%" }}>
        <ActionButtons
          onReject={onReject}
          onSuper={onSuper}
          onLike={onLike}
          disabled={matches.length === 0 || isLoading}
          likePending={swipePending}
        />
        <Text style={styles.showMoreText}>Show More Profiles</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: {
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  showMoreText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
    letterSpacing: 0.2,
  },
});