import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useThemeContext } from "@/providers/theme-context";
import { router } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo } from "react";
import Link from "expo-router/link";
import {
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsIndexScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const secondary = useColor("secondary");

  const { themePreference, setColorScheme, colorScheme } = useThemeContext();
  const darkMode =
    themePreference === "dark" ||
    (themePreference === "system" && colorScheme === "dark");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: border,
        },
        headerTitle: {
          fontSize: 20,
          fontWeight: "bold",
          color: text,
          marginLeft: 8,
        },
        content: {
          flex: 1,
        },
        scrollContent: {
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 40,
        },
        profileContainer: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 32,
          gap: 16,
        },
        avatarContainer: {
          width: 72,
          height: 72,
          borderRadius: 36,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: border,
        },
        avatar: {
          width: "100%",
          height: "100%",
        },
        name: {
          fontSize: 20,
          fontWeight: "bold",
          color: text,
          marginBottom: 4,
        },
        email: {
          fontSize: 14,
          color: muted,
        },
        darkModeCard: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: cardColor,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: border,
          marginBottom: 32,
        },
        darkModeText: {
          fontSize: 16,
          fontWeight: "bold",
          color: text,
        },
        section: {
          marginBottom: 24,
        },
        sectionTitle: {
          fontSize: 12,
          fontWeight: "700",
          color: "#555",
          marginBottom: 8,
          letterSpacing: 0.5,
        },
        itemRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: border,
        },
        itemText: {
          fontSize: 16,
          color: text,
        },
      }),
    [background, cardColor, text, muted, border, secondary],
  );

  const renderItem = (title: string, route: any) => (
    <Pressable style={styles.itemRow} onPress={() => router.push(route)}>
      <Text style={styles.itemText}>{title}</Text>
      <Icon name={ChevronRight} size={20} color="#A0AEC0" />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Section */}
        <View style={styles.profileContainer}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
              }}
              style={styles.avatar}
            />
          </View>
          <View>
            <Text style={styles.name}>Marcus Jenkins</Text>
            <Text style={styles.email}>marcus.jenkins@constela.au</Text>
          </View>
        </View>

        {/* Dark Mode Toggle */}
        <View style={styles.darkModeCard}>
          <Text style={styles.darkModeText}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={(val) => setColorScheme(val ? "dark" : "light")}
            trackColor={{ false: muted + "55", true: secondary }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 16, marginBottom: 32 }}>
          <Link href="/profile">
            <Badge>Profile</Badge>
          </Link>
          <Link href="/settings/likes">
            <Badge>Likes</Badge>
          </Link>
          <Link href="/settings/subscription">
            <Badge>Subscription</Badge>
          </Link>
        </View>

        {/* ACCOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          {renderItem("Change Email", "/settings/email")}
        </View>

        {/* SECURITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          {renderItem("Change Password", "/settings/password")}
          {renderItem("Change Language", "/settings/language")}
        </View>

        {/* PRIVACY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRIVACY</Text>
          {renderItem("Blocked Users", "/settings")}
        </View>

        {/* NOTIFICATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION</Text>
          {renderItem("Push Notification", "/settings/notifications")}
        </View>

        {/* SUBSCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUBSCRIPTION</Text>
          {renderItem("Payment History", "/settings")}
        </View>

        <Button
          variant="destructive"
          onPress={() => {
            router.replace("/login");
          }}
        >
          Logout
        </Button>
      </ScrollView>
    </View>
  );
}
