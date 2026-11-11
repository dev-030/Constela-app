import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useProfileStore } from "@/store/profileStore";
import { router } from "expo-router";
import {
  ChevronLeft,
  RefreshCw,
  Bug,
  Copy,
  ShoppingBag,
  CreditCard,
  Undo2,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Purchases, {
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import {
  isNativeModuleAvailable,
  initializePurchases,
  getCustomerInfo,
  restorePurchases,
  syncSubscription,
  purchasePackage as purchasePackageHelper,
} from "@/api/purchases";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { showAlert } from "@/components/ui/app-alert";

/**
 * RevenueCat Debug Screen
 * ------------------------
 * Use this screen to verify that the RevenueCat native SDK is wired up
 * correctly and to inspect the live `CustomerInfo` and `Offerings`
 * responses from the API.
 *
 * What it checks:
 *  1. Is EXPO_PUBLIC_REVENUECAT_KEY set?
 *  2. Is the native RNPurchases module compiled in (i.e. not Expo Go)?
 *  3. Is Purchases.configure() callable?
 *  4. Does Purchases.getCustomerInfo() return a valid payload?
 *  5. Does Purchases.getOfferings() return the products you configured
 *     in the RevenueCat dashboard?
 */

const RC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "";

type PurchaseLog = {
  id: number;
  at: number;
  packageIdentifier: string;
  productId: string;
  status: "started" | "success" | "cancelled" | "failed" | "no-op";
  message: string;
  customerInfo?: CustomerInfo | null;
};

type DebugState = {
  loading: boolean;
  fetching: boolean;
  error: string | null;
  configured: boolean;
  customerInfo: CustomerInfo | null;
  lastFetchedAt: number | null;
  offeringsLoading: boolean;
  offeringsError: string | null;
  offerings: PurchasesOfferings | null;
  lastOfferingsFetchedAt: number | null;
  purchasingPackageId: string | null;
  purchaseLogs: PurchaseLog[];
  apiKeyPresent: boolean;
  nativeModuleAvailable: boolean;
};

const initialState: DebugState = {
  loading: false,
  fetching: false,
  error: null,
  configured: false,
  customerInfo: null,
  lastFetchedAt: null,
  offeringsLoading: false,
  offeringsError: null,
  offerings: null,
  lastOfferingsFetchedAt: null,
  purchasingPackageId: null,
  purchaseLogs: [],
  apiKeyPresent: !!RC_KEY && RC_KEY.length > 0,
  nativeModuleAvailable: isNativeModuleAvailable(),
};

export default function RevenueCatDebugScreen() {
  useAndroidBack();
  const background = useColor("background");
  const card = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const primary = useColor("primary");
  const destructive = "#ef4444";
  const success = "#10b981";
  const insets = useSafeAreaInsets();

  const { profile } = useProfileStore();
  const [state, setState] = useState<DebugState>(initialState);

  const maskKey = (key: string) => {
    if (!key) return "(empty)";
    if (key.length <= 8) return "•".repeat(key.length);
    return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`;
  };

  const runDiagnostic = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      // Step 1: environment checks
      if (!state.apiKeyPresent) {
        throw new Error(
          "EXPO_PUBLIC_REVENUECAT_KEY is missing. Add it to your .env and restart the dev server.",
        );
      }
      if (!state.nativeModuleAvailable) {
        throw new Error(
          "Native RevenueCat module is not available. This usually means you are running in Expo Go — build a dev client with `npx expo run:ios` or `npx expo run:android`.",
        );
      }

      // Step 2: make sure Purchases is configured (idempotent)
      const userId =
        profile?.id?.toString() || "";

      try {
        await initializePurchases(userId);
      } catch (e: any) {
        console.warn("[RC Debug] initializePurchases threw:", e);
      }

      // Step 3: ping the RC backend for customer info
      const info = await getCustomerInfo();

      if (!info) {
        throw new Error(
          "getCustomerInfo() returned null. Check the console for the underlying error from react-native-purchases.",
        );
      }

      // Step 4: fetch offerings in parallel so the screen shows them by default
      let offerings: PurchasesOfferings | null = null;
      let offeringsError: string | null = null;
      try {
        offerings = await Purchases.getOfferings();
      } catch (e: any) {
        offeringsError = e?.message || String(e);
        console.warn("[RC Debug] getOfferings threw:", e);
      }

      setState((s) => ({
        ...s,
        loading: false,
        error: null,
        configured: true,
        customerInfo: info,
        lastFetchedAt: Date.now(),
        offerings,
        offeringsError,
        lastOfferingsFetchedAt: Date.now(),
      }));
    } catch (e: any) {
      console.error("[RC Debug] Diagnostic failed:", e);
      setState((s) => ({
        ...s,
        loading: false,
        error: e?.message || String(e),
      }));
    }
  }, [profile, state.apiKeyPresent, state.nativeModuleAvailable]);

  const runOfferingsDiagnostic = useCallback(async () => {
    setState((s) => ({ ...s, offeringsLoading: true, offeringsError: null }));

    try {
      if (!state.apiKeyPresent) {
        throw new Error(
          "EXPO_PUBLIC_REVENUECAT_KEY is missing. Add it to your .env and restart the dev server.",
        );
      }
      if (!state.nativeModuleAvailable) {
        throw new Error(
          "Native RevenueCat module is not available. This usually means you are running in Expo Go — build a dev client with `npx expo run:ios` or `npx expo run:android`.",
        );
      }

      // Make sure Purchases is configured (idempotent)
      const userId =
        profile?.id?.toString() || "";
      try {
        await initializePurchases(userId);
      } catch (e: any) {
        console.warn("[RC Debug] initializePurchases threw:", e);
      }

      const offerings = await Purchases.getOfferings();
      setState((s) => ({
        ...s,
        offeringsLoading: false,
        offeringsError: null,
        offerings,
        lastOfferingsFetchedAt: Date.now(),
      }));
    } catch (e: any) {
      console.error("[RC Debug] Offerings diagnostic failed:", e);
      setState((s) => ({
        ...s,
        offeringsLoading: false,
        offeringsError: e?.message || String(e),
      }));
    }
  }, [profile, state.apiKeyPresent, state.nativeModuleAvailable]);

  // ── Purchase debug ───────────────────────────────────────────────────────
  //
  // Wraps Purchases.purchasePackage with verbose console logging and an
  // inline history so you can see exactly what the SDK did without digging
  // through Xcode / Metro logs. Each call is also assigned a numeric id so
  // async log lines stay correlated.

  const tryPurchase = useCallback(
    async (pkg: PurchasesPackage) => {
      const id = Date.now();
      const pkgInfo = {
        identifier: pkg.identifier,
        packageType: pkg.packageType,
        productId: pkg.product.identifier,
        title: pkg.product.title,
        price: pkg.product.priceString,
        currency: pkg.product.currencyCode,
        subscriptionPeriod: pkg.product.subscriptionPeriod ?? null,
        introPrice: pkg.product.introPrice
          ? {
              price: pkg.product.introPrice.priceString,
              cycles: pkg.product.introPrice.cycles,
              periodUnit: pkg.product.introPrice.periodUnit,
              periodNumberOfUnits: pkg.product.introPrice.periodNumberOfUnits,
            }
          : null,
      };

      console.log(`[RC Debug #${id}] purchase START`, pkgInfo);

      const startedLog: PurchaseLog = {
        id,
        at: Date.now(),
        packageIdentifier: pkg.identifier,
        productId: pkg.product.identifier,
        status: "started",
        message: "Calling Purchases.purchasePackage()…",
      };
      setState((s) => ({
        ...s,
        purchasingPackageId: pkg.identifier,
        purchaseLogs: [startedLog, ...s.purchaseLogs],
      }));

      try {
        // Make sure the SDK is configured before purchasing
        const userId =
          profile?.id?.toString() || "";
        await initializePurchases(userId);
        console.log(`[RC Debug #${id}] Purchases configured for`, userId);

        // Use the helper so it goes through the same path as production
        const customerInfo = await purchasePackageHelper(pkg);

        console.log(
          `[RC Debug #${id}] purchasePackage returned`,
          customerInfo ? "(CustomerInfo)" : "(null)",
        );
        if (customerInfo) {
          await syncSubscription();
          console.log(
            `[RC Debug #${id}] customerInfo JSON =`,
            JSON.stringify(customerInfo, null, 2),
          );
          const active = Object.keys(customerInfo.entitlements.active ?? {});
          console.log(`[RC Debug #${id}] active entitlements:`, active);
        }

        // Always re-fetch fresh customer info to verify the purchase stuck
        let freshInfo: CustomerInfo | null = null;
        try {
          freshInfo = await getCustomerInfo();
          console.log(
            `[RC Debug #${id}] post-purchase getCustomerInfo() =`,
            freshInfo
              ? {
                  originalAppUserId: freshInfo.originalAppUserId,
                  activeEntitlements: Object.keys(
                    freshInfo.entitlements.active ?? {},
                  ),
                  activeSubscriptions: freshInfo.activeSubscriptions,
                }
              : null,
          );
        } catch (e) {
          console.warn(`[RC Debug #${id}] post-purchase getCustomerInfo failed`, e);
        }

        setState((s) => ({
          ...s,
          purchasingPackageId: null,
          customerInfo: freshInfo ?? s.customerInfo,
          lastFetchedAt: freshInfo ? Date.now() : s.lastFetchedAt,
          purchaseLogs: [
            {
              id,
              at: Date.now(),
              packageIdentifier: pkg.identifier,
              productId: pkg.product.identifier,
              status: customerInfo ? "success" : "no-op",
              message: customerInfo
                ? `Purchase succeeded. Active entitlements: ${Object.keys(
                    customerInfo.entitlements.active ?? {},
                  ).join(", ") || "(none)"}`
                : "purchasePackage returned null — SDK did not throw but produced no customer info.",
              customerInfo: freshInfo,
            },
            ...s.purchaseLogs,
          ],
        }));
      } catch (e: any) {
        const cancelled = !!e?.userCancelled;
        console.log(
          `[RC Debug #${id}] purchase THREW — userCancelled=${cancelled}`,
          e,
        );

        setState((s) => ({
          ...s,
          purchasingPackageId: null,
          purchaseLogs: [
            {
              id,
              at: Date.now(),
              packageIdentifier: pkg.identifier,
              productId: pkg.product.identifier,
              status: cancelled ? "cancelled" : "failed",
              message: cancelled
                ? "User cancelled the purchase sheet."
                : `Error: ${e?.message || String(e)}` +
                  (e?.code !== undefined ? ` (code=${e.code})` : ""),
            },
            ...s.purchaseLogs,
          ],
        }));
      }
    },
    [profile],
  );

  const tryRestore = useCallback(async () => {
    const id = Date.now();
    console.log(`[RC Debug #${id}] restorePurchases START`);
    setState((s) => ({
      ...s,
      purchasingPackageId: "__restore__",
      purchaseLogs: [
        {
          id,
          at: Date.now(),
          packageIdentifier: "restore",
          productId: "restore",
          status: "started",
          message: "Calling Purchases.restorePurchases()…",
        },
        ...s.purchaseLogs,
      ],
    }));

    try {
      const customerInfo = await restorePurchases();
      await syncSubscription();
      console.log(
        `[RC Debug #${id}] restorePurchases customerInfo =`,
        JSON.stringify(customerInfo, null, 2),
      );

      let freshInfo: CustomerInfo | null = null;
      try {
        freshInfo = await getCustomerInfo();
      } catch (e) {
        console.warn(`[RC Debug #${id}] post-restore getCustomerInfo failed`, e);
      }

      setState((s) => ({
        ...s,
        purchasingPackageId: null,
        customerInfo: freshInfo ?? s.customerInfo,
        lastFetchedAt: freshInfo ? Date.now() : s.lastFetchedAt,
        purchaseLogs: [
          {
            id,
            at: Date.now(),
            packageIdentifier: "restore",
            productId: "restore",
            status: "success",
            message: `Restore complete. Active entitlements: ${Object.keys(
              customerInfo?.entitlements?.active ?? {},
            ).join(", ") || "(none)"}`,
            customerInfo: freshInfo,
          },
          ...s.purchaseLogs,
        ],
      }));
    } catch (e: any) {
      console.log(`[RC Debug #${id}] restorePurchases THREW`, e);
      setState((s) => ({
        ...s,
        purchasingPackageId: null,
        purchaseLogs: [
          {
            id,
            at: Date.now(),
            packageIdentifier: "restore",
            productId: "restore",
            status: "failed",
            message: `Error: ${e?.message || String(e)}`,
          },
          ...s.purchaseLogs,
        ],
      }));
    }
  }, []);

  // Run once on mount so the screen shows something useful right away.
  useEffect(() => {
    runDiagnostic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (value: string) => {
    Share.share({ message: value }).catch(() => {
      /* user dismissed */
    });
  };

  // ── Offerings render helpers ──────────────────────────────────────────────

  const renderPackage = (pkg: PurchasesPackage, isFromCurrent: boolean) => {
    const product = pkg.product;
    return (
      <View
        key={`${pkg.identifier}-${pkg.packageType}`}
        style={[
          styles.entitlement,
          { borderColor: border, backgroundColor: isFromCurrent ? background : card },
        ]}
      >
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>identifier: </Text>
          {pkg.identifier}
        </Text>
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>packageType: </Text>
          {pkg.packageType}
        </Text>
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>productId: </Text>
          {product.identifier}
        </Text>
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>title: </Text>
          {product.title}
        </Text>
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>description: </Text>
          {product.description || "(none)"}
        </Text>
        <Text style={[styles.kv, { color: text }]}>
          <Text style={{ color: muted }}>price: </Text>
          {product.priceString} {product.currencyCode}
        </Text>
        {product.subscriptionPeriod ? (
          <Text style={[styles.kv, { color: text }]}>
            <Text style={{ color: muted }}>period: </Text>
            {product.subscriptionPeriod}
          </Text>
        ) : null}
        {product.introPrice ? (
          <>
            <Text style={[styles.kv, { color: success }]}>
              Intro price active
            </Text>
            <Text style={[styles.kv, { color: text }]}>
              <Text style={{ color: muted }}>introPrice: </Text>
              {product.introPrice.priceString} for {product.introPrice.cycles} cycle(s)
            </Text>
            <Text style={[styles.kv, { color: text }]}>
              <Text style={{ color: muted }}>introPeriod: </Text>
              {product.introPrice.periodNumberOfUnits} {product.introPrice.periodUnit}
            </Text>
          </>
        ) : null}
      </View>
    );
  };

  const renderOffering = (
    offering: PurchasesOffering,
    isCurrent: boolean,
  ) => {
    const packages = offering.availablePackages ?? [];
    return (
      <View key={offering.identifier} style={{ marginBottom: 12 }}>
        <View
          style={[
            styles.offeringHeader,
            {
              backgroundColor: isCurrent ? primary + "20" : border + "55",
              borderColor: isCurrent ? primary : border,
            },
          ]}
        >
          <Text
            style={[
              styles.offeringTitle,
              { color: isCurrent ? primary : text },
            ]}
          >
            {offering.identifier}
            {isCurrent ? "  •  CURRENT" : ""}
          </Text>
          <Text style={[styles.offeringMeta, { color: muted }]}>
            {packages.length} package{packages.length === 1 ? "" : "s"}
            {" · "}serverDescription: {offering.serverDescription || "(none)"}
          </Text>
        </View>

        {packages.length === 0 ? (
          <Text style={[styles.kv, { color: muted, marginTop: 8 }]}>
            (no available packages in this offering)
          </Text>
        ) : (
          packages.map((p) => renderPackage(p, isCurrent))
        )}
      </View>
    );
  };

  const renderStatusRow = (
    label: string,
    ok: boolean,
    detail?: string,
  ) => (
    <View style={[styles.statusRow, { borderColor: border }]}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: ok ? success : destructive },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={[styles.statusLabel, { color: text }]}>{label}</Text>
        {detail ? (
          <Text style={[styles.statusDetail, { color: muted }]}>
            {detail}
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={24} color={text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
            RevenueCat Debug
          </Text>
        </View>
        <Pressable onPress={runDiagnostic} hitSlop={12} disabled={state.loading}>
          <RefreshCw
            size={20}
            color={state.fetching ? muted : primary}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick context */}
        <View style={[styles.introCard, { backgroundColor: card, borderColor: border }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Bug size={18} color={primary} />
            <Text style={[styles.cardTitle, { color: text }]}>
              SDK health check
            </Text>
          </View>
          <Text style={[styles.cardBody, { color: muted }]}>
            This page talks directly to the RevenueCat REST API via
            <Text style={{ fontWeight: "700", color: text }}> Purchases.getCustomerInfo()</Text>{" "}
            and renders the response so you can confirm the SDK is configured
            and the backend recognises this user.
          </Text>
        </View>

        {/* Status checklist */}
        <View style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: muted }]}>
            ENVIRONMENT
          </Text>
          {renderStatusRow(
            "EXPO_PUBLIC_REVENUECAT_KEY",
            state.apiKeyPresent,
            state.apiKeyPresent
              ? maskKey(RC_KEY)
              : "Missing — set it in .env and rebuild",
          )}
          {renderStatusRow(
            "Native RNPurchases module",
            state.nativeModuleAvailable,
            state.nativeModuleAvailable
              ? "Compiled in (dev client / production build)"
              : "Not found — likely running in Expo Go",
          )}
          {renderStatusRow(
            "Purchases.configure() ran",
            state.configured,
            state.configured
              ? "SDK initialised for current user"
              : "Has not completed successfully yet",
          )}
          {renderStatusRow(
            "Customer info received",
            !!state.customerInfo,
            state.customerInfo
              ? `App user ID: ${state.customerInfo.originalAppUserId}`
              : "Awaiting fetch…",
          )}
        </View>

        {/* User context */}
        <View style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: muted }]}>USER</Text>
          <Text style={[styles.kv, { color: text }]}>
            <Text style={{ color: muted }}>Profile ID: </Text>
            {profile?.user?.id?.toString() ||
              profile?.id?.toString() ||
              "(not loaded)"}
          </Text>
          <Text style={[styles.kv, { color: text }]}>
            <Text style={{ color: muted }}>Username: </Text>
            {profile?.username || "(n/a)"}
          </Text>
        </View>

        {/* Error banner */}
        {state.error ? (
          <View
            style={[
              styles.errorBox,
              { backgroundColor: destructive + "15", borderColor: destructive },
            ]}
          >
            <Text style={[styles.errorTitle, { color: destructive }]}>
              Diagnostic error
            </Text>
            <Text style={[styles.errorBody, { color: text }]}>
              {state.error}
            </Text>
            <Pressable
              onPress={runDiagnostic}
              style={[styles.retryBtn, { backgroundColor: destructive }]}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Customer info payload */}
        <View style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: muted, marginBottom: 0 }]}>
              CUSTOMER INFO
            </Text>
            {state.customerInfo ? (
              <Pressable
                onPress={() =>
                  handleCopy(JSON.stringify(state.customerInfo, null, 2))
                }
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Copy size={14} color={primary} />
                <Text style={{ color: primary, fontSize: 12, fontWeight: "600" }}>
                  Share
                </Text>
              </Pressable>
            ) : null}
          </View>

          {state.loading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={primary} />
              <Text style={{ color: muted, marginTop: 8, fontSize: 13 }}>
                Fetching from RevenueCat…
              </Text>
            </View>
          ) : state.customerInfo ? (
            <>
              <Text style={[styles.kv, { color: text }]}>
                <Text style={{ color: muted }}>originalAppUserId: </Text>
                {state.customerInfo.originalAppUserId}
              </Text>
              <Text style={[styles.kv, { color: text }]}>
                <Text style={{ color: muted }}>firstSeen: </Text>
                {state.customerInfo.firstSeen}
              </Text>
              <Text style={[styles.kv, { color: text }]}>
                <Text style={{ color: muted }}>managementURL: </Text>
                {state.customerInfo.managementURL || "(none)"}
              </Text>

              <Text style={[styles.subTitle, { color: muted }]}>
                ACTIVE ENTITLEMENTS
              </Text>
              {Object.keys(state.customerInfo.entitlements.active).length === 0 ? (
                <Text style={[styles.kv, { color: muted }]}>(none)</Text>
              ) : (
                Object.values(state.customerInfo.entitlements.active).map((e) => (
                  <View
                    key={e.identifier}
                    style={[styles.entitlement, { borderColor: border }]}
                  >
                    <Text style={[styles.kv, { color: text }]}>
                      <Text style={{ color: muted }}>id: </Text>
                      {e.identifier}
                    </Text>
                    <Text style={[styles.kv, { color: text }]}>
                      <Text style={{ color: muted }}>product: </Text>
                      {e.productIdentifier}
                    </Text>
                    <Text style={[styles.kv, { color: text }]}>
                      <Text style={{ color: muted }}>expires: </Text>
                      {e.expirationDate || "(never)"}
                    </Text>
                    {e.willRenew ? (
                      <Text style={[styles.kv, { color: success }]}>
                        will renew
                      </Text>
                    ) : null}
                  </View>
                ))
              )}

              <Text style={[styles.subTitle, { color: muted }]}>
                ACTIVE SUBSCRIPTIONS
              </Text>
              {Object.keys(state.customerInfo.activeSubscriptions).length === 0 ? (
                <Text style={[styles.kv, { color: muted }]}>(none)</Text>
              ) : (
                state.customerInfo.activeSubscriptions.map((id) => (
                  <Text key={id} style={[styles.kv, { color: text }]}>
                    • {id}
                  </Text>
                ))
              )}

              <Text style={[styles.subTitle, { color: muted }]}>
                NON-SUBSCRIPTION PURCHASES
              </Text>
              {state.customerInfo.nonSubscriptionTransactions.length === 0 ? (
                <Text style={[styles.kv, { color: muted }]}>(none)</Text>
              ) : (
                state.customerInfo.nonSubscriptionTransactions.map((t) => (
                  <Text key={t.transactionIdentifier} style={[styles.kv, { color: text }]}>
                    • {t.productIdentifier} ({t.transactionIdentifier})
                  </Text>
                ))
              )}

              {state.lastFetchedAt ? (
                <Text style={[styles.footer, { color: muted }]}>
                  Last fetched {new Date(state.lastFetchedAt).toLocaleTimeString()}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.kv, { color: muted }]}>
              No data yet — tap the refresh icon to retry.
            </Text>
          )}
        </View>

        {/* Offerings */}
        <View style={[styles.section, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: muted, marginBottom: 0 }]}>
              OFFERINGS
            </Text>
            {state.offerings ? (
              <Pressable
                onPress={() =>
                  handleCopy(JSON.stringify(state.offerings, null, 2))
                }
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Copy size={14} color={primary} />
                <Text style={{ color: primary, fontSize: 12, fontWeight: "600" }}>
                  Share
                </Text>
              </Pressable>
            ) : null}
          </View>

          {state.offeringsError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: destructive + "15",
                  borderColor: destructive,
                  marginBottom: 0,
                },
              ]}
            >
              <Text style={[styles.errorTitle, { color: destructive }]}>
                getOfferings() error
              </Text>
              <Text style={[styles.errorBody, { color: text }]}>
                {state.offeringsError}
              </Text>
            </View>
          ) : state.offeringsLoading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={primary} />
              <Text style={{ color: muted, marginTop: 8, fontSize: 13 }}>
                Fetching offerings from RevenueCat…
              </Text>
            </View>
          ) : state.offerings ? (
            <>
              {/* Top-level summary */}
              <Text style={[styles.kv, { color: text }]}>
                <Text style={{ color: muted }}>all keys: </Text>
                {Object.keys(state.offerings.all).join(", ") || "(none)"}
              </Text>
              <Text style={[styles.kv, { color: text }]}>
                <Text style={{ color: muted }}>current offering: </Text>
                {state.offerings.current?.identifier || "(none configured)"}
              </Text>

              {/* Current offering, expanded */}
              {state.offerings.current ? (
                renderOffering(state.offerings.current, true)
              ) : null}

              {/* Other configured offerings (non-current) */}
              {Object.entries(state.offerings.all)
                .filter(([id]) => id !== state.offerings!.current?.identifier)
                .map(([id, offering]) =>
                  renderOffering(offering, false),
                )}

              <Text style={[styles.subTitle, { color: muted }]}>RAW JSON</Text>
              <View
                style={[
                  styles.codeBlock,
                  { backgroundColor: background, borderColor: border },
                ]}
              >
                <Text
                  style={[styles.code, { color: text }]}
                  selectable
                >
                  {JSON.stringify(state.offerings, null, 2)}
                </Text>
              </View>

              {state.lastOfferingsFetchedAt ? (
                <Text style={[styles.footer, { color: muted }]}>
                  Last fetched{" "}
                  {new Date(state.lastOfferingsFetchedAt).toLocaleTimeString()}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.kv, { color: muted }]}>
              No offerings fetched yet — tap the button below.
            </Text>
          )}
        </View>

        {/* Action buttons */}
        <Pressable
          onPress={runDiagnostic}
          disabled={state.loading}
          style={[
            styles.bigButton,
            { backgroundColor: primary, opacity: state.loading ? 0.6 : 1 },
          ]}
        >
          <RefreshCw size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 8 }}>
            {state.loading ? "Fetching…" : "Re-run getCustomerInfo()"}
          </Text>
        </Pressable>

        <Pressable
          onPress={runOfferingsDiagnostic}
          disabled={state.offeringsLoading}
          style={[
            styles.bigButton,
            {
              backgroundColor: card,
              borderWidth: 1,
              borderColor: border,
              marginTop: 12,
              opacity: state.offeringsLoading ? 0.6 : 1,
            },
          ]}
        >
          <ShoppingBag size={18} color={text} />
          <Text style={{ color: text, fontWeight: "700", marginLeft: 8 }}>
            {state.offeringsLoading ? "Fetching…" : "Fetch getOfferings()"}
          </Text>
        </Pressable>

        {/* Try purchase */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: card,
              borderColor: border,
              marginTop: 16,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: muted, marginBottom: 0 }]}>
              TRY PURCHASE
            </Text>
            {state.purchaseLogs.length > 0 ? (
              <Pressable
                onPress={() =>
                  setState((s) => ({ ...s, purchaseLogs: [] }))
                }
                hitSlop={8}
              >
                <Text style={{ color: destructive, fontSize: 12, fontWeight: "700" }}>
                  Clear log
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[styles.cardBody, { color: muted, marginBottom: 12 }]}>
            Tap a package to invoke{" "}
            <Text style={{ fontWeight: "700", color: text }}>
              Purchases.purchasePackage()
            </Text>
            . The full flow is logged to the JS console with a unique id per
            attempt so you can correlate. Make sure you are signed into a
            sandbox Apple/Google account before tapping.
          </Text>

          {state.offerings?.current?.availablePackages?.length ? (
            state.offerings.current.availablePackages.map((pkg) => {
              const isPending = state.purchasingPackageId === pkg.identifier;
              const isRestore =
                state.purchasingPackageId === "__restore__";
              return (
                <Pressable
                  key={`buy-${pkg.identifier}-${pkg.packageType}`}
                  onPress={() => tryPurchase(pkg)}
                  disabled={!!state.purchasingPackageId}
                  style={[
                    styles.buyButton,
                    {
                      backgroundColor: primary,
                      opacity:
                        state.purchasingPackageId && !isPending ? 0.5 : 1,
                    },
                  ]}
                >
                  {isPending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <CreditCard size={16} color="#fff" />
                  )}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.buyTitle} numberOfLines={1}>
                      {pkg.product.title || pkg.identifier}
                    </Text>
                    <Text style={styles.buySubtitle} numberOfLines={1}>
                      {pkg.identifier} · {pkg.product.priceString}
                      {pkg.product.subscriptionPeriod
                        ? ` / ${pkg.product.subscriptionPeriod}`
                        : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <Text style={[styles.kv, { color: muted }]}>
              No packages in current offering — fetch offerings first.
            </Text>
          )}

          <Pressable
            onPress={tryRestore}
            disabled={!!state.purchasingPackageId}
            style={[
              styles.buyButton,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: border,
                marginTop: 8,
                opacity: state.purchasingPackageId ? 0.5 : 1,
              },
            ]}
          >
            {state.purchasingPackageId === "__restore__" ? (
              <ActivityIndicator color={text} size="small" />
            ) : (
              <Undo2 size={16} color={text} />
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text
                style={[styles.buyTitle, { color: text }]}
                numberOfLines={1}
              >
                Restore purchases
              </Text>
              <Text
                style={[styles.buySubtitle, { color: muted }]}
                numberOfLines={1}
              >
                Calls Purchases.restorePurchases()
              </Text>
            </View>
          </Pressable>

          {/* Purchase log history */}
          {state.purchaseLogs.length > 0 ? (
            <View style={{ marginTop: 16 }}>
              <Text style={[styles.subTitle, { color: muted, marginTop: 0 }]}>
                ATTEMPT LOG
              </Text>
              {state.purchaseLogs.map((log) => {
                const color =
                  log.status === "success"
                    ? success
                    : log.status === "failed"
                    ? destructive
                    : log.status === "cancelled"
                    ? muted
                    : primary;
                return (
                  <View
                    key={log.id}
                    style={[
                      styles.logEntry,
                      { borderColor: border },
                    ]}
                  >
                    <View style={styles.logHeader}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: color, marginTop: 0 },
                        ]}
                      />
                      <Text
                        style={[styles.logTitle, { color: text }]}
                        numberOfLines={1}
                      >
                        #{log.id} · {log.productId}
                      </Text>
                      <Text
                        style={[styles.logTime, { color: muted }]}
                      >
                        {new Date(log.at).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.logMessage, { color: muted }]}
                      selectable
                    >
                      {log.message}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            showAlert(
              "Verbose SDK logs",
              "This will print full SDK state to the console. Use Metro / Xcode to inspect.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Log",
                  onPress: async () => {
                    try {
                      // These calls are best-effort and may not exist in every SDK version.
                      const appUserID = await Purchases.getAppUserID?.();
                      console.log("[RC Debug] appUserID =", appUserID);
                      const customerInfo = await Purchases.getCustomerInfo?.();
                      console.log(
                        "[RC Debug] customerInfo =",
                        JSON.stringify(customerInfo, null, 2),
                      );
                    } catch (e) {
                      console.log("[RC Debug] verbose log failed:", e);
                    }
                  },
                },
              ],
            );
          }}
          style={[styles.bigButton, { backgroundColor: card, borderWidth: 1, borderColor: border, marginTop: 12 }]}
        >
          <Bug size={18} color={text} />
          <Text style={{ color: text, fontWeight: "700", marginLeft: 8 }}>
            Verbose console log
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  introCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  kv: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: "Courier",
  },
  entitlement: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  offeringHeader: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  offeringTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  offeringMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  code: {
    fontSize: 11,
    fontFamily: "Courier",
  },
  footer: {
    fontSize: 11,
    marginTop: 12,
    textAlign: "right",
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  bigButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  buyTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  buySubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
  },
  logEntry: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  logTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  logTime: {
    fontSize: 10,
  },
  logMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
});
