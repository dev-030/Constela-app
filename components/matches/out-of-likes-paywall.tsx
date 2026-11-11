import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check, Clock, Heart, Sparkles } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useProfileStore } from "@/store/profileStore";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function nextLocalMidnight() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  return d;
}

function formatRemaining(ms: number) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}m`;
}

/**
 * Full-screen "Out of likes" paywall that takes over the Matches tab while the
 * daily like quota is used up. Shows a live countdown to the reset and refreshes
 * the profile when it hits zero, which unlocks the deck again.
 */
export function OutOfLikesPaywall() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isCompact } = useResponsiveLayout();
  const insets = useSafeAreaInsets();
  // The tab bar floats over the screen (66px + bottom inset); keep content clear of it.
  const bottomSpace = 66 + insets.bottom + 24;
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const resetsAt = useMemo(() => {
    const raw = profile?.access?.quotas.likes.resets_at;
    const parsed = raw ? new Date(raw) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : nextLocalMidnight();
  }, [profile?.access?.quotas.likes.resets_at]);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30 * 1000);
    return () => clearInterval(timer);
  }, []);

  const remainingMs = resetsAt.getTime() - now;
  useEffect(() => {
    // Quota reset: pull fresh quotas so the deck unlocks without leaving the tab.
    if (remainingMs <= 0) void fetchProfile();
  }, [remainingMs <= 0, fetchProfile]);

  // ── Fit-to-screen (no scrolling) ──
  // The content is laid out at its natural size and then scaled down just enough
  // to fit the space between the header and the floating tab bar. Measuring the
  // real layout covers every language, font-size setting and screen size. When
  // it would have to shrink a lot, a compact variant is used first so the text
  // stays readable.
  const TOP_PAD = isCompact ? 12 : 20;
  const [available, setAvailable] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const [compactHeight, setCompactHeight] = useState(0);

  const compact = available > 0 && fullHeight > 0 && available / fullHeight < 0.82;
  const contentHeight = compact ? compactHeight : fullHeight;
  const measured = available > 0 && contentHeight > 0;
  const scale = measured ? Math.min(1, available / contentHeight) : 1;

  const onAreaLayout = (e: LayoutChangeEvent) => {
    setAvailable(Math.max(0, e.nativeEvent.layout.height - TOP_PAD - bottomSpace));
  };
  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (compact) setCompactHeight(h);
    else setFullHeight(h);
  };

  const allBenefits = [
    t("subscription.likes_unlimited", "Unlimited likes"),
    t("subscription.feature_see_likes", "See who liked you"),
    t("subscription.feature_rewind", "Rewind swipes"),
    t("subscription.personal_unlimited", "Unlimited personal messages"),
  ];
  const benefits = compact ? allBenefits.slice(0, 3) : allBenefits;

  return (
    <LinearGradient
      colors={["#3A0A20", "#73143C", "#DE4177"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.4, y: 1 }}
      style={styles.root}
    >
      <View
        style={[styles.area, { paddingTop: TOP_PAD, paddingBottom: bottomSpace }]}
        onLayout={onAreaLayout}
      >
        <View
          onLayout={onContentLayout}
          style={[
            styles.content,
            // Hidden until measured, so there is no visible jump on first render.
            { opacity: measured ? 1 : 0, transform: [{ scale }] },
          ]}
        >
        <View style={styles.iconGlowWrap}>
          <LinearGradient
            colors={["#FF6598", "#DE4177"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.iconCircle, isCompact && { width: 76, height: 76, borderRadius: 38 }]}
          >
            <Heart size={isCompact ? 34 : 42} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </View>

        <Text style={[styles.title, isCompact && { fontSize: 28 }]}>
          {t("matches.out_of_likes_title", "Out of Likes")}
        </Text>
        <Text style={styles.desc}>
          {t(
            "matches.out_of_likes_desc",
            "You've reached your daily limit of likes. Upgrade your plan for unlimited likes or check back at midnight!",
          )}
        </Text>

        <View style={styles.countdownRow}>
          <Clock size={16} color="#FDE68A" />
          <Text style={styles.countdownText}>
            {remainingMs > 0
              ? t("matches.out_of_likes_resets_in", {
                  defaultValue: "New likes in {{time}}",
                  time: formatRemaining(remainingMs),
                })
              : t("matches.out_of_likes_resets", "Resets at midnight")}
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          {!compact && (
            <Text style={styles.benefitsTitle}>
              {t("matches.out_of_likes_benefits_title", "With Premium")}
            </Text>
          )}
          {benefits.map((label) => (
            <View key={label} style={styles.benefitRow}>
              <View style={styles.benefitCheck}>
                <Check size={14} color="#DE4177" strokeWidth={3} />
              </View>
              <Text style={styles.benefitText}>{label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.upgradeBtn, { opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.navigate("/settings/subscription")}
          accessibilityRole="button"
        >
          <Sparkles size={18} color="#DE4177" />
          <Text style={styles.upgradeBtnText}>
            {t("matches.out_of_likes_upgrade", "Upgrade Plan")}
          </Text>
        </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  area: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    overflow: "hidden",
  },
  content: {
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  iconGlowWrap: {
    shadowColor: "#FF6598",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 22,
    elevation: 10,
    marginBottom: 22,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 32,
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 10,
  },
  desc: {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: 15.5,
    lineHeight: 23,
    textAlign: "center",
    marginBottom: 22,
    maxWidth: 360,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 24,
    marginBottom: 26,
  },
  countdownText: {
    color: "#FDE68A",
    fontSize: 14.5,
    fontWeight: "700",
  },
  benefitsCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  benefitsTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    opacity: 0.85,
    marginBottom: 2,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  upgradeBtn: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  upgradeBtnText: {
    color: "#DE4177",
    fontSize: 16.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
