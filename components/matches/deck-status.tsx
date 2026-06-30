import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

type DeckStatusKind = "loading" | "error" | "empty";

interface DeckStatusProps {
  kind: DeckStatusKind;
  onRetry?: () => void;
}

export function DeckStatus({ kind, onRetry }: DeckStatusProps) {
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  if (kind === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.muted, { marginTop: 12, color: primary }]}>
          Finding matches...
        </Text>
      </View>
    );
  }

  if (kind === "error") {
    return (
      <View style={styles.center}>
        <Text style={[styles.muted, { color: "red" }]}>
          Failed to load matches.
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry}>
            <Text style={[styles.retryText, { color: primary }]}>
              Tap to retry
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={[styles.muted, { color: muted }]}>
        No matches found. Try widening your filters.
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={[styles.retryText, { color: primary }]}>Refresh</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  muted: {
    fontSize: 14,
  },
  retryText: {
    marginTop: 8,
    fontWeight: "700",
  },
});