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
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { router, useFocusEffect } from "expo-router";
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
import { useState, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import {
  AppState,
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
} from "@/api/settings";
import { useProfileStore } from "@/store/profileStore";
import {
  getOfferings,
  purchasePackage,
  isNativeModuleAvailable,
  getCustomerInfo,
  syncSubscription,
  restorePurchases,
} from "@/api/purchases";
import Purchases, {
  type CustomerInfo,
  type PurchasesPackage,
  type UpgradeInfo,
  PRORATION_MODE,
} from "react-native-purchases";
import VerificationOverlay from "@/components/VerificationOverlay";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useTranslation } from "react-i18next";
import i18n from "@/app/i18n";
import { showAlert } from "@/components/ui/app-alert";

type LightPlanChoice = "1m" | "3m" | "6m" | "1yr" | "lifetime";
type PlusPlanChoice = "1m" | "3m" | "6m" | "1yr" | "lifetime";

// Display labels for each plan choice. The actual price + currency come from
// RevenueCat (PurchasesPackage.product.priceString) at render time, so the UI
// never hardcodes money — see findPackageForChoice below.
const PLAN_DURATION_KEY: Record<LightPlanChoice, string> = {
  "1m": "duration_1m",
  "3m": "duration_3m",
  "6m": "duration_6m",
  "1yr": "duration_1yr",
  lifetime: "duration_lifetime",
};
const PLAN_DURATION_FALLBACK: Record<LightPlanChoice, string> = {
  "1m": "1 MONTH",
  "3m": "3 MONTHS",
  "6m": "6 MONTHS",
  "1yr": "1 YEAR",
  lifetime: "LIFETIME",
};
const planDurationLabel = (plan: LightPlanChoice) =>
  i18n.t(`subscription.${PLAN_DURATION_KEY[plan]}`, PLAN_DURATION_FALLBACK[plan]);

// Explicit identifiers for each plan, in priority order. The first match wins.
// `premium_plus:*` / `premium_light:*` are the canonical identifiers
// configured in RevenueCat. Generic $rc_* package names cannot identify a tier.
const PLUS_PACKAGE_IDS: Record<PlusPlanChoice, string[]> = {
  "1m": ["premium_plus:monthly", "premium_plus"],
  "3m": ["premium_plus:quarterly"],
  "6m": ["premium_plus:semiannual"],
  "1yr": ["premium_plus:annual"],
  lifetime: ["premium_plus:lifetime"],
};

