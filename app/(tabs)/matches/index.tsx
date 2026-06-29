import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { Link, router } from "expo-router";
import { Image, Pressable, ScrollView, View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Bell,
  Heart,
  RotateCcw,
  Sliders,
  SlidersHorizontal,
  Star,
  Undo,
  User,
  X,
} from "lucide-react-native";
import Swipe from "@/components/swipe";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { usePerfectMatchQuery, useSwipeActionMutation, MatchProfile } from "@/api/matching";
import { ActivityIndicator, Alert } from "react-native";

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const secondary = useColor("secondary");
  const muted = useColor("textMuted");
  const text = useColor("text");
  const border = useColor("border");

  // Fetch perfect matches with no filters (default behavior)
  const { data, isLoading, isError } = usePerfectMatchQuery({});
  const swipeAction = useSwipeActionMutation();

  const handleSwipe = async (profile: MatchProfile, direction: "left" | "right") => {
    try {
      const action = direction === "right" ? "liked" : "disliked";
      const res = await swipeAction.mutateAsync({ targetId: profile.id, action });
      
      if (res.is_mutual_match) {
        Alert.alert("It's a Match! 🎉", `You and ${profile.username} liked each other!`);
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        Alert.alert("Limit Reached", err.response.data.error || "Daily like limit reached. Upgrade to Premium for more.");
      } else {
        console.log("Swipe action error:", err);
      }
    }
  };

  return (
     <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
       <View style={styles.scrollContent}>
      {/* Filters Header */}
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>
          Find Your Perfect Match by Filters
        </Text>
        <Link href="/filters" asChild>
          <Pressable hitSlop={20}>
            <SlidersHorizontal color={primary} />
          </Pressable>
        </Link>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text>Hello Alex</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View
            style={{
              backgroundColor: "green",
              width: 46,
              height: 46,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 36,
            }}
          >
            <Star color={"#fff"} fill={"#fff"} />
          </View>
          <Text style={{ fontSize: 14 }}>Premium{"\n"}Membership</Text>
        </View>
      </View>

      {/* Card Stack Area */}
      <View style={[styles.cardStackArea, { backgroundColor: primary + 20 }]}>
        <View
          style={{
            // marginBottom: 16,
            //   right: 16,
            //   position: "absolute",
            backgroundColor: "#fff",
            padding: 8,
            borderRadius: BORDER_RADIUS,
            //   margin: 8,
          }}
        >
          <Undo />
        </View>

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={primary} />
            <Text style={{ marginTop: 12, color: primary }}>Finding matches...</Text>
          </View>
        ) : isError ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "red" }}>Failed to load matches.</Text>
          </View>
        ) : data?.results && data.results.length > 0 ? (
          <Swipe profiles={data.results} onSwipe={handleSwipe} />
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: muted }}>No matches found.</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          {/* Reject Button */}
          <Pressable style={styles.rejectButton}>
            <Icon name={X} size={32} color="#FFF" />
          </Pressable>

          {/* Super Like Button */}
          <Pressable style={styles.superLikeButton}>
            <Icon name={Star} size={24} color="#E65100" />
          </Pressable>

          {/* Like Button */}
          <Pressable style={[styles.likeButton, { backgroundColor: primary }]}>
            <Icon name={Heart} size={32} color="#FFF" />
          </Pressable>
        </View>
      </View>
    {/* </Layout> */}
        </View>
  </SafeAreaView>
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
    flex: 1,
    padding: 16,
    paddingBottom: 24, // reduced from 100 since no scrolling
  },
  filtersHeader: {
    paddingTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 999,
    elevation: 10,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  cardStackArea: {
    flex: 1, // fill remaining space
    borderRadius: 24,
    //  padding: 16,
    paddingTop: 16,
    alignItems: "center",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    //  marginTop: 40,
    //  zIndex: 10,
  },
  rejectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#004D40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4, // Added Android shadow compatibility
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2, // Added Android shadow compatibility
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4, // Added Android shadow compatibility
  },
});
