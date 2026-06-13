import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Filter,
  MessageSquare,
  Rocket,
  X,
  Zap,
} from "lucide-react-native";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#DE4177";
const GOLD = "#1A3A2A";
const GOLD_TEXT = "#FFFFFF";

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
        },
      ]}
    >
      {badge ? (
        <View style={[styles.chipBadge, { backgroundColor: "#FF6B00" }]}>
          <Text style={{ fontSize: 9, fontWeight: "700", color: "#fff", letterSpacing: 0.3 }}>
            {badge}
          </Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 10, color: muted, fontWeight: "600", marginBottom: 2 }}>
        {duration}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: "800", color: selected ? primary : text }}>
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
  const primaryForeground = useColor("primaryForeground");

  const [lightPlan, setLightPlan] = useState<"1m" | "3m" | "6m" | "lifetime">("6m");
  const [plusPlan, setPlusPlan] = useState<"1m" | "3m" | "1yr">("1yr");

  return (
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

        {/* ── Freemium ── */}
        <View style={[styles.planCard, { backgroundColor: card, borderColor: border, borderWidth: 1 }]}>
          <View style={styles.planCardHeader}>
            <View>
              <Text style={[styles.planName, { color: text }]}>Freemium Access</Text>
              <Text style={{ fontSize: 13, color: primary, fontWeight: "700" }}>Free</Text>
            </View>
            <View style={[styles.currentBadge, { backgroundColor: GOLD }]}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: GOLD_TEXT, letterSpacing: 0.3 }}>
                CURRENT PLAN
              </Text>
            </View>
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
        <View style={[styles.planCard, { backgroundColor: card, borderColor: border, borderWidth: 1, marginTop: 12 }]}>
          <View>
            <Text style={[styles.planName, { color: text }]}>Premium Light</Text>
            <Text style={{ fontSize: 12, color: muted }}>For serious, intentional browsing</Text>
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
            <PriceChip duration="6 MONTHS" price="$39.99" badge="BEST VALUE" selected={lightPlan === "6m"} onPress={() => setLightPlan("6m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="LIFETIME" price="$99.99" selected={lightPlan === "lifetime"} onPress={() => setLightPlan("lifetime")} primary={primary} border={border} card={background} text={text} muted={muted} />
          </View>

          <Button
            onPress={() => {}}
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
              borderColor: PRIMARY,
              borderWidth: 1.5,
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

          <View>
            <Text style={[styles.planName, { color: text }]}>Premium Plus</Text>
            <Text style={{ fontSize: 12, color: muted }}>The complete experience with total freedom.</Text>
          </View>

          <View style={{ gap: 7, marginTop: 14 }}>
            {[
              { icon: Zap, label: "Unlimited Likes & Messages" },
              { icon: MessageSquare, label: "Access to ALL Chat Rooms" },
              { icon: Check, label: "See all received likes" },
              { icon: Filter, label: "Full Advanced Filter toolkit" },
              { icon: ArrowLeft, label: "Banner ads displayed (Bottom)" },
            ].map(({ icon, label }) => (
              <View key={label} style={styles.featureRow}>
                <Icon name={icon} size={15} color={PRIMARY} />
                <Text style={{ fontSize: 13, color: text, flex: 1, marginLeft: 8 }}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Annual highlight */}
          <View
            style={[
              styles.annualRow,
              { borderColor: PRIMARY + "55", backgroundColor: PRIMARY + "08" },
            ]}
          >
            <View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: text }}>Annual Plan</Text>
              <Text style={{ fontSize: 11, color: PRIMARY }}>Save over 30%</Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: text }}>$79.99</Text>
          </View>

          {/* Month chips */}
          <View style={[styles.priceRow, { marginTop: 10 }]}>
            <PriceChip duration="1 MO" price="$9.99" selected={plusPlan === "1m"} onPress={() => setPlusPlan("1m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="3 MO" price="$24.99" selected={plusPlan === "3m"} onPress={() => setPlusPlan("3m")} primary={primary} border={border} card={background} text={text} muted={muted} />
            <PriceChip duration="1 YR" price="$199.99" selected={plusPlan === "1yr"} onPress={() => setPlusPlan("1yr")} primary={primary} border={border} card={background} text={text} muted={muted} />
          </View>

          <Button
            onPress={() => {}}
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
                <Text style={{ fontSize: 11, color: GOLD_TEXT }}>📊 Compatibility %age scores</Text>
              </View>
            </View>
          </View>
          <View style={{ alignItems: "flex-end", justifyContent: "space-between", paddingLeft: 12 }}>
            <View style={[styles.addOnPrice, { backgroundColor: GOLD_TEXT + "22", borderColor: GOLD_TEXT + "44" }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: GOLD_TEXT }}>$14.99</Text>
            </View>
          </View>
        </View>
        <Button
          variant="outline"
          onPress={() => {}}
          style={{ borderRadius: 12, marginTop: 10, height: 46 }}
        >
          Purchase One-Time Pack
        </Button>

        {/* Add-on rows */}
        {[
          { icon: Filter, title: "Advanced Filters", sub: "Including anonymous profile", price: "$2.99/mo" },
          { icon: MessageSquare, title: "All Chat Rooms", sub: "Access all chat rooms", price: "$3.99/mo" },
        ].map(({ icon, title, sub, price }) => (
          <View
            key={title}
            style={[styles.addOnRow, { backgroundColor: card, borderColor: border }]}
          >
            <View
              style={[styles.addOnIcon, { backgroundColor: primary + "18" }]}
            >
              <Icon name={icon} size={18} color={primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: text }}>{title}</Text>
              <Text style={{ fontSize: 12, color: muted }}>{sub}</Text>
            </View>
            <View style={[styles.addOnPrice, { backgroundColor: primary + "15", borderColor: primary + "44" }]}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: primary }}>{price}</Text>
            </View>
          </View>
        ))}

        <Text style={{ textAlign: "center", fontSize: 11, color: muted, marginTop: 20, lineHeight: 16 }}>
          Secure checkout. You agree to let the app auto-renew.{"\n"}
          Manage or cancel in your in-account settings.
        </Text>
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
    padding: 10,
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
    paddingVertical: 2,
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
    flexDirection: "row",
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
