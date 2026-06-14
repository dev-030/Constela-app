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
import CardList from "../../../components/feat-card";
import Header from "../../../components/header";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const muted = useColor("textMuted");
  const border = useColor("border");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />

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

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  donationBanner: {
   //  paddingHorizontal: 36,
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
