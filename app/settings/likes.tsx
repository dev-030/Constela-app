import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ChevronLeft, Heart, CheckCircle2 } from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useLikesSentQuery, useLikesReceivedQuery, MutualMatchProfile } from "@/api/matching";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useProfileStore } from "@/store/profileStore";
import { canSeeLikes } from "@/api/profile";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TABS = ["Liked", "Likes You"];

function SegmentedControl({
  activeTab,
  onChange,
}: {
  activeTab: string;
  onChange: (value: string) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [pillWidth, setPillWidth] = useState(0);
  const activeIndex = TABS.indexOf(activeTab);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (pillWidth > 0) {
      translateX.value = withTiming(activeIndex * pillWidth, {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [activeIndex, pillWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerBg = isDark ? "#2C2C2E" : "#EFEFEF";
  const pillBg = isDark ? "#3A3A3C" : "#FFFFFF";
  const activeTextColor = isDark ? "#FFFFFF" : "#1C1C1C";
  const inactiveTextColor = isDark ? "#8E8E93" : "#8E8E93";

  return (
    <View
      style={[segStyles.wrapper, { backgroundColor: containerBg }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        setPillWidth((w - 6) / TABS.length);
      }}
    >
      {/* Sliding pill */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            segStyles.pill,
            { width: pillWidth, backgroundColor: pillBg },
            pillStyle,
          ]}
        />
      )}
      {/* Labels */}
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          activeOpacity={0.75}
          style={[segStyles.tab, pillWidth > 0 && { width: pillWidth }]}
        >
          <Text
            style={[
              segStyles.tabText,
              {
                color:
                  activeTab === tab
                    ? activeTextColor
                    : inactiveTextColor,
                fontWeight: activeTab === tab ? "700" : "500",
              },
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    borderRadius: 30,
    padding: 3,
    marginHorizontal: 16,
    position: "relative",
  },
  pill: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});

function ProfileCard({
  profile,
  primary,
  text,
  muted,
  card,
  border,
  showSentBadge,
}: {
  profile: MutualMatchProfile;
  primary: string;
  text: string;
  muted: string;
  card: string;
  border: string;
  showSentBadge?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const photoUri = profile.photos?.find((p: any) => p.is_main)?.image || profile.photos?.[0]?.image;
  const displayName = profile.name || (profile as any).username || "Unknown";

  const tags = [
    ...(profile.qualities || []),
    ...(profile.neurotype_labels || []),
    ...(profile.interests || []),
  ].filter(Boolean);

  const displayTags = tags.length > 0 ? tags.slice(0, 2) : (profile.city ? [profile.city] : []);
  const bioText = (profile as any).bio || (profile.city ? `From ${profile.city}` : "");

  const handlePress = () => {
    router.push({
      pathname: `/profile/${profile.id}`,
      params: { name: displayName, age: profile.age, photo: photoUri },
    } as any);
  };

  return (
    <AnimatedPressable
      style={[
        styles.card,
        { backgroundColor: card, borderColor: border },
        animStyle,
      ]}
      onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 100 }); }}
      onPress={handlePress}
    >
      {/* Photo with Name & Age Overlay */}
      <View style={styles.photoWrapper}>
        <Image
          source={photoUri ? { uri: photoUri } : require("@/assets/profiles/mia.jpg")}
          style={styles.photo}
          contentFit="cover"
          transition={150}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.68)"]}
          locations={[0.5, 1]}
          style={styles.photoGradient}
        />

        {/* Top Badge */}
        {showSentBadge ? (
          <View style={[styles.sentBadge, { backgroundColor: primary }]}>
            <Heart size={10} color="#FFF" fill="#FFF" />
            <Text style={styles.sentBadgeText}>SENT</Text>
          </View>
        ) : (
          <View style={[styles.sentBadge, { backgroundColor: "#10B981" }]}>
            <Heart size={10} color="#FFF" fill="#FFF" />
            <Text style={styles.sentBadgeText}>LIKES YOU</Text>
          </View>
        )}

        {/* Name, Age & Verified Overlay */}
        <View style={styles.nameOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.nameText} numberOfLines={1}>
              {displayName}{profile.age ? `, ${profile.age}` : ""}
            </Text>
            {profile.is_verified && (
              <CheckCircle2 size={16} color="#3B82F6" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>

      {/* Card Info */}
      <View style={styles.cardInfo}>
        <View style={styles.tagsRow}>
          {displayTags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={[styles.tagPill, { backgroundColor: primary + "18" }]}>
              <Text style={[styles.tagPillText, { color: primary }]} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.bioText, { color: muted }]} numberOfLines={2}>
          {bioText}
        </Text>

        <View style={[styles.viewBtn, { backgroundColor: primary }]}>
          <Text style={styles.viewBtnText}>View Profile</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export default function LikesScreen() {
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { profile } = useProfileStore();
  const userCanSeeLikes = canSeeLikes(profile);

  const [activeTab, setActiveTab] = useState("Liked");
  const isLikedTab = activeTab === "Liked";

  const { data: likesSentData, isLoading: isLoadingSent } = useLikesSentQuery();
  const { data: likesReceivedData, isLoading: isLoadingReceived, error: receivedError, isError: isReceivedError } = useLikesReceivedQuery(Boolean(userCanSeeLikes && !isLikedTab));

  const isLoading = isLikedTab ? isLoadingSent : isLoadingReceived;

  let profiles: MutualMatchProfile[] = [];
  if (isLikedTab && likesSentData) {
    profiles = likesSentData.map((entry) => entry.profile);
  } else if (!isLikedTab && likesReceivedData) {
    profiles = likesReceivedData;
  }

  const getErrorMessage = (error: any) => {
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }
    return "Failed to load.";
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]} numberOfLines={1}>
            Likes
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <SegmentedControl
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Grid */}
      {!isLikedTab && !userCanSeeLikes ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: primary + "1A", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
            <Icon name={Heart} size={40} color={primary} fill={primary} />
          </View>
          <Text style={{ color: text, textAlign: "center", fontSize: 24, fontWeight: "800", marginBottom: 12 }}>
            See Who Likes You
          </Text>
          <Text style={{ color: muted, textAlign: "center", fontSize: 16, lineHeight: 24, marginBottom: 32 }}>
            Match instantly with people who already like you by upgrading to Premium.
          </Text>
          <Pressable
            onPress={() => router.push("/settings/subscription")}
            style={({ pressed }) => ({
              backgroundColor: primary,
              width: "100%",
              paddingVertical: 16,
              borderRadius: 30,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Upgrade to Premium</Text>
          </Pressable>
        </View>
      ) : isLoading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      ) : !isLikedTab && isReceivedError ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: primary + "1A", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
            <Icon name={Heart} size={40} color={primary} fill={primary} />
          </View>
          <Text style={{ color: text, textAlign: "center", fontSize: 24, fontWeight: "800", marginBottom: 12 }}>
            See Who Likes You
          </Text>
          <Text style={{ color: muted, textAlign: "center", fontSize: 16, lineHeight: 24, marginBottom: 32 }}>
            {getErrorMessage(receivedError) === "Upgrade to Premium to see who liked you."
              ? "Match instantly with people who already like you by upgrading to Premium."
              : getErrorMessage(receivedError)}
          </Text>
          <Pressable
            onPress={() => router.push("/settings/subscription")}
            style={({ pressed }) => ({
              backgroundColor: primary,
              width: "100%",
              paddingVertical: 16,
              borderRadius: 30,
              alignItems: "center",
              opacity: pressed ? 0.85 : 1,
              shadowColor: primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Upgrade to Premium</Text>
          </Pressable>
        </View>
      ) : profiles.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ color: muted, textAlign: "center", fontSize: 16 }}>
            {isLikedTab
              ? "You haven't liked anyone yet."
              : "No one has liked you yet."}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.grid}
        >
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              primary={primary}
              text={text}
              muted={muted}
              card={card}
              border={border}
              showSentBadge={isLikedTab}
            />
          ))}
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

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 16,
    rowGap: 14,
  },
  card: {
    width: "48%",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
  },
  photoWrapper: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  sentBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.1,
  },
  nameOverlay: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nameText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    flexShrink: 1,
  },
  cardInfo: {
    minHeight: 140,
    padding: 12,
    gap: 8,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  bioText: {
    height: 36,
    fontSize: 13,
    lineHeight: 18,
  },
  viewBtn: {
    marginTop: "auto",
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
