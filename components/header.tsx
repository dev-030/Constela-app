import { View, Pressable, Image, StyleSheet } from "react-native";
import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColor } from "@/hooks/useColor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui/avatar";
import { useProfileStore } from "@/store/profileStore";
import { useUnreadNotificationCount } from "@/api/notifications";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function Header({ title }: { title?: string }) {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const isDark = useColorScheme() === "dark";
  const router = useRouter();
  const { profile } = useProfileStore();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { horizontalPadding, isCompact, size } = useResponsiveLayout();
  const logoWidth = size(80, 64);
  const notificationSize = size(40, 36);
  const avatarSize = size(36, 32);

  const userPhotoUri = profile?.photos?.find((p) => p.is_main)?.image || (profile?.photos && profile.photos.length > 0 ? profile.photos[0].image : null);

  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 0,
          paddingHorizontal: horizontalPadding,
        },
      ]}
    >
      <Image
        source={require("@/assets/images/icon_transparent.png")}
        style={[styles.headerLogo, { width: logoWidth, height: size(50, 40) }]}
        resizeMode="contain"
      />
      <View style={[styles.headerRight, { gap: isCompact ? 10 : 16 }]}>
        <Pressable
          onPress={() => router.push("/notifications")}
          style={({ pressed }) => [
            styles.notificationBtn,
            {
              width: notificationSize,
              height: notificationSize,
              borderRadius: notificationSize / 2,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.07)",
              borderWidth: 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          hitSlop={12}
        >
          <Ionicons
            name={unreadCount > 0 ? "notifications" : "notifications-outline"}
            size={size(20, 18)}
            color={text}
          />
          {unreadCount > 0 && (
            <View style={[styles.notificationBadge, { borderColor: background }]} />
          )}
        </Pressable>
        <Pressable onPress={() => router.push("/settings")} style={[styles.avatarBtn, { borderColor: primary }]}>
          <Avatar uri={userPhotoUri} size={avatarSize} rounded />
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
