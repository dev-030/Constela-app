import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Sparkles, MapPin, CheckCircle2 } from "lucide-react-native";
import { useMatchAnalysisQuery } from "@/api/matching";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import { useProfileStore } from "@/store/profileStore";
import { useAndroidBack } from "@/hooks/useAndroidBack";

const GOLD = "#FFD700";
const GOLD_TEXT = "#B8860B";

export default function MatchAnalysisScreen() {
  const router = useRouter();
  useAndroidBack();
  const { data: matches, isLoading, error, refetch, isRefetching } = useMatchAnalysisQuery();
  const { profile } = useProfileStore();
  
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("muted");
  const card = useColor("card");
  const border = useColor("border");

  // Handle Face Verification Lock
  if (profile && profile.must_verify_face) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color={text} />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Sparkles size={48} color="#EF4444" style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: text, textAlign: 'center' }]}>Action Required</Text>
          <Text style={[styles.subtitle, { color: text, opacity: 0.6, textAlign: 'center', marginHorizontal: 32 }]}>
            Your account has received multiple reports. You must verify your face to unlock Premium Match Analysis and card swiping.
          </Text>
          <Pressable 
            style={[styles.upgradeBtn, { backgroundColor: "#EF4444" }]}
            onPress={() => router.push("/onboarding/face-verification" as any)}
          >
            <Text style={styles.upgradeBtnText}>Verify Face Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Handle Profile Incomplete Lock
  if (profile && profile.profile_completion_pct < 80) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color={text} />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Sparkles size={48} color={GOLD_TEXT} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: text, textAlign: 'center' }]}>Profile Incomplete</Text>
          <Text style={[styles.subtitle, { color: text, opacity: 0.6, textAlign: 'center', marginHorizontal: 32 }]}>
            You must complete at least 80% of your profile to unlock Perfect Match Analysis. This ensures our AI can find your truly compatible matches!
          </Text>
          <Pressable 
            style={[styles.upgradeBtn, { backgroundColor: GOLD_TEXT }]}
            onPress={() => router.push("/profile" as any)}
          >
            <Text style={styles.upgradeBtnText}>Complete Profile Now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Handle 403 / No Access
  if (error) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <ArrowLeft size={22} color={text} />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Sparkles size={48} color={GOLD_TEXT} style={{ marginBottom: 16 }} />
          <Text style={[styles.title, { color: text, textAlign: 'center' }]}>Premium Feature</Text>
          <Text style={[styles.subtitle, { color: text, opacity: 0.6, textAlign: 'center', marginHorizontal: 32 }]}>
            Purchase the Perfect Match Analysis add-on to unlock your top 5 compatible profiles!
          </Text>
          <Pressable 
            style={[styles.upgradeBtn, { backgroundColor: GOLD_TEXT }]}
            onPress={() => router.push("/settings/subscription" as any)}
          >
            <Text style={styles.upgradeBtnText}>View Subscription Options</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ArrowLeft size={22} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Perfect Matches</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={GOLD_TEXT} />
          <Text style={{ color: muted, marginTop: 16, fontSize: 15 }}>Running deep compatibility analysis...</Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={GOLD_TEXT}
              colors={[GOLD_TEXT]}
            />
          }
        >
          <View style={styles.heroSection}>
            <Sparkles size={32} color={GOLD_TEXT} />
            <Text style={[styles.heroTitle, { color: text }]}>Your Top 5 Matches</Text>
            <Text style={[styles.heroSubtitle, { color: text, opacity: 0.8 }]}>
              Based on your profile gender ({profile?.gender || 'not set'}), we are showing highly compatible {profile?.gender?.toLowerCase() === 'man' ? 'women' : profile?.gender?.toLowerCase() === 'woman' ? 'men' : 'matches'}. We analyzed thousands of data points across personality, lifestyle, and sensory needs to find these profiles just for you.
            </Text>
          </View>

          {matches?.map((match, index) => {
            const photoUrl = match.photo || "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop";
            return (
            <Pressable 
              key={match.id} 
              style={[styles.matchCard, { backgroundColor: card, borderColor: border }]}
              onPress={() => router.push(`/profile/${match.id}` as any)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: GOLD_TEXT + '22' }]}>
                  <Text style={[styles.scoreText, { color: GOLD_TEXT }]}>
                    {Math.round(match.compatibility_score || 0)}% Match
                  </Text>
                </View>
              </View>

              <Image 
                source={{ uri: photoUrl }} 
                style={styles.profileImage}
                resizeMode="cover"
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradientOverlay}
              />

              <View style={styles.cardInfo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Text style={[styles.nameText, { marginBottom: 0 }]}>
                    {match.name}, {match.age}
                  </Text>
                  {match.is_verified && <CheckCircle2 size={18} color="#3B82F6" />}
                </View>
                
                <View style={styles.metaRow}>
                  <MapPin size={14} color="#ddd" />
                  <Text style={styles.metaText}>
                    {match.city}{match.city && match.country ? ", " : ""}{match.country}
                  </Text>
                </View>

                {match.tags && match.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {match.tags.slice(0, 3).map((tag, i) => (
                      <View key={i} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Pressable>
          )})}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  upgradeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  upgradeBtnText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
  scrollContent: {
    padding: 16,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 12,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  matchCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    zIndex: 10,
  },
  rankBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontWeight: "800",
    fontSize: 14,
  },
  profileImage: {
    width: "100%",
    height: 400,
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  nameText: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6,
    color: "#FFF",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#ddd",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  tagText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFF",
  }
});
