import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  InteractionManager,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, memo, useCallback, useMemo } from "react";
import { Mic, MoreVertical } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import Header from "../../../components/header";
import VerificationOverlay from "@/components/VerificationOverlay";
import { directHistoryQueryOptions, MessageThread, ThreadType, useThreadsQuery } from "@/api/messages";
import { Avatar } from "@/components/ui/avatar";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";


/**
 * The server (and the live socket update) build the last-message preview in
 * English. Map those fixed strings to the user's language.
 */
function translateLastMessage(
  lastMessage: string | null | undefined,
  t: (key: string, fallback: string) => string,
): { isVoicePreview: boolean; previewText: string } {
  const msg = (lastMessage ?? "").trim();
  if (/^(🎤\s*)?voice message$/i.test(msg)) {
    return { isVoicePreview: true, previewText: t("messages.voice_message", "Voice message") };
  }
  const photo = msg.match(/^📷\s*Photo(?::\s*([\s\S]*))?$/);
  if (photo) {
    const label = `📷 ${t("messages.photo", "Photo")}`;
    return { isVoicePreview: false, previewText: photo[1] ? `${label}: ${photo[1]}` : label };
  }
  if (msg === "You've matched! Say hi.") {
    return { isVoicePreview: false, previewText: t("messages.matched_placeholder", msg) };
  }
  if (msg === "You are now friends! Say hi.") {
    return { isVoicePreview: false, previewText: t("messages.friends_placeholder", msg) };
  }
  return { isVoicePreview: false, previewText: lastMessage ?? "" };
}

