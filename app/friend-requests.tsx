import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  usePendingFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  type FriendRequest,
} from "@/api/friends";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useTranslation } from "react-i18next";
import { showAlert } from "@/components/ui/app-alert";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ReceivedRequestCardProps {
  req: FriendRequest;
  cardColor: string;
  primary: string;
  muted: string;
  border: string;
  text: string;
  isDark: boolean;
  onAccept: (req: FriendRequest, onComplete?: () => void) => void;
  onDecline: (friendshipId: string, onComplete?: () => void) => void;
  isPending: boolean;
}

const ReceivedRequestCard = React.memo(function ReceivedRequestCard({
  req,
  cardColor,
  primary,
  muted,
  border,
  text,
  isDark,
  onAccept,
  onDecline,
  isPending,
}: ReceivedRequestCardProps) {
  const { t } = useTranslation();
  const [isActing, setIsActing] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animateOut = (callback: () => void) => {
    setIsActing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    opacity.value = withTiming(0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
    scale.value = withTiming(
      0.9,
      { duration: 220, easing: Easing.out(Easing.quad) },
      (finished) => {
        if (finished) {
          runOnJS(callback)();
        }
      }
    );
  };

  const handlePressAccept = (e: any) => {
    e.stopPropagation();
    if (isActing || isPending) return;
    animateOut(() => onAccept(req, () => setIsActing(false)));
  };

  const handlePressDecline = (e: any) => {
    e.stopPropagation();
    if (isActing || isPending) return;
    animateOut(() => onDecline(req.id, () => setIsActing(false)));
  };

  const declineBg = isDark ? "rgba(255, 255, 255, 0.08)" : "#F3F4F6";
  const declineBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#E5E7EB";
  const declineTextColor = isDark ? "#E5E7EB" : "#4B5563";

  return (
    <AnimatedPressable
      layout={Layout.duration(260)}
      entering={FadeIn}
      exiting={FadeOut.duration(220)}
      style={[
        styles.requestCard,
        { backgroundColor: cardColor, borderColor: border },
        cardAnimatedStyle,
      ]}
      onPress={() =>
        router.push({
          pathname: `/profile/${req.sender_id}`,
          params: {
            name: req.name,
            age: req.age?.toString(),
            photo: req.photo,
          },
        } as any)
      }
    >
      <View style={styles.requestInfo}>
        <Image
          source={{ uri: req.photo }}
          style={styles.requestAvatar}
          contentFit="cover"
          transition={180}
        />
        <View style={styles.requestTextCol}>
          <Text style={[styles.requestName, { color: text }]} numberOfLines={1}>
            {req.name || "User"}
            {req.age ? `, ${req.age}` : ""}
          </Text>
          <Text style={[styles.requestSubtitle, { color: muted }]} numberOfLines={1}>
            {req.subtitle || "Sent you a friend request"}
          </Text>
        </View>
      </View>

      <View style={styles.requestActions}>
        <Pressable
          style={[
            styles.actionBtn,
            { backgroundColor: primary, opacity: isPending || isActing ? 0.6 : 1 },
          ]}
          disabled={isPending || isActing}
          onPress={handlePressAccept}
        >
          <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
            {isActing ? t('friend_requests.accepting') : t('friend_requests.accept')}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionBtn,
            {
              backgroundColor: declineBg,
              borderColor: declineBorder,
              borderWidth: 1,
              opacity: isPending || isActing ? 0.6 : 1,
            },
          ]}
          disabled={isPending || isActing}
          onPress={handlePressDecline}
        >
          <Text style={[styles.actionBtnText, { color: declineTextColor }]}>
            {isActing ? t('friend_requests.declining') : t('friend_requests.decline')}
          </Text>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
});

export default function FriendRequestsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  useAndroidBack();

  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");
  const isDark = useColorScheme() === "dark";

  const requestsQuery = usePendingFriendRequestsQuery();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const requests = requestsQuery.data ?? [];
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await requestsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAccept = (req: FriendRequest, onComplete?: () => void) => {
    acceptMutation.mutate(req, {
      onError: (err: any) => {
        onComplete?.();
        const msg = err?.response?.data?.error || "Couldn't accept request. Please try again.";
        showAlert("Error", msg);
      },
      onSuccess: () => {
        onComplete?.();
      },
    });
  };

  const handleDecline = (friendshipId: string, onComplete?: () => void) => {
    declineMutation.mutate(friendshipId, {
      onError: () => {
        onComplete?.();
        showAlert("Error", "Couldn't decline request. Please try again.");
      },
      onSuccess: () => {
        onComplete?.();
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
        <View style={styles.titleRow}>
          <Text style={[styles.headerTitle, { color: text }]}>{t('friend_requests.title')}</Text>
          {requests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: primary }]}>
              <Text style={styles.badgeText}>{requests.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={primary}
            colors={[primary]}
          />
        }
      >
        {requestsQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : requestsQuery.isError ? (
          <View style={styles.inlineMessage}>
            <Text style={{ color: muted }}>{t('friend_requests.load_error')}</Text>
            <Pressable onPress={() => requestsQuery.refetch()}>
              <Text style={{ color: primary, fontWeight: "600", marginTop: 8 }}>{t('friend_requests.retry')}</Text>
            </Pressable>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: text }]}>{t('friend_requests.empty_title')}</Text>
            <Text style={[styles.emptyText, { color: muted }]}>
              {t('friend_requests.empty_desc')}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {requests.map((req) => {
              const isPending =
                (acceptMutation.isPending &&
                  (typeof acceptMutation.variables === "string"
                    ? acceptMutation.variables === req.id
                    : acceptMutation.variables?.id === req.id)) ||
                (declineMutation.isPending && declineMutation.variables === req.id);
              return (
                <ReceivedRequestCard
                  key={req.id}
                  req={req}
                  cardColor={cardColor}
                  primary={primary}
                  muted={muted}
                  border={border}
                  text={text}
                  isDark={isDark}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isPending={isPending}
                />
              );
            })}
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  centered: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineMessage: {
    alignItems: "center",
    padding: 40,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    gap: 12,
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  requestAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  requestTextCol: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  requestSubtitle: {
    fontSize: 13,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
