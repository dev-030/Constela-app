import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useProfileLabels } from "@/hooks/use-profile-labels";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  MessageCircle,
  Heart,
  Users,
  MoreVertical,
  UserX,
  User,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Text } from "@/components/ui/text";
import { Avatar } from "@/components/ui/avatar";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { useMyFriendsQuery, type FriendContact } from "@/api/friends";
import {
  useMutualMatchesQuery,
  useUnmatchMutation,
  useUnfriendMutation,
  type MutualMatch,
} from "@/api/matching";
import { showAlert } from "@/components/ui/app-alert";

type TabType = "matches" | "friends";

// ── Match Contact Row ────────────────────────────────────────────────────────
interface MatchRowProps {
  match: MutualMatch;
  isOnline: boolean;
  cardColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
  onMessage: (match: MutualMatch) => void;
  onViewProfile: (match: MutualMatch) => void;
  onMorePress: (match: MutualMatch) => void;
}

const MatchRow = React.memo(function MatchRow({
  match,
  isOnline,
  cardColor,
  textColor,
  textMuted,
  borderColor,
  primaryColor,
  isDark,
  onMessage,
  onViewProfile,
  onMorePress,
}: MatchRowProps) {
  const { size } = useResponsiveLayout();
  const { t } = useTranslation();
  const { listLabel, interestCategory } = useProfileLabels();
  const profile = match.profile;
  const mainPhoto =
    profile.photos?.find((p) => p.is_main)?.image ||
    profile.photos?.[0]?.image ||
    null;

  const locationStr = [profile.city, profile.country].filter(Boolean).join(", ");
  const interests = (profile.interests || []).map((i: string) => interestCategory(i));
  const loves = t('connections.loves', "Loves");
  const bio =
    interests.length >= 2
      ? `${loves} ${interests[0]} ${t('connections.and', "and")} ${interests[1]}`
      : interests.length === 1
      ? `${loves} ${interests[0]}`
      : (profile.qualities || []).slice(0, 2).map((q: string) => listLabel('qualities', q)).join(", ");

  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactCard,
        {
          backgroundColor: cardColor,
          borderColor,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
      onPress={() => onViewProfile(match)}
    >
      {/* Avatar with Online Status */}
      <View style={styles.avatarContainer}>
        <Avatar uri={mainPhoto} size={52} rounded />
        {isOnline && (
          <View
            style={[
              styles.onlineBadge,
              { borderColor: isDark ? "#1C1C1E" : "#FFFFFF" },
            ]}
          />
        )}
      </View>

      {/* Profile Details */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {profile.name}
            {profile.age ? `, ${profile.age}` : ""}
          </Text>
        </View>

        {bio ? (
          <Text
            style={[styles.bioText, { color: textMuted }]}
            numberOfLines={1}
          >
            {bio}
          </Text>
        ) : locationStr ? (
          <Text
            style={[styles.bioText, { color: textMuted }]}
            numberOfLines={1}
          >
            {locationStr}
          </Text>
        ) : (
          <View style={styles.tagRow}>
            <View
              style={[
                styles.miniTag,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 105, 180, 0.15)"
                    : "rgba(255, 105, 180, 0.1)",
                },
              ]}
            >
              <Heart size={10} color="#FF69B4" style={{ marginRight: 3 }} />
              <Text style={[styles.miniTagText, { color: "#FF69B4" }]}>
                Mutual Match
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.chatButton,
            {
              backgroundColor: primaryColor,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onMessage(match);
          }}
          hitSlop={6}
        >
          <MessageCircle size={15} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.moreButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            onMorePress(match);
          }}
          hitSlop={10}
        >
          <MoreVertical size={18} color={textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
});

// ── Friend Contact Row ────────────────────────────────────────────────────────
interface FriendRowProps {
  friend: FriendContact;
  isOnline: boolean;
  cardColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  primaryColor: string;
  isDark: boolean;
  onMessage: (friend: FriendContact) => void;
  onViewProfile: (friend: FriendContact) => void;
  onMorePress: (friend: FriendContact) => void;
}

