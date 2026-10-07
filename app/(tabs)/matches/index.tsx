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
import { Sparkles, SlidersHorizontal, ChevronRight } from "lucide-react-native";
import { useRouter, Link } from "expo-router";
import VerificationOverlay from "@/components/VerificationOverlay";
import Header from "../../../components/header";
import { useTranslation } from "react-i18next";

export default function MatchesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const background = useColor("background");
  const primary = useColor("primary");

  const feed = useMatchesFeed();

  return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header />
        <View style={styles.scrollContent}>
        <View style={styles.headerRow}>
          <Pressable 
            style={[styles.analysisBanner, { flex: 1, marginRight: 12 }]}
            onPress={() => router.push("/match-analysis" as any)}
          >
            <Sparkles size={18} color="#B8860B" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.bannerTitle}>{t('matches.analysis_banner_title')}</Text>
              <Text style={styles.bannerSub}>{t('matches.analysis_banner_sub')}</Text>
            </View>
            <ChevronRight size={18} color="#B8860B" style={{ opacity: 0.6 }} />
          </Pressable>

          <Link href="/filters" asChild>
            <Pressable hitSlop={20} style={styles.filterButton}>
              <SlidersHorizontal color={primary} size={24} />
            </Pressable>
          </Link>
        </View>

        <VerificationOverlay>
          <CardStackArea
            matches={feed.matches}
            feedKey={feed.feedKey}
            isLoading={feed.isLoading}
            isError={feed.isError}
            swipeRef={feed.swipeRef}
            canUndo={feed.canUndo}
            isLocked={feed.isLocked}
            swipePending={false}
            onSwipe={feed.handleSwipe}
            onActiveIndexChange={feed.handleActiveIndexChange}
            onUndo={feed.handleUndo}
            onReject={() => feed.handleActionPress("reject")}
            onSuper={() => feed.handleActionPress("super")}
            onLike={() => feed.handleActionPress("like")}
            onRetry={() => feed.refetch()}
          />
        </VerificationOverlay>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(233, 30, 99, 0.08)",
    borderColor: "rgba(233, 30, 99, 0.3)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  analysisBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.12)",
    borderColor: "rgba(184, 134, 11, 0.3)",
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B8860B",
    letterSpacing: 0.2,
  },
  bannerSub: {
    fontSize: 11,
    color: "#B8860B",
    opacity: 0.8,
    marginTop: 2,
  },
});
