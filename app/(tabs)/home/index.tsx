import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { router } from "expo-router";
import {
  Clock,
  Heart,
  MessageCircle,
  User,
  PlayCircle,
  Search,
  Coffee,
  Users,
  MessageSquare,
  BookOpen,
  Sliders,
  Bell,
  HandHeart,
} from "lucide-react-native";
import { Image, Pressable, ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CardList from "./_components/feat-card";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const muted = useColor("textMuted");
  const border = useColor("border");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Custom Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
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
            <View
              style={[styles.statusIndicator, { borderColor: background }]}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Donation Banner */}
        <View
          style={[styles.donationBanner, { backgroundColor: primary + 30 }]}
        >
          <Icon name={HandHeart} size={16} color={primary} />
          <Text style={[styles.donationText, { color: primary }]}>
            5% of our benefits are donated to charitable organizations
          </Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text variant="title" style={styles.greetingTitle}>
            Hello Alex
          </Text>
          <Text style={{ color: muted }}>What would you like to do today?</Text>
        </View>

        {/* Feature Cards */}
        <CardList />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  donationBanner: {
    borderRadius: BORDER_RADIUS,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E25687" + 60,
  },
  donationText: {
    fontSize: 12,
    fontWeight: "500",
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