const LIGHT_PACKAGE_IDS: Record<LightPlanChoice, string[]> = {
  "1m": ["premium_light:monthly", "premium_light"],
  "3m": ["premium_light:quarterly"],
  "6m": ["premium_light:semiannual"],
  "1yr": ["premium_light:annual"],
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
    return planDurationLabel("6m");
  if (/quarter|three\s*month|three_month|3\s*month|3mo|\b3m\b/.test(s))
    return planDurationLabel("3m");
  if (/annual|yearly|1\s*year|1yr|12\s*month|\b1y\b/.test(s)) return planDurationLabel("1yr");
  if (/monthly|month(?!.*six|.*three|.*annual)|\b1m\b/.test(s))
    return planDurationLabel("1m");
  if (/lifetime|forever/.test(s)) return planDurationLabel("lifetime");

  // Unknown — if it's just the tier name, return empty string so fallback kicks in
  if (/^premium_(light|plus)$/i.test(s)) {
    return "";
  }

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
  const { isCompact } = useResponsiveLayout();
  return (
    <View style={styles.featureRow}>
      {available ? (
        <Check size={isCompact ? 16 : 18} color={primary} strokeWidth={2.5} />
      ) : (
        <X size={isCompact ? 16 : 18} color={muted} strokeWidth={2.5} />
      )}
      <Text
        style={{
          fontSize: isCompact ? 13 : 14,
          color: available ? text : muted,
          flex: 1,
          marginLeft: isCompact ? 10 : 12,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

type LimitKind = "likes" | "personal" | "community";
const LIMIT_FALLBACK: Record<LimitKind, string> = {
  likes: "likes",
  personal: "personal messages",
  community: "community messages",
};

function dailyLimitLabel(limit: number | null | undefined, kind: LimitKind) {
  if (limit === undefined) return i18n.t("subscription.limit_loading", "Loading plan limit…");
  return limit === null
    ? i18n.t(`subscription.${kind}_unlimited`, `Unlimited ${LIMIT_FALLBACK[kind]}`)
    : i18n.t(`subscription.${kind}_per_day`, { defaultValue: `{{count}} ${LIMIT_FALLBACK[kind]} per day`, count: limit });
}

function roomLimitLabel(limit: number | null | undefined) {
  if (limit === undefined) return i18n.t("subscription.rooms_loading", "Loading room access…");
  if (limit === null) return i18n.t("subscription.rooms_all", "Access to all chat rooms");
  if (limit === 0) return i18n.t("subscription.rooms_none", "No chat room access");
  return limit === 1
    ? i18n.t("subscription.rooms_one", { defaultValue: "Access to {{count}} chat room", count: limit })
    : i18n.t("subscription.rooms_many", { defaultValue: "Access to {{count}} chat rooms", count: limit });
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
  labels,
}: {
  activeTab: string;
  onChange: (value: string) => void;
  isCurrentPlanActive: (tab: string) => boolean;
  primaryColor: string;
  labels: Record<string, string>;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isCompact, isNarrow } = useResponsiveLayout();

  const [containerWidth, setContainerWidth] = useState(0);
  const activeIndex = TABS.indexOf(activeTab);
  const translateX = useSharedValue(0);
  const pillWidthAnim = useSharedValue(0);

  // Give the Premium tabs slightly more space than Freemium (20% more)
  const flexes = [1, 1.2, 1.2];
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
  const innerPad = isCompact ? 3 : 4;

  return (
    <View
      style={[
        segStyles.wrapper,
        {
          backgroundColor: containerBg,
          marginHorizontal: isNarrow ? 10 : isCompact ? 12 : 16,
          marginBottom: isCompact ? 16 : 24,
          padding: innerPad,
        },
      ]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - innerPad * 2;
        setContainerWidth(w);
      }}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            segStyles.pill,
            {
              backgroundColor: pillBg,
              top: innerPad,
              left: innerPad,
              bottom: innerPad,
            },
            pillStyle,
          ]}
        />
      )}
      {TABS.map((tab, index) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
          style={[
            segStyles.tab,
            { paddingVertical: isCompact ? 8 : 12 },
            containerWidth > 0 && { width: getTabWidth(index, containerWidth) },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              paddingHorizontal: isCompact ? 2 : 4,
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
                  fontSize: isCompact ? (isNarrow ? 12 : 13) : 14,
                },
              ]}
            >
              {labels[tab] ?? tab}
            </Text>
            {isCurrentPlanActive(tab) && (
              <View
                style={{
                  width: isCompact ? 5 : 6,
                  height: isCompact ? 5 : 6,
                  borderRadius: 3,
                  backgroundColor: primaryColor,
                  marginLeft: isCompact ? 4 : 6,
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
    position: "relative",
  },
  pill: {
    position: "absolute",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
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
  const { t } = useTranslation();
  const { isCompact, isNarrow, horizontalPadding } = useResponsiveLayout();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { profile, fetchProfile } = useProfileStore();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const tierRules = profile?.access?.tier_rules ?? {
    freemium: {
      name: "Freemium",
      daily_likes_limit: undefined,
      daily_personal_messages_limit: undefined,
      daily_community_messages_limit: undefined,
      community_room_limit: 0,
      can_see_likes: false,
      can_undo_swipes: false,
    },
    light: {
      name: "Premium Light",
      daily_likes_limit: undefined,
      daily_personal_messages_limit: undefined,
      daily_community_messages_limit: undefined,
      community_room_limit: 3,
      can_see_likes: true,
      can_undo_swipes: true,
    },
    plus: {
      name: "Premium Plus",
      daily_likes_limit: undefined,
      daily_personal_messages_limit: undefined,
      daily_community_messages_limit: undefined,
      community_room_limit: null,
      can_see_likes: true,
      can_undo_swipes: true,
    },
  };

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


  // Live active entitlements & tier. Evaluated immediately from RevenueCat
  // customerInfo (and falling back to backend profile) so that UI updates
  // on the exact same frame as purchase completion with zero delay or lag.
  const activeEntitlements = customerInfo?.entitlements?.active ?? {};
  const primaryEntitlement =
    activeEntitlements.premium_plus ?? activeEntitlements.premium_light;

  const currentTier: SubscriptionTier = activeEntitlements.premium_plus
    ? "plus"
    : activeEntitlements.premium_light
      ? "light"
      : (profile?.subscription_tier as SubscriptionTier | undefined) ?? "freemium";

  const currentProductId =
    primaryEntitlement?.productIdentifier || profile?.subscription_product_id;

  // Perfect Match Analysis is a one-time purchase: it can always be bought
  // again. These only decide whether to also offer "view last results".
  const hasMatchAnalysis = Boolean(
    profile?.access?.has_match_analysis ?? profile?.has_match_analysis
  );
  const lastAnalysisAt = profile?.access?.match_analysis_last_at ?? null;

  // 1. Initial offerings on mount
  useEffect(() => {
    getOfferings().then((all) => {
      console.log("Fetched offerings:", all);
      if (!all) return;
      const seen = new Set<string>();
      const flat: PurchasesPackage[] = [];
      for (const offering of all) {
        for (const pkg of offering.availablePackages) {
          const key = `${offering.identifier}::${pkg.identifier}::${pkg.product.identifier}`;
          if (seen.has(key)) continue;
          seen.add(key);
          flat.push(pkg);
        }
      }
      setPackages(flat);
    });
  }, []);

  const refreshCustomerState = useCallback(async () => {
    fetchProfile();
    if (isNativeModuleAvailable()) {
      try {
        const info = await getCustomerInfo();
        if (info) {
          setCustomerInfo(info);
          setManagementURL(info?.managementURL ?? null);
        }
      } catch (e) {
        console.warn("[Subscription] Failed to refresh customer state:", e);
      }
    }
  }, [fetchProfile]);

  // 2. Refresh customer state on screen focus
  useFocusEffect(
    useCallback(() => {
      void refreshCustomerState();
    }, [refreshCustomerState])
  );

  // 3. Auto-detect when user returns to app from Google Play / Play Store Subscriptions!
  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (nextState === "active") {
        void refreshCustomerState();
      }
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [refreshCustomerState]);

  // 4. Live RevenueCat listener for active customer updates
  useEffect(() => {
    if (!isNativeModuleAvailable()) return;
    const listener = (info: CustomerInfo) => {
      setCustomerInfo(info);
      setManagementURL(info?.managementURL ?? null);
    };
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, []);

  const findPackage = (identifier: string): PurchasesPackage | undefined => {
    return packages.find(
      (p) => p.identifier === identifier || p.product.identifier === identifier,
    );
  };

  const matchAnalysisPackage = findPackage("perfect_match");

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
    const offeringId = tier === "light" ? "premium_light" : "premium_plus";

    for (const id of ids) {
      const tierMatch = packages.find(
        (p) =>
          p.offeringIdentifier === offeringId &&
          (p.identifier === id || p.product.identifier === id),
      );
      if (tierMatch) return tierMatch;

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
  ) => {
    const pkg = findPackageForChoice(tier, plan);
    const rcPackageId =
      pkg?.product.identifier ?? "";

    if (pkg && rcPackageId === currentProductId) {
      showAlert(
        t("subscription.already_title", "Already on this plan"),
        t("subscription.already_desc", "You're already subscribed to this exact plan duration."),
      );
      return;
    }

    const executePurchase = async () => {
      if (isPurchasing) return;
      if (!pkg) {
        toast.error(t("subscription.not_configured", "This plan is not configured in the store yet."));
        return;
      }
      setIsPurchasing(true);
      let purchased = false;
      try {
        let upgradeInfo: UpgradeInfo | null = null;
        if (
          Platform.OS === "android" &&
          currentProductId &&
          currentProductId !== rcPackageId &&
          (currentTier === "light" || currentTier === "plus")
        ) {
          upgradeInfo = {
            oldSKU: currentProductId,
            prorationMode: PRORATION_MODE.IMMEDIATE_WITH_TIME_PRORATION,
          };
        }

        const info = await purchasePackage(pkg, upgradeInfo);
        if (!info) {
          setIsPurchasing(false);
          return; // User cancelled; no error or artificial access grant.
        }
        purchased = true;
        // 1. Immediately dismiss button spinner so UI has zero lag
        setIsPurchasing(false);
        // 2. Immediate tactile celebration!
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // 3. Update customer info & management URL immediately
        setCustomerInfo(info);
        setManagementURL(info.managementURL ?? null);
        // 4. Sleek in-app celebration toast
        const tierTitle = tier === "plus" ? tierRules.plus.name : tierRules.light.name;
        toast.success(t("subscription.welcome_title", { defaultValue: "Welcome to {{name}}! 🎉", name: tierTitle }), {
          description: t("subscription.welcome_desc", "Your verified subscription is now active."),
        });
        // 5. Background sync with backend & invalidate queries
        void syncSubscription()
          .then((verified) => {
            void queryClient.invalidateQueries();
            if (verified.subscription_tier !== tier && verified.subscription_tier !== "plus") {
              toast.info(t("subscription.verification_pending", "Store verification in progress. Access will update shortly."));
            }
          })
          .catch(() => {
            void queryClient.invalidateQueries();
          });
      } catch (error: any) {
        setIsPurchasing(false);
        const isCancel = error?.userCancelled || error?.code === "1";
        if (purchased) {
          toast.info(t("subscription.purchase_recorded", "Purchase recorded. Use Restore Purchases if benefits delay."));
        } else if (!isCancel) {
          toast.error(error?.message || t("subscription.purchase_failed", "The store could not complete your purchase."));
        }
      }
    };

    await executePurchase();
  };

  const handleAddonPurchase = async (label: string) => {
    if (isPurchasing) return;
    const pkg = matchAnalysisPackage;
    if (!pkg) {
      toast.error(t("subscription.addon_not_configured", { defaultValue: "{{name}} is not configured in the store yet.", name: label }));
      return;
    }
    setIsPurchasing(true);
    let purchased = false;
    try {
      const info = await purchasePackage(pkg);
      if (!info) {
        setIsPurchasing(false);
        return;
      }
      purchased = true;
      setIsPurchasing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCustomerInfo(info);
      toast.success(t("subscription.addon_unlocked_title", "Your Perfect Match Analysis is ready! 🔬"), {
        description: t("subscription.addon_unlocked_desc", "Here are your top 5 compatible profiles right now."),
      });
      // The server records the purchase and computes this top 5 now; then show it.
      try {
        await syncSubscription();
      } catch {
        // The webhook will still record it; the results screen retries on open.
      }
      await fetchProfile();
      await queryClient.invalidateQueries({ queryKey: ["matchAnalysis"] });
      router.push("/match-analysis" as any);
    } catch (error: any) {
      setIsPurchasing(false);
      const isCancel = error?.userCancelled || error?.code === "1";
      if (!isCancel) {
        toast.error(error?.message || t("subscription.addon_failed", "Could not complete purchase. Please try again."));
      }
    }
  };

  const isUpgrading = isPurchasing;

  const getActivePlanDetails = () => {
    // Mirror revenuecat-debug.tsx: read the live customerInfo and pick the
    // first active entitlement. Display its productIdentifier as-is,
    // humanised for the card. No reliance on the backend's stored
    // subscription_product_id — that can lag the webhook or be the
    // underlying store SKU instead of the RC package id, which is why
    // this card previously always said "1 YEAR".
    const activeEntitlements = customerInfo?.entitlements?.active ?? {};
    const primary = activeEntitlements.premium_plus ?? activeEntitlements.premium_light;
    const targetIdentifier = primary?.productIdentifier || profile?.subscription_product_id || "";

    const tierName =
      currentTier === "plus"
        ? tierRules.plus.name
        : currentTier === "light"
          ? tierRules.light.name
          : tierRules.freemium.name;

    if (currentTier === "freemium") {
      return { tierName, duration: "", price: "", expiresText: "" };
    }

    let duration = "";
    if (targetIdentifier) {
      duration = formatProductIdentifier(targetIdentifier).duration;
    }

    // If duration is empty or just generic, match against known keywords
    if (!duration || /^premium/i.test(duration)) {
      const matchTarget = `${targetIdentifier} ${profile?.subscription_product_id || ""}`.toLowerCase();
      if (/semi|6m|six/i.test(matchTarget)) duration = planDurationLabel("6m");
      else if (/annual|year|12m|1y/i.test(matchTarget)) duration = planDurationLabel("1yr");
      else if (/quarter|3m|three/i.test(matchTarget)) duration = planDurationLabel("3m");
      else if (/month|1m/i.test(matchTarget)) duration = planDurationLabel("1m");
      else if (/lifetime/i.test(matchTarget)) duration = planDurationLabel("lifetime");
      else duration = planDurationLabel("1m"); // Fallback for bare identifiers
    }

    // Expiration or renewal text
    let expiresText = "";
    const rawExp = primary?.expirationDate || profile?.subscription_expires;
    if (rawExp) {
      try {
        const expDate = new Date(rawExp);
        const willRenew = primary ? primary.willRenew : true;
        if (willRenew) {
          expiresText = t("subscription.renews", { defaultValue: "Renews: {{date}}", date: expDate.toLocaleDateString(i18n.language) });
        } else {
          expiresText = t("subscription.expires_auto_off", { defaultValue: "Expires: {{date}} (Auto-renew off)", date: expDate.toLocaleDateString(i18n.language) });
        }
      } catch (e) {}
    }

    // Look up the matching package so we can show the store-localized price
    let price = "";
    const activeTier: SubscriptionTier = currentTier;
    const planMaps = activeTier === "light" ? LIGHT_PACKAGE_IDS : PLUS_PACKAGE_IDS;
    for (const plan of Object.keys(planMaps) as (LightPlanChoice | PlusPlanChoice)[]) {
      const ids = planMaps[plan];
      if (ids.some((id) => targetIdentifier.includes(id) || (profile?.subscription_product_id && profile.subscription_product_id.includes(id)))) {
        const pkg = findPackageForChoice(activeTier, plan);
        price = pkg?.product.priceString ?? "";
        break;
      }
    }

    return { tierName, duration, price, expiresText };
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
      toast.info(t("subscription.restore_unavailable", "Restore is available in the store production build."));
      return;
    }
    try {
      setIsPurchasing(true);
      const info = await restorePurchases();
      const verified = await syncSubscription();
      await queryClient.invalidateQueries();
      setCustomerInfo(info);
      setManagementURL(info?.managementURL ?? null);
      setIsPurchasing(false);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (verified.subscription_tier !== "freemium" || verified.has_match_analysis) {
        toast.success(t("subscription.restored_title", "Purchases Restored! ✅"), {
          description: t("subscription.restored_desc", "Your active subscriptions have been restored."),
        });
      } else {
        toast.info(t("subscription.restore_none", "No active purchases found for this account."));
      }
    } catch (e: any) {
      setIsPurchasing(false);
      toast.error(e.message || t("subscription.restore_failed", "We couldn't restore your purchases."));
    }
  };

  const isProductActive = (tier: "light" | "plus", plan: string) => {
    const entitlementId = tier === "plus" ? "premium_plus" : "premium_light";
    const ent = customerInfo?.entitlements?.active?.[entitlementId];
    
    const ids =
      tier === "light"
        ? LIGHT_PACKAGE_IDS[plan as LightPlanChoice]
        : PLUS_PACKAGE_IDS[plan as PlusPlanChoice];

    // Check RevenueCat active entitlement productIdentifier first (instant live state)
    if (ent && ids?.some((id) => ent.productIdentifier === id || ent.productIdentifier?.includes(id))) {
      return true;
    }

    // Check backend profile's subscription_product_id as fallback
    if (currentTier === tier && profile?.subscription_product_id && ids?.some((id) => profile.subscription_product_id === id || profile.subscription_product_id?.includes(id))) {
      return true;
    }

    return false;
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
              {t("subscription.title", "Subscription")}
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: showFooter
              ? Math.max(insets.bottom + 110, 240)
              : Math.max(insets.bottom + 48, 120),
          }}
        >
          {currentTier !== "freemium" && (
            <View
              style={{
                marginHorizontal: horizontalPadding,
                marginTop: 12,
                marginBottom: isCompact ? 16 : 24,
                padding: isCompact ? 12 : 16,
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
                  {t("subscription.active_plan", "ACTIVE PLAN")}
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
                  {getActivePlanDetails().duration
                    ? ` • ${getActivePlanDetails().duration}`
                    : ""}
                </Text>
                {getActivePlanDetails().expiresText ? (
                  <Text style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                    {getActivePlanDetails().expiresText}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={async () => {
                  if (!isNativeModuleAvailable()) {
                    showAlert(
                      t("subscription.manage_title", "Manage Subscription"),
                      t("subscription.manage_dev_only", "Subscription management is only available in a production build. Please use your device's App Store / Play Store subscriptions page."),
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
                    showAlert(
                      t("subscription.manage_title", "Manage Subscription"),
                      e?.message || t("subscription.manage_open_failed", "Could not open subscription management."),
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
                  {t("subscription.manage", "Manage")}
                </Text>
              </Pressable>
            </View>
          )}

          <SegmentedControl
            activeTab={activeTab}
            onChange={setActiveTab}
            isCurrentPlanActive={isCurrentPlanActive}
            primaryColor={primary}
            labels={{
              Freemium: tierRules.freemium.name,
              "Premium Light": tierRules.light.name,
              "Premium Plus": tierRules.plus.name,
            }}
          />

          {activeTab === "Freemium" && (
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <Text
                style={{
                  fontSize: isCompact ? 20 : 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                {tierRules.freemium.name}
              </Text>
              <Text
                style={{
                  fontSize: isCompact ? 13 : 14,
                  color: muted,
                  marginBottom: isCompact ? 16 : 24,
                }}
              >
                {t("subscription.freemium_tagline", "The basic experience.")}
              </Text>

              <View
                style={{
                  gap: isCompact ? 9 : 12,
                  marginBottom: isCompact ? 20 : 32,
                }}
              >
                <FeatureRow
                  label={t("subscription.feature_browse", "Browse dating & friendship profiles")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.freemium.daily_likes_limit, "likes")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={t("subscription.feature_see_likes", "See who liked you")}
                  available={tierRules.freemium.can_see_likes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={t("subscription.feature_rewind", "Rewind swipes")}
                  available={tierRules.freemium.can_undo_swipes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.freemium.daily_personal_messages_limit, "personal")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.freemium.daily_community_messages_limit, "community")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={roomLimitLabel(tierRules.freemium.community_room_limit)}
                  available={tierRules.freemium.community_room_limit === null || (tierRules.freemium.community_room_limit ?? 0) > 0}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>
            </View>
          )}

          {activeTab === "Premium Light" && (
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <Text
                style={{
                  fontSize: isCompact ? 20 : 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                {tierRules.light.name}
              </Text>
              <Text
                style={{
                  fontSize: isCompact ? 13 : 14,
                  color: muted,
                  marginBottom: isCompact ? 16 : 24,
                }}
              >
                {t("subscription.light_tagline", "For serious, intentional browsing.")}
              </Text>

              <View
                style={{
                  gap: isCompact ? 9 : 12,
                  marginBottom: isCompact ? 20 : 32,
                }}
              >
                <FeatureRow
                  label={t("subscription.feature_see_likes", "See who liked you")}
                  available={tierRules.light.can_see_likes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={t("subscription.feature_rewind", "Rewind swipes")}
                  available={tierRules.light.can_undo_swipes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.light.daily_likes_limit, "likes")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.light.daily_personal_messages_limit, "personal")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.light.daily_community_messages_limit, "community")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={roomLimitLabel(tierRules.light.community_room_limit)}
                  available={tierRules.light.community_room_limit === null || (tierRules.light.community_room_limit ?? 0) > 0}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>

              <Text
                style={{
                  fontSize: isCompact ? 12 : 13,
                  fontWeight: "700",
                  color: text,
                  marginBottom: isCompact ? 10 : 12,
                  letterSpacing: 0.5,
                }}
              >
                {t("subscription.select_plan", "SELECT PLAN")}
              </Text>
              <View style={styles.priceRow}>
                {hasPackageFor("light", "1m") && (
                  <PriceChip
                    duration={planDurationLabel("1m")}
                    price={
                      findPackageForChoice("light", "1m")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "1m")
                        ? t("subscription.badge_current", "CURRENT PLAN")
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
                    duration={planDurationLabel("3m")}
                    price={
                      findPackageForChoice("light", "3m")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "3m")
                        ? t("subscription.badge_current", "CURRENT PLAN")
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
                    duration={planDurationLabel("6m")}
                    price={
                      findPackageForChoice("light", "6m")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "6m")
                        ? t("subscription.badge_current", "CURRENT PLAN")
                        : undefined
                    }
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
                    duration={planDurationLabel("1yr")}
                    price={
                      findPackageForChoice("light", "1yr")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "1yr")
                        ? t("subscription.badge_current", "CURRENT PLAN")
                        : t("subscription.badge_best_value", "BEST VALUE")
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
                    duration={planDurationLabel("lifetime")}
                    price={
                      findPackageForChoice("light", "lifetime")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("light", "lifetime")
                        ? t("subscription.badge_current", "CURRENT PLAN")
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
            <View style={{ paddingHorizontal: horizontalPadding }}>
              <Text
                style={{
                  fontSize: isCompact ? 20 : 22,
                  fontWeight: "800",
                  color: text,
                  marginBottom: 4,
                }}
              >
                {tierRules.plus.name}
              </Text>
              <Text
                style={{
                  fontSize: isCompact ? 13 : 14,
                  color: muted,
                  marginBottom: isCompact ? 16 : 24,
                }}
              >
                {t("subscription.plus_tagline", "The complete experience with total freedom.")}
              </Text>

              <View
                style={{
                  gap: isCompact ? 9 : 12,
                  marginBottom: isCompact ? 20 : 32,
                }}
              >
                <FeatureRow
                  label={dailyLimitLabel(tierRules.plus.daily_likes_limit, "likes")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.plus.daily_personal_messages_limit, "personal")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={dailyLimitLabel(tierRules.plus.daily_community_messages_limit, "community")}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={roomLimitLabel(tierRules.plus.community_room_limit)}
                  available={tierRules.plus.community_room_limit === null || (tierRules.plus.community_room_limit ?? 0) > 0}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={t("subscription.feature_see_likes", "See who liked you")}
                  available={tierRules.plus.can_see_likes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
                <FeatureRow
                  label={t("subscription.feature_rewind", "Rewind swipes")}
                  available={tierRules.plus.can_undo_swipes}
                  muted={muted}
                  primary={primary}
                  text={text}
                />
              </View>

              <Text
                style={{
                  fontSize: isCompact ? 12 : 13,
                  fontWeight: "700",
                  color: text,
                  marginBottom: isCompact ? 10 : 12,
                  letterSpacing: 0.5,
                }}
              >
                {t("subscription.select_plan", "SELECT PLAN")}
              </Text>
              <View style={styles.priceRow}>
                {hasPackageFor("plus", "1m") && (
                  <PriceChip
                    duration={planDurationLabel("1m")}
                    price={
                      findPackageForChoice("plus", "1m")?.product.priceString ??
                      ""
                    }
                    badge={
                      isProductActive("plus", "1m") ? t("subscription.badge_current", "CURRENT PLAN") : undefined
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
                    duration={planDurationLabel("3m")}
                    price={
                      findPackageForChoice("plus", "3m")?.product.priceString ??
                      ""
                    }
                    badge={
                      isProductActive("plus", "3m") ? t("subscription.badge_current", "CURRENT PLAN") : undefined
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
                    duration={planDurationLabel("6m")}
                    price={
                      findPackageForChoice("plus", "6m")?.product.priceString ??
                      ""
                    }
                    badge={
                      isProductActive("plus", "6m")
                        ? t("subscription.badge_current", "CURRENT PLAN")
                        : undefined
                    }
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
                    duration={planDurationLabel("1yr")}
                    price={
                      findPackageForChoice("plus", "1yr")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("plus", "1yr")
                        ? t("subscription.badge_current", "CURRENT PLAN")
                        : t("subscription.badge_best_value", "BEST VALUE")
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
                    duration={planDurationLabel("lifetime")}
                    price={
                      findPackageForChoice("plus", "lifetime")?.product
                        .priceString ?? ""
                    }
                    badge={
                      isProductActive("plus", "lifetime")
                        ? t("subscription.badge_current", "CURRENT PLAN")
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
              marginTop: activeTab === "Freemium" ? 8 : isCompact ? 24 : 40,
              paddingHorizontal: horizontalPadding,
            }}
          >
            {/* Live offering dump so you can see exactly what RC is returning */}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: muted,
                marginBottom: isCompact ? 12 : 16,
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {t("subscription.addons_title", "Specialized Add-ons")}
            </Text>

            {/* Perfect Match */}
            <View
              style={{
                backgroundColor: "#1A3A2A",
                borderRadius: 16,
                padding: isCompact ? 12 : 16,
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
                    {t("subscription.match_analysis_title", "Perfect Match Analysis")}
                  </Text>
                  <Text
                    style={{ fontSize: 13, color: "#A0B8AA", marginTop: 2 }}
                  >
                    {t("subscription.match_analysis_desc", "Deep compatibility insights.")}
                  </Text>
                </View>
                {(
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
                      {matchAnalysisPackage?.product.priceString ?? t("subscription.unavailable", "Unavailable")}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={{
                  gap: 6,
                  marginBottom: 16,
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
                    {t("subscription.match_analysis_top5", "Top 5 compatible matches")}
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
                    {t("subscription.match_analysis_scores", "Compatibility percentage scores")}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: "#A0B8AA", marginBottom: 12 }}>
                {t("subscription.match_analysis_one_time", "One-time purchase: your top 5 at the moment you buy. Buy again anytime for an updated top 5.")}
              </Text>
              <Pressable
                  disabled={!matchAnalysisPackage || isPurchasing}
                  accessibilityState={{
                    disabled: !matchAnalysisPackage || isPurchasing,
                  }}
                  onPress={() =>
                    handleAddonPurchase(t("subscription.match_analysis_title", "Perfect Match Analysis"))
                  }
                  style={({ pressed }) => ({
                    backgroundColor: matchAnalysisPackage ? "#FFF" : "#D8DEDA",
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    opacity: !matchAnalysisPackage ? 0.6 : pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: "#1A3A2A",
                      fontWeight: "700",
                      fontSize: 14,
                    }}
                  >
                    {!matchAnalysisPackage
                      ? t("subscription.currently_unavailable", "Currently unavailable")
                      : hasMatchAnalysis
                        ? t("subscription.buy_new_analysis", "Get a new analysis")
                        : t("subscription.buy_analysis", "Get my top 5")}
                  </Text>
                </Pressable>
              {hasMatchAnalysis && (
                <Pressable
                  onPress={() => router.push("/match-analysis" as any)}
                  style={({ pressed }) => ({
                    marginTop: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 13, textDecorationLine: "underline" }}>
                    {lastAnalysisAt
                      ? t("subscription.view_last_results_date", {
                          defaultValue: "View my last results ({{date}})",
                          date: new Date(lastAnalysisAt).toLocaleDateString(i18n.language),
                        })
                      : t("subscription.view_last_results", "View my last results")}
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
              paddingHorizontal: horizontalPadding,
              paddingBottom: isCompact ? 16 : 24,
            }}
          >
            <TouchableOpacity
              onPress={handleRestore}
              style={{
                paddingVertical: isCompact ? 10 : 12,
                paddingHorizontal: 24,
              }}
            >
              <Text style={{ color: primary, fontWeight: "700", fontSize: 14 }}>
                {t("subscription.restore", "Restore Purchases")}
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
                  Linking.openURL("https://constela-dating.com/terms")
                }
              >
                <Text
                  style={{
                    color: muted,
                    fontSize: 11,
                    textDecorationLine: "underline",
                  }}
                >
                  {t("subscription.terms", "Terms of Service")}
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
                  {t("subscription.privacy", "Privacy Policy")}
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
                  handlePurchase("light", lightPlan);
                } else if (activeTab === "Premium Plus" && plusPlan) {
                  handlePurchase("plus", plusPlan);
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
                ? t("subscription.current_plan", "Current Plan")
                : activeTab === "Premium Light"
                  ? currentTier === "plus"
                    ? t("subscription.downgrade_to", { defaultValue: "Downgrade to {{name}}", name: tierRules.light.name })
                    : currentTier === "light"
                      ? t("subscription.change_plan", "Change Plan")
                      : t("subscription.upgrade_to", { defaultValue: "Upgrade to {{name}}", name: tierRules.light.name })
                  : currentTier === "plus"
                    ? t("subscription.change_plan", "Change Plan")
                    : t("subscription.go_plan", { defaultValue: "Go {{name}}", name: tierRules.plus.name })}
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
              {t("subscription.checkout_note", "Secure checkout. You agree to let the app auto-renew. Manage or cancel in your in-account settings.")}
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
