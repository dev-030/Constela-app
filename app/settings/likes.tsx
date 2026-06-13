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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LIKED_PROFILES = [
  {
    id: "1",
    name: "Jordan",
    age: 24,
    tag: "Sensory: Low light",
    image: require("@/assets/profiles/jordan.png"),
  },
  {
    id: "2",
    name: "Mia",
    age: 22,
    tag: "Neurotype: ADHD",
    image: require("@/assets/profiles/mia.png"),
  },
  {
    id: "3",
    name: "Liam",
    age: 27,
    tag: "Sensory: Quiet space",
    image: require("@/assets/profiles/liam.png"),
  },
  {
    id: "4",
    name: "Casey",
    age: 25,
    tag: "Neurotype: Autistic",
    image: require("@/assets/profiles/casey.png"),
  },
];

const LIKES_YOU_PROFILES = [
  {
    id: "5",
    name: "Alex",
    age: 23,
    tag: "Sensory: Dim light",
    image: require("@/assets/profiles/mia.png"),
  },
  {
    id: "6",
    name: "Sam",
    age: 26,
    tag: "Neurotype: Dyslexic",
    image: require("@/assets/profiles/liam.png"),
  },
];

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
}: {
  profile: (typeof LIKED_PROFILES)[0];
  primary: string;
  text: string;
  muted: string;
  card: string;
  border: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.card, animStyle]}>
      {/* Photo */}
      <View style={styles.photoWrapper}>
        <Image source={profile.image} style={styles.photo} resizeMode="cover" />
        {/* SENT badge */}
        <View style={[styles.sentBadge, { backgroundColor: primary }]}>
          <Heart size={10} color="#FFF" fill="#FFF" />
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFF" }}>SENT</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: text }}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={{ fontSize: 12, color: muted, marginTop: 2 }}>{profile.tag}</Text>

        <Pressable
          style={[styles.viewBtn, { borderColor: border }]}
          onPressIn={() => { scale.value = withTiming(0.97, { duration: 100 }); }}
          onPressOut={() => { scale.value = withTiming(1, { duration: 150 }); }}
          onPress={() => {}}
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

  const profiles = activeTab === "Liked" ? LIKED_PROFILES : LIKES_YOU_PROFILES;

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
          />
        ))}
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
