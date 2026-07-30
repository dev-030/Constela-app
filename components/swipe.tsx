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
  Text,
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
  topTranslateX,
  topTranslateY,
}: {
  user: MatchProfile;
  isTop: boolean;
  isSecond: boolean;
  isThird: boolean;
  topTranslateX: SharedValue<number>;
  topTranslateY: SharedValue<number>;
}) {
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
          style={[styles.cardContainer, { zIndex: 0 }, thirdAnimated]}
        >
          <View style={styles.cardInner}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: user.photo }}
                style={[styles.image, { opacity: 0.6 }]}
              />
            </View>
          </View>
        </Animated.View>
      ) : null}

      {isSecond ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.cardContainer, { zIndex: 1 }, secondAnimated]}
        >
          <View style={styles.cardInner}>
            <View style={styles.imageWrapper}>
              <Image source={{ uri: user.photo }} style={styles.image} />
            </View>
          </View>
        </Animated.View>
      ) : null}

      {isTop ? (
        <Animated.View
          style={[styles.cardContainer, { zIndex: 2 }, topAnimated]}
        >
          <View style={styles.cardInner}>
            {/* Banner at top center */}
            <View style={styles.perfectMatchBanner}>
              <Text style={styles.perfectMatchBannerText}>YOUR PERFECT MATCH</Text>
            </View>

            {/* Inset Image wrapper */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: user.photo }} style={styles.image} />

              <LinearGradient
                pointerEvents="none"
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.75)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.bottomGradientLayer}
              />

              {/* Floating heart icon on top right */}
              <View style={styles.floatingHeart}>
                <Heart size={16} color="#E91E63" fill="#E91E63" />
              </View>

              {/* Text overlays (Name/Bio) on the image */}
              <View style={styles.imageDetails} pointerEvents="none">
                <Text numberOfLines={1} style={styles.name}>
                  {user.username}, {user.age}
                </Text>
                {user.bio ? (
                  <Text numberOfLines={1} style={styles.bio}>
                    {user.bio}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Gold tags below the image */}
            <View style={styles.tagsContainer}>
              {(user.tags || []).slice(0, 3).map((tag) => (
                <View key={tag} style={styles.goldTagPill}>
                  <Text style={styles.goldTagText}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Like/Nope/Super badges floating overlays */}
            <Animated.View pointerEvents="none" style={[styles.badgeLike, likeBadgeStyle]}>
              <View style={[styles.badgeInner, { borderColor: "#10B981" }]}>
                <Heart size={28} color="#10B981" fill="#10B981" />
                <Animated.Text style={styles.badgeLikeText}>LIKE</Animated.Text>
              </View>
            </Animated.View>

            <Animated.View pointerEvents="none" style={[styles.badgeNope, nopeBadgeStyle]}>
              <View style={[styles.badgeInner, { borderColor: "#EF4444" }]}>
                <X size={28} color="#EF4444" strokeWidth={3} />
                <Animated.Text style={styles.badgeNopeText}>NOPE</Animated.Text>
              </View>
            </Animated.View>

            <Animated.View pointerEvents="none" style={[styles.badgeSuper, superBadgeStyle]}>
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
          </View>
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
    setTimeout(() => {
      setStack((prev) => prev.slice(1));
      setHistory((prev) => [...prev, profile]);
      if (onSwipe) onSwipe(profile, direction);
      translateX.value = 0;
      translateY.value = 0;
    }, 0);
  };

  const flyOff = (
    toX: number,
    toY: number,
    direction: SwipeDirection,
    duration: number = SWIPE_OUT_DURATION
  ) => {
    "worklet";
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
      direction === "right"
        ? SCREEN_WIDTH * 1.5
        : direction === "left"
        ? -SCREEN_WIDTH * 1.5
        : 0;
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
      // Lock vertical movement for a strictly horizontal swipe feel
      translateY.value = 0;
    })
    .onEnd((e) => {
      const farEnoughX =
        Math.abs(e.translationX) > SWIPE_THRESHOLD ||
        Math.abs(e.velocityX) > 800;

      if (farEnoughX) {
        if (e.translationX > 0) {
          runOnJS(triggerHaptic)("notificationSuccess");
          flyOff(SCREEN_WIDTH * 1.5, 0, "right");
        } else {
          runOnJS(triggerHaptic)("notificationWarning");
          flyOff(-SCREEN_WIDTH * 1.5, 0, "left");
        }
        return;
      }

      // Didn't reach threshold → spring back.
      translateX.value = withTiming(0, { duration: 220 });
      translateY.value = withTiming(0, { duration: 220 });
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (top) {
        runOnJS(router.push)({ pathname: "/sheet", params: { id: top.id } });
      }
    });

  const combinedGesture = Gesture.Exclusive(panGesture, tapGesture);

  const PAGE_WIDTH = SCREEN_WIDTH - 48;
  const PAGE_HEIGHT = 420;

  // Surface empty state via the prop without breaking Rules of Hooks.
  React.useEffect(() => {
    if (!top && onEmpty) onEmpty();
  }, [top, onEmpty]);

  if (!top) {
    return (
      <View
        style={[
          styles.container,
          { height: PAGE_HEIGHT, width: "100%" },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height: PAGE_HEIGHT, width: "100%" },
      ]}
    >
      <GestureDetector gesture={combinedGesture}>
        <View style={StyleSheet.absoluteFill}>
          {third ? (
            <Card
              user={third}
              isTop={false}
              isSecond={false}
              isThird
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
              topTranslateX={translateX}
              topTranslateY={translateY}
            />
          ) : null}
          <Card
            user={top}
            isTop
            isSecond={false}
            isThird={false}
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
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cardContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  perfectMatchBanner: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: "#D81B60",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  perfectMatchBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    padding: 12,
    paddingTop: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageWrapper: {
    flex: 1,
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
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
    height: 120,
  },
  floatingHeart: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageDetails: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  bio: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 4,
  },
  goldTagPill: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  goldTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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