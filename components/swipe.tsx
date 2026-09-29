import React, {
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  SharedValue,
  runOnUI,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Heart, Star, X, CheckCircle2 } from "lucide-react-native";
import { useQueryClient } from "@tanstack/react-query";
import { fetchProfileDetails } from "@/api/profile";

import { MatchProfile } from "@/api/matching";

export type SwipeDirection = "left" | "right" | "super";

export interface SwipeHandle {
  swipe: (direction: SwipeDirection) => void;
  undo: () => MatchProfile | null;
  canUndo: boolean;
  remaining: number;
}

interface SwipeProps {
  profiles: MatchProfile[];
  onSwipe?: (profile: MatchProfile, direction: SwipeDirection) => void;
  onEmpty?: () => void;
  onActiveIndexChange?: (profile: MatchProfile | undefined) => void;
  locked?: boolean;
}

const SWIPE_OUT_DURATION = 280;
const ROTATION_AMPLITUDE = 15; // degrees at the edge

const Card = React.memo(function Card({
  user,
  positionSv,
  topTranslateX,
  topTranslateY,
  screenWidth,
}: {
  user: MatchProfile;
  /** 0 = top, 1 = second, 2 = third — updated on the UI thread directly */
  positionSv: SharedValue<number>;
  topTranslateX: SharedValue<number>;
  topTranslateY: SharedValue<number>;
  screenWidth: number;
}) {
  const swipeThreshold = screenWidth * 0.22;
  // Single worklet that blends all three position styles on the UI thread.
  // Because positionSv is a SharedValue it updates without any React re-render,
  // eliminating the "wrong worklet for one frame" flash that JS-boolean switching causes.
  const animatedStyle = useAnimatedStyle(() => {
    const pos = positionSv.value; // 0=top, 1=second, 2=third

    if (pos === 0) {
      // TOP: translates with the gesture
      const rotateZ = interpolate(
        topTranslateX.value,
        [-screenWidth, 0, screenWidth],
        [-ROTATION_AMPLITUDE, 0, ROTATION_AMPLITUDE],
        Extrapolation.CLAMP
      );
      return {
        zIndex: 2,
        transform: [
          { translateX: topTranslateX.value },
          { translateY: topTranslateY.value },
          { rotateZ: `${rotateZ}deg` },
        ],
        opacity: 1,
      };
    }

    // SECOND / THIRD: scale up as the top card is dragged away
    const dragProgress = Math.min(Math.abs(topTranslateX.value) / screenWidth, 1);
    const isSecond = pos === 1;

    const scale = isSecond
      ? interpolate(dragProgress, [0, 1], [0.98, 1])
      : interpolate(dragProgress, [0, 1], [0.96, 0.98]);

    const rotateZ = isSecond
      ? interpolate(dragProgress, [0, 1], [-4, 0])
      : interpolate(dragProgress, [0, 1], [4, -4]);

    const opacity = isSecond
      ? interpolate(dragProgress, [0, 1], [0.9, 1], Extrapolation.CLAMP)
      : interpolate(dragProgress, [0, 1], [0.75, 0.85], Extrapolation.CLAMP);

    return {
      zIndex: isSecond ? 1 : 0,
      transform: [{ scale }, { translateY: 0 }, { rotateZ: `${rotateZ}deg` }],
      opacity,
    };
  });

  const likeBadgeStyle = useAnimatedStyle(() => {
    if (positionSv.value !== 0) return { opacity: 0 };
    return {
      opacity: interpolate(topTranslateX.value, [0, swipeThreshold], [0, 1], Extrapolation.CLAMP),
    };
  });

  const nopeBadgeStyle = useAnimatedStyle(() => {
    if (positionSv.value !== 0) return { opacity: 0 };
    return {
      opacity: interpolate(topTranslateX.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  const superBadgeStyle = useAnimatedStyle(() => {
    if (positionSv.value !== 0) return { opacity: 0 };
    return {
      opacity: interpolate(topTranslateY.value, [-swipeThreshold, 0], [1, 0], Extrapolation.CLAMP),
    };
  });

  // Read isTop once for JSX branching — this IS fine because React.memo will
  // re-render when positionSv changes as a prop... wait, SharedValues don't
  // trigger React re-renders. So we use a derived JS value only for the badge
  // overlay which only matters when the card IS on top.
  // The animated style handles everything else on the UI thread.
  const isTopForBadges = positionSv.value === 0;

  return (
    <Animated.View
      pointerEvents="auto"
      style={[styles.cardContainer, animatedStyle]}
    >
      <View style={[styles.cardInner, user.has_superliked_me && styles.superLikedBorder]}>
        {user.compatibility_score && user.compatibility_score >= 90 ? (
          <View style={styles.perfectMatchBanner}>
            <Text style={styles.perfectMatchBannerText}>YOUR PERFECT MATCH</Text>
          </View>
        ) : null}

        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: user.photo }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.85)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.bottomGradientLayer, { height: 160 }]}
          />

          {user.has_superliked_me && (
            <View style={styles.superLikedBadge}>
              <Star size={16} color="#FFF" fill="#FFF" />
              <Text style={styles.superLikedText}>SUPER LIKED YOU</Text>
            </View>
          )}



          <View style={styles.imageDetails} pointerEvents="none">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Text numberOfLines={1} style={[styles.name, { marginBottom: 0 }]}>
                {user.name}, {user.age}
              </Text>
              {user.is_verified && <CheckCircle2 size={22} color="#3B82F6" />}
            </View>
            {user.bio ? (
              <Text numberOfLines={1} style={styles.bio}>
                {user.bio}
              </Text>
            ) : null}

            {user.tags && user.tags.length > 0 && (
              <View style={[styles.tagsContainer, { paddingHorizontal: 0, paddingTop: 8, paddingBottom: 0, justifyContent: 'flex-start' }]}>
                {user.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.goldTagPill}>
                    <Text style={styles.goldTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

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
          <View style={[styles.badgeInner, { borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.18)" }]}>
            <Star size={26} color="#3B82F6" fill="#3B82F6" />
            <Animated.Text style={[styles.badgeSuperText, { color: "#3B82F6" }]}>SUPER</Animated.Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

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

export const Swipe = forwardRef<SwipeHandle, SwipeProps>(function Swipe(
  { profiles, onSwipe, onEmpty, onActiveIndexChange, locked = false },
  ref
) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const swipeThreshold = screenWidth * 0.22;
  const renderedIds = React.useRef<Set<string>>(new Set());
  const lockedSv = useSharedValue(locked);
  React.useEffect(() => {
    lockedSv.value = locked;
  }, [locked, lockedSv]);

  const buildInitialDeck = React.useCallback((profileList: MatchProfile[]) => {
    const initial = profileList.slice(0, 3);
    initial.forEach((p) => renderedIds.current.add(p.id));
    const queue = profileList.slice(3).filter((p) => !renderedIds.current.has(p.id));
    queue.forEach((p) => renderedIds.current.add(p.id));
    return {
      slots: [
        initial[0] ?? null,
        initial[1] ?? null,
        initial[2] ?? null,
      ] as (MatchProfile | null)[],
      topSlotIndex: 0,
      queue,
    };
  }, []);

  const [deck, setDeck] = React.useState(() => buildInitialDeck(profiles));
  const [history, setHistory] = React.useState<MatchProfile[]>([]);

  const deckRef = React.useRef(deck);
  React.useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  React.useEffect(() => {
    if (profiles.length === 0) return;
    const fresh = profiles.filter((p) => !renderedIds.current.has(p.id));
    if (fresh.length === 0) return;
    fresh.forEach((p) => renderedIds.current.add(p.id));

    setDeck((prev) => {
      const newSlots = [...prev.slots];
      const incoming = [...prev.queue, ...fresh];
      let qi = 0;
      for (let i = 0; i < 3 && qi < incoming.length; i++) {
        if (newSlots[i] === null) {
          newSlots[i] = incoming[qi++];
        }
      }
      return { ...prev, slots: newSlots, queue: incoming.slice(qi) };
    });
  }, [profiles]);

  React.useEffect(() => {
    const slotUrls = deck.slots.map((p) => p?.photo).filter(Boolean) as string[];
    const queueUrls = deck.queue.slice(0, 3).map((p) => p.photo).filter(Boolean) as string[];
    const urlsToPrefetch = [...slotUrls, ...queueUrls];
    
    if (urlsToPrefetch.length > 0) {
      Image.prefetch(urlsToPrefetch);
    }
  }, [deck.topSlotIndex, deck.queue]);

  const { slots, topSlotIndex, queue } = deck;
  const secondSlotIndex = (topSlotIndex + 1) % 3;
  const thirdSlotIndex  = (topSlotIndex + 2) % 3;
  const topProfile = slots[topSlotIndex];

  React.useEffect(() => {
    if (onActiveIndexChange) onActiveIndexChange(topProfile ?? undefined);
  }, [topProfile?.id]);               // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!topProfile && onEmpty) onEmpty();
  }, [topProfile]);                   // eslint-disable-line react-hooks/exhaustive-deps

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pendingSwipe = useSharedValue(false);

  const positionSv0 = useSharedValue(0);
  const positionSv1 = useSharedValue(1);
  const positionSv2 = useSharedValue(2);
  const positionSvs = [positionSv0, positionSv1, positionSv2];

  React.useLayoutEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    pendingSwipe.value = false;
    for (let i = 0; i < 3; i++) {
      positionSvs[i].value = (i - topSlotIndex + 3) % 3;
    }
  }, [topSlotIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalizeSwipe = React.useCallback(
    (direction: SwipeDirection) => {
      const { slots, topSlotIndex, queue } = deckRef.current;
      const profile = slots[topSlotIndex];
      if (!profile) return;

      setDeck((prev) => {
        const newTopSlot   = (prev.topSlotIndex + 1) % 3;
        const recycledSlot = prev.topSlotIndex;
        const newSlots     = [...prev.slots];
        const [nextProfile, ...restQueue] = prev.queue;
        newSlots[recycledSlot] = nextProfile ?? null;
        return { slots: newSlots, topSlotIndex: newTopSlot, queue: restQueue };
      });

      setHistory([profile]);
      if (onSwipe) onSwipe(profile, direction);
    },
    [onSwipe]
  );

  const queryClient = useQueryClient();

  // Prefetch full profile details for the active card and next card in queue
  // so opening a profile displays image + info together instantly with zero pop-in
  React.useEffect(() => {
    const current = slots[topSlotIndex];
    if (current?.id) {
      void queryClient.prefetchQuery({
        queryKey: ["profileDetails", current.id],
        queryFn: () => fetchProfileDetails(current.id),
        staleTime: 5 * 60 * 1000,
      });
    }
    const nextSlot = slots[(topSlotIndex + 1) % 3];
    if (nextSlot?.id) {
      void queryClient.prefetchQuery({
        queryKey: ["profileDetails", nextSlot.id],
        queryFn: () => fetchProfileDetails(nextSlot.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [topSlotIndex, slots, queryClient]);

  const navigateToProfile = React.useCallback((profile: MatchProfile) => {
    router.push({
      pathname: "/profile/[id]",
      params: {
        id: profile.id,
        name: profile.name,
        age: profile.age.toString(),
        photo: profile.photo,
        is_verified: profile.is_verified ? "true" : "false",
      },
    } as any);
  }, []);

  const triggerProgrammatic = (direction: SwipeDirection) => {
    if (locked || !slots[topSlotIndex] || pendingSwipe.value) return;
    pendingSwipe.value = true;
    const horizontal =
      direction === "right"
        ? screenWidth * 1.5
        : direction === "left"
        ? -screenWidth * 1.5
        : 0;
    const vertical = direction === "super" ? -screenHeight * 1.2 : 0;
    
    triggerHaptic(direction === "left" ? "notificationWarning" : "notificationSuccess");
    
    const triggerAnim = () => {
      'worklet';
      const exitEasing = Easing.out(Easing.cubic);
      const DURATION = 220;
      if (direction === "super") {
        translateX.value = withTiming(horizontal, { duration: DURATION, easing: exitEasing });
        translateY.value = withTiming(vertical, { duration: DURATION, easing: exitEasing }, (finished) => {
          if (finished) {
            runOnJS(finalizeSwipe)(direction);
          } else {
            pendingSwipe.value = false;
          }
        });
      } else {
        translateY.value = withTiming(vertical, { duration: DURATION, easing: exitEasing });
        translateX.value = withTiming(horizontal, { duration: DURATION, easing: exitEasing }, (finished) => {
          if (finished) {
            runOnJS(finalizeSwipe)(direction);
          } else {
            pendingSwipe.value = false;
          }
        });
      }
    };
    
    runOnUI(triggerAnim)();
  };

  const undo = (): MatchProfile | null => {
    if (history.length === 0 || pendingSwipe.value) return null;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    setDeck((prev) => {
      const prevTopSlot  = (prev.topSlotIndex - 1 + 3) % 3;
      const newSlots     = [...prev.slots];
      const displaced = newSlots[prevTopSlot];
      newSlots[prevTopSlot] = last;
      return {
        slots: newSlots,
        topSlotIndex: prevTopSlot,
        queue: displaced ? [displaced, ...prev.queue] : prev.queue,
      };
    });
    return last;
  };

  useImperativeHandle(
    ref,
    () => ({
      swipe: (direction) => triggerProgrammatic(direction),
      undo: () => undo(),
      canUndo: history.length > 0,
      remaining:
        deck.slots.filter((s) => s !== null).length + deck.queue.length,
    }),
    [deck, history]
  );

  const panGesture = Gesture.Pan()
    .enabled(!locked)
    .onBegin(() => {
      if (locked || lockedSv.value) return;
    })
    .onUpdate((e) => {
      if (locked || lockedSv.value || pendingSwipe.value) return;
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (locked || lockedSv.value || pendingSwipe.value) return;

      const farEnoughX =
        Math.abs(e.translationX) > swipeThreshold || Math.abs(e.velocityX) > 800;
      const isSwipeUp  = e.translationY < -swipeThreshold || e.velocityY < -800;
      const isSuperLike = isSwipeUp && Math.abs(e.translationY) > Math.abs(e.translationX);

      const EXIT_DURATION = 220;
      const exitEasing = Easing.out(Easing.cubic);

      if (isSuperLike) {
        pendingSwipe.value = true;
        runOnJS(triggerHaptic)("notificationSuccess");
        const angle = Math.atan2(e.translationY, e.translationX || 0.001);
        const exitX = Math.cos(angle) * screenHeight * 1.5;
        translateX.value = withTiming(exitX, { duration: EXIT_DURATION, easing: exitEasing });
        translateY.value = withTiming(
          -screenHeight * 1.5,
          { duration: EXIT_DURATION, easing: exitEasing },
          (finished) => {
            if (finished) {
              runOnJS(finalizeSwipe)("super");
            } else {
              pendingSwipe.value = false;
            }
          }
        );
        return;
      } else if (farEnoughX) {
        const direction = e.translationX > 0 ? "right" : "left";
        pendingSwipe.value = true;
        const dir = e.translationX > 0 ? 1 : -1;
        runOnJS(triggerHaptic)(e.translationX > 0 ? "notificationSuccess" : "notificationWarning");

        const angle = Math.atan2(e.translationY, e.translationX || 0.001);
        const exitDistance = screenWidth * 1.5;
        const exitX = dir * exitDistance;
        const rawExitY = Math.tan(angle) * exitDistance * dir;
        const exitY = Math.max(-screenHeight * 0.5, Math.min(screenHeight * 0.5, rawExitY));

        translateY.value = withTiming(exitY, { duration: EXIT_DURATION, easing: exitEasing });
        translateX.value = withTiming(
          exitX,
          { duration: EXIT_DURATION, easing: exitEasing },
          (finished) => {
            if (finished) {
              runOnJS(finalizeSwipe)(direction);
            } else {
              pendingSwipe.value = false;
            }
          }
        );
        return;
      }


      translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const tapGesture = Gesture.Tap()
    .enabled(!locked)
    .maxDuration(250)
    .maxDistance(10)
    .onEnd(() => {
      if (locked || lockedSv.value || pendingSwipe.value) return;
      const profile = slots[topSlotIndex];
      if (profile) runOnJS(navigateToProfile)(profile);
    });

  const combinedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const hasAnyProfile = slots.some((s) => s !== null);

  if (!hasAnyProfile) {
    return (
      <View style={[styles.container, { flex: 1, width: "100%" }]} />
    );
  }

  const renderCards = () => (
    <View style={StyleSheet.absoluteFill}>
      {[thirdSlotIndex, secondSlotIndex, topSlotIndex].map((slotIdx) => {
        const profile = slots[slotIdx];
        if (!profile) return null;
        return (
          <Card
            key={`slot-${slotIdx}`}
            user={profile}
            positionSv={positionSvs[slotIdx]}
            topTranslateX={translateX}
            topTranslateY={translateY}
            screenWidth={screenWidth}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { flex: 1, width: "100%" }]}>
      {locked ? renderCards() : (
        <GestureDetector gesture={combinedGesture}>
          {renderCards()}
        </GestureDetector>
      )}
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
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  superLikedBorder: {
    borderWidth: 3,
    borderColor: "#4A90E2",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  superLikedBadge: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  superLikedText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  imageWrapper: {
    flex: 1,
    width: "100%",
    borderRadius: 24,
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
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    rowGap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  goldTagPill: {
    backgroundColor: "#FFC107",
    maxWidth: "100%",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  goldTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
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