const FriendRow = React.memo(function FriendRow({
  friend,
  isOnline,
  cardColor,
  textColor,
  textMuted,
  borderColor,
  primaryColor,
  isDark,
  onMessage,
  onViewProfile,
  onMorePress,
}: FriendRowProps) {
  const { lovesSentence, translateBio } = useProfileLabels();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.contactCard,
        {
          backgroundColor: cardColor,
          borderColor,
          opacity: pressed ? 0.96 : 1,
        },
      ]}
      onPress={() => onViewProfile(friend)}
    >
      {/* Avatar with Online Status */}
      <View style={styles.avatarContainer}>
        <Avatar uri={friend.photo} size={52} rounded />
        {isOnline && (
          <View
            style={[
              styles.onlineBadge,
              { borderColor: isDark ? "#1C1C1E" : "#FFFFFF" },
            ]}
          />
        )}
      </View>

      {/* Profile Details */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {friend.name}
            {friend.age ? `, ${friend.age}` : ""}
          </Text>
        </View>

        {friend.bio ? (
          <Text
            style={[styles.bioText, { color: textMuted }]}
            numberOfLines={1}
          >
            {friend.bio_interests?.length ? lovesSentence(friend.bio_interests) : translateBio(friend.bio)}
          </Text>
        ) : friend.location ? (
          <Text
            style={[styles.bioText, { color: textMuted }]}
            numberOfLines={1}
          >
            {friend.location}
          </Text>
        ) : (
          <Text
            style={[styles.bioText, { color: textMuted }]}
            numberOfLines={1}
          >
            @{friend.username}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.chatButton,
            {
              backgroundColor: primaryColor,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            onMessage(friend);
          }}
          hitSlop={6}
        >
          <MessageCircle size={15} color="#FFFFFF" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.moreButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          onPress={(e) => {
            e.stopPropagation();
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {}
            onMorePress(friend);
          }}
          hitSlop={10}
        >
          <MoreVertical size={18} color={textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ConnectionsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  useAndroidBack();

  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: TabType = params.tab === "friends" ? "friends" : "matches";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const [search, setSearch] = useState("");
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const primary = useColor("primary");
  const border = isDark ? "rgba(255, 255, 255, 0.08)" : "#EFEFEF";

  const { isVisible: isSheetVisible, open: openSheet, close: closeSheet } = useBottomSheet();
  const [selectedItem, setSelectedItem] = useState<{ type: 'match' | 'friend', data: MutualMatch | FriendContact } | null>(null);

  const sheetSnapPoint = useMemo(() => {
    // Generously open enough so all options are completely visible with comfortable breathing room above the Android navigation bar.
    const neededHeight = 280 + Math.max(insets.bottom, 24);
    const ratio = neededHeight / (screenHeight || 800);
    return Math.min(0.55, Math.max(0.44, Number(ratio.toFixed(2))));
  }, [insets.bottom, screenHeight]);

  const handleMorePressMatch = useCallback((match: MutualMatch) => {
    setSelectedItem({ type: 'match', data: match });
    openSheet();
  }, [openSheet]);

  const handleMorePressFriend = useCallback((friend: FriendContact) => {
    setSelectedItem({ type: 'friend', data: friend });
    openSheet();
  }, [openSheet]);

  const { onlineUsers } = useChatSocket();

  // Queries
  const matchesQuery = useMutualMatchesQuery();
  const friendsQuery = useMyFriendsQuery();

  const unmatchMutation = useUnmatchMutation();
  const unfriendMutation = useUnfriendMutation();

  useFocusEffect(
    useCallback(() => {
      void matchesQuery.refetch();
      void friendsQuery.refetch();
    }, [matchesQuery.refetch, friendsQuery.refetch])
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([matchesQuery.refetch(), friendsQuery.refetch()]);
    setRefreshing(false);
  };

  // Sliding pill control setup
  const [pillWidth, setPillWidth] = useState(0);
  const translateX = useSharedValue(0);

  // Unique lists deduplicated by partner ID
  const uniqueMatches = useMemo(() => {
    const list = matchesQuery.data || [];
    const seen = new Set<string>();
    const unique: MutualMatch[] = [];
    for (const m of list) {
      const pid = m.profile?.id;
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        unique.push(m);
      }
    }
    return unique;
  }, [matchesQuery.data]);

  const uniqueFriends = useMemo(() => {
    const list = friendsQuery.data || [];
    const seen = new Set<string>();
    const unique: FriendContact[] = [];
    for (const f of list) {
      if (f.id && !seen.has(f.id)) {
        seen.add(f.id);
        unique.push(f);
      }
    }
    return unique;
  }, [friendsQuery.data]);

  const tabsList: { value: TabType; label: string; count: number }[] = useMemo(
    () => [
      {
        value: "matches",
        label: "Matches",
        count: uniqueMatches.length,
      },
      {
        value: "friends",
        label: "Friends",
        count: uniqueFriends.length,
      },
    ],
    [uniqueMatches.length, uniqueFriends.length]
  );

  const activeIndex = activeTab === "matches" ? 0 : 1;

  useEffect(() => {
    if (pillWidth > 0) {
      translateX.value = withTiming(activeIndex * pillWidth, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [activeIndex, pillWidth, translateX]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleTabChange = (newTab: TabType) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setActiveTab(newTab);
    setSearch("");
  };

  // Filtered lists
  const queryTerm = search.trim().toLowerCase();

  const filteredMatches = useMemo(() => {
    if (!queryTerm) return uniqueMatches;
    return uniqueMatches.filter((m) => {
      const name = (m.profile?.name || "").toLowerCase();
      const city = (m.profile?.city || "").toLowerCase();
      const interests = (m.profile?.interests || []).join(" ").toLowerCase();
      return (
        name.includes(queryTerm) ||
        city.includes(queryTerm) ||
        interests.includes(queryTerm)
      );
    });
  }, [uniqueMatches, queryTerm]);

  const filteredFriends = useMemo(() => {
    if (!queryTerm) return uniqueFriends;
    return uniqueFriends.filter((f) => {
      const name = (f.name || "").toLowerCase();
      const username = (f.username || "").toLowerCase();
      const bio = (f.bio || "").toLowerCase();
      const location = (f.location || "").toLowerCase();
      return (
        name.includes(queryTerm) ||
        username.includes(queryTerm) ||
        bio.includes(queryTerm) ||
        location.includes(queryTerm)
      );
    });
  }, [uniqueFriends, queryTerm]);

  // Actions for Matches
  const handleMessageMatch = useCallback(
    (match: MutualMatch) => {
      const mainPhoto =
        match.profile.photos?.find((p) => p.is_main)?.image ||
        match.profile.photos?.[0]?.image ||
        null;
      router.push({
        pathname: "/inbox/[id]",
        params: {
          id: match.profile.id,
          type: "dating",
          photo: mainPhoto || "",
          name: match.profile.name,
          username: (match.profile as any).username || match.profile.name,
        },
      });
    },
    []
  );

  const handleViewMatchProfile = useCallback((match: MutualMatch) => {
    router.push({
      pathname: "/profile/[id]",
      params: { id: match.profile.id },
    });
  }, []);

  const handleUnmatch = useCallback(
    (match: MutualMatch) => {
      showAlert(
        "Unmatch Connection",
        `Are you sure you want to unmatch with ${match.profile.name}? This will remove your conversation thread.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unmatch",
            style: "destructive",
            onPress: () => {
              unmatchMutation.mutate(match.profile.id, {
                onSuccess: () => {
                  try {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  } catch {}
                },
              });
            },
          },
        ]
      );
    },
    [unmatchMutation]
  );

  // Actions for Friends
  const handleMessageFriend = useCallback((friend: FriendContact) => {
    router.push({
      pathname: "/inbox/[id]",
      params: {
        id: friend.id,
        type: "friends",
        photo: friend.photo || "",
        name: friend.name,
        username: friend.username || friend.name,
      },
    });
  }, []);

  const handleViewFriendProfile = useCallback((friend: FriendContact) => {
    router.push({
      pathname: "/profile/[id]",
      params: { id: friend.id },
    });
  }, []);

  const handleUnfriend = useCallback(
    (friend: FriendContact) => {
      showAlert(
        "Remove Friend",
        `Are you sure you want to unfriend ${friend.name}? You can always send another friend request later.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unfriend",
            style: "destructive",
            onPress: () => {
              unfriendMutation.mutate(friend.id, {
                onSuccess: () => {
                  try {
                    Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    );
                  } catch {}
                },
              });
            },
          },
        ]
      );
    },
    [unfriendMutation]
  );

  const segContainerBg = isDark ? "#2C2C2E" : "#EFEFEF";
  const segPillBg = isDark ? "#3A3A3C" : cardColor;
  const activeTextColor = isDark ? "#FFFFFF" : text;
  const inactiveTextColor = "#8E8E93";

  const isLoading =
    activeTab === "matches" ? matchesQuery.isLoading : friendsQuery.isLoading;
  const isError =
    activeTab === "matches" ? matchesQuery.isError : friendsQuery.isError;

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: isDark ? "#2C2C2E" : "#F4F4F5" },
          ]}
          onPress={() => router.back()}
          hitSlop={10}
        >
          <ChevronLeft size={22} color={text} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: text }]}>{t('connections.title')}</Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      {/* Segmented Sliding Pill Tabs */}
      <View
        style={[styles.segWrapper, { backgroundColor: segContainerBg }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setPillWidth((w - 6) / tabsList.length);
        }}
      >
        {pillWidth > 0 && (
          <Animated.View
            style={[
              styles.segPill,
              { width: pillWidth, backgroundColor: segPillBg },
              pillStyle,
            ]}
          />
        )}
        {tabsList.map((tabItem) => {
          const isSelected = activeTab === tabItem.value;
          return (
            <TouchableOpacity
              key={tabItem.value}
              onPress={() => handleTabChange(tabItem.value)}
              activeOpacity={0.75}
              style={[styles.segTab, pillWidth > 0 && { width: pillWidth }]}
            >
              <View style={styles.tabContentRow}>
                <Text
                  style={[
                    styles.segTabText,
                    {
                      color: isSelected ? activeTextColor : inactiveTextColor,
                      fontWeight: isSelected ? "700" : "500",
                    },
                  ]}
                >
                  {tabItem.value === 'matches' ? t('connections.tab_matches') : t('connections.tab_friends')}
                </Text>
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: isSelected
                        ? primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.12)"
                        : "rgba(0, 0, 0, 0.08)",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countPillText,
                      { color: isSelected ? "#FFFFFF" : inactiveTextColor },
                    ]}
                  >
                    {tabItem.count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
              borderColor: border,
            },
          ]}
        >
          <Search size={18} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: text }]}
            placeholder={
              activeTab === "matches" ? t('connections.search_matches') : t('connections.search_friends')
            }
            placeholderTextColor={textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} hitSlop={8}>
              <X size={16} color={textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content List */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      )}

      {isError && (
        <ScrollView showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.centered}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
            />
          }
        >
          <Text style={[styles.emptySubtitle, { color: textMuted }]}>
            {t('connections.unable_load', { tab: activeTab === 'matches' ? t('connections.tab_matches') : t('connections.tab_friends') })}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.emptyButtonText}>{t('connections.retry')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {!isLoading && !isError && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
            />
          }
        >
          {activeTab === "matches" ? (
            filteredMatches.length > 0 ? (
              <View style={styles.listContainer}>
                {filteredMatches.map((item) => {
                  const pid = String(item.profile.id);
                  const isOnline =
                    !!onlineUsers[pid] || !!onlineUsers[pid.toLowerCase()];
                  return (
                    <MatchRow
                      key={item.match_id || item.profile.id}
                      match={item}
                      isOnline={isOnline}
                      cardColor={cardColor}
                      textColor={text}
                      textMuted={textMuted}
                      borderColor={border}
                      primaryColor={primary}
                      isDark={isDark}
                      onMessage={handleMessageMatch}
                      onViewProfile={handleViewMatchProfile}
                      onMorePress={handleMorePressMatch}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <View
                  style={[
                    styles.emptyIconCircle,
                    {
                      backgroundColor: isDark
                        ? "rgba(255, 105, 180, 0.12)"
                        : "rgba(255, 105, 180, 0.08)",
                    },
                  ]}
                >
                  <Heart size={38} color="#FF69B4" />
                </View>
                <Text style={[styles.emptyTitle, { color: text }]}>
                  {queryTerm ? t('connections.search_matches') : t('connections.empty_matches_title')}
                </Text>
                <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                  {queryTerm
                    ? `No matches found matching "${search}".`
                    : t('connections.empty_matches_sub')}
                </Text>
                {!queryTerm && (
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: primary }]}
                    onPress={() => router.push("/(tabs)/matches")}
                  >
                    <Sparkles size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.emptyButtonText}>{t('connections.discover_matches')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          ) : filteredFriends.length > 0 ? (
            <View style={styles.listContainer}>
              {filteredFriends.map((item) => {
                const pid = String(item.id);
                const isOnline =
                  !!onlineUsers[pid] || !!onlineUsers[pid.toLowerCase()];
                return (
                  <FriendRow
                    key={item.friendship_id || item.id}
                    friend={item}
                    isOnline={isOnline}
                    cardColor={cardColor}
                    textColor={text}
                    textMuted={textMuted}
                    borderColor={border}
                    primaryColor={primary}
                    isDark={isDark}
                    onMessage={handleMessageFriend}
                    onViewProfile={handleViewFriendProfile}
                    onMorePress={handleMorePressFriend}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  {
                    backgroundColor: isDark
                      ? "rgba(100, 100, 255, 0.12)"
                      : "rgba(100, 100, 255, 0.08)",
                  },
                ]}
              >
                <Users size={38} color={primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: text }]}>
                {queryTerm ? t('connections.search_friends') : t('connections.empty_friends_title')}
              </Text>
              <Text style={[styles.emptySubtitle, { color: textMuted }]}>
                {queryTerm
                  ? `No friends found matching "${search}".`
                  : t('connections.empty_friends_sub')}
              </Text>
              {!queryTerm && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: primary }]}
                  onPress={() => router.push("/(tabs)/friends")}
                >
                  <Users size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyButtonText}>{t('connections.find_friends')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Options Bottom Sheet */}
      <BottomSheet
        isVisible={isSheetVisible}
        onClose={closeSheet}
        snapPoints={[sheetSnapPoint]}
      >
        {selectedItem && (() => {
          const isMatch = selectedItem.type === 'match';
          const matchData = isMatch ? (selectedItem.data as MutualMatch) : null;
          const friendData = !isMatch ? (selectedItem.data as FriendContact) : null;

          const name = isMatch ? matchData!.profile.name : friendData!.name;
          const age = isMatch ? matchData!.profile.age : friendData!.age;
          const displayName = age ? `${name}, ${age}` : name;
          const photo = isMatch
            ? (matchData!.profile.photos?.find((p) => p.is_main)?.image || matchData!.profile.photos?.[0]?.image)
            : friendData!.photo;
          const location = isMatch
            ? [matchData!.profile.city, matchData!.profile.country].filter(Boolean).join(", ")
            : friendData!.location || "";

          return (
            <View style={{ gap: 10, paddingHorizontal: 4, paddingBottom: Math.max(insets.bottom, 24) }}>
              {/* Header with Avatar, Name, Age & Location */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Avatar uri={photo} size={50} rounded />
                <View style={{ marginLeft: 14, flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: text }} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {!!location && (
                    <Text style={{ fontSize: 13, color: textMuted, marginTop: 2 }} numberOfLines={1}>
                      {location}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action 1: View Profile (Clean & simple) */}
              <TouchableOpacity
                style={[
                  styles.sheetActionCard,
                  {
                    backgroundColor: isDark ? "#242426" : "#F5F5F7",
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  closeSheet();
                  if (isMatch) handleViewMatchProfile(matchData!);
                  else handleViewFriendProfile(friendData!);
                }}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF" }]}>
                  <User size={19} color={text} />
                </View>
                <Text style={[styles.sheetActionText, { color: text }]}>{t('connections.view_profile')}</Text>
                <ChevronRight size={18} color={textMuted} />
              </TouchableOpacity>

              {/* Action 2: Unmatch / Remove Friend */}
              <TouchableOpacity
                style={[
                  styles.sheetActionCard,
                  {
                    backgroundColor: isDark ? "rgba(255, 59, 48, 0.08)" : "rgba(255, 59, 48, 0.05)",
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {}
                  closeSheet();
                  setTimeout(() => {
                    if (isMatch) handleUnmatch(matchData!);
                    else handleUnfriend(friendData!);
                  }, 350);
                }}
              >
                <View style={[styles.sheetActionIcon, { backgroundColor: isDark ? "rgba(255, 59, 48, 0.15)" : "#FEE2E2" }]}>
                  <UserX size={19} color="#FF3B30" />
                </View>
                <Text style={[styles.sheetActionText, { color: "#FF3B30" }]}>
                  {isMatch ? t('connections.unmatch') : t('connections.remove_friend')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </BottomSheet>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  headerRightSpacer: {
    width: 40,
  },
  segWrapper: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
    position: "relative",
  },
  segPill: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  segTab: {
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segTabText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listContainer: {
    gap: 10,
    paddingTop: 4,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
  },
  infoContainer: {
    flex: 1,
    marginRight: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  bioText: {
    fontSize: 12.5,
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  miniTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  miniTagText: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  chatButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "600",
  },
  moreButton: {
    padding: 6,
    borderRadius: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "600",
  },
  sheetActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 15,
    borderRadius: 16,
  },
  sheetActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  sheetActionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
