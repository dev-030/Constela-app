import * as React from "react";
import { Image, Pressable, View, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useSharedValue,
} from "react-native-reanimated";
import Carousel, { TAnimationStyle } from "react-native-reanimated-carousel";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Heart,
  RotateCcw,
  Sliders,
  SlidersHorizontal,
  Star,
  Undo,
  User,
  X,
} from "lucide-react-native";

import { window } from "@/constants/sizes";
import { router } from "expo-router";
import { Icon } from "./ui/icon";
import { useColor } from "@/hooks/useColor";
import { MatchProfile } from "@/api/matching";

interface SwipeProps {
  profiles: MatchProfile[];
  onSwipe?: (profile: MatchProfile, direction: "left" | "right") => void;
}

function Swipe({ profiles, onSwipe }: SwipeProps) {
  const PAGE_WIDTH = window.width - 64; // accounting for padding
  const PAGE_HEIGHT = window.height * 0.55; // smaller height to fit in the cardStackArea

  const primary = useColor("primary")

  const directionAnimVal = useSharedValue(0);
  const currentIndex = React.useRef(0);

  const animationStyle: TAnimationStyle = React.useCallback(
    (value: number, index: number) => {
      "worklet";
      const translateY = interpolate(value, [0, 1], [0, -18]);

      const translateX =
        interpolate(value, [-1, 0], [PAGE_WIDTH, 0], Extrapolation.CLAMP) *
        directionAnimVal.value;

      const rotateZ =
        interpolate(value, [-1, 0], [15, 0], Extrapolation.CLAMP) *
        directionAnimVal.value;

      const zIndex = -10 * index;

      const scale = interpolate(value, [0, 1], [1, 0.95]);

      const opacity = interpolate(
        value,
        [-1, -0.8, 0, 1],
        [0, 0.9, 1, 0.85],
        Extrapolation.EXTEND,
      );

      return {
        transform: [
          { translateY },
          { translateX },
          { rotateZ: `${rotateZ}deg` },
          { scale },
        ],
        zIndex,
        opacity,
      };
    },
    [PAGE_HEIGHT, PAGE_WIDTH],
  );

  return (
    <View
      id="carousel-component"
      dataSet={{ kind: "custom-animations", name: "tinder" }}
      style={{
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
      //   backgroundColor: "red",
      }}
    >
      <Carousel
        loop={false}
        width={PAGE_WIDTH}
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
        }}
        defaultIndex={0}
        vertical={false}
        data={profiles}
        onConfigurePanGesture={(g) => {
          g.onChange((e) => {
            "worklet";
            directionAnimVal.value = Math.sign(e.translationX);
          });
        }}
        onSnapToItem={(index) => {
          if (onSwipe && profiles[currentIndex.current]) {
            const swipedProfile = profiles[currentIndex.current];
            const direction = directionAnimVal.value > 0 ? "right" : "left";
            onSwipe(swipedProfile, direction);
          }
          currentIndex.current = index;
        }}
        fixedDirection="negative"
        renderItem={({ index, item }) => <Item key={item.id || index} user={item} />}
        customAnimation={animationStyle}
        windowSize={5}
      />
    </View>
  );
}

const Item: React.FC<{ user: MatchProfile }> = ({ user }) => {
  const width = window.width * 0.7;
  const height = window.height * 0.5;

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Pressable
        onPress={() => router.push({ pathname: "/sheet", params: { id: user.id } })}
        style={{
          width,
          height,
          borderWidth: 1,
          borderColor: "black",
          borderRadius: 20,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri: user.photo }}
          style={{
            width,
            height,
            borderRadius: 20,
          }}
        />

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.70)", "rgba(0,0,0,0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomGradientLayer}
        />

        {/* User details */}
        <View style={styles.details} pointerEvents="none">
          <Animated.Text numberOfLines={1} style={styles.name}>
            {user.username}, {user.age}
          </Animated.Text>

          <Animated.Text numberOfLines={2} style={styles.bio}>
            {user.bio}
          </Animated.Text>

          <View style={styles.interestsRow}>
            {(user.tags || []).slice(0, 3).map((tag) => (
              <View key={tag} style={styles.interestPill}>
                <Animated.Text numberOfLines={1} style={styles.interestText}>
                  {tag}
                </Animated.Text>
              </View>
            ))}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomGradientLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 170,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  details: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  bio: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    marginTop: 4,
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
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
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    marginTop: 40,
    zIndex: 10,
  },
  rejectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#004D40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4, // Added Android shadow compatibility
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2, // Added Android shadow compatibility
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4, // Added Android shadow compatibility
  },
});

export default Swipe;
