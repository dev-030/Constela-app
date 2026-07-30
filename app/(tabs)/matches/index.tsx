import { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { useColor } from "@/hooks/useColor";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CardStackArea,
  FiltersHeader,
  GreetingRow,
  useMatchesFeed,
} from "@/components/matches";
import { Sparkles } from "lucide-react-native";
import { useRouter } from "expo-router";
import VerificationOverlay from "@/components/VerificationOverlay";

export default function MatchesScreen() {
  const router = useRouter();
  const background = useColor("background");

  const feed = useMatchesFeed();

  useFocusEffect(
    useCallback(() => {
      feed.refetch();
    }, [feed.refetch])
  );

  return (
    <VerificationOverlay>
      <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
        <View style={styles.scrollContent}>
        <GreetingRow
          displayName={feed.displayName}
          tierLabel={feed.tierLabel}
          tier={feed.tier}
        />

        <Pressable 
          style={styles.analysisBanner}
          onPress={() => router.push("/match-analysis" as any)}
        >
          <Sparkles size={20} color="#B8860B" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerTitle}>Perfect Match Analysis</Text>
            <Text style={styles.bannerSub}>View your top 5 compatible profiles</Text>
          </View>
        </Pressable>

        <FiltersHeader />

        <CardStackArea
          matches={feed.matches}
          isLoading={feed.isLoading}
          isError={feed.isError}
          swipeRef={feed.swipeRef}
          canUndo={feed.canUndo}
          swipePending={feed.swipeAction.isPending}
          onSwipe={feed.handleSwipe}
          onActiveIndexChange={feed.handleActiveIndexChange}
          onUndo={feed.handleUndo}
          onReject={() => feed.handleActionPress("reject")}
          onSuper={() => feed.handleActionPress("super")}
          onLike={() => feed.handleActionPress("like")}
          onRetry={() => feed.refetch()}
        />
        </View>
      </SafeAreaView>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  analysisBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderColor: "rgba(184, 134, 11, 0.3)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B8860B",
  },
  bannerSub: {
    fontSize: 12,
    color: "#B8860B",
    opacity: 0.8,
    marginTop: 2,
  }
});
