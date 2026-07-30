import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import Header from "../../../components/header";
import VerificationOverlay from "@/components/VerificationOverlay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageThread, ThreadType, useThreadsQuery } from "@/api/messages";
import { Avatar } from "@/components/ui/avatar";
import { useChatSocket } from "@/api/ChatSocketProvider";

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
  const { onlineUsers } = useChatSocket();

  // Only show a full-page spinner on the very first load (no data yet).
  // When a background refetch is triggered by invalidateQueries, we already
  // have data in the cache — continue showing it without blocking the screen.
  if (isLoading && threads.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#1F3A3D" />
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
            tintColor="#1F3A3D"
          />
        }
      >
        <Text style={styles.emptyText}>Couldn&apos;t load conversations.</Text>
        <Pressable onPress={onRefresh}>
          <Text style={styles.retryText}>Retry</Text>
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
            tintColor="#1F3A3D"
          />
        }
      >
        <Text style={styles.emptyText}>{emptyText}</Text>
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
          tintColor="#1F3A3D"
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
                  <Text style={styles.name}>{thread.profile.username}</Text>
                  <Text style={styles.time}>
                    {formatThreadTime(thread.last_message_time)}
                  </Text>
                </View>
                <View style={styles.previewRow}>
                  <Text numberOfLines={1} style={styles.messagePreview}>
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

  useFocusEffect(
    useCallback(() => {
      datingQuery.refetch();
      friendsQuery.refetch();
    }, [datingQuery.refetch, friendsQuery.refetch])
  );

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
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ThreadType)}
        enableSwipe
      >
        <TabsList style={styles.tabsList}>
          <TabsTrigger value="dating" textStyle={styles.triggerText}>
            Dating
          </TabsTrigger>
          <TabsTrigger value="friends" textStyle={styles.triggerText}>
            Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dating" style={{ paddingTop: 0 }}>
          <ConversationList
            threads={datingQuery.data ?? []}
            isLoading={datingQuery.isLoading}
            isError={!!datingQuery.isError}
            onRefresh={handleDatingRefresh}
            isRefreshing={refreshingDating}
            type="dating"
            emptyText={
              tab === "dating"
                ? "No matches yet. Start liking profiles to begin a thread."
                : "No conversations."
            }
          />
        </TabsContent>

        <TabsContent value="friends" style={{ paddingTop: 0 }}>
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
  tabsList: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "800",
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
    color: "#1C1C1C",
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
    color: "#71717A",
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
    color: "#71717A",
    fontSize: 14,
  },
  retryText: {
    color: "#9A3B00",
    fontWeight: "700",
  },
});
