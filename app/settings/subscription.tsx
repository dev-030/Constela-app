import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import {
  ArrowLeft,
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SubscriptionTier,
  useUpgradeSubscriptionMutation,
} from "@/api/settings";
import { useProfileStore } from "@/store/profileStore";
import { getOfferings, purchasePackage } from "@/api/purchases";
import Purchases, { type PurchasesOffering, type PurchasesPackage } from "react-native-purchases";
import VerificationOverlay from "@/components/VerificationOverlay";

const PRIMARY = "#DE4177";
const GOLD = "#1A3A2A";
const GOLD_TEXT = "#FFFFFF";

type LightPlanChoice = "1m" | "3m" | "1yr" | "lifetime";
type PlusPlanChoice = "1m" | "3m" | "1yr" | "lifetime";

const LIGHT_PRICES: Record<LightPlanChoice, number> = {
  "1m": 4.99,
  "3m": 12.99,
  "1yr": 39.99,
  lifetime: 99.99,
};

const PLUS_PRICES: Record<PlusPlanChoice, number> = {
  "1m": 9.99,
  "3m": 24.99,
  "1yr": 79.99,
  lifetime: 199.99,
};

// ─── Reusable row ───────────────────────────────────────────────────────────

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
        <Check size={15} color={primary} strokeWidth={3} />
      ) : (
        <X size={15} color={muted} strokeWidth={2.5} />
      )}
      <Text style={{ fontSize: 13, color: available ? text : muted, flex: 1, marginLeft: 8 }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Price chip ─────────────────────────────────────────────────────────────

function PriceChip({
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
        <View style={[styles.chipBadge, { backgroundColor: "#FF6B00" }]}>
          <Text style={{ fontSize: 7, fontWeight: "800", color: "#fff", letterSpacing: 0.3 }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 8, color: muted, fontWeight: "700", marginBottom: 2 }}>
        {duration}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: "800", color: selected ? primary : text }} numberOfLines={1} adjustsFontSizeToFit>
        {price}
      </Text>
    </Pressable>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SubscriptionScreen() {
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { profile, fetchProfile } = useProfileStore();

  const [lightPlan, setLightPlan] = useState<LightPlanChoice>("1yr");
  const [plusPlan, setPlusPlan] = useState<PlusPlanChoice>("1yr");
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const upgradeMutation = useUpgradeSubscriptionMutation();

  const currentProductId = profile?.subscription_product_id;
  const currentTier: SubscriptionTier =
    (profile?.subscription_tier as SubscriptionTier | undefined) ?? "freemium";

  // Load RevenueCat offerings on mount
  useEffect(() => {
    getOfferings().then(setOffering);
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  // Find a package from offerings by its identifier
  const findPackage = (identifier: string): PurchasesPackage | undefined =>
    offering?.availablePackages.find((p) => p.identifier === identifier);

  // The main purchase handler: tries RevenueCat first, falls back to mock
  const handlePurchase = async (
    tier: SubscriptionTier,
    rcPackageId: string,
    fallbackAmount: number,
    label: string
  ) => {
    if (rcPackageId === currentProductId) {
      Alert.alert("Already on this plan", `You're already subscribed to this exact plan duration.`);
      return;
    }

    const redundantAddons = [];
    if (tier === "plus") {
      if (profile?.has_advanced_filters) redundantAddons.push("Advanced Filters");
      if (profile?.has_all_chat_rooms) redundantAddons.push("All Chat Rooms");
    } else if (tier === "light") {
      if (profile?.has_advanced_filters) redundantAddons.push("Advanced Filters");
    }

    const executePurchase = async () => {
      const pkg = findPackage(rcPackageId);
      setIsPurchasing(true);

      if (pkg) {
        // RevenueCat real/test purchase
        const customerInfo = await purchasePackage(pkg);
        setIsPurchasing(false);
        if (customerInfo) {
          // 1. Optimistically update the UI instantly without waiting for the backend webhook
          useProfileStore.setState((state) => ({
            profile: state.profile 
              ? { ...state.profile, subscription_tier: tier, subscription_product_id: rcPackageId } 
              : null
          }));
          
          // 2. Fetch the true state from the backend after 3 seconds (giving the webhook time to process)
          setTimeout(() => {
            fetchProfile();
          }, 3000);
          
          Alert.alert("Subscription updated", `You are now on ${label}. Enjoy! 🎉`);
        }
      } else {
        // Fallback: use the existing mock backend upgrade (for Expo Go without native billing)
        upgradeMutation.mutate(
          { tier, amount: fallbackAmount },
          {
            onSuccess: () => {
              setIsPurchasing(false);
              Alert.alert(
                "Subscription updated",
                `You are now on ${label}. (Fallback Mode)`,
                [{ text: "OK", onPress: () => fetchProfile() }]
              );
            },
            onError: (err: any) => {
              setIsPurchasing(false);
              const message =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "We couldn\u2019t process your upgrade. Please try again.";
              Alert.alert("Upgrade failed", message);
            },
          }
        );
      }
    };

    if (redundantAddons.length > 0) {
      Alert.alert(
        "Heads Up!",
        `Upgrading to ${label} gives you access to ${redundantAddons.join(" and ")}! After upgrading, please remember to cancel your active add-on subscriptions in your device settings to avoid being double-billed.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue & Upgrade", onPress: executePurchase, style: "default" }
        ]
      );
      return;
    }

    await executePurchase();
  };

  // Add-on purchase (one-time or monthly)
  const handleAddonPurchase = async (
    rcPackageId: string,
    label: string,
  ) => {
    const pkg = findPackage(rcPackageId);
    setIsPurchasing(true);
    if (pkg) {
      const customerInfo = await purchasePackage(pkg);
      setIsPurchasing(false);
      if (customerInfo) {
        await fetchProfile();
        Alert.alert("Add-on activated!", `${label} is now active on your account.`);
      }
    } else {
      setIsPurchasing(false);
      Alert.alert("Coming Soon", `${label} will be available when connected to the store.`);
    }
  };

  const isUpgrading = isPurchasing || upgradeMutation.isPending;

  const getActivePlanTitle = () => {
    if (!currentProductId) return currentTier === "plus" ? "Premium Plus" : "Premium Light";
    const isPlus = currentProductId.includes("plus");
    const tierName = isPlus ? "Premium Plus" : "Premium Light";
    
    let duration = "";
    if (currentProductId.includes("_1m")) duration = "1 Month";
    else if (currentProductId.includes("_3m")) duration = "3 Months";
    else if (currentProductId.includes("_1yr")) duration = "1 Year";
    else if (currentProductId.includes("_life")) duration = "Lifetime";

    return duration ? `${tierName} (${duration})` : tierName;
  };

  return (
    <VerificationOverlay>
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
        {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Subscription</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Hero subtitle */}
        <Text style={[styles.heroTitle, { color: text }]}>Upgrade Your Experience</Text>
        <Text style={[styles.heroSubtitle, { color: muted }]}>
          Choose the tier that fits your journey towards meaningful connection.
        </Text>

        {currentTier !== "freemium" && (
          <View style={{ backgroundColor: card, borderColor: primary, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: primary, marginBottom: 6, letterSpacing: 0.5 }}>ACTIVE SUBSCRIPTION</Text>
            <Text style={{ fontSize: 18, fontWeight: "800", color: text, marginBottom: 16 }}>{getActivePlanTitle()}</Text>
            
            <Button
              variant="outline"
              onPress={async () => {
                try {
                  await Purchases.showManageSubscriptions();
                } catch (e) {
                  Alert.alert("Error", "Could not open subscription management.");
                }
              }}
              style={{ borderRadius: 8, height: 44 }}
            >
              Manage Subscription
            </Button>
          </View>
        )}

        {/* ── Freemium ── */}
        <View style={[styles.planCard, { backgroundColor: card, borderColor: border, borderWidth: 1 }]}>
          <View style={styles.planCardHeader}>
            <View>
              <Text style={[styles.planName, { color: text }]}>Freemium Access</Text>
              <Text style={{ fontSize: 13, color: primary, fontWeight: "700" }}>Free</Text>
            </View>
            {currentTier === "freemium" && (
              <View style={[styles.currentBadge, { backgroundColor: GOLD }]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD_TEXT, letterSpacing: 0.3 }}>
                  CURRENT PLAN
                </Text>
              </View>
            )}
          </View>
          <View style={{ gap: 6, marginTop: 12 }}>
            <FeatureRow label="Browse dating & friendship profiles" muted={muted} primary={primary} text={text} />
            <FeatureRow label="28 likes per day" muted={muted} primary={primary} text={text} />
            <FeatureRow label="1 free message/match to new profiles" muted={muted} primary={primary} text={text} />
            <FeatureRow label="Ads displayed (Banner + Video)" muted={muted} primary={primary} text={text} />
            <FeatureRow label="Basic filters only" available={false} muted={muted} primary={primary} text={text} />
            <FeatureRow label="No chat room access" available={false} muted={muted} primary={primary} text={text} />
          </View>
          <Text style={{ fontSize: 12, color: muted, marginTop: 10 }}>
            Cannot see received likes
          </Text>
        </View>

        {/* ── Premium Light ── */}
        <View style={[styles.planCard, { backgroundColor: card, borderColor: currentTier === "light" ? primary : border, borderWidth: currentTier === "light" ? 1.5 : 1, marginTop: 12 }]}>
          <View style={styles.planCardHeader}>
            <View>
              <Text style={[styles.planName, { color: text }]}>Premium Light</Text>
              <Text style={{ fontSize: 12, color: muted }}>For serious, intentional browsing</Text>
            </View>
            {currentTier === "light" && (
              <View style={[styles.currentBadge, { backgroundColor: GOLD }]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD_TEXT, letterSpacing: 0.3 }}>
                  CURRENT PLAN
                </Text>
              </View>
            )}
          </View>
          <View style={{ gap: 6, marginTop: 12 }}>
            <FeatureRow label="See who liked you" muted={muted} primary={primary} text={text} />
            <FeatureRow label="50 likes per day" muted={muted} primary={primary} text={text} />
            <FeatureRow label="3 free messages/match to new profiles" muted={muted} primary={primary} text={text} />
            <FeatureRow label="Access to 3 themed chat rooms" muted={muted} primary={primary} text={text} />
            <FeatureRow label="Advanced search filters" muted={muted} primary={primary} text={text} />
          </View>

          {/* Price chips */}
          <View style={styles.priceRow}>
            <PriceChip duration="1 MONTH" price="$4.99" selected={lightPlan === "1m"} onPress={() => setLightPlan("1m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="3 MONTHS" price="$12.99" selected={lightPlan === "3m"} onPress={() => setLightPlan("3m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="1 YEAR" price="$39.99" badge="BEST VALUE" selected={lightPlan === "1yr"} onPress={() => setLightPlan("1yr")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="LIFETIME" price="$99.99" selected={lightPlan === "lifetime"} onPress={() => setLightPlan("lifetime")} primary={primary} border={border} card={background} text={text} muted={muted} />
          </View>

          <Button
            onPress={() =>
              handlePurchase(
                "light",
                `chahira_light_${lightPlan}`,
                LIGHT_PRICES[lightPlan],
                "Premium Light"
              )
            }
            disabled={isUpgrading}
            loading={isUpgrading}
            style={{ borderRadius: 28, marginTop: 14, height: 48 }}
          >
            Upgrade to Light
          </Button>
          <Text style={{ textAlign: "center", fontSize: 11, color: muted, marginTop: 8 }}>
            Billed as a lump-sum
          </Text>
        </View>

        {/* ── Premium Plus ── */}
        <View
          style={[
            styles.planCard,
            {
              backgroundColor: PRIMARY + "0D",
              borderColor: currentTier === "plus" ? PRIMARY : PRIMARY,
              borderWidth: currentTier === "plus" ? 2 : 1.5,
              marginTop: 12,
            },
          ]}
        >
          {/* Most popular badge */}
          <View style={[styles.mostPopularBadge, { backgroundColor: PRIMARY }]}>
            <Text style={{ fontSize: 10, fontWeight: "800", color: "#FFF", letterSpacing: 0.5 }}>
              MOST POPULAR
            </Text>
          </View>

          <View style={styles.planCardHeader}>
            <View>
              <Text style={[styles.planName, { color: text }]}>Premium Plus</Text>
              <Text style={{ fontSize: 12, color: muted }}>The complete experience with total freedom.</Text>
            </View>
            {currentTier === "plus" && (
              <View style={[styles.currentBadge, { backgroundColor: GOLD }]}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD_TEXT, letterSpacing: 0.3 }}>
                  CURRENT PLAN
                </Text>
              </View>
            )}
          </View>

          <View style={{ gap: 7, marginTop: 14 }}>
            {[
              { icon: Zap, label: "Unlimited Likes & Messages" },
              { icon: MessageSquare, label: "Access to ALL Chat Rooms" },
              { icon: Check, label: "See all received likes" },
              { icon: Filter, label: "Full Advanced Filter toolkit" },
              { icon: X, label: "No Ads" },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.featureRow}>
                <Icon name={icon} size={15} color={PRIMARY} />
                <Text style={{ fontSize: 13, color: text, flex: 1, marginLeft: 8 }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Annual highlight */}
          <Pressable
            onPress={() => setPlusPlan("1yr")}
            style={[
              styles.annualRow,
              {
                borderColor: plusPlan === "1yr" ? PRIMARY : PRIMARY + "55",
                borderWidth: plusPlan === "1yr" ? 2 : 1,
                backgroundColor: plusPlan === "1yr" ? PRIMARY + "15" : PRIMARY + "08",
              },
            ]}
          >
            <View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: text }}>Annual Plan</Text>
              <Text style={{ fontSize: 11, color: PRIMARY }}>Save over 30%</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: text }}>$79.99</Text>
          </Pressable>

          {/* Month chips */}
          <View style={[styles.priceRow, { marginTop: 10 }]}>
            <PriceChip duration="1 MO" price="$9.99" selected={plusPlan === "1m"} onPress={() => setPlusPlan("1m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="3 MO" price="$24.99" selected={plusPlan === "3m"} onPress={() => setPlusPlan("3m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="LIFE" price="$199.99" selected={plusPlan === "lifetime"} onPress={() => setPlusPlan("lifetime")} primary={primary} border={border} card={background} text={text} muted={muted} />
          </View>

          <Button
            onPress={() =>
              handlePurchase(
                "plus",
                `chahira_plus_${plusPlan}`,
                PLUS_PRICES[plusPlan],
                "Premium Plus"
              )
            }
            disabled={isUpgrading}
            loading={isUpgrading}
            icon={Rocket}
            style={{ borderRadius: 28, marginTop: 14, height: 52 }}
          >
            Go Premium Plus
          </Button>
        </View>

        {/* ── Specialised Add-ons ── */}
        <Text style={[styles.addOnTitle, { color: muted }]}>SPECIALIZED ADD-ONS</Text>

        {/* Perfect Match Analysis */}
        <View style={[styles.addOnCard, { backgroundColor: GOLD, borderColor: GOLD }]}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: GOLD_TEXT }}>
                Perfect Match Analysis
              </Text>
              <Text style={{ fontSize: 12, color: GOLD_TEXT + "BB", marginTop: 2 }}>
                Deep compatibility insights.
              </Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 10 }}>
                <View style={[styles.addOnFeatureChip, { borderColor: GOLD_TEXT + "44" }]}>
                  <Text style={{ fontSize: 11, color: GOLD_TEXT }}>🔬 Top 5 compatible matches</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
                <View style={[styles.addOnFeatureChip, { borderColor: GOLD_TEXT + "44" }]}>
                  <Text style={{ fontSize: 11, color: GOLD_TEXT }}>📊 Compatibility percentage scores</Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", justifyContent: "flex-start", paddingLeft: 12 }}>
              <View style={[styles.addOnPrice, { backgroundColor: GOLD_TEXT + "22", borderColor: GOLD_TEXT + "44" }]}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: GOLD_TEXT }}>$14.99</Text>
              </View>
            </View>
          </View>

          <Button
            variant="outline"
            onPress={() => handleAddonPurchase("chahira_addon_match_analysis", "Perfect Match Analysis")}
            disabled={isUpgrading || profile?.has_match_analysis}
            loading={isUpgrading}
            style={{ borderRadius: 12, marginTop: 20, height: 46, backgroundColor: profile?.has_match_analysis ? GOLD_TEXT + "05" : GOLD_TEXT + "15", borderColor: GOLD_TEXT + "33", borderWidth: 1 }}
            textStyle={{ color: profile?.has_match_analysis ? GOLD_TEXT + "88" : GOLD_TEXT }}
          >
            {profile?.has_match_analysis ? "PURCHASED" : "Purchase One-Time Pack"}
          </Button>
        </View>

        {/* Add-on rows */}
        {[
          { 
            icon: Filter, 
            title: "Advanced Filters", 
            sub: "Including anonymous profile", 
            price: "$2.99/mo", 
            rcId: "chahira_addon_filters_monthly",
            isIncludedByTier: currentTier === "light" || currentTier === "plus",
            isSubscribed: profile?.has_advanced_filters
          },
          { 
            icon: MessageSquare, 
            title: "All Chat Rooms", 
            sub: "Access all chat rooms", 
            price: "$3.99/mo", 
            rcId: "chahira_addon_chatrooms_monthly",
            isIncludedByTier: currentTier === "plus",
            isSubscribed: profile?.has_all_chat_rooms
          },
        ].map(({ icon, title, sub, price, rcId, isIncludedByTier, isSubscribed }) => {
          const isActive = isIncludedByTier || isSubscribed;
          const badgeText = isIncludedByTier ? "INCLUDED" : (isSubscribed ? "SUBSCRIBED" : price);
          return (
          <Pressable
            key={title}
            style={[
              styles.addOnRow, 
              { backgroundColor: card, borderColor: border, opacity: isActive ? 0.6 : 1 }
            ]}
            disabled={isActive}
            onPress={() => {
              if (isActive) {
                Alert.alert("Already Active", "You already have access to this feature!");
                return;
              }
              handleAddonPurchase(rcId, title);
            }}
          >
            <View
              style={[styles.addOnIcon, { backgroundColor: isActive ? muted + "15" : primary + "18" }]}
            >
              <Icon name={icon} size={18} color={isActive ? muted : primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: text }}>{title}</Text>
              <Text style={{ fontSize: 12, color: muted }}>{sub}</Text>
            </View>
            <View style={[
              styles.addOnPrice, 
              { 
                backgroundColor: isActive ? muted + "15" : primary + "15", 
                borderColor: isActive ? "transparent" : primary + "44",
                borderWidth: isActive ? 0 : 1
              }
            ]}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: isActive ? muted : primary }}>
                {badgeText}
              </Text>
            </View>
          </Pressable>
        )})}

        <Text style={{ textAlign: "center", fontSize: 11, color: muted, marginTop: 20, lineHeight: 16 }}>
          Secure checkout. You agree to let the app auto-renew.{"\n"}
          Manage or cancel in your in-account settings.
        </Text>
      </ScrollView>
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
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 20,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    position: "relative",
  },
  planCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planName: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  currentBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mostPopularBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  priceChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  chipBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingVertical: 1,
    height: 14,
  },
  annualRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  addOnTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 28,
    marginBottom: 12,
  },
  addOnCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: "column",
  },
  addOnFeatureChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addOnRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    gap: 12,
  },
  addOnIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  addOnPrice: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});