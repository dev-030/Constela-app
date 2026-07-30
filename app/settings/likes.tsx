import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ArrowLeft, Heart } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useLikesSentQuery, useLikesReceivedQuery, MutualMatchProfile } from "@/api/matching";

// ─── Underline tab bar ────────────────────────────────────────────────────────

function UnderlineTabs({
  tabs,
  active,
  onChange,
  primary,
  text,
  muted,
  border,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
  primary: string;
  text: string;
  muted: string;
  border: string;
}) {
  return (
    <View style={[styles.tabBar, { borderBottomColor: border }]}>
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(tab)}
            style={styles.tabItem}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: isActive ? "700" : "400",
                color: isActive ? text : muted,
              }}
            >
              {tab}
            </Text>
            {isActive && (
              <View style={[styles.tabUnderline, { backgroundColor: primary }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

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
          source={photoUri ? { uri: photoUri } : require("@/assets/profiles/mia.png")}
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
          onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
          onPress={() => router.push(`/sheet?id=${profile.id}`)}
        >
          <Text style={{ fontSize: 13, fontWeight: "600", color: text }}>View Profile</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const TABS = ["Liked", "Likes You"];

export default function LikesScreen() {
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Icon name={ArrowLeft} size={22} color={text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700", color: text, marginLeft: 8 }}>
          Back
        </Text>
      </View>

      {/* Tabs */}
      <UnderlineTabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        primary={primary}
        text={text}
        muted={muted}
        border={border}
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
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  tabItem: {
    marginRight: 28,
    paddingBottom: 12,
    paddingTop: 4,
    position: "relative",
  },
  tabUnderline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
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
