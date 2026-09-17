import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Check,
  Filter,
  MessageSquare,
  Rocket,
  X,
  Zap,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  SubscriptionTier,
  useUpgradeSubscriptionMutation,
} from "@/api/settings";
import { useProfileStore } from "@/store/profileStore";
import {
  getOfferings,
  purchasePackage,
  isNativeModuleAvailable,
  getCustomerInfo,
} from "@/api/purchases";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
} from "react-native-purchases";
import VerificationOverlay from "@/components/VerificationOverlay";
import { useAndroidBack } from "@/hooks/useAndroidBack";

type LightPlanChoice = "1m" | "3m" | "6m" | "1yr" | "lifetime";
type PlusPlanChoice = "1m" | "3m" | "6m" | "1yr" | "lifetime";

// Display labels for each plan choice. The actual price + currency come from
// RevenueCat (PurchasesPackage.product.priceString) at render time, so the UI
// never hardcodes money — see findPackageForChoice below.
const PLAN_DURATION_LABEL: Record<LightPlanChoice, string> = {
  "1m": "1 MONTH",
  "3m": "3 MONTHS",
  "6m": "6 MONTHS",
  "1yr": "1 YEAR",
  lifetime: "LIFETIME",
};

// Explicit identifiers for each plan, in priority order. The first match wins.
// `premium_plus:*` / `premium_light:*` are the canonical identifiers
// configured in RevenueCat; `$rc_*` are the legacy fallback identifiers.
const PLUS_PACKAGE_IDS: Record<PlusPlanChoice, string[]> = {
  "1m": ["premium_plus:monthly", "$rc_monthly"],
  "3m": ["premium_plus:quarterly", "$rc_three_month"],
  "6m": ["premium_plus:semiannual", "$rc_six_month"],
  "1yr": ["premium_plus:annual", "$rc_annual"],
  lifetime: ["premium_plus:lifetime"],
};

const LIGHT_PACKAGE_IDS: Record<LightPlanChoice, string[]> = {
  "1m": ["premium_light:monthly", "$rc_monthly"],
  "3m": ["premium_light:quarterly", "$rc_three_month"],
  "6m": ["premium_light:semiannual", "$rc_six_month"],
  "1yr": ["premium_light:annual", "$rc_annual"],
  lifetime: ["premium_light:lifetime"],
};

// ── productIdentifier → display label ────────────────────────────────────
//
// The RC debug screen displays `customerInfo.entitlements.active[id]
// .productIdentifier` raw. We do the same here: read the live SDK value
// and humanize it for display, instead of trusting the backend's stored
// `subscription_product_id` (which can lag the webhook or be the
// underlying App Store / Play Store SKU instead of the RC package id).
//
// Example: `premium_plus:semiannual` → { tier: "Premium Plus",
// duration: "6 MONTHS" }.

/**
 * Turn an RC productIdentifier into a human-readable tier + duration
 * label. Pure string parsing — no translation table — so any future
 * identifier RevenueCat produces is handled correctly.
 */
function formatProductIdentifier(productIdentifier: string): {
  tier: string;
  duration: string;
} {
  // RC's canonical form is `<tier>:<duration>` (e.g. `premium_plus:semiannual`).
  if (productIdentifier.includes(":")) {
    const [tierPart, durationPart] = productIdentifier.split(":", 2);
    return {
      tier: tierLabel(tierPart),
      duration: durationLabel(durationPart),
    };
  }

  // No `:` — identifier is either a legacy alias (`$rc_six_month`,
  // `chahira_plus_6m`) or the underlying store SKU (`premium_plus_6month`).
  // Pull the tier from any `premium_<x>` prefix; everything else becomes
  // the duration label.
  const tierMatch = productIdentifier.match(/premium_(plus|light)/i);
  const tier = tierMatch ? tierLabel(tierMatch[0]) : "Premium";

  return { tier, duration: durationLabel(productIdentifier) };
}

function tierLabel(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === "premium_plus") return "Premium Plus";
  if (s === "premium_light") return "Premium Light";
  // Fallback for unexpected prefixes — best-effort humanize.
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function durationLabel(raw: string): string {
  const s = raw.toLowerCase();

  // Order matters: longer/more specific keywords first.
  if (/semi\s*annual|semi_annual|six\s*month|six_month|6\s*month|6mo|\b6m\b/.test(s))
    return "6 MONTHS";
  if (/quarter|three\s*month|three_month|3\s*month|3mo|\b3m\b/.test(s))
    return "3 MONTHS";
  if (/annual|yearly|1\s*year|1yr|12\s*month|\b1y\b/.test(s)) return "1 YEAR";
  if (/monthly|month(?!.*six|.*three|.*annual)|\b1m\b/.test(s))
    return "1 MONTH";
  if (/lifetime|forever/.test(s)) return "LIFETIME";

  // Unknown — return a readable version of whatever RC gave us.
  return raw.replace(/_/g, " ").toUpperCase();
}

