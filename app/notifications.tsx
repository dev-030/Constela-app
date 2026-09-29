import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Heart, MessageCircle, Star, Users, ChevronLeft } from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAndroidBack } from "@/hooks/useAndroidBack";

import { useInfiniteNotificationsQuery, Notification, useMarkNotificationsReadMutation } from "@/api/notifications";
import { ActivityIndicator, FlatList, RefreshControl } from "react-native";
import { useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";

const getIconForType = (type: string) => {
  switch (type) {
    case 'match': return { icon: Heart, color: '#DE4177' };
    case 'message': return { icon: MessageCircle, color: '#007AFF' };
    case 'super_like': return { icon: Star, color: '#FF9500' };
    default: return { icon: Users, color: '#2E735F' };
  }
};

export default function NotificationsScreen() {
  useAndroidBack();
  const background = useColor("background");
  const card = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  const query = useInfiniteNotificationsQuery();
  const markReadMutation = useMarkNotificationsReadMutation();

  const notifications = query.data?.pages.flatMap(page => page.results) ?? [];

  useEffect(() => {
    // When the screen opens, mark all notifications as read on the backend
    markReadMutation.mutate();
  }, []);

  const renderItem = ({ item }: { item: Notification }) => {
    const { icon, color } = getIconForType(item.type);
    const date = new Date(item.created_at);
    const timeString = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <Pressable
        style={({ pressed }) => [
          styles.notificationItem,
          { backgroundColor: pressed ? card : "transparent" },
        ]}
      >
        {/* Avatar / Icon wrapper */}
        <View style={styles.avatarWrapper}>
          {item.data?.sender_photo ? (
            <Avatar uri={item.data.sender_photo} size={56} rounded />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar, { backgroundColor: color + "20" }]}>
              <Text style={[styles.initialsText, { color: color }]}>{item.type.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.typeIconBadge, { backgroundColor: color, borderColor: background }]}>
            <Icon name={icon} size={10} color="#FFF" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: text, fontWeight: !item.is_read ? "800" : "600" }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: !item.is_read ? text : muted }]} numberOfLines={2}>
            {item.body}
          </Text>
          <Text style={[styles.time, { color: muted }]}>{timeString}</Text>
        </View>

        {/* Unread Dot */}
        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: primary }]} />}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Notifications</Text>
        <View style={styles.headerRight} />
      </View>

      {query.isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ padding: 20, alignItems: "center", marginTop: 40 }}>
              <Text style={{ color: muted }}>You have no notifications yet.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={query.isRefetching || false} onRefresh={query.refetch} tintColor={primary} />
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <ActivityIndicator color={primary} style={{ marginVertical: 20 }} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  avatarWrapper: {
    width: 56,
    height: 56,
    marginRight: 16,
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  initialsAvatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    fontSize: 20,
    fontWeight: "700",
  },
  typeIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
  },
});
