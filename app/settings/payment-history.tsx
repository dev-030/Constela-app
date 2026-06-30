import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ArrowLeft, Receipt, RefreshCw } from "lucide-react-native";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SubscriptionTransaction,
  useTransactionHistoryQuery,
} from "@/api/settings";

function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatAmount(amount: string | number): string {
  const value = typeof amount === "number" ? amount.toFixed(2) : amount;
  return `$${value}`;
}

function statusColor(
  status: string,
  palette: { success: string; error: string; muted: string }
): string {
  const normalized = status.toLowerCase();
  if (normalized === "successful" || normalized === "success" || normalized === "succeeded") {
    return palette.success;
  }
  if (normalized === "failed" || normalized === "refunded") {
    return palette.error;
  }
  return palette.muted;
}

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const historyQuery = useTransactionHistoryQuery();

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
          paddingVertical: 12,
          gap: 10,
        },
        backBtn: {
          padding: 4,
        },
        headerTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: text,
        },
        content: {
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 40,
        },
        hero: {
          alignItems: "center",
          paddingVertical: 24,
          gap: 8,
        },
        heroBadge: {
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: primary + "15",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        },
        heroTitle: {
          fontSize: 20,
          fontWeight: "800",
          color: text,
        },
        heroSubtitle: {
          fontSize: 13,
          color: muted,
          textAlign: "center",
          paddingHorizontal: 24,
          lineHeight: 19,
        },
        list: {
          marginTop: 8,
          gap: 10,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: border,
          backgroundColor: card,
          gap: 12,
        },
        rowIcon: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: primary + "15",
          alignItems: "center",
          justifyContent: "center",
        },
        rowBody: {
          flex: 1,
          minWidth: 0,
        },
        rowPlan: {
          fontSize: 15,
          fontWeight: "700",
          color: text,
          marginBottom: 2,
        },
        rowMeta: {
          fontSize: 12,
          color: muted,
        },
        rowAmount: {
          alignItems: "flex-end",
        },
        rowAmountText: {
          fontSize: 15,
          fontWeight: "800",
          color: text,
        },
        rowStatus: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        empty: {
          alignItems: "center",
          paddingVertical: 32,
          gap: 8,
        },
        emptyText: {
          color: muted,
          fontSize: 14,
          textAlign: "center",
        },
        retryText: {
          color: primary,
          fontWeight: "700",
        },
        errorBanner: {
          backgroundColor: "#FEE2E2",
          borderRadius: 10,
          padding: 12,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: "#FCA5A5",
        },
        errorText: {
          color: "#991B1B",
          fontSize: 13,
          marginBottom: 8,
        },
      }),
    [background, text, muted, card, border, primary]
  );

  const palette = {
    success: "#10B981",
    error: "#EF4444",
    muted,
  };

  const transactions = historyQuery.data ?? [];
  const isEmpty =
    !historyQuery.isLoading &&
    !historyQuery.isError &&
    transactions.length === 0;

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Payment History</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={historyQuery.isFetching}
            onRefresh={() => historyQuery.refetch()}
            tintColor={primary}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Icon name={Receipt} size={26} color={primary} />
          </View>
          <Text style={styles.heroTitle}>Subscription transactions</Text>
          <Text style={styles.heroSubtitle}>
            Every charge for Premium Light or Premium Plus, in one place.
          </Text>
        </View>

        {historyQuery.isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {(historyQuery.error as any)?.response?.data?.error ||
                "Couldn\u2019t load your transactions."}
            </Text>
            <Button
              variant="outline"
              onPress={() => historyQuery.refetch()}
              icon={RefreshCw}
              style={{ borderRadius: 10, height: 40 }}
            >
              Retry
            </Button>
          </View>
        )}

        {historyQuery.isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={primary} />
            <Text style={styles.emptyText}>Loading your transactions…</Text>
          </View>
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
            <Text style={styles.emptyText}>
              Upgrade to Premium to see your receipts here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {transactions.map((tx: SubscriptionTransaction) => (
              <View key={tx.id} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Icon name={Receipt} size={18} color={primary} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowPlan}>{tx.plan_name}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {formatDate(tx.created_at)}
                    {tx.stripe_charge_id
                      ? ` • ${tx.stripe_charge_id.slice(0, 10)}…`
                      : ""}
                  </Text>
                </View>
                <View style={styles.rowAmount}>
                  <Text style={styles.rowAmountText}>
                    {formatAmount(tx.amount)}
                  </Text>
                  <Text
                    style={[
                      styles.rowStatus,
                      { color: statusColor(tx.status, palette) },
                    ]}
                  >
                    {tx.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}