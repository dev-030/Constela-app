import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import VerificationOverlay from "@/components/VerificationOverlay";
import { Check } from "lucide-react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useTranslation } from "react-i18next";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import Header from "../../../components/header";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import {
  useInfiniteFriendSuggestionsQuery,
  usePendingFriendRequestsQuery,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  type Suggestion,
  type SuggestionsResponse,
} from "@/api/friends";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SEARCH_DEBOUNCE_MS = 300;

interface SuggestionCardProps {
  person: Suggestion;
  cardColor: string;
  primary: string;
  muted: string;
  border: string;
  onAddFriend: (userId: string) => Promise<void>;
  onDismiss: (userId: string) => void;
  cardWidth: number;
}

const SuggestionCard = React.memo(function SuggestionCard({
  person,
  cardColor,
  primary,
  muted,
  border,
  onAddFriend,
  onDismiss,
  cardWidth,
}: SuggestionCardProps) {
  const { t } = useTranslation();
  const { size, isCompact } = useResponsiveLayout();
  const [isRequested, setIsRequested] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const btnScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const btnAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handlePressAdd = (event: any) => {
    event.stopPropagation();
    if (isRequested) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    btnScale.value = withSequence(
      withTiming(0.92, { duration: 90 }),
      withSpring(1, { damping: 12 })
    );

    setIsRequested(true);

    // Call the independent API request
    onAddFriend(person.id).catch(() => {
      // Revert if API failed
      setIsRequested(false);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    });

    // Clean dwell & smooth exit transition
    setTimeout(() => {
      opacity.value = withTiming(0, {
        duration: 240,
        easing: Easing.out(Easing.quad),
      });
      scale.value = withTiming(0.9, {
        duration: 240,
        easing: Easing.out(Easing.quad),
      });
      translateY.value = withTiming(
        -6,
        { duration: 240, easing: Easing.out(Easing.quad) },
        (finished) => {
          if (finished) {
            runOnJS(onDismiss)(person.id);
          }
        }
      );
    }, 280);
  };

  return (
    <AnimatedPressable
      layout={Layout.duration(260)}
      style={[
        styles.personCard,
        {
          width: cardWidth,
          borderRadius: size(18, 14),
          backgroundColor: cardColor,
          borderColor: border,
        },
        cardAnimatedStyle,
      ]}
      onPress={() =>
        router.push({
          pathname: `/profile/${person.id}`,
          params: {
            name: person.name,
            age: person.age?.toString(),
            photo: person.photo,
          },
        } as any)
      }
    >
      <View style={[styles.personImageContainer, isCompact && { aspectRatio: 1.05 }]}>
        <Image
          source={{ uri: person.photo }}
          style={styles.personImage}
          contentFit="cover"
          transition={180}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.68)"]}
          locations={[0.5, 1]}
          style={styles.personImageOverlay}
        />
        <View style={[styles.personNameContainer, { left: isCompact ? 8 : size(12, 10), right: isCompact ? 8 : size(12, 10), bottom: isCompact ? 8 : size(12, 10) }]}>
          <Text style={[styles.personNameAge, { fontSize: isCompact ? 14 : size(16, 14) }]} numberOfLines={1}>
            {person.name || person.username || "Unknown"}
            {person.age ? `, ${person.age}` : ""}
          </Text>
        </View>
      </View>

      <View style={[styles.personContent, { minHeight: isCompact ? 122 : size(142, 126), padding: isCompact ? 8 : size(12, 10), gap: isCompact ? 5 : size(8, 6) }]}>
        <View style={[styles.personTags, isCompact && { gap: 3 }]}>
          {(person.tags ?? []).slice(0, 2).map((tag) => (
            <View
              key={tag}
              style={[styles.smallPill, { paddingHorizontal: isCompact ? 5 : size(8, 6), paddingVertical: isCompact ? 2 : 3, backgroundColor: primary + "18" }]}
            >
              <Text style={[styles.smallPillText, { fontSize: isCompact ? 8.5 : size(10, 9), color: primary }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.personBio, { height: isCompact ? 28 : size(36, 32), fontSize: isCompact ? 11 : size(13, 12), lineHeight: isCompact ? 14 : size(18, 16), color: muted }]} numberOfLines={2}>
          {person.bio}
        </Text>

        <AnimatedPressable
          style={[
            styles.addFriendBtn,
            { paddingVertical: isCompact ? 7 : size(10, 8), borderRadius: size(20, 16) },
            isRequested
              ? {
                  backgroundColor: primary + "18",
                  borderWidth: 1,
                  borderColor: primary + "35",
                }
              : { backgroundColor: primary },
            btnAnimatedStyle,
          ]}
          disabled={isRequested}
          accessibilityRole="button"
          accessibilityLabel={
            isRequested
              ? `Friend request sent to ${person.name || person.username || "this person"}`
              : `Add ${person.name || person.username || "this person"} as a friend`
          }
          onPress={handlePressAdd}
        >
          <View style={styles.btnContentRow}>
            {isRequested ? (
              <>
                <Check size={size(14, 12)} color={primary} strokeWidth={2.5} />
                <Text style={[styles.addFriendText, { fontSize: size(12, 11), color: primary }]}>
                  {t('friends.requested')}
                </Text>
              </>
            ) : (
              <Text style={[styles.addFriendText, { fontSize: size(12, 11) }]}>{t('friends.add_friend')}</Text>
            )}
          </View>
        </AnimatedPressable>
      </View>
    </AnimatedPressable>
  );
});

export default function FriendsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");
  const isDark = useColorScheme() === "dark";
  const { horizontalPadding, size, width, isCompact } = useResponsiveLayout();
  const gridGap = isCompact ? 8 : size(16, 10);
  const cardWidth = (width - horizontalPadding * 2 - gridGap) / 2;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const suggestionsQuery = useInfiniteFriendSuggestionsQuery({
    search: debouncedSearch || undefined,
  });
  const requestsQuery = usePendingFriendRequestsQuery();
  const { refetch: refetchRequests } = requestsQuery;

  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const suggestions = suggestionsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const requests = requestsQuery.data ?? [];
  const searchTerm = search.trim();
  const isSearching =
    searchTerm !== debouncedSearch ||
    (Boolean(searchTerm) && suggestionsQuery.isLoading);

  useFocusEffect(
    useCallback(() => {
      refetchRequests();
    }, [refetchRequests]),
  );

  const isInitialLoading =
    (suggestionsQuery.isLoading || requestsQuery.isLoading) &&
    !suggestionsQuery.data &&
    !requestsQuery.data;

  const handleAccept = (friendshipId: string) => {
    acceptMutation.mutate(friendshipId, {
      onError: (err: any) => {
        if (err?.response?.status === 403) {
          Alert.alert(
            "Not allowed",
            err.response.data?.error || "You can&apos;t accept this request."
          );
        } else {
          Alert.alert("Something went wrong", "Please try again.");
        }
      },
    });
  };

  const handleDecline = (friendshipId: string) => {
    declineMutation.mutate(friendshipId, {
      onError: () => {
        Alert.alert("Something went wrong", "Please try again.");
      },
    });
  };

  const handleAddFriend = useCallback(
    async (userId: string) => {
      try {
        await apiClient.post("/api/friends/send_request/", {
          user_id: userId,
        });
        queryClient.invalidateQueries({ queryKey: ["sentFriendRequests"] });
      } catch (err: any) {
        if (err?.response?.status === 400) {
          Alert.alert(
            "Cannot send request",
            err.response.data?.error || "You can't send a request to this user."
          );
        } else {
          Alert.alert("Something went wrong", "Please try again.");
        }
        throw err;
      }
    },
    [queryClient]
  );

  const handleDismiss = useCallback(
    (userId: string) => {
      queryClient.setQueriesData<InfiniteData<SuggestionsResponse>>(
        { queryKey: ["friendSuggestions"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              results: page.results.filter((p) => p.id !== userId),
            })),
          };
        }
      );
    },
    [queryClient]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const paddingToBottom = 350;
      if (
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom
      ) {
        if (suggestionsQuery.hasNextPage && !suggestionsQuery.isFetchingNextPage) {
          suggestionsQuery.fetchNextPage();
        }
      }
    },
    [suggestionsQuery]
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      suggestionsQuery.refetch(),
      requestsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator color={primary} />
        </View>
      </View>
    );
  }

  const declineBg = isDark ? "rgba(255, 255, 255, 0.08)" : "#F3F4F6";
  const declineBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "#E5E7EB";
  const declineTextColor = isDark ? "#E5E7EB" : "#4B5563";

  const renderRequestCard = (req: any, isCarousel: boolean) => {
    const isPending =
      (acceptMutation.isPending && acceptMutation.variables === req.id) ||
      (declineMutation.isPending && declineMutation.variables === req.id);
    const cardItemWidth = isCarousel ? Math.min(width - horizontalPadding * 2 - 24, 310) : "100%";

    return (
      <AnimatedPressable
        key={req.id}
        layout={Layout.springify()}
        entering={FadeIn}
        exiting={FadeOut.duration(300)}
        style={[
          styles.requestCard,
          {
            borderColor: border,
            backgroundColor: cardColor,
            width: cardItemWidth,
            marginBottom: isCarousel ? 0 : 12,
          },
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
              {req.name}
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
              { backgroundColor: primary, opacity: isPending ? 0.6 : 1 },
            ]}
            disabled={isPending}
            onPress={(event) => {
              event.stopPropagation();
              handleAccept(req.id);
            }}
          >
            <Text style={[styles.actionBtnText, { color: "#FFFFFF" }]}>
              {acceptMutation.isPending && acceptMutation.variables === req.id
                ? t('friends.accepting')
                : t('friends.accept')}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: declineBg,
                borderColor: declineBorder,
                borderWidth: 1,
                opacity: isPending ? 0.6 : 1,
              },
            ]}
            disabled={isPending}
            onPress={(event) => {
              event.stopPropagation();
              handleDecline(req.id);
            }}
          >
            <Text style={[styles.actionBtnText, { color: declineTextColor }]}>
              {declineMutation.isPending && declineMutation.variables === req.id
                ? t('friends.declining')
                : t('friends.decline')}
            </Text>
          </Pressable>
        </View>
      </AnimatedPressable>
    );
  };

  const renderHeader = () => (
    <>
      {/* Top Search Input & Sent Requests Action */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#E5E7EB",
            },
          ]}
        >
          <Ionicons name="search" size={19} color={muted} />
          <TextInput
            style={[styles.searchInput, { color: text }]}
            placeholder={t('friends.search_placeholder')}
            placeholderTextColor={muted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={muted} />
            </Pressable>
          )}
        </View>

        <View style={styles.searchSubRow}>
          <Pressable
            style={({ pressed }) => [
              styles.sentLinkPressable,
              { opacity: pressed ? 0.65 : 1 },
            ]}
            onPress={() => router.push("/sent-requests")}
            hitSlop={10}
          >
            <Text style={[styles.sentLinkText, { color: primary }]}>
              {t('friends.sent_requests')}
            </Text>
            <Ionicons name="chevron-forward" size={13} color={primary} />
          </Pressable>
        </View>
      </View>

      {/* Friend Requests (Only displayed when there are active requests or error) */}
      {requestsQuery.isError ? (
        <View style={styles.inlineMessage}>
          <Text style={{ color: muted }}>{t('friends.requests_error')}</Text>
          <Pressable onPress={() => requestsQuery.refetch()}>
            <Text style={{ color: primary, fontWeight: "600" }}>{t('friends.retry')}</Text>
          </Pressable>
        </View>
      ) : requests.length > 0 ? (
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>{t('friends.requests_title')}</Text>
              <View style={[styles.badge, { backgroundColor: primary }]}>
                <Text style={styles.badgeText}>{t('friends.new_badge', { count: requests.length })}</Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [styles.showAllBtn, { opacity: pressed ? 0.65 : 1 }]}
              onPress={() => router.push("/friend-requests")}
              hitSlop={8}
            >
              <Text style={[styles.showAllText, { color: primary }]}>{t('friends.show_all')}</Text>
              <Ionicons name="chevron-forward" size={14} color={primary} />
            </Pressable>
          </View>

          {requests.length === 1 ? (
            renderRequestCard(requests[0], false)
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalRequestsList}
              nestedScrollEnabled
            >
              {requests.map((req) => renderRequestCard(req, true))}
            </ScrollView>
          )}
        </View>
      ) : null}

      <Text style={[styles.suggestionsTitle, { color: text }]}>
        {isSearching
          ? searchTerm
            ? t('friends.searching_for', { query: searchTerm })
            : t('friends.people_you_may_know')
          : debouncedSearch
            ? t('friends.results_for', { query: debouncedSearch })
            : t('friends.people_you_may_know')}
      </Text>

      {isSearching ? (
        <View style={styles.searchStatus} accessibilityLiveRegion="polite">
          <ActivityIndicator color={primary} size="small" />
          <Text style={{ color: muted }}>
            {searchTerm ? t('friends.looking_for_people') : t('friends.updating_suggestions')}
          </Text>
        </View>
      ) : suggestionsQuery.isError ? (
        <View style={styles.inlineMessage}>
          <Text style={{ color: muted }}>{t('friends.suggestions_error')}</Text>
          <Pressable onPress={() => suggestionsQuery.refetch()}>
            <Text style={{ color: primary, fontWeight: "600" }}>{t('friends.retry')}</Text>
          </Pressable>
        </View>
      ) : suggestions.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          {debouncedSearch
            ? t('friends.no_results', { query: debouncedSearch })
            : t('friends.no_suggestions')}
        </Text>
      ) : null}
    </>
  );

  return (
    <VerificationOverlay>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header title="Friends" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
          onScroll={handleScroll}
          scrollEventThrottle={150}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
              colors={[primary]}
            />
          }
        >
          {renderHeader()}

          {!isSearching && !suggestionsQuery.isError && (
            <View style={[styles.gridContainer, { gap: gridGap }]}>
              {suggestions.map((person) => (
                <SuggestionCard
                  key={person.id}
                  person={person}
                  cardColor={cardColor}
                  primary={primary}
                  muted={muted}
                  border={border}
                  onAddFriend={handleAddFriend}
                  onDismiss={handleDismiss}
                  cardWidth={cardWidth}
                />
              ))}
            </View>
          )}

          {suggestionsQuery.isFetchingNextPage && (
            <ActivityIndicator color={primary} style={{ marginVertical: 20 }} />
          )}
        </ScrollView>
      </View>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 130,
  },
  searchSection: {
    marginBottom: 16,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  searchSubRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 6,
  },
  sentLinkPressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 2,
  },
  sentLinkText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  requestsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  sentRequestsLink: {
    flexShrink: 0,
  },
  suggestionsTitle: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.4,
    marginBottom: 14,
  },
  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  showAllText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  horizontalRequestsList: {
    paddingRight: 16,
    gap: 12,
    paddingBottom: 4,
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
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
    marginBottom: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestTextCol: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  requestSubtitle: {
    fontSize: 13,
  },
  requestActions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  personCard: {
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
  addFriendBtn: {
    marginTop: "auto",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  btnContentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addFriendText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inlineMessage: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 12,
  },
});
