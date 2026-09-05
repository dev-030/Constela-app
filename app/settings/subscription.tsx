import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Check, Filter, MessageSquare, Rocket, X, Zap } from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  SubscriptionTier,
  useUpgradeSubscriptionMutation,
} from "@/api/settings";
import { useProfileStore } from "@/store/profileStore";
import { getOfferings, purchasePackage, isNativeModuleAvailable } from "@/api/purchases";
import Purchases, { type PurchasesOffering, type PurchasesPackage } from "react-native-purchases";
import VerificationOverlay from "@/components/VerificationOverlay";
import { useAndroidBack } from '@/hooks/useAndroidBack';

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
        <Check size={18} color={primary} strokeWidth={2.5} />
      ) : (
        <X size={18} color={muted} strokeWidth={2.5} />
      )}
      <Text style={{ fontSize: 14, color: available ? text : muted, flex: 1, marginLeft: 12, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Price chip ─────────────────────────────────────────────────────────────

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
            style={{ fontSize: 7, fontWeight: "800", color: "#fff", letterSpacing: 0.3 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
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



// ─── Segmented Control ────────────────────────────────────────────────────────

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
          style={[
            segStyles.pill,
            { backgroundColor: pillBg },
            pillStyle,
          ]}
        />
      )}
      {TABS.map((tab, index) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
          style={[segStyles.tab, containerWidth > 0 && { width: getTabWidth(index, containerWidth) }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 4 }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                segStyles.tabText,
                {
                  color: activeTab === tab ? activeTextColor : inactiveTextColor,
                  fontWeight: activeTab === tab ? "700" : "500",
                },
              ]}
            >
              {tab}
            </Text>
            {isCurrentPlanActive(tab) && (
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: primaryColor, marginLeft: 6, marginTop: 1 }} />
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

// ─── Main ────────────────────────────────────────────────────────────────────

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

  const initialTab = profile?.subscription_tier === "plus" 
    ? "Premium Plus" 
    : profile?.subscription_tier === "light" 
      ? "Premium Light" 
      : "Freemium";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [lightPlan, setLightPlan] = useState<LightPlanChoice | null>(null);
  const [plusPlan, setPlusPlan] = useState<PlusPlanChoice | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const upgradeMutation = useUpgradeSubscriptionMutation();

  const currentProductId = profile?.subscription_product_id;
  const currentTier: SubscriptionTier =
    (profile?.subscription_tier as SubscriptionTier | undefined) ?? "freemium";

  useEffect(() => {
    getOfferings().then(setOffering);
    fetchProfile();
  }, [fetchProfile]);

  const findPackage = (identifier: string): PurchasesPackage | undefined =>
    offering?.availablePackages.find((p) => p.identifier === identifier);

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

      const handleBackendUpgrade = (rcSuccess: boolean = false) => {
        if (rcSuccess) {
          // PRODUCTION MODE: RevenueCat succeeded!
          // We optimistically update the UI. The secure Webhook handles the database.
          setIsPurchasing(false);
          useProfileStore.setState((state) => ({
            profile: state.profile
              ? { ...state.profile, subscription_tier: tier, subscription_product_id: rcPackageId }
              : null,
          }));
          queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
          Alert.alert("Subscription updated", `You are now on ${label}.`);
        } else {
          // FALLBACK MODE: No RevenueCat connected. We use the insecure mock endpoint.
          upgradeMutation.mutate(
            { tier, amount: fallbackAmount },
            {
              onSuccess: (updatedProfile) => {
                setIsPurchasing(false);
                useProfileStore.setState((state) => ({
                  profile: state.profile
                    ? { ...state.profile, ...updatedProfile, subscription_product_id: rcPackageId }
                    : null,
                }));
                queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
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
                  "We couldn’t process your upgrade. Please try again.";
                Alert.alert("Upgrade failed", message);
              },
            }
          );
        }
      };

      if (pkg) {
        const customerInfo = await purchasePackage(pkg);
        if (customerInfo) {
          handleBackendUpgrade(true);
        } else {
          setIsPurchasing(false);
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
          { text: "Continue & Upgrade", onPress: executePurchase, style: "default" }
        ]
      );
      return;
    }

    await executePurchase();
  };

  const handleAddonPurchase = async (
    rcPackageId: string,
    label: string,
  ) => {
    const pkg = findPackage(rcPackageId);
    setIsPurchasing(true);
    if (pkg) {
      const customerInfo = await purchasePackage(pkg);
      if (customerInfo) {
        let backendTier = "";
        if (rcPackageId === 'chahira_addon_filters_monthly') backendTier = 'add_on_filters';
        if (rcPackageId === 'chahira_addon_chatrooms_monthly') backendTier = 'add_on_chatrooms';
        if (rcPackageId === 'chahira_addon_match_analysis') backendTier = 'add_on_perfect_match';
        
        // PRODUCTION MODE: RevenueCat succeeded. 
        // We optimistically update the UI. The secure Webhook handles the database.
        setIsPurchasing(false);
        useProfileStore.setState((state) => ({
          profile: state.profile ? {
            ...state.profile,
            has_advanced_filters: backendTier === 'add_on_filters' ? true : state.profile.has_advanced_filters,
            has_all_chat_rooms: backendTier === 'add_on_chatrooms' ? true : state.profile.has_all_chat_rooms,
            has_match_analysis: backendTier === 'add_on_perfect_match' ? true : state.profile.has_match_analysis,
          } : null
        }));
        Alert.alert("Add-on activated!", `${label} is now active on your account.`);
      } else {
        setIsPurchasing(false);
      }
    } else {
      setIsPurchasing(false);
      Alert.alert("Coming Soon", `${label} will be available when connected to the store.`);
    }
  };

  const isUpgrading = isPurchasing || upgradeMutation.isPending;

  const getActivePlanDetails = () => {
    let tierName = currentTier === "plus" ? "Premium Plus" : (currentTier === "light" ? "Premium Light" : "Freemium");
    let duration = "1 Year";
    let price = currentTier === "plus" ? "$79.99" : "$39.99";

    if (currentProductId) {
      const isPlus = currentProductId.includes("plus");
      tierName = isPlus ? "Premium Plus" : "Premium Light";
      if (currentProductId.includes("_1m")) { duration = "1 Month"; price = isPlus ? "$9.99" : "$4.99"; }
      else if (currentProductId.includes("_3m")) { duration = "3 Months"; price = isPlus ? "$24.99" : "$12.99"; }
      else if (currentProductId.includes("_1yr")) { duration = "1 Year"; price = isPlus ? "$79.99" : "$39.99"; }
      else if (currentProductId.includes("_life")) { duration = "Lifetime"; price = isPlus ? "$199.99" : "$99.99"; }
    }

    return { tierName, duration, price };
  };


  const handleRestore = async () => {
    if (!isNativeModuleAvailable()) {
      Alert.alert(
        "Restore Purchases",
        "Restore is only available in a production build. Please use your device's App Store / Play Store subscriptions page."
      );
      return;
    }
    try {
      setIsPurchasing(true);
      await Purchases.restorePurchases();
      await fetchProfile();
      setIsPurchasing(false);
      Alert.alert("Success", "Your purchases have been restored.");
    } catch (e: any) {
      setIsPurchasing(false);
      Alert.alert("Restore Failed", e.message || "We couldn't restore your purchases.");
    }
  };

  const isProductActive = (tier: "light" | "plus", plan: string) => {
    if (currentProductId) {
      return currentProductId === `chahira_${tier}_${plan}`;
    }
    // Fallback logic for dev/mock environment
    return currentTier === tier && plan === "1yr";
  };

  const isCurrentPlanActive = (tab: string) => {
    if (tab === "Freemium" && currentTier === "freemium") return true;
    if (tab === "Premium Light" && currentTier === "light") return true;
    if (tab === "Premium Plus" && currentTier === "plus") return true;
    return false;
  };

  const showFooter = 
    (activeTab === "Premium Light" && lightPlan !== null) || 
    (activeTab === "Premium Plus" && plusPlan !== null);
    
  const selectedProductIsActive = 
    (activeTab === "Premium Light" && lightPlan && isProductActive("light", lightPlan)) ||
    (activeTab === "Premium Plus" && plusPlan && isProductActive("plus", plusPlan));

  return (
    <VerificationOverlay>
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <ChevronLeft size={24} color={text} />
            </Pressable>
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>Subscription</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: showFooter ? 220 : 60 }}
        >
          {currentTier !== "freemium" && (
            <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 24, padding: 16, backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(150, 150, 150, 0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: "800", color: primary, marginBottom: 4, letterSpacing: 0.5 }}>ACTIVE PLAN</Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: text, marginBottom: 2 }}>{getActivePlanDetails().tierName}</Text>
                <Text style={{ fontSize: 13, color: muted }}>{getActivePlanDetails().duration} • {getActivePlanDetails().price}</Text>
              </View>
              <Pressable
                onPress={async () => {
                  if (!isNativeModuleAvailable()) {
                    Alert.alert(
                      "Manage Subscription",
                      "Subscription management is only available in a production build. Please use your device's App Store / Play Store subscriptions page."
                    );
                    return;
                  }
                  try {
                    await Purchases.showManageSubscriptions();
                  } catch (e: any) {
                    Alert.alert(
                      "Manage Subscription",
                      e?.message || "Could not open subscription management."
                    );
                  }
                }}
                style={({ pressed }) => ({
                  backgroundColor: primary,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  opacity: pressed ? 0.8 : 1
                })}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Manage</Text>
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
              <Text style={{ fontSize: 22, fontWeight: "800", color: text, marginBottom: 4 }}>Freemium Access</Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>The basic experience.</Text>
              
              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow label="Browse dating & friendship profiles" muted={muted} primary={primary} text={text} />
                <FeatureRow label="28 likes per day" muted={muted} primary={primary} text={text} />
                <FeatureRow label="1 free message/match to new profiles" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Ads displayed (Banner + Video)" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Basic filters only" available={false} muted={muted} primary={primary} text={text} />
                <FeatureRow label="No chat room access" available={false} muted={muted} primary={primary} text={text} />
              </View>
            </View>
          )}

          {activeTab === "Premium Light" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: text, marginBottom: 4 }}>Premium Light</Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>For serious, intentional browsing.</Text>
              
              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow label="See who liked you" muted={muted} primary={primary} text={text} />
                <FeatureRow label="50 likes per day" muted={muted} primary={primary} text={text} />
                <FeatureRow label="3 free messages/match to new profiles" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Access to 3 themed chat rooms" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Advanced search filters" muted={muted} primary={primary} text={text} />
              </View>

              <Text style={{ fontSize: 13, fontWeight: "700", color: text, marginBottom: 12, letterSpacing: 0.5 }}>SELECT PLAN</Text>
              <View style={styles.priceRow}>
                <PriceChip duration="1 MONTH" price="$4.99" badge={isProductActive("light", "1m") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={lightPlan === "1m"} onPress={() => setLightPlan("1m")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="3 MONTHS" price="$12.99" badge={isProductActive("light", "3m") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={lightPlan === "3m"} onPress={() => setLightPlan("3m")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="1 YEAR" price="$39.99" badge={isProductActive("light", "1yr") ? "CURRENT PLAN" : "BEST VALUE"} badgeColor={isProductActive("light", "1yr") ? primary : "#FF6B00"} selected={lightPlan === "1yr"} onPress={() => setLightPlan("1yr")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="LIFETIME" price="$99.99" badge={isProductActive("light", "lifetime") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={lightPlan === "lifetime"} onPress={() => setLightPlan("lifetime")} primary={primary} border={border} card={card} text={text} muted={muted} />
              </View>
            </View>
          )}

          {activeTab === "Premium Plus" && (
            <View style={{ paddingHorizontal: 20 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: text, marginBottom: 4 }}>Premium Plus</Text>
              <Text style={{ fontSize: 14, color: muted, marginBottom: 24 }}>The complete experience with total freedom.</Text>

              <View style={{ gap: 12, marginBottom: 32 }}>
                <FeatureRow label="Unlimited Likes & Messages" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Access to ALL Chat Rooms" muted={muted} primary={primary} text={text} />
                <FeatureRow label="See all received likes" muted={muted} primary={primary} text={text} />
                <FeatureRow label="Full Advanced Filter toolkit" muted={muted} primary={primary} text={text} />
                <FeatureRow label="No Ads" muted={muted} primary={primary} text={text} />
              </View>

              <Text style={{ fontSize: 13, fontWeight: "700", color: text, marginBottom: 12, letterSpacing: 0.5 }}>SELECT PLAN</Text>
              <View style={styles.priceRow}>
                <PriceChip duration="1 MONTH" price="$9.99" badge={isProductActive("plus", "1m") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={plusPlan === "1m"} onPress={() => setPlusPlan("1m")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="3 MONTHS" price="$24.99" badge={isProductActive("plus", "3m") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={plusPlan === "3m"} onPress={() => setPlusPlan("3m")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="1 YEAR" price="$79.99" badge={isProductActive("plus", "1yr") ? "CURRENT PLAN" : "BEST VALUE"} badgeColor={isProductActive("plus", "1yr") ? primary : "#FF6B00"} selected={plusPlan === "1yr"} onPress={() => setPlusPlan("1yr")} primary={primary} border={border} card={card} text={text} muted={muted} />
                <PriceChip duration="LIFETIME" price="$199.99" badge={isProductActive("plus", "lifetime") ? "CURRENT PLAN" : undefined} badgeColor={primary} selected={plusPlan === "lifetime"} onPress={() => setPlusPlan("lifetime")} primary={primary} border={border} card={card} text={text} muted={muted} />
              </View>
            </View>
          )}

          <View style={{ marginTop: activeTab === "Freemium" ? 8 : 40, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "800", color: muted, marginBottom: 16, letterSpacing: 0.8, textTransform: "uppercase" }}>Specialized Add-ons</Text>
            
            {/* Perfect Match */}
            <View style={{ backgroundColor: '#1A3A2A', borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: '#FFF' }}>Perfect Match Analysis</Text>
                  <Text style={{ fontSize: 13, color: '#A0B8AA', marginTop: 2 }}>Deep compatibility insights.</Text>
                </View>
                {profile?.has_match_analysis ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: '#FFF', fontWeight: "800", fontSize: 10, letterSpacing: 0.5 }}>SUBSCRIBED</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: "700", fontSize: 13 }}>$14.99</Text>
                  </View>
                )}
              </View>
              <View style={{ gap: 6, marginBottom: profile?.has_perfect_match ? 0 : 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, marginRight: 6 }}>🔬</Text>
                  <Text style={{ fontSize: 11, color: '#E0EAE4', fontWeight: "500" }}>Top 5 compatible matches</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, marginRight: 6 }}>📊</Text>
                  <Text style={{ fontSize: 11, color: '#E0EAE4', fontWeight: "500" }}>Compatibility percentage scores</Text>
                </View>
              </View>
              {!profile?.has_match_analysis ? (
                <Pressable
                  onPress={() => handleAddonPurchase('chahira_addon_match_analysis', 'Perfect Match Analysis')}
                  style={({ pressed }) => ({
                    backgroundColor: '#FFF',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1
                  })}
                >
                  <Text style={{ color: '#1A3A2A', fontWeight: "700", fontSize: 14 }}>Get Add-on</Text>
                </Pressable>
              ) : (
                <Pressable
                  disabled
                  style={{
                    backgroundColor: '#FFF',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.5
                  }}
                >
                  <Text style={{ color: '#1A3A2A', fontWeight: "700", fontSize: 14 }}>Subscribed</Text>
                </Pressable>
              )}
            </View>

            {/* Advanced Filters */}
            <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name={Filter} size={20} color={text} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: text }}>Advanced Filters</Text>
                    <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>Including anonymous profile.</Text>
                  </View>
                </View>
                {activeTab === 'Premium Light' || activeTab === 'Premium Plus' ? (
                  <View style={{ backgroundColor: primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: primary, fontWeight: "800", fontSize: 10, letterSpacing: 0.5 }}>INCLUDED</Text>
                  </View>
                ) : currentTier === 'light' || currentTier === 'plus' || profile?.has_advanced_filters ? (
                  <View style={{ backgroundColor: background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: text, fontWeight: "800", fontSize: 10, letterSpacing: 0.5, opacity: 0.7 }}>SUBSCRIBED</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>$2.99/mo</Text>
                  </View>
                )}
              </View>
              {activeTab === 'Premium Light' || activeTab === 'Premium Plus' ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Included in {activeTab}</Text>
                </Pressable>
              ) : currentTier === 'light' || currentTier === 'plus' ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Included in your plan</Text>
                </Pressable>
              ) : profile?.has_advanced_filters ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Subscribed</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleAddonPurchase('chahira_addon_filters_monthly', 'Advanced Filters')}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    backgroundColor: primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1
                  })}
                >
                  <Text style={{ color: '#FFF', fontWeight: "700", fontSize: 14 }}>Get Add-on</Text>
                </Pressable>
              )}
            </View>

            {/* All Chat Rooms */}
            <View style={{ backgroundColor: card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name={MessageSquare} size={20} color={text} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: "700", color: text }}>All Chat Rooms</Text>
                    <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>Access all chat rooms.</Text>
                  </View>
                </View>
                {activeTab === 'Premium Plus' ? (
                  <View style={{ backgroundColor: primary + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: primary, fontWeight: "800", fontSize: 10, letterSpacing: 0.5 }}>INCLUDED</Text>
                  </View>
                ) : currentTier === 'plus' || profile?.has_all_chat_rooms ? (
                  <View style={{ backgroundColor: background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ color: text, fontWeight: "800", fontSize: 10, letterSpacing: 0.5, opacity: 0.7 }}>SUBSCRIBED</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                    <Text style={{ color: text, fontWeight: "700", fontSize: 13 }}>$3.99/mo</Text>
                  </View>
                )}
              </View>
              {activeTab === 'Premium Plus' ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Included in {activeTab}</Text>
                </Pressable>
              ) : currentTier === 'plus' ? (
                <Pressable
                  disabled
                  style={{
                    marginTop: 16,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Included in your plan</Text>
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
                    alignItems: 'center',
                    opacity: 0.8
                  }}
                >
                  <Text style={{ color: text, fontWeight: "700", fontSize: 14 }}>Subscribed</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleAddonPurchase('chahira_addon_chatrooms_monthly', 'All Chat Rooms')}
                  style={({ pressed }) => ({
                    marginTop: 16,
                    backgroundColor: primary,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    opacity: pressed ? 0.8 : 1
                  })}
                >
                  <Text style={{ color: '#FFF', fontWeight: "700", fontSize: 14 }}>Get Add-on</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Compliance Footer */}
          <View style={{ alignItems: 'center', marginTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
            <TouchableOpacity onPress={handleRestore} style={{ paddingVertical: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: primary, fontWeight: '700', fontSize: 14 }}>Restore Purchases</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 }}>
              <TouchableOpacity>
                <Text style={{ color: muted, fontSize: 11, textDecorationLine: 'underline' }}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={{ color: muted, fontSize: 11 }}>•</Text>
              <TouchableOpacity>
                <Text style={{ color: muted, fontSize: 11, textDecorationLine: 'underline' }}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Fixed Footer for Upgrade Button */}
        {showFooter && (
          <View style={[styles.footer, { backgroundColor: background, borderTopColor: border, paddingBottom: Math.max(insets.bottom / 2, 16) }]}>
            <Button
              onPress={() => {
                if (selectedProductIsActive) return;
                
                if (activeTab === "Premium Light" && lightPlan) {
                  handlePurchase("light", `chahira_light_${lightPlan}`, LIGHT_PRICES[lightPlan], "Premium Light");
                } else if (activeTab === "Premium Plus" && plusPlan) {
                  handlePurchase("plus", `chahira_plus_${plusPlan}`, PLUS_PRICES[plusPlan], "Premium Plus");
                }
              }}
              disabled={isUpgrading || !!selectedProductIsActive}
              loading={isUpgrading}
              style={{ borderRadius: 28, height: 54, opacity: selectedProductIsActive ? 0.6 : 1 }}
            >
              {selectedProductIsActive 
                ? "Current Plan" 
                : activeTab === "Premium Light" 
                  ? (currentTier === "plus" ? "Downgrade to Light" : (currentTier === "light" ? "Change Plan" : "Upgrade to Light")) 
                  : (currentTier === "plus" ? "Change Plan" : "Go Premium Plus")}
            </Button>
            <Text style={{ textAlign: "center", fontSize: 11, color: muted, marginTop: 6, paddingHorizontal: 20 }}>
              Secure checkout. You agree to let the app auto-renew. Manage or cancel in your in-account settings.
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
    gap: 8,
  },
  priceChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
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
