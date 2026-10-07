import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ChevronLeft, Receipt, RefreshCw } from "lucide-react-native";
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
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from "react-i18next";

function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amount: string | number): string {
  const value = typeof amount === "number" ? amount.toFixed(2) : amount;
  return `$${value}`;
}

function formatPlanName(rawName: string): string {
  if (!rawName) return "Subscription";
  let name = rawName.replace(/RevenueCat:\s*/i, "");
  name = name.replace(/_/g, " ");
  return name.replace(/\b\w/g, c => c.toUpperCase());
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
  useAndroidBack();
  const { t } = useTranslation();
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
          paddingBottom: 24,
        },
        headerLeft: {
          flex: 1,
          alignItems: "flex-start",
        },
        headerCenter: {
          flex: 2,
          alignItems: "center",
        },
        headerRight: {
          flex: 1,
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
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={24} color={text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('settings.payment_history', 'Payment History')}</Text>
        </View>
        <View style={styles.headerRight} />
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
          <Text style={styles.heroTitle}>{t('settings_pages.subscription_transactions', 'Subscription transactions')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('settings_pages.subscription_transactions_sub', 'Every charge for Premium Light or Premium Plus, in one place.')}
          </Text>
        </View>

        {historyQuery.isError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {(historyQuery.error as any)?.response?.data?.error ||
                t('settings_pages.transactions_load_error', "Couldn\u2019t load your transactions.")}
            </Text>
            <Button
              variant="outline"
              onPress={() => historyQuery.refetch()}
              icon={RefreshCw}
              style={{ borderRadius: 10, height: 40 }}
            >
              {t('settings_pages.retry', 'Retry')}
            </Button>
          </View>
        )}

        {historyQuery.isLoading ? (
          <View style={[styles.empty, { paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={primary} />
          </View>
        ) : isEmpty ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{t('settings_pages.no_transactions', 'No transactions yet.')}</Text>
            <Text style={styles.emptyText}>
              {t('settings_pages.upgrade_for_receipts', 'Upgrade to Premium to see your receipts here.')}
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
                  <Text style={styles.rowPlan}>{formatPlanName(tx.plan_name)}</Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {formatDate(tx.created_at)}
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