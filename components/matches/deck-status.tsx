import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

type DeckStatusKind = "loading" | "error" | "empty";

interface DeckStatusProps {
  kind: DeckStatusKind;
  onRetry?: () => void;
}

export function DeckStatus({ kind, onRetry }: DeckStatusProps) {
  const { t } = useTranslation();
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  if (kind === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.muted, { marginTop: 12, color: primary }]}>
          {t('matches.finding_matches')}
        </Text>
      </View>
    );
  }

  if (kind === "error") {
    return (
      <View style={styles.center}>
        <Text style={[styles.muted, { color: "red" }]}>
          {t('matches.load_error')}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry}>
            <Text style={[styles.retryText, { color: primary }]}>
              {t('matches.retry')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={[styles.muted, { color: muted }]}>
        {t('matches.no_matches')}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={[styles.retryText, { color: primary }]}>{t('matches.refresh')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    height: 420,
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