function FeatureRow({
  label,
  available = true,
  muted,
  primary,
  text,
}: {
  label: string;
  available?: boolean;
  muted: string;
  primary: string;
  text: string;
}) {
  return (
    <View style={styles.featureRow}>
      {available ? (
        <Check size={18} color={primary} strokeWidth={2.5} />
      ) : (
        <X size={18} color={muted} strokeWidth={2.5} />
      )}
      <Text
        style={{
          fontSize: 14,
          color: available ? text : muted,
          flex: 1,
          marginLeft: 12,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function PriceChip({
  badgeColor = "#FF6B00",
  duration,
  price,
  badge,
  selected,
  onPress,
  primary,
  border,
  card,
  text,
  muted,
}: {
  duration: string;
  price: string;
  badge?: string;
  badgeColor?: string;
  selected: boolean;
  onPress: () => void;
  primary: string;
  border: string;
  card: string;
  text: string;
  muted: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.priceChip,
        {
          borderColor: selected ? primary : border,
          backgroundColor: selected ? primary + "12" : card,
          paddingTop: badge ? 18 : 8,
        },
      ]}
    >
      {badge ? (
        <View style={[styles.chipBadge, { backgroundColor: badgeColor }]}>
          <Text
            style={{
              fontSize: 7,
              fontWeight: "800",
              color: "#fff",
              letterSpacing: 0.3,
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {badge}
          </Text>
        </View>
      ) : null}
      <Text
        style={{
          fontSize: 10,
          color: muted,
          fontWeight: "700",
          marginBottom: 2,
          alignSelf: "center",
          textAlign: "center",
        }}
      >
        {duration}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontWeight: "800",
          color: selected ? primary : text,
        }}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {price}
      </Text>
    </Pressable>
  );
}

// ─── Segmented Control

const TABS = ["Freemium", "Premium Light", "Premium Plus"];

function SegmentedControl({
  activeTab,
  onChange,
  isCurrentPlanActive,
  primaryColor,
}: {
  activeTab: string;
  onChange: (value: string) => void;
  isCurrentPlanActive: (tab: string) => boolean;
  primaryColor: string;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = TABS.indexOf(activeTab);
  const translateX = useSharedValue(0);
  const pillWidthAnim = useSharedValue(0);

  // Give the Premium tabs slightly more space than Freemium (25% more)
  const flexes = [1, 1.25, 1.25];
  const totalFlex = flexes.reduce((a, b) => a + b, 0);

  const getTabWidth = (index: number, w: number) => {
    return (flexes[index] / totalFlex) * w;
  };

  const getTabOffset = (index: number, w: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getTabWidth(i, w);
    }
    return offset;
  };

  useEffect(() => {
    if (containerWidth > 0) {
      const targetWidth = getTabWidth(activeIndex, containerWidth);
      const targetOffset = getTabOffset(activeIndex, containerWidth);

      // Snap immediately on first render, otherwise animate
      if (pillWidthAnim.value === 0) {
        translateX.value = targetOffset;
        pillWidthAnim.value = targetWidth;
      } else {
        translateX.value = withTiming(targetOffset, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        });
        pillWidthAnim.value = withTiming(targetWidth, {
          duration: 220,
          easing: Easing.out(Easing.quad),
        });
      }
    }
  }, [activeIndex, containerWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: pillWidthAnim.value,
  }));

  const containerBg = isDark ? "#2C2C2E" : "#EFEFEF";
  const pillBg = isDark ? "#3A3A3C" : "#FFFFFF";
  const activeTextColor = isDark ? "#FFFFFF" : "#1C1C1C";
  const inactiveTextColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <View
      style={[segStyles.wrapper, { backgroundColor: containerBg }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 8; // subtract padding
        setContainerWidth(w);
      }}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[segStyles.pill, { backgroundColor: pillBg }, pillStyle]}
        />
      )}
      {TABS.map((tab, index) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
          style={[
            segStyles.tab,
            containerWidth > 0 && { width: getTabWidth(index, containerWidth) },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              paddingHorizontal: 4,
            }}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                segStyles.tabText,
                {
                  color:
                    activeTab === tab ? activeTextColor : inactiveTextColor,
                  fontWeight: activeTab === tab ? "700" : "500",
                },
              ]}
            >
              {tab}
            </Text>
            {isCurrentPlanActive(tab) && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: primaryColor,
                  marginLeft: 6,
                  marginTop: 1,
                }}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 24,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

