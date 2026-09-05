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
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "../../../components/header";
import VerificationOverlay from "@/components/VerificationOverlay";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { MessageThread, ThreadType, useThreadsQuery } from "@/api/messages";
import { Avatar } from "@/components/ui/avatar";
import { useChatSocket } from "@/api/ChatSocketProvider";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";

// Format a UTC timestamp as "10:45 AM", "Yesterday", or "N days ago".
function formatThreadTime(iso: string): string {
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
    return "Yesterday";
  }
  if (dayDiff < 7) {
    return `${dayDiff} days ago`;
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

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
  }, [activeIndex, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerBg = isDark ? "#2C2C2E" : "#EFEFEF";
  const pillBg = isDark ? "#3A3A3C" : useColor("card");
  const activeTextColor = isDark ? "#FFFFFF" : useColor("text");
  const inactiveTextColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <View
      style={[segStyles.wrapper, { backgroundColor: containerBg }]}
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
          style={[segStyles.tab, pillWidth > 0 && { width: pillWidth }]}
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
            ]}
          >
            {tab.label}
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
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    position: "relative",
  },
  pill: {
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
  tab: {
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

// ── Conversation list ────────────────────────────────────────────────────────
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
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const textMuted = useColor("textMuted");
  const { onlineUsers } = useChatSocket();

  // Only show a full-page spinner on the very first load (no data yet).
  // When a background refetch is triggered by invalidateQueries, we already
  // have data in the cache — continue showing it without blocking the screen.
  if (isLoading && threads.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <ScrollView
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={primary}
          />
        }
      >
        <Text style={[styles.emptyText, { color: textMuted }]}>Couldn&apos;t load conversations.</Text>
        <Pressable onPress={onRefresh}>
          <Text style={[styles.retryText, { color: primary }]}>Retry</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (threads.length === 0) {
    return (
      <ScrollView
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

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={primary}
        />
      }
    >
      <View style={styles.messageList}>
        {threads.map((thread) => {
          const isOnline = !!onlineUsers[thread.profile.id];
          return (
            <Pressable
              key={thread.profile.id}
              style={styles.conversationRow}
              onPress={() => router.push({ pathname: `/inbox/${thread.profile.id}`, params: { type } })}
            >
              <View style={styles.avatarWrap}>
                <Avatar
                  uri={thread.profile.photo}
                  size={56}
                />
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isOnline ? "#22C55E" : "#CFD5D8",
                      borderColor: background,
                    },
                  ]}
                />
              </View>

              <View style={styles.conversationBody}>
                <View style={styles.conversationTop}>
                  <Text style={[styles.name, { color: text }]}>{thread.profile.name}</Text>
                  <Text style={styles.time}>
                    {formatThreadTime(thread.last_message_time)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text numberOfLines={1} style={[styles.messagePreview, { color: textMuted }]}>
                    {thread.last_message}
                  </Text>
                  {thread.unread_count > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{thread.unread_count}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export default function MessagesScreen() {
  const background = useColor("background");

  const [tab, setTab] = useState<ThreadType>("dating");

  const datingQuery = useThreadsQuery("dating");
  const friendsQuery = useThreadsQuery("friends");

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

        <SegmentedControl activeTab={tab} onChange={setTab} />

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as ThreadType)}
          enableSwipe={false}
          style={{ flex: 1 }}
        >
          <TabsContent value="dating" style={{ paddingTop: 0, flex: 1 }}>
            <ConversationList
              threads={datingQuery.data ?? []}
              isLoading={datingQuery.isLoading}
              isError={!!datingQuery.isError}
              onRefresh={handleDatingRefresh}
              isRefreshing={refreshingDating}
              type="dating"
              emptyText="No matches yet. Start liking profiles to begin a thread."
            />
          </TabsContent>

          <TabsContent value="friends" style={{ paddingTop: 0, flex: 1 }}>
            <ConversationList
              threads={friendsQuery.data ?? []}
              isLoading={friendsQuery.isLoading}
              isError={!!friendsQuery.isError}
              onRefresh={handleFriendsRefresh}
              isRefreshing={refreshingFriends}
              type="friends"
              emptyText="No friends to chat with yet."
            />
          </TabsContent>
        </Tabs>
      </View>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
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
  },
  retryText: {
    color: "#9A3B00",
    fontWeight: "700",
  },
});
