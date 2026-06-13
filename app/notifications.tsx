import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Heart, MessageCircle, Star, Users, X } from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const NOTIFICATIONS = [
  {
    title: "New",
    data: [
      {
        id: "1",
        type: "match",
        title: "You matched with Sam!",
        description: "Don't keep them waiting, say hi!",
        time: "10m ago",
        unread: true,
        avatar: require("@/assets/profiles/liam.png"),
        icon: Heart,
        iconColor: "#DE4177",
      },
      {
        id: "2",
        type: "message",
        title: "Mia sent you a message",
        description: "\"Hey! I saw you also like quiet spaces...\"",
        time: "1h ago",
        unread: true,
        avatar: require("@/assets/profiles/mia.png"),
        icon: MessageCircle,
        iconColor: "#007AFF",
      },
      {
        id: "3",
        type: "community",
        title: "ADHD Hub",
        description: "Nico Alexis mentioned you in a message.",
        time: "3h ago",
        unread: false,
        avatar: null,
        initials: "AH",
        icon: Users,
        iconColor: "#2E735F",
      },
    ],
  },
  {
    title: "Earlier",
    data: [
      {
        id: "4",
        type: "superlike",
        title: "Someone Super Liked you!",
        description: "Upgrade to Premium Plus to see who it is.",
        time: "Yesterday",
        unread: false,
        avatar: null,
        initials: "✨",
        icon: Star,
        iconColor: "#FF9500",
      },
      {
        id: "5",
        type: "match",
        title: "You matched with Jordan!",
        description: "Start a conversation now.",
        time: "2 days ago",
        unread: false,
        avatar: require("@/assets/profiles/jordan.png"),
        icon: Heart,
        iconColor: "#DE4177",
      },
    ],
  },
];

export default function NotificationsScreen() {
  const background = useColor("background");
  const card = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: text }]}>Notifications</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
          <Icon name={X} size={24} color={text} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {NOTIFICATIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>{section.title}</Text>

            {section.data.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.notificationItem,
                  { backgroundColor: pressed ? card : "transparent" },
                ]}
              >
                {/* Avatar / Icon wrapper */}
                <View style={styles.avatarWrapper}>
                  {item.avatar ? (
                    <Image source={item.avatar} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.initialsAvatar, { backgroundColor: item.iconColor + "20" }]}>
                      <Text style={[styles.initialsText, { color: item.iconColor }]}>{item.initials}</Text>
                    </View>
                  )}
                  {/* Small Type Icon */}
                  <View style={[styles.typeIconBadge, { backgroundColor: item.iconColor, borderColor: background }]}>
                    <Icon name={item.icon} size={10} color="#FFF" />
                  </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                  <Text style={[styles.title, { color: text, fontWeight: item.unread ? "800" : "600" }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.description, { color: item.unread ? text : muted }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <Text style={[styles.time, { color: muted }]}>{item.time}</Text>
                </View>

                {/* Unread Dot */}
                {item.unread && <View style={[styles.unreadDot, { backgroundColor: primary }]} />}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
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
