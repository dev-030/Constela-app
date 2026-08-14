import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import React from "react";
import { Icon } from "@/components/ui/icon";
import { Bell } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui/avatar";
import { useProfileStore } from "@/store/profileStore";

export default function Header() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const accent = useColor("accent");
  const router = useRouter();
  const { profile } = useProfileStore();

  const userPhotoUri = profile?.photos && profile.photos.length > 0 ? profile.photos[0].image : null;

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 0,
        },
      ]}
    >
      <Image
        source={require("@/assets/images/icon_transparent.png")}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <View style={styles.headerRight}>
        <Pressable onPress={() => router.push("/notifications")} style={[styles.notificationBtn, { backgroundColor: accent }]} hitSlop={12}>
          <Icon name={Bell} size={22} color={text} />
          {/* Optional: unread dot */}
          <View style={[styles.notificationBadge, { borderColor: background }]} />
        </Pressable>
        <Pressable onPress={() => router.push("/settings")} style={[styles.avatarBtn, { borderColor: primary }]}>
          <Avatar uri={userPhotoUri} size={36} rounded />
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 80,
    height: 50,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444", // red dot for notifications
    borderWidth: 1.5,
  },
  avatarBtn: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    position: "relative",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
  },
  fullSize: {
    width: "100%",
    height: "100%",
  },
});
