import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import React from "react";
import { Icon } from "@/components/ui/icon";
import { Bell } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Header() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const router = useRouter();
  return (
    <View
      style={[
        styles.header,
        {
          paddingTop: insets.top + 0,
          borderBottomColor: border,
        },
      ]}
    >
      <Image
        source={require("@/assets/images/icon.png")}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <View style={styles.headerRight}>
        <Icon name={Bell} size={24} />
        <Pressable onPress={() => router.push("/settings")}>
          <View style={[styles.avatarContainer, { backgroundColor: muted }]}>
            <Image
              source={{ uri: "https://i.pravatar.cc/150?img=68" }}
              style={styles.fullSize}
            />
          </View>
          <View style={[styles.statusIndicator, { borderColor: background }]} />
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
    borderBottomWidth: 1,
  },
  headerLogo: {
    width: 60,
    height: 40,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
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
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34C759",
    borderWidth: 2,
  },
});
