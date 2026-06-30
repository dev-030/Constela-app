import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Heart, Star, X } from "lucide-react-native";

import { MatchProfile } from "@/api/matching";

export type SwipeDirection = "left" | "right" | "super";

export interface SwipeHandle {
  swipe: (direction: SwipeDirection) => void;
  undo: () => boolean;
  canUndo: boolean;
  remaining: number;
}

interface SwipeProps {
  profiles: MatchProfile[];
  onSwipe?: (profile: MatchProfile, direction: SwipeDirection) => void;
  onEmpty?: () => void;
  onActiveIndexChange?: (profile: MatchProfile | undefined) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.22;
const SWIPE_OUT_DURATION = 280;
const ROTATION_AMPLITUDE = 12; // degrees at the edge

function Card({
  user,
  isTop,
  isSecond,
  isThird,
  width,
  height,
  topTranslateX,
  topTranslateY,
}: {
  user: MatchProfile;
  isTop: boolean;
  isSecond: boolean;
  isThird: boolean;
  width: number;
  height: number;
  topTranslateX: SharedValue<number>;
  topTranslateY: SharedValue<number>;
}) {
  const handlePress = () => {
    router.push({ pathname: "/sheet", params: { id: user.id } });
  };

  const topAnimated = useAnimatedStyle(() => {
    const rotateZ = interpolate(
      topTranslateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-ROTATION_AMPLITUDE, 0, ROTATION_AMPLITUDE],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: topTranslateX.value },
        { translateY: topTranslateY.value },
        { rotateZ: `${rotateZ}deg` },
      ],
    };
  });

  const secondAnimated = useAnimatedStyle(() => {
    const dragProgress = Math.min(Math.abs(topTranslateX.value) / SCREEN_WIDTH, 1);
    const scale = interpolate(dragProgress, [0, 1], [0.94, 1]);
    const translateY = interpolate(dragProgress, [0, 1], [16, 0]);
    return {
      transform: [{ scale }, { translateY }],
      opacity: interpolate(dragProgress, [0, 1], [0.85, 1], Extrapolation.CLAMP),
    };
  });

  const thirdAnimated = useAnimatedStyle(() => {
    const dragProgress = Math.min(Math.abs(topTranslateX.value) / SCREEN_WIDTH, 1);
    const scale = interpolate(dragProgress, [0, 1], [0.88, 0.94]);
    const translateY = interpolate(dragProgress, [0, 1], [32, 16]);
    return {
      transform: [{ scale }, { translateY }],
      opacity: interpolate(dragProgress, [0, 1], [0.7, 0.85], Extrapolation.CLAMP),
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      topTranslateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const nopeBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      topTranslateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  const superBadgeStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      topTranslateY.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <>
      {isThird ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardContainer,
            {
              width,
              height,
              zIndex: 0,
            },
            thirdAnimated,
          ]}
        >
          <View style={[styles.cardInner, { backgroundColor: "#E5E5EA" }]}>
            <Image
              source={{ uri: user.photo }}
              style={[styles.image, { opacity: 0.6 }]}
            />
          </View>
        </Animated.View>
      ) : null}

      {isSecond ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardContainer,
            {
              width,
              height,
              zIndex: 1,
            },
            secondAnimated,
          ]}
        >
          <View style={[styles.cardInner, { backgroundColor: "#FFFFFF" }]}>
            <Image source={{ uri: user.photo }} style={styles.image} />
          </View>
        </Animated.View>
      ) : null}

      {isTop ? (
        <Animated.View
          style={[
            styles.cardContainer,
            {
              width,
              height,
              zIndex: 2,
            },
            topAnimated,
          ]}
        >
          <Pressable
            onPress={handlePress}
            style={[styles.cardInner, { backgroundColor: "#FFFFFF" }]}
          >
            <Image source={{ uri: user.photo }} style={styles.image} />

            <LinearGradient
              pointerEvents="none"
              colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.85)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.bottomGradientLayer}
            />

            <Animated.View
              pointerEvents="none"
              style={[styles.badgeLike, likeBadgeStyle]}
            >
              <View style={[styles.badgeInner, { borderColor: "#10B981" }]}>
                <Heart size={28} color="#10B981" fill="#10B981" />
                <Animated.Text style={styles.badgeLikeText}>LIKE</Animated.Text>
              </View>
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[styles.badgeNope, nopeBadgeStyle]}
            >
              <View style={[styles.badgeInner, { borderColor: "#EF4444" }]}>
                <X size={28} color="#EF4444" strokeWidth={3} />
                <Animated.Text style={styles.badgeNopeText}>NOPE</Animated.Text>
              </View>
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={[styles.badgeSuper, superBadgeStyle]}
            >
              <View
                style={[
                  styles.badgeInner,
                  { borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.18)" },
                ]}
              >
                <Star size={26} color="#3B82F6" fill="#3B82F6" />
                <Animated.Text style={[styles.badgeSuperText, { color: "#3B82F6" }]}>
                  SUPER
                </Animated.Text>
              </View>
            </Animated.View>

            <View style={styles.details} pointerEvents="none">
              <View style={styles.detailsRow}>
                <View style={{ flex: 1 }}>
                  <Animated.Text numberOfLines={1} style={styles.name}>
                    {user.username}, {user.age}
                  </Animated.Text>
                  {user.city || user.country ? (
                    <Animated.Text numberOfLines={1} style={styles.location}>
                      {[user.city, user.country].filter(Boolean).join(", ")}
                    </Animated.Text>
                  ) : null}
                </View>
                {typeof user.compatibility_score === "number" ? (
                  <View style={styles.scorePill}>
                    <Animated.Text style={styles.scoreText}>
                      {user.compatibility_score}%
                    </Animated.Text>
                  </View>
                ) : null}
              </View>
              {user.bio ? (
                <Animated.Text numberOfLines={2} style={styles.bio}>
                  {user.bio}
                </Animated.Text>
              ) : null}
              {user.tags?.length ? (
                <View style={styles.interestsRow}>
                  {user.tags.slice(0, 4).map((tag) => (
                    <View key={tag} style={styles.interestPill}>
                      <Animated.Text numberOfLines={1} style={styles.interestText}>
                        {tag}
                      </Animated.Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </>
  );
}

const Swipe = forwardRef<SwipeHandle, SwipeProps>(function Swipe(
  { profiles, onSwipe, onEmpty, onActiveIndexChange },
  ref
) {
  const [stack, setStack] = useState<MatchProfile[]>(profiles);
  const [history, setHistory] = useState<MatchProfile[]>([]);

  React.useEffect(() => {
    setStack(profiles);
    setHistory([]);
  }, [profiles]);

  React.useEffect(() => {
    if (onActiveIndexChange) {
      onActiveIndexChange(stack[0]);
    }
  }, [stack, onActiveIndexChange]);

  const top = stack[0];
  const second = stack[1];
  const third = stack[2];

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const triggerHaptic = (
    kind: "impactLight" | "notificationSuccess" | "notificationWarning"
  ) => {
    try {
      if (kind === "impactLight") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (kind === "notificationSuccess") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      /* haptics unavailable */
    }
  };

  const finalizeSwipe = (direction: SwipeDirection) => {
    const profile = stack[0];
    if (!profile) {
      translateX.value = 0;
      translateY.value = 0;
      return;
    }
    setStack((prev) => prev.slice(1));
    setHistory((prev) => [...prev, profile]);
    if (onSwipe) onSwipe(profile, direction);
    translateX.value = 0;
    translateY.value = 0;
  };

  const flyOff = (
    toX: number,
    toY: number,
    direction: SwipeDirection,
    duration: number = SWIPE_OUT_DURATION
  ) => {
    translateX.value = withTiming(toX, { duration });
    translateY.value = withTiming(
      toY,
      { duration },
      (finished) => {
        if (finished) {
          runOnJS(finalizeSwipe)(direction);
        }
      }
    );
  };

  const triggerProgrammatic = (direction: SwipeDirection) => {
    if (!stack[0]) return;
    const horizontal =
      direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    const vertical = direction === "super" ? -SCREEN_HEIGHT * 1.2 : 0;
    triggerHaptic(direction === "left" ? "notificationWarning" : "notificationSuccess");
    flyOff(horizontal, vertical, direction);
  };

  const undo = (): boolean => {
    if (history.length === 0) return false;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setStack((prev) => [last, ...prev]);
    translateX.value = 0;
    translateY.value = 0;
    return true;
  };

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => triggerProgrammatic(direction),
      undo: () => undo(),
      canUndo: history.length > 0,
      remaining: stack.length,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stack, history]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      const farEnoughX =
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.velocityX) > 800;
      const farEnoughY =
        e.translationY < -SWIPE_THRESHOLD || e.velocityY < -800;

      if (farEnoughY && e.translationY < Math.abs(e.translationX) * -1) {
        runOnJS(triggerHaptic)("notificationSuccess");
        flyOff(e.translationX, -SCREEN_HEIGHT * 1.2, "super");
        return;
      }

      if (farEnoughX) {
        if (e.translationX > 0) {
          runOnJS(triggerHaptic)("notificationSuccess");
          flyOff(SCREEN_WIDTH * 1.5, e.translationY, "right");
        } else {
          runOnJS(triggerHaptic)("notificationWarning");
          flyOff(-SCREEN_WIDTH * 1.5, e.translationY, "left");
        }
        return;
      }

      // Didn't reach threshold → spring back.
      translateX.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(0, { duration: 220 });
    });

  const PAGE_WIDTH = SCREEN_WIDTH - 48;
  const PAGE_HEIGHT = Math.min(SCREEN_HEIGHT * 0.58, 560);

  // Surface empty state via the prop without breaking Rules of Hooks.
  React.useEffect(() => {
    if (!top && onEmpty) onEmpty();
  }, [top, onEmpty]);

  if (!top) {
    return (
      <View
        style={[
          styles.container,
          { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: PAGE_WIDTH, height: PAGE_HEIGHT },
      ]}
    >
      <GestureDetector gesture={panGesture}>
        <View style={StyleSheet.absoluteFill}>
          {third ? (
            <Card
              user={third}
              isTop={false}
              isSecond={false}
              isThird
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              topTranslateX={translateX}
              topTranslateY={translateY}
            />
          ) : null}
          {second ? (
            <Card
              user={second}
              isTop={false}
              isSecond
              isThird={false}
              width={PAGE_WIDTH}
              height={PAGE_HEIGHT}
              topTranslateX={translateX}
              topTranslateY={translateY}
            />
          ) : null}
          <Card
            user={top}
            isTop
            isSecond={false}
            isThird={false}
            width={PAGE_WIDTH}
            height={PAGE_HEIGHT}
            topTranslateX={translateX}
            topTranslateY={translateY}
          />
        </View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cardContainer: {
    position: "absolute",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  bottomGradientLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  details: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  location: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  bio: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
    marginTop: 6,
  },
  scorePill: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.4)",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  interestPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  interestText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  badgeLike: {
    position: "absolute",
    top: 28,
    left: 24,
    transform: [{ rotate: "-12deg" }],
    zIndex: 5,
  },
  badgeNope: {
    position: "absolute",
    top: 28,
    right: 24,
    transform: [{ rotate: "12deg" }],
    zIndex: 5,
  },
  badgeSuper: {
    position: "absolute",
    top: 28,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  badgeLikeText: {
    color: "#10B981",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  badgeNopeText: {
    color: "#EF4444",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  badgeSuperText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },
});

export default Swipe;