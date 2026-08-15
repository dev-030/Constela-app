import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ChevronLeft, Heart } from "lucide-react-native";
import { useState, useEffect } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
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

// ─── Underline tab bar ────────────────────────────────────────────────────────

// ─── Segmented pill control ────────────────────────────────────────────────────────

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
    marginBottom: 16,
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

// ─── Profile card ─────────────────────────────────────────────────────────────

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

  const photoUri = profile.photos?.[0]?.image;
  const tag = profile.neurotype_labels?.[0]
    ? `Neurotype: ${profile.neurotype_labels[0]}`
    : profile.city
    ? `From ${profile.city}`
    : "";

  return (
    <Animated.View style={[styles.card, animStyle]}>
      {/* Photo */}
      <View style={styles.photoWrapper}>
        <Image
          source={photoUri ? { uri: photoUri } : require("@/assets/profiles/mia.jpg")}
          style={styles.photo}
          resizeMode="cover"
        />
        {/* SENT badge */}
        {showSentBadge && (
          <View style={[styles.sentBadge, { backgroundColor: primary }]}>
            <Heart size={10} color="#FFF" fill="#FFF" />
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>SENT</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: text }}>
          {profile.username}, {profile.age}
        </Text>
        <Text style={{ fontSize: 12, color: muted, marginTop: 2 }} numberOfLines={1}>
          {tag}
        </Text>

        <Pressable
          style={[styles.viewBtn, { borderColor: border }]}
          onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
          onPress={() => router.push({ pathname: `/profile/${profile.id}`, params: { name: profile.username, age: profile.age, photo: photoUri } } as any)}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: text }}>View Profile</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────



export default function LikesScreen() {
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const [activeTab, setActiveTab] = useState("Liked");

  const { data: likesSentData, isLoading: isLoadingSent } = useLikesSentQuery();
  const { data: likesReceivedData, isLoading: isLoadingReceived, error: receivedError, isError: isReceivedError } = useLikesReceivedQuery();

  const isLikedTab = activeTab === "Liked";
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
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top"]}>
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
      {isLoading ? (
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
            style={{ 
              backgroundColor: primary, 
              width: "100%", 
              paddingVertical: 16, 
              borderRadius: 30,
              alignItems: "center",
              shadowColor: primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
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
    padding: 12,
    gap: 12,
  },
  card: {
    width: "47%",
    borderRadius: 16,
    overflow: "hidden",
  },
  photoWrapper: {
    width: "100%",
    aspectRatio: 0.85,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
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
  cardInfo: {
    paddingTop: 8,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  viewBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
});