// Format a UTC timestamp as "10:45 AM", "Yesterday", or "N days ago".
function formatThreadTime(iso: string, t?: (key: string, opts?: any) => string): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);
  const thatDay = startOfDay(date);
  const dayDiff = Math.round(
    (today.getTime() - thatDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (dayDiff === 1) {
    return t ? t('messages.yesterday') : "Yesterday";
  }
  if (dayDiff < 7) {
    return t ? t('messages.days_ago', { count: dayDiff }) : `${dayDiff} days ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ── Segmented pill control ──────────────────────────────────────────────────
const TABS: { value: ThreadType; label: string }[] = [
  { value: "dating", label: "Dating" },
  { value: "friends", label: "Friends" },
];

function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: ThreadType;
  onChange: (value: ThreadType) => void;
}) {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const cardColor = useColor("card");
  const textColor = useColor("text");

  const [pillWidth, setPillWidth] = useState(0);
  const activeIndex = TABS.findIndex((t) => t.value === activeTab);
  const translateX = useSharedValue(0);

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

  const containerBg = isDark ? "#2C2C2E" : "#EFEFEF";
  const pillBg = isDark ? "#3A3A3C" : cardColor;
  const activeTextColor = isDark ? "#FFFFFF" : textColor;
  const inactiveTextColor = isDark ? "#8E8E93" : "#8E8E93";
  const controlHeight = isCompact ? 36 : 40;

  return (
    <View
      style={[
        segStyles.wrapper,
        { backgroundColor: containerBg, height: controlHeight },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setPillWidth((w - 6) / TABS.length);
      }}
    >
      {/* Sliding pill */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            segStyles.pill,
            { width: pillWidth, backgroundColor: pillBg },
            pillStyle,
          ]}
        />
      )}
      {/* Labels */}
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          onPress={() => onChange(tab.value)}
          activeOpacity={0.75}
          style={[
            segStyles.tab,
            pillWidth > 0 && { width: pillWidth },
          ]}
        >
          <Text
            style={[
              segStyles.tabText,
              {
                color:
                  activeTab === tab.value
                    ? activeTextColor
                    : inactiveTextColor,
                fontWeight: activeTab === tab.value ? "700" : "500",
              },
              isCompact && { fontSize: 13 },
            ]}
          >
            {tab.value === "dating" ? t('messages.tabs_dating') : t('messages.tabs_friends')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 3,
    position: "relative",
    alignItems: "center",
  },
  pill: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

// ── Memoized rows — prevent re-renders (and avatar flash) on background refetch ──
const TopAvatarItem = memo(
  function TopAvatarItem({
    thread,
    type,
    primary,
    background,
    text,
    isOnline,
  }: {
    thread: MessageThread;
    type: "dating" | "friends";
    primary: string;
    background: string;
    text: string;
    isOnline: boolean;
  }) {
    const { isCompact } = useResponsiveLayout();
    const queryClient = useQueryClient();
    const pid = String(thread.profile.id);
    const firstName = thread.profile.name.split(' ')[0];

    const handlePressIn = useCallback(() => {
      void queryClient.prefetchQuery(
        directHistoryQueryOptions(pid, true)
      );
    }, [queryClient, pid]);

    const handlePress = useCallback(() => {
      router.push({
        pathname: "/inbox/[id]",
        params: { 
          id: thread.profile.id, 
          type,
          photo: thread.profile.photo,
          name: thread.profile.name,
          username: thread.profile.username
        },
      });
    }, [type, thread.profile]);

    const avatarSize = isCompact ? 50 : 58;
    const ringSize = isCompact ? 54 : 64;

    return (
      <Pressable
        key={`active-${thread.profile.id}`}
        style={[styles.activeItem, isCompact && { width: 58, marginHorizontal: 4 }]}
        onPressIn={handlePressIn}
        onPress={handlePress}
      >
        <View style={[styles.activeAvatarWrap, isCompact && { width: ringSize, height: ringSize, marginBottom: 5 }]}>
          <View style={[
            styles.activeAvatarRing,
            { borderColor: type === "friends" && isOnline ? "#22C55E" : primary },
            isCompact && { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }
          ]}>
            <Avatar uri={thread.profile.photo} size={avatarSize} rounded />
          </View>
          {isOnline && (
            <View style={[styles.statusDotActive, { borderColor: background }, isCompact && { width: 13, height: 13, borderRadius: 6.5 }]} />
          )}
        </View>
        <Text style={[styles.activeName, { color: text }, isCompact && { fontSize: 11 }]} numberOfLines={1}>{firstName}</Text>
      </Pressable>
    );
  },
  (prev, next) => {
    const prevBase = prev.thread.profile.photo?.split('?')[0];
    const nextBase = next.thread.profile.photo?.split('?')[0];
    return (
      prev.thread.profile.id === next.thread.profile.id &&
      prev.thread.profile.name === next.thread.profile.name &&
      prevBase === nextBase &&
      prev.isOnline === next.isOnline &&
      prev.type === next.type &&
      prev.primary === next.primary &&
      prev.background === next.background &&
      prev.text === next.text
    );
  }
);

const ConversationRow = memo(
  function ConversationRow({
    thread,
    type,
    background,
    text,
    textMuted,
    isOnline,
  }: {
    thread: MessageThread;
    type: "dating" | "friends";
    background: string;
    text: string;
    textMuted: string;
    isOnline: boolean;
  }) {
    const { t } = useTranslation();
    const { isVoicePreview, previewText } = translateLastMessage(thread.last_message, t);
    const { isCompact } = useResponsiveLayout();
    const queryClient = useQueryClient();
    const pid = String(thread.profile.id);

    const handlePressIn = useCallback(() => {
      void queryClient.prefetchQuery(
        directHistoryQueryOptions(pid, true)
      );
    }, [queryClient, pid]);

    const handlePress = useCallback(() => {
      router.push({
        pathname: "/inbox/[id]",
        params: { 
          id: thread.profile.id, 
          type,
          photo: thread.profile.photo,
          name: thread.profile.name,
          username: thread.profile.username
        },
      });
    }, [type, thread.profile]);

    const avatarSize = isCompact ? 48 : 56;

    return (
      <Pressable
        style={[
          styles.conversationRow,
          isCompact && { paddingHorizontal: 12, marginBottom: 18, minHeight: 54 }
        ]}
        onPressIn={handlePressIn}
        onPress={handlePress}
      >
        <View style={[styles.avatarWrap, isCompact && { width: avatarSize, height: avatarSize, marginRight: 12 }]}>
          <Avatar
            uri={thread.profile.photo}
            size={avatarSize}
            rounded
          />
          {isOnline && (
            <View
              style={[
                styles.statusDot,
                { borderColor: background },
                isCompact && { width: 12, height: 12, borderRadius: 6 }
              ]}
            />
          )}
        </View>

        <View style={styles.conversationBody}>
          <View style={styles.conversationTop}>
            <Text style={[styles.name, { color: text }, isCompact && { fontSize: 13.5 }]}>{thread.profile.name}</Text>
            <Text style={[styles.time, isCompact && { fontSize: 11.5 }]}>
              {formatThreadTime(thread.last_message_time, t)}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              {isVoicePreview && (
                <Mic size={isCompact ? 13 : 14} color={textMuted} style={{ marginRight: 4 }} />
              )}
              <Text numberOfLines={1} style={[styles.messagePreview, { color: textMuted }, isCompact && { fontSize: 13.5, lineHeight: 18 }]}>
                {previewText}
              </Text>
            </View>
            {thread.unread_count > 0 ? (
              <View style={[styles.unreadBadge, isCompact && { minWidth: 18, height: 18, borderRadius: 9 }]}>
                <Text style={[styles.unreadText, isCompact && { fontSize: 11 }]}>{thread.unread_count}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
    );
  },
  (prev, next) => {
    const prevBase = prev.thread.profile.photo?.split('?')[0];
    const nextBase = next.thread.profile.photo?.split('?')[0];
    return (
      prev.thread.profile.id === next.thread.profile.id &&
      prev.thread.profile.name === next.thread.profile.name &&
      prevBase === nextBase &&
      prev.thread.last_message === next.thread.last_message &&
      prev.thread.last_message_time === next.thread.last_message_time &&
      prev.thread.unread_count === next.thread.unread_count &&
      prev.isOnline === next.isOnline &&
      prev.type === next.type &&
      prev.background === next.background &&
      prev.text === next.text &&
      prev.textMuted === next.textMuted
    );
  }
);

// ── Main conversation list ────────────────────────────────────────────────────
function ConversationList({
  threads,
  isLoading,
  isError,
  onRefresh,
  isRefreshing,
  emptyText,
  type,
}: {
  threads: MessageThread[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  emptyText: string;
  type: "dating" | "friends";
}) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === "dark";
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const { onlineUsers } = useChatSocket();
  const queryClient = useQueryClient();

  // Only show a full-page spinner on the very first load (no data yet).
  if (isLoading && threads.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={primary}
          />
        }
      >
        <Text style={[styles.emptyText, { color: textMuted }]}>{t('messages.load_error')}</Text>
        <Pressable onPress={onRefresh}>
          <Text style={[styles.retryText, { color: primary }]}>{t('messages.retry')}</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (threads.length === 0) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={primary}
          />
        }
      >
        <Text style={[styles.emptyText, { color: textMuted }]}>{emptyText}</Text>
      </ScrollView>
    );
  }

  const topBarThreads = useMemo(() => {
    if (type === "friends") {
      // Friends tab: ONLY show friends who are currently online/active
      return threads.filter((thread) => {
        const pid = String(thread.profile.id);
        return !!onlineUsers[pid] || !!onlineUsers[pid.toLowerCase()];
      });
    }
    // Dating tab: ONLY show new matches where no conversation has started yet
    return threads.filter((thread) => {
      return thread.last_message === "You've matched! Say hi.";
    });
  }, [threads, onlineUsers, type]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 130 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={primary}
        />
      }
    >
      {topBarThreads.length > 0 && (
        <View style={styles.activeRowContainer}>
          <View style={styles.activeRowHeader}>
            <Text style={[styles.activeRowTitle, { color: text }]}>
              {type === "dating" ? t('messages.new_matches') : t('messages.active_now')}
            </Text>
            {type === "friends" && (
              <View style={styles.activeCountBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeCountText}>
                  {topBarThreads.length}
                </Text>
              </View>
            )}
          </View>
          <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeRowScroll}>
            {topBarThreads.map((thread) => {
              const pid = String(thread.profile.id);
              const isOnline = !!onlineUsers[pid] || !!onlineUsers[pid.toLowerCase()];
              return (
                <TopAvatarItem
                  key={`active-${thread.profile.id}`}
                  thread={thread}
                  type={type}
                  isOnline={isOnline}
                  primary={primary}
                  background={background}
                  text={text}
                />
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={styles.messageList}>
        {threads.map((thread) => {
          const pid = String(thread.profile.id);
          const isOnline = !!onlineUsers[pid] || !!onlineUsers[pid.toLowerCase()];
          return (
            <ConversationRow
              key={thread.profile.id}
              thread={thread}
              type={type}
              isOnline={isOnline}
              background={background}
              text={text}
              textMuted={textMuted}
            />
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const background = useColor("background");
  const cardColor = useColor("card");
  const primary = useColor("primary");
  const text = useColor("text");
  const isDark = useColorScheme() === "dark";
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<ThreadType>("dating");

  const datingQuery = useThreadsQuery("dating");
  const friendsQuery = useThreadsQuery("friends");
  useFocusEffect(
    useCallback(() => {
      void datingQuery.refetch();
      void friendsQuery.refetch();
    }, [datingQuery.refetch, friendsQuery.refetch])
  );

  useEffect(() => {
    const threads = tab === "dating" ? datingQuery.data : friendsQuery.data;
    if (!threads?.length) return;

    const task = InteractionManager.runAfterInteractions(() => {
      threads.slice(0, 3).forEach((thread) => {
        void queryClient.prefetchQuery(
          directHistoryQueryOptions(String(thread.profile.id), true)
        );
      });
    });

    return () => task.cancel();
  }, [tab, datingQuery.data, friendsQuery.data, queryClient]);

  const [refreshingDating, setRefreshingDating] = useState(false);
  const handleDatingRefresh = async () => {
    setRefreshingDating(true);
    await datingQuery.refetch();
    setRefreshingDating(false);
  };

  const [refreshingFriends, setRefreshingFriends] = useState(false);
  const handleFriendsRefresh = async () => {
    setRefreshingFriends(true);
    await friendsQuery.refetch();
    setRefreshingFriends(false);
  };

  return (
    <VerificationOverlay>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header />

        <View style={[styles.topControlRow, isCompact && { marginHorizontal: 10, gap: 8, marginTop: 6, marginBottom: 4 }]}>
          <View style={{ flex: 1 }}>
            <SegmentedControl activeTab={tab} onChange={setTab} />
          </View>
          <TouchableOpacity
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push({
                pathname: "/connections",
                params: { tab: tab === "dating" ? "matches" : "friends" },
              });
            }}
            activeOpacity={0.7}
            style={[
              styles.moreRoundedBtn,
              {
                backgroundColor: isDark ? "#2C2C2E" : cardColor,
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                width: isCompact ? 36 : 40,
                height: isCompact ? 36 : 40,
                borderRadius: isCompact ? 18 : 20,
              },
            ]}
            accessibilityLabel={t('messages.all_connections')}
            accessibilityRole="button"
          >
            <MoreVertical size={isCompact ? 16 : 18} color={isDark ? "#FFFFFF" : "#374151"} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, display: tab === "dating" ? "flex" : "none" }}>
            <ConversationList
              threads={datingQuery.data ?? []}
              isLoading={datingQuery.isLoading}
              isError={!!datingQuery.isError}
              onRefresh={handleDatingRefresh}
              isRefreshing={refreshingDating}
              type="dating"
              emptyText={t('messages.empty_dating')}
            />
          </View>

          <View style={{ flex: 1, display: tab === "friends" ? "flex" : "none" }}>
            <ConversationList
              threads={friendsQuery.data ?? []}
              isLoading={friendsQuery.isLoading}
              isError={!!friendsQuery.isError}
              onRefresh={handleFriendsRefresh}
              isRefreshing={refreshingFriends}
              type="friends"
              emptyText={t('messages.empty_friends')}
            />
          </View>
        </View>
      </View>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topControlRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    gap: 10,
  },
  moreRoundedBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  messageList: {
    paddingTop: 20,
  },
  conversationRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
  },
  conversationBody: {
    flex: 1,
    minWidth: 0,
  },
  conversationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "800",
  },
  time: {
    color: "#A14200",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 10,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagePreview: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
  },
  unreadBadge: {
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#9A3B00",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
  centered: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    maxWidth: 360,
    paddingHorizontal: 24,
    textAlign: "center",
  },
  retryText: {
    color: "#9A3B00",
    fontWeight: "700",
  },
  activeRowContainer: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  activeRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  activeRowTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  activeCountBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 4,
  },
  activeCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#22C55E",
  },
  activeRowScroll: {
    paddingHorizontal: 14,
  },
  activeItem: {
    alignItems: "center",
    marginHorizontal: 6,
    width: 68,
  },
  activeAvatarWrap: {
    width: 64,
    height: 64,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeAvatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  activeName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  statusDotActive: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#22C55E",
    borderWidth: 2.5,
  },
});
