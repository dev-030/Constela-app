import { useColor } from "@/hooks/useColor";
import { StyleSheet, View, Text } from "react-native";
import { ActionButtons } from "./action-buttons";
import { SwipeDeck } from "./swipe-deck";
import { UndoButton } from "./undo-button";
import { Lock } from "lucide-react-native";
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
  const primary = useColor("primary");

  return (
    <View style={[styles.area, { backgroundColor: "transparent" }]}>
      <View style={{ flex: 1, width: "100%", paddingHorizontal: 16, marginVertical: 20 }}>
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
        {isLocked && (
          <View style={styles.lockOverlay} pointerEvents="none">
            <View style={styles.lockBadge}>
              <Lock size={24} color="#FFF" />
              <Text style={styles.lockText}>Daily Limit Reached</Text>
              <Text style={styles.lockSubtext}>Resets at midnight</Text>
            </View>
          </View>
        )}
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
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    zIndex: 10,
  },
  lockBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  lockText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  lockSubtext: {
    color: "#CCC",
    fontSize: 12,
  },
});