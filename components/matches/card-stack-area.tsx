import { useColor } from "@/hooks/useColor";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { ActionButtons } from "./action-buttons";
import { SwipeDeck } from "./swipe-deck";
import { UndoButton } from "./undo-button";
import { Lock, Clock, Sparkles } from "lucide-react-native";
import { MatchProfile } from "@/api/matching";
import { SwipeDirection, SwipeHandle } from "@/components/swipe";
import { Ref } from "react";
import { BlurView } from "expo-blur";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

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
  const router = useRouter();
  const { t } = useTranslation();
  const primary = useColor("primary");
  const noopGesture = Gesture.Pan().onUpdate(() => {}).onEnd(() => {});
  const noopTap = Gesture.Tap().onEnd(() => {});
  const lockGesture = Gesture.Simultaneous(noopGesture, noopTap);

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
        {isLocked && (
          <GestureDetector gesture={lockGesture}>
            <Pressable
              style={styles.lockOverlayContainer}
              pointerEvents="auto"
              onPress={(e) => e.stopPropagation()}
            >
              <BlurView intensity={90} tint="dark" style={styles.blurContainer}>
                <LinearGradient
                  colors={[
                    "rgba(58, 10, 32, 0.92)",
                    "rgba(115, 20, 60, 0.88)",
                    "rgba(222, 65, 119, 0.82)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.glassContent}
                >
                  {/* Glowing Brand Icon */}
                  <View style={styles.iconGlowWrap}>
                    <LinearGradient
                      colors={["#FF6598", "#DE4177"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iconCircle}
                    >
                      <Lock size={32} color="#FFFFFF" strokeWidth={2.5} />
                    </LinearGradient>
                  </View>

                  {/* Luminous Title */}
                  <Text style={styles.premiumLockTitle}>{t("matches.out_of_likes_title", "Out of Likes")}</Text>

                  {/* Refined Subtitle */}
                  <Text style={styles.premiumLockDesc}>
                    {t(
                      "matches.out_of_likes_desc",
                      "You've reached your daily limit of likes. Upgrade your plan for unlimited likes or check back at midnight!",
                    )}
                  </Text>

                  {/* Reset Countdown Badge */}
                  <View style={styles.countdownRow}>
                    <Clock size={15} color="#FDE68A" />
                    <Text style={styles.countdownText}>{t("matches.out_of_likes_resets", "Resets at midnight")}</Text>
                  </View>

                  {/* Upgrade CTA Button */}
                  <Pressable
                    style={styles.upgradeBtn}
                    onPress={() => router.navigate("/settings/subscription")}
                  >
                    <LinearGradient
                      colors={["#FF5388", "#DE4177"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.upgradeBtnGradient}
                    >
                      <Sparkles size={16} color="#FFFFFF" />
                      <Text style={styles.upgradeBtnText}>{t("matches.out_of_likes_upgrade", "Upgrade Plan")}</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              </BlurView>
            </Pressable>
          </GestureDetector>
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
  lockOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: "hidden",
    zIndex: 100,
  },
  blurContainer: {
    flex: 1,
  },
  glassContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  iconGlowWrap: {
    shadowColor: "#FF6598",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
    marginBottom: 18,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  premiumLockTitle: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 27,
    marginBottom: 8,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  premiumLockDesc: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 14.5,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 7,
    marginBottom: 20,
  },
  countdownText: {
    color: "#FDE68A",
    fontSize: 13.5,
    fontWeight: "700",
  },
  upgradeBtn: {
    width: "100%",
    maxWidth: 240,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#FF5388",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  upgradeBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
  },
  upgradeBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
