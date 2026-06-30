import { useColor } from "@/hooks/useColor";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  CardStackArea,
  FiltersHeader,
  GreetingRow,
  useMatchesFeed,
} from "@/components/matches";

export default function MatchesScreen() {
  const background = useColor("background");

  const feed = useMatchesFeed();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
      <View style={styles.scrollContent}>
        <FiltersHeader />

        <GreetingRow
          displayName={feed.displayName}
          tierLabel={feed.tierLabel}
          tier={feed.tier}
        />

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
});