export default function SubscriptionScreen() {
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { profile, fetchProfile } = useProfileStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const initialTab =
    profile?.subscription_tier === "plus"
      ? "Premium Plus"
      : profile?.subscription_tier === "light"
        ? "Premium Light"
        : "Freemium";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [lightPlan, setLightPlan] = useState<LightPlanChoice | null>(null);
  const [plusPlan, setPlusPlan] = useState<PlusPlanChoice | null>(null);
  // Flattened list of every package across every offering. Searching across
  // all offerings (rather than just `offerings.current`) lets a product be
  // configured in any offering — "Plus quarterly", "default", etc. — and
  // still surface correctly here.
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [managementURL, setManagementURL] = useState<string | null>(null);
  // Live RevenueCat customer info. The source of truth for which product
  // the user is currently subscribed to — the same value the
  // `revenuecat-debug` screen displays under "ACTIVE SUBSCRIPTION". We
  // read from this directly instead of trusting the backend's
  // `subscription_product_id`, which can lag the webhook or store the
  // underlying App Store / Play Store SKU instead of the RC package id.
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);

  const upgradeMutation = useUpgradeSubscriptionMutation();

  const currentProductId = profile?.subscription_product_id;
  const currentTier: SubscriptionTier =
    (profile?.subscription_tier as SubscriptionTier | undefined) ?? "freemium";

  useEffect(() => {
    getOfferings().then((all) => {
      console.log("Fetched offerings:", all);
      if (!all) return;
      // Flatten every package across every offering, then dedupe by package
      // identifier so a product present in multiple offerings isn't shown
      // twice. Order is preserved (current offering first) so the first
      // match wins.
      const seen = new Set<string>();
      const flat: PurchasesPackage[] = [];
      for (const offering of all) {
        for (const pkg of offering.availablePackages) {
          const key = `${pkg.identifier}::${pkg.product.identifier}`;
          if (seen.has(key)) continue;
          seen.add(key);
          flat.push(pkg);
        }
      }
      setPackages(flat);
    });
    fetchProfile();
    if (isNativeModuleAvailable()) {
      getCustomerInfo().then((info) => {
        console.log(info);
        setCustomerInfo(info);
        setManagementURL(info?.managementURL ?? null);
      });
    }
  }, [fetchProfile]);

  const findPackage = (identifier: string): PurchasesPackage | undefined => {
    return packages.find(
      (p) => p.identifier === identifier || p.product.identifier === identifier,
    );
  };

  const findPackageForChoice = (
    tier: SubscriptionTier,
    plan: LightPlanChoice | PlusPlanChoice,
  ): PurchasesPackage | undefined => {
    if (!packages.length) return undefined;

    // Deterministic lookup: try each candidate identifier in priority order.
    // First match on either the package identifier or the underlying product
    // identifier wins. No keyword scoring — that was unreliable when RC
    // identifiers changed.
    const ids =
      tier === "light" ? LIGHT_PACKAGE_IDS[plan] : PLUS_PACKAGE_IDS[plan];

    for (const id of ids) {
      const match = packages.find(
        (p) => p.identifier === id || p.product.identifier === id,
      );
      if (match) return match;
    }

    // Last resort: legacy chahira_* identifier, in case the catalog still
    // uses the old naming from before the premium_plus:* migration.
    const legacyId = `chahira_${tier}_${plan}`;
    const legacy = packages.find(
      (p) => p.identifier === legacyId || p.product.identifier === legacyId,
    );
    return legacy;
  };

  // True if at least one RC package exists for the given (tier, plan).
  // Used to grey out chips whose product isn't configured in RevenueCat —
  // otherwise clicking them silently falls back to the insecure mock endpoint.
  const hasPackageFor = (
    tier: SubscriptionTier,
    plan: LightPlanChoice | PlusPlanChoice,
  ): boolean => findPackageForChoice(tier, plan) !== undefined;

  const handlePurchase = async (
    tier: SubscriptionTier,
    plan: LightPlanChoice | PlusPlanChoice,
    label: string,
  ) => {
    const pkg = findPackageForChoice(tier, plan);
    const rcPackageId =
      pkg?.identifier ?? pkg?.product.identifier ?? `chahira_${tier}_${plan}`;

    if (pkg && rcPackageId === currentProductId) {
      Alert.alert(
        "Already on this plan",
        `You're already subscribed to this exact plan duration.`,
      );
      return;
    }

    const redundantAddons = [];
    if (tier === "plus") {
      if (profile?.has_advanced_filters)
        redundantAddons.push("Advanced Filters");
      if (profile?.has_all_chat_rooms) redundantAddons.push("All Chat Rooms");
    } else if (tier === "light") {
      if (profile?.has_advanced_filters)
        redundantAddons.push("Advanced Filters");
    }

    const executePurchase = async () => {
      setIsPurchasing(true);

      const handleBackendUpgrade = (rcSuccess: boolean = false) => {
        if (rcSuccess) {
          // PRODUCTION MODE: RevenueCat succeeded!
          // We optimistically update the UI. The secure Webhook handles the database.
          setIsPurchasing(false);
          useProfileStore.setState((state) => ({
            profile: state.profile
              ? {
                  ...state.profile,
                  subscription_tier: tier,
                  subscription_product_id: rcPackageId,
                }
              : null,
          }));
          // Re-fetch the live customer info so the active-plan card reflects
          // the new product identifier immediately (instead of waiting for
          // the webhook to round-trip through the backend).
          if (isNativeModuleAvailable()) {
            getCustomerInfo().then((info) => {
              setCustomerInfo(info);
              setManagementURL(info?.managementURL ?? null);
            });
          }
          queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
          Alert.alert("Subscription updated", `You are now on ${label}.`);
        } else {
          // FALLBACK MODE: No RevenueCat connected. We use the insecure mock endpoint.
          // Best-effort: forward the RC package's price so the backend logs match
          // what the user saw. If unavailable, send 0 — this path is dev-only.
          const fallbackAmount = pkg?.product.price ?? 0;
          upgradeMutation.mutate(
            { tier, amount: fallbackAmount },
            {
              onSuccess: (updatedProfile) => {
                setIsPurchasing(false);
                useProfileStore.setState((state) => ({
                  profile: state.profile
                    ? {
                        ...state.profile,
                        ...updatedProfile,
                        subscription_product_id: rcPackageId,
                      }
                    : null,
                }));
                queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
                Alert.alert(
                  "Subscription updated",
                  `You are now on ${label}. (Fallback Mode)`,
                  [{ text: "OK", onPress: () => fetchProfile() }],
                );
              },
              onError: (err: any) => {
                setIsPurchasing(false);
                const message =
                  err?.response?.data?.error ||
                  err?.response?.data?.message ||
                  "We couldn’t process your upgrade. Please try again.";
                Alert.alert("Upgrade failed", message);
              },
            },
          );
        }
      };

      if (pkg) {
        const customerInfo = await purchasePackage(pkg);
        if (customerInfo) {
          handleBackendUpgrade(true);
        } else {
          // RC purchase flow returned nothing — either it failed mid-purchase
          // or was cancelled. Surface that instead of silently re-enabling
          // the button.
          setIsPurchasing(false);
          Alert.alert(
            "Purchase did not complete",
            "The store couldn't finish the purchase. Please try again.",
          );
        }
      } else {
        handleBackendUpgrade(false);
      }
    };

    if (redundantAddons.length > 0) {
      Alert.alert(
        "Heads Up!",
        `Upgrading to ${label} gives you access to ${redundantAddons.join(" and ")}! After upgrading, please remember to cancel your active add-on subscriptions in your device settings to avoid being double-billed.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue & Upgrade",
            onPress: executePurchase,
            style: "default",
          },
        ],
      );
      return;
    }

    await executePurchase();
  };

  const handleAddonPurchase = async (rcPackageId: string, label: string) => {
    const pkg = findPackage(rcPackageId);

    console.log(`handleAddonPurchase: ${rcPackageId} (${label})`);

    setIsPurchasing(true);
    if (pkg) {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        // Use whichever identifier actually came back from RC, falling back to
        // the legacy `chahira_addon_*` strings so the backend can still match.
        const resolvedId = pkg.identifier ?? rcPackageId;
        let backendTier = "";
        if (
          resolvedId.includes("addon_filters") ||
          resolvedId.includes("add_on_filters") ||
          resolvedId.includes("filters_monthly")
        )
          backendTier = "add_on_filters";
        else if (
          resolvedId.includes("addon_chatrooms") ||
          resolvedId.includes("add_on_chatrooms") ||
          resolvedId.includes("chatrooms_monthly")
        )
          backendTier = "add_on_chatrooms";
        else if (
          resolvedId.includes("addon_match") ||
          resolvedId.includes("add_on_perfect_match") ||
          resolvedId.includes("match_analysis")
        )
          backendTier = "add_on_perfect_match";

        // PRODUCTION MODE: RevenueCat succeeded.
        // We optimistically update the UI. The secure Webhook handles the database.
        setIsPurchasing(false);
        useProfileStore.setState((state) => ({
          profile: state.profile
            ? {
                ...state.profile,
                has_advanced_filters:
                  backendTier === "add_on_filters"
                    ? true
                    : state.profile.has_advanced_filters,
                has_all_chat_rooms:
                  backendTier === "add_on_chatrooms"
                    ? true
                    : state.profile.has_all_chat_rooms,
                has_match_analysis:
                  backendTier === "add_on_perfect_match"
                    ? true
                    : state.profile.has_match_analysis,
              }
            : null,
        }));
        Alert.alert(
          "Add-on activated!",
          `${label} is now active on your account.`,
        );
      } else {
        setIsPurchasing(false);
      }
    } else {
      setIsPurchasing(false);
      Alert.alert(
        "Coming Soon",
        `${label} will be available when connected to the store.`,
      );
    }
  };

  const isUpgrading = isPurchasing || upgradeMutation.isPending;

  const getActivePlanDetails = () => {
    // Mirror revenuecat-debug.tsx: read the live customerInfo and pick the
    // first active entitlement. Display its productIdentifier as-is,
    // humanised for the card. No reliance on the backend's stored
    // subscription_product_id — that can lag the webhook or be the
    // underlying store SKU instead of the RC package id, which is why
    // this card previously always said "1 YEAR".
    const activeEntitlements = Object.values(
      customerInfo?.entitlements?.active ?? {},
    );

    if (activeEntitlements.length === 0) {
      // No live entitlement. Fall back to whatever the backend tier says,
      // so we're not blank if the SDK hasn't loaded yet.
      const tierName =
        currentTier === "plus"
          ? "Premium Plus"
          : currentTier === "light"
            ? "Premium Light"
            : "Freemium";
      return { tierName, duration: "—", price: "" };
    }

    const primary = activeEntitlements[0];
    const { tier, duration } = formatProductIdentifier(
      primary.productIdentifier,
    );

    // Look up the matching package so we can show the store-localized
    // price. We resolve (tier, plan) from the identifier for lookup, but
    // fall back to no price if we can't — the label is still useful.
    let price = "";
    const activeTier: SubscriptionTier =
      primary.identifier === "premium_light" ? "light" : "plus";

    const planMaps = activeTier === "light" ? LIGHT_PACKAGE_IDS : PLUS_PACKAGE_IDS;
    for (const plan of Object.keys(planMaps) as (LightPlanChoice | PlusPlanChoice)[]) {
      const ids = planMaps[plan];
      if (ids.includes(primary.productIdentifier)) {
        const pkg = findPackageForChoice(activeTier, plan);
        price = pkg?.product.priceString ?? "";
        break;
      }
    }

    return { tierName: tier, duration, price };
  };

  /**
   * Returns the list of active entitlements from the live SDK, exactly
   * the way `revenuecat-debug.tsx` iterates
   * `Object.values(customerInfo.entitlements.active)`. The card above
   * shows just the primary one; this exposes the full list so we could
   * render additional cards if a user has multiple active entitlements.
   */
  const getActiveEntitlements = () => {
    return Object.values(customerInfo?.entitlements?.active ?? {});
  };

  const handleRestore = async () => {
    if (!isNativeModuleAvailable()) {
      Alert.alert(
        "Restore Purchases",
        "Restore is only available in a production build. Please use your device's App Store / Play Store subscriptions page.",
      );
      return;
    }
    try {
      setIsPurchasing(true);
      await Purchases.restorePurchases();
      await fetchProfile();
      // Refresh customer info so the active-plan card reflects the restored
      // product, not whatever the backend had cached before the restore.
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      setManagementURL(info?.managementURL ?? null);
      setIsPurchasing(false);
      Alert.alert("Success", "Your purchases have been restored.");
    } catch (e: any) {
      setIsPurchasing(false);
      Alert.alert(
        "Restore Failed",
        e.message || "We couldn't restore your purchases.",
      );
    }
  };

  const isProductActive = (tier: "light" | "plus", plan: string) => {
    // Walk the same identifiers the price chips use and check whether any
    // of them match the live SDK's productIdentifier for the active
    // entitlement on this tier. This is what the debug screen effectively
    // does when it shows "ACTIVE SUBSCRIPTION" — it displays the raw
    // productIdentifier, which is the source of truth.
    const entitlementId = tier === "plus" ? "premium_plus" : "premium_light";
    const ent = customerInfo?.entitlements?.active?.[entitlementId];
    if (ent) {
      const ids =
        tier === "light"
          ? LIGHT_PACKAGE_IDS[plan as LightPlanChoice]
          : PLUS_PACKAGE_IDS[plan as PlusPlanChoice];
      if (ids?.includes(ent.productIdentifier)) return true;
    }

    // Fallback for dev/Expo Go (no native module): trust the backend
    // tier and highlight 1yr so the UI still shows something attached.
    return currentTier === tier && plan === "1yr";
  };

  const isCurrentPlanActive = (tab: string) => {
    if (tab === "Freemium" && currentTier === "freemium") return true;
    if (tab === "Premium Light" && currentTier === "light") return true;
    if (tab === "Premium Plus" && currentTier === "plus") return true;
    return false;
  };

  const showFooter =
    (activeTab === "Premium Light" &&
      lightPlan !== null &&
      hasPackageFor("light", lightPlan)) ||
    (activeTab === "Premium Plus" &&
      plusPlan !== null &&
      hasPackageFor("plus", plusPlan));

  const selectedProductIsActive =
    (activeTab === "Premium Light" &&
      lightPlan &&
      isProductActive("light", lightPlan)) ||
    (activeTab === "Premium Plus" &&
      plusPlan &&
      isProductActive("plus", plusPlan));

  return (
    <VerificationOverlay>
      <SafeAreaView
        style={[styles.root, { backgroundColor: background }]}
        edges={["top"]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ChevronLeft size={24} color={text} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text
              style={[styles.headerTitle, { color: text }]}
              numberOfLines={1}
            >
              Subscription
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: showFooter ? 220 : 60 }}
        >
          {currentTier !== "freemium" && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                marginBottom: 24,
                padding: 16,
                backgroundColor: card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(150, 150, 150, 0.2)",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: primary,
                    marginBottom: 4,
                    letterSpacing: 0.5,
                  }}
                >
                  ACTIVE PLAN
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "800",
                    color: text,
                    marginBottom: 2,
                  }}
                >
                  {getActivePlanDetails().tierName}
                </Text>
                <Text style={{ fontSize: 13, color: muted }}>
                  {getActivePlanDetails().duration}
                  {getActivePlanDetails().price
                    ? ` • ${getActivePlanDetails().price}`
                    : ""}
                </Text>
              </View>
              <Pressable
                onPress={async () => {
                  if (!isNativeModuleAvailable()) {
                    Alert.alert(
                      "Manage Subscription",
                      "Subscription management is only available in a production build. Please use your device's App Store / Play Store subscriptions page.",
                    );
                    return;
                  }
                  try {
                    const url =
                      managementURL ??
                      (Platform.OS === "android"
                        ? "https://play.google.com/store/account/subscriptions"
                        : "https://apps.apple.com/account/subscriptions");
                    await Linking.openURL(url);
                  } catch (e: any) {
                    Alert.alert(
                      "Manage Subscription",
                      e?.message || "Could not open subscription management.",
                    );
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text
                  style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}
                >
                  Manage
                </Text>
              </Pressable>
            </View>
          )}

          <SegmentedControl
            activeTab={activeTab}
            onChange={setActiveTab}
            isCurrentPlanActive={isCurrentPlanActive}
            primaryColor={primary}
          />

          {activeTab === "Freemium" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                Freemium Access
              </Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>
                The basic experience.
              </Text>

              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow
                  label="Browse dating & friendship profiles"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="28 likes per day"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="1 free message/match to new profiles"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Ads displayed (Banner + Video)"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Basic filters only"
                  available={false}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="No chat room access"
                  available={false}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>
            </View>
          )}

          {activeTab === "Premium Light" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                Premium Light
              </Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>
                For serious, intentional browsing.
              </Text>

              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow
                  label="See who liked you"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="50 likes per day"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="3 free messages/match to new profiles"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Access to 3 themed chat rooms"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Advanced search filters"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: text,
                  marginBottom: 12,
                  letterSpacing: 0.5,
                }}
              >
                SELECT PLAN
              </Text>
              <View style={styles.priceRow}>
                {hasPackageFor("light", "1m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["1m"]}
                    price={
                      findPackageForChoice("light", "1m")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "1m")
                        ? "CURRENT PLAN"
                        : undefined
                    }
                    badgeColor={primary}
                    selected={lightPlan === "1m"}
                    onPress={() => setLightPlan("1m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("light", "3m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["3m"]}
                    price={
                      findPackageForChoice("light", "3m")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "3m")
                        ? "CURRENT PLAN"
                        : undefined
                    }
                    badgeColor={primary}
                    selected={lightPlan === "3m"}
                    onPress={() => setLightPlan("3m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("light", "6m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["6m"]}
                    price={
                      findPackageForChoice("light", "6m")?.product
                        .priceString ?? ""
                    }
                    badge={undefined}
                    badgeColor={primary}
                    selected={lightPlan === "6m"}
                    onPress={() => setLightPlan("6m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("light", "1yr") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["1yr"]}
                    price={
                      findPackageForChoice("light", "1yr")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "1yr")
                        ? "CURRENT PLAN"
                        : "BEST VALUE"
                    }
                    badgeColor={
                      isProductActive("light", "1yr") ? primary : "#FF6B00"
                    }
                    selected={lightPlan === "1yr"}
                    onPress={() => setLightPlan("1yr")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("light", "lifetime") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL.lifetime}
                    price={
                      findPackageForChoice("light", "lifetime")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "lifetime")
                        ? "CURRENT PLAN"
                        : undefined
                    }
                    badgeColor={primary}
                    selected={lightPlan === "lifetime"}
                    onPress={() => setLightPlan("lifetime")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
              </View>
            </View>
          )}

          {activeTab === "Premium Plus" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                Premium Plus
              </Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>
                The complete experience with total freedom.
              </Text>

              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow
                  label="Unlimited Likes & Messages"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Access to ALL Chat Rooms"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="See all received likes"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="Full Advanced Filter toolkit"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label="No Ads"
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: text,
                  marginBottom: 12,
                  letterSpacing: 0.5,
                }}
              >
                SELECT PLAN
              </Text>
              <View style={styles.priceRow}>
                {hasPackageFor("plus", "1m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["1m"]}
                    price={
                      findPackageForChoice("plus", "1m")?.product.priceString ??
                      ""
                    }
                    badge={
                      isProductActive("plus", "1m") ? "CURRENT PLAN" : undefined
                    }
                    badgeColor={primary}
                    selected={plusPlan === "1m"}
                    onPress={() => setPlusPlan("1m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("plus", "3m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["3m"]}
                    price={
                      findPackageForChoice("plus", "3m")?.product.priceString ??
                      ""
                    }
                    badge={
                      isProductActive("plus", "3m") ? "CURRENT PLAN" : undefined
                    }
                    badgeColor={primary}
                    selected={plusPlan === "3m"}
                    onPress={() => setPlusPlan("3m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("plus", "6m") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["6m"]}
                    price={
                      findPackageForChoice("plus", "6m")?.product.priceString ??
                      ""
                    }
                    badge={undefined}
                    badgeColor={primary}
                    selected={plusPlan === "6m"}
                    onPress={() => setPlusPlan("6m")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("plus", "1yr") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL["1yr"]}
                    price={
                      findPackageForChoice("plus", "1yr")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("plus", "1yr")
                        ? "CURRENT PLAN"
                        : "BEST VALUE"
                    }
                    badgeColor={
                      isProductActive("plus", "1yr") ? primary : "#FF6B00"
                    }
                    selected={plusPlan === "1yr"}
                    onPress={() => setPlusPlan("1yr")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
                {hasPackageFor("plus", "lifetime") && (
                  <PriceChip
                    duration={PLAN_DURATION_LABEL.lifetime}
                    price={
                      findPackageForChoice("plus", "lifetime")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("plus", "lifetime")
                        ? "CURRENT PLAN"
                        : undefined
                    }
                    badgeColor={primary}
                    selected={plusPlan === "lifetime"}
                    onPress={() => setPlusPlan("lifetime")}
                    primary={primary}
                    border={border}
                    card={card}
                    text={text}
                    muted={muted}
                  />
                )}
              </View>
            </View>
          )}

          <View
            style={{
              marginTop: activeTab === "Freemium" ? 8 : 40,
              paddingHorizontal: 20,
            }}
          >
            {/* Live offering dump so you can see exactly what RC is returning */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: muted,
                marginBottom: 16,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              Specialized Add-ons
            </Text>

            {/* Perfect Match */}
            <View
              style={{
                backgroundColor: "#1A3A2A",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: "#FFF" }}
                  >
                    Perfect Match Analysis
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#A0B8AA", marginTop: 2 }}
                  >
                    Deep compatibility insights.
                  </Text>
                </View>
                {profile?.has_match_analysis ? (
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.15)",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontWeight: "800",
                        fontSize: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      SUBSCRIBED
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: "rgba(255,255,255,0.1)",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{ color: "#FFF", fontWeight: "700", fontSize: 13 }}
                    >
                      $14.99
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  gap: 6,
                  marginBottom: profile?.has_perfect_match ? 0 : 16,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    alignSelf: "flex-start",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, marginRight: 6 }}>🔬</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#E0EAE4",
                      fontWeight: "500",
                    }}
                  >
                    Top 5 compatible matches
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.05)",
                    alignSelf: "flex-start",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 12, marginRight: 6 }}>📊</Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: "#E0EAE4",
                      fontWeight: "500",
                    }}
                  >
                    Compatibility percentage scores
                  </Text>
                </View>
              </View>
              {!profile?.has_match_analysis ? (
                <Pressable
                  onPress={() =>
                    handleAddonPurchase(
                      "chahira_addon_match_analysis",
                      "Perfect Match Analysis",
                    )
                  }
                  style={({ pressed }) => ({
                    backgroundColor: "#FFF",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: "#1A3A2A",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Get Add-on
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled
                  style={{
                    backgroundColor: "#FFF",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: 0.5,
                  }}
                >
                  <Text
                    style={{
                      color: "#1A3A2A",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    Subscribed
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Advanced Filters */}
            <View
              style={{
                backgroundColor: card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Icon
                    name={Filter}
                    size={20}
                    color={text}
                    style={{ marginRight: 10 }}
                  />
                  <View>
                    <Text
                      style={{ fontSize: 15, fontWeight: "700", color: text }}
                    >
                      Advanced Filters
                    </Text>
                    <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                      Including anonymous profile.
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: primary + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: primary,
                      fontWeight: "800",
                      fontSize: 10,
                      letterSpacing: 0.5,
                    }}
                  >
                    AVAILABLE TO ALL
                  </Text>
                </View>
              </View>
              <Pressable
                disabled
                style={{
                  marginTop: 16,
                  backgroundColor: background,
                  borderWidth: 1,
                  borderColor: border,
                  paddingVertical: 12,
                  borderRadius: 12,
                  alignItems: "center",
                  opacity: 0.8,
                }}
              >
                <Text
                  style={{ color: text, fontWeight: "700", fontSize: 14 }}
                >
                  Included with your account
                </Text>
              </Pressable>
            </View>

            {/* All Chat Rooms */}
            <View
              style={{
                backgroundColor: card,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Icon
                    name={MessageSquare}
                    size={20}
                    color={text}
                    style={{ marginRight: 10 }}
                  />
                  <View>
                    <Text
                      style={{ fontSize: 15, fontWeight: "700", color: text }}
                    >
                      All Chat Rooms
                    </Text>
                    <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>
                      Access all chat rooms.
                    </Text>
                  </View>
                </View>
                {activeTab === "Premium Plus" ? (
                  <View
                    style={{
                      backgroundColor: primary + "20",
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: primary,
                        fontWeight: "800",
                        fontSize: 10,
                        letterSpacing: 0.5,
                      }}
                    >
                      INCLUDED
                    </Text>
                  </View>
                ) : currentTier === "plus" || profile?.has_all_chat_rooms ? (
                  <View
                    style={{
                      backgroundColor: background,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: text,
                        fontWeight: "800",
                        fontSize: 10,
                        letterSpacing: 0.5,
                        opacity: 0.7,
                      }}
                    >
                      SUBSCRIBED
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      backgroundColor: background,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{ color: text, fontWeight: "700", fontSize: 13 }}
                    >
                      $3.99/mo
                    </Text>
                  </View>
                )}
              </View>
              {activeTab === "Premium Plus" ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  <Text
                    style={{ color: text, fontWeight: "700", fontSize: 14 }}
                  >
                    Included in {activeTab}
                  </Text>
                </Pressable>
              ) : currentTier === "plus" ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  <Text
                    style={{ color: text, fontWeight: "700", fontSize: 14 }}
                  >
                    Included in your plan
                  </Text>
                </Pressable>
              ) : profile?.has_all_chat_rooms ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: 0.8,
                  }}
                >
                  <Text
                    style={{ color: text, fontWeight: "700", fontSize: 14 }}
                  >
                    Subscribed
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() =>
                    handleAddonPurchase(
                      "chahira_addon_chatrooms_monthly",
                      "All Chat Rooms",
                    )
                  }
                  style={({ pressed }) => ({
                    marginTop: 16,
                    backgroundColor: primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{ color: "#FFF", fontWeight: "700", fontSize: 14 }}
                  >
                    Get Add-on
                  </Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Compliance Footer */}
          <View
            style={{
              alignItems: "center",
              marginTop: 16,
              paddingHorizontal: 20,
              paddingBottom: 24,
            }}
          >
            <TouchableOpacity
              onPress={handleRestore}
              style={{ paddingVertical: 12, paddingHorizontal: 24 }}
            >
              <Text style={{ color: primary, fontWeight: "700", fontSize: 14 }}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 8,
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://constela-dating.com/privacy")
                }
              >
                <Text
                  style={{
                    color: muted,
                    fontSize: 11,
                    textDecorationLine: "underline",
                  }}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={{ color: muted, fontSize: 11 }}>•</Text>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://constela-dating.com/privacy")
                }
              >
                <Text
                  style={{
                    color: muted,
                    fontSize: 11,
                    textDecorationLine: "underline",
                  }}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer for Upgrade Button */}
        {showFooter && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: background,
                borderTopColor: border,
                paddingBottom: Math.max(insets.bottom, 10),
              },
            ]}
          >
            <Button
              onPress={() => {
                if (selectedProductIsActive) return;

                if (activeTab === "Premium Light" && lightPlan) {
                  handlePurchase("light", lightPlan, "Premium Light");
                } else if (activeTab === "Premium Plus" && plusPlan) {
                  handlePurchase("plus", plusPlan, "Premium Plus");
                }
              }}
              disabled={isUpgrading || !!selectedProductIsActive}
              loading={isUpgrading}
              style={{
                borderRadius: 28,
                height: 54,
                opacity: selectedProductIsActive ? 0.6 : 1,
              }}
            >
              {selectedProductIsActive
                ? "Current Plan"
                : activeTab === "Premium Light"
                  ? currentTier === "plus"
                    ? "Downgrade to Light"
                    : currentTier === "light"
                      ? "Change Plan"
                      : "Upgrade to Light"
                  : currentTier === "plus"
                    ? "Change Plan"
                    : "Go Premium Plus"}
            </Button>
            <Text
              style={{
                textAlign: "center",
                fontSize: 11,
                color: muted,
                marginTop: 6,
                paddingHorizontal: 20,
              }}
            >
              Secure checkout. You agree to let the app auto-renew. Manage or
              cancel in your in-account settings.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </VerificationOverlay>
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
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 4,
  },
  priceChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 70,
  },
  chipBadge: {
    position: "absolute",
    top: -8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
    width: "90%",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    // paddingBottom dynamically set
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
