import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import Animated, {
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  useSentFriendRequestsQuery,
  useCancelFriendRequestMutation,
  type FriendRequest,
} from "@/api/friends";
import { useAndroidBack } from "@/hooks/useAndroidBack";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SentRequestCardProps {
  req: FriendRequest;
  cardColor: string;
  primary: string;
  muted: string;
  border: string;
  onCancel: (friendshipId: string, onComplete?: () => void) => void;
}

const SentRequestCard = React.memo(function SentRequestCard({
  req,
  cardColor,
  primary,
  muted,
  border,
  onCancel,
}: SentRequestCardProps) {
  const [isCanceling, setIsCanceling] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressCancel = (event: any) => {
    event.stopPropagation();
    if (isCanceling) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    setIsCanceling(true);

    opacity.value = withTiming(0, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(0.88, {
      duration: 250,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(
      -6,
      { duration: 250, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(onCancel)(req.id, () => {
            setIsCanceling(false);
          });
        }
      }
    );
  };

  return (
    <AnimatedPressable
      layout={Layout.duration(260)}
      style={[
        styles.personCard,
        { backgroundColor: cardColor, borderColor: border },
        cardAnimatedStyle,
      ]}
      onPress={() =>
        router.push({
          pathname: `/profile/${req.receiver_id}`,
          params: { name: req.name, photo: req.photo },
        } as any)
      }
    >
      {/* Image with Name and Age Overlay */}
      <View style={styles.personImageContainer}>
        <Image
          source={{ uri: req.photo }}
          style={styles.personImage}
          contentFit="cover"
          transition={180}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.68)"]}
          locations={[0.5, 1]}
          style={styles.personImageOverlay}
        />
        <View style={styles.personNameContainer}>
          <Text style={styles.personNameAge} numberOfLines={1}>
            {req.name || req.username || "Unknown"}
            {req.age ? `, ${req.age}` : ""}
          </Text>
        </View>
      </View>

      {/* Content: Tags, Bio, Cancel Button */}
      <View style={styles.personContent}>
        <View style={styles.personTags}>
          {(req.tags ?? []).slice(0, 2).map((tag) => (
            <View
              key={tag}
              style={[styles.smallPill, { backgroundColor: primary + "18" }]}
            >
              <Text style={[styles.smallPillText, { color: primary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.personBio, { color: muted }]} numberOfLines={2}>
          {req.bio || req.subtitle || ""}
        </Text>

        <Pressable
          style={[
            styles.cancelBtn,
            { backgroundColor: primary },
            isCanceling && { opacity: 0.6 },
          ]}
          disabled={isCanceling}
          accessibilityRole="button"
          accessibilityLabel={`Cancel friend request to ${req.name || "user"}`}
          onPress={handlePressCancel}
        >
          <Text style={styles.cancelBtnText}>
            {isCanceling ? "Canceling…" : "Cancel"}
          </Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
});

export default function SentRequestsScreen() {
  const insets = useSafeAreaInsets();
  useAndroidBack();

  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  const sentRequestsQuery = useSentFriendRequestsQuery();
  const cancelMutation = useCancelFriendRequestMutation();
  const sentRequests = sentRequestsQuery.data ?? [];

  const handleCancel = (friendshipId: string, onComplete?: () => void) => {
    cancelMutation.mutate(friendshipId, {
      onError: () => {
        onComplete?.();
        Alert.alert("Something went wrong", "Please try again.");
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <ChevronLeft size={28} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Sent Requests</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sentRequestsQuery.isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : sentRequestsQuery.isError ? (
          <View style={styles.inlineMessage}>
            <Text style={{ color: muted }}>Couldn&apos;t load sent requests.</Text>
            <Pressable onPress={() => sentRequestsQuery.refetch()}>
              <Text style={{ color: primary, fontWeight: "600", marginTop: 8 }}>Retry</Text>
            </Pressable>
          </View>
        ) : sentRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: muted }]}>
              You haven&apos;t sent any friend requests yet.
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {sentRequests.map((req) => (
              <SentRequestCard
                key={req.id}
                req={req}
                cardColor={cardColor}
                primary={primary}
                muted={muted}
                border={border}
                onCancel={handleCancel}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  inlineMessage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  personCard: {
    width: "48%",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  personImageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  personImage: {
    width: "100%",
    height: "100%",
  },
  personImageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  personNameContainer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  personNameAge: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  personContent: {
    minHeight: 142,
    padding: 12,
    gap: 8,
  },
  personTags: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  smallPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  personBio: {
    height: 36,
    fontSize: 13,
    lineHeight: 18,
  },
  cancelBtn: {
    marginTop: "auto",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
