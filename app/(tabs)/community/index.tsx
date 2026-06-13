import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Image, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, Search, SlidersHorizontal, Zap } from "lucide-react-native";
import Header from "../_components/header";
import { router } from "expo-router";

const avatarUris = [
  "https://i.pravatar.cc/80?img=32",
  "https://i.pravatar.cc/80?img=47",
  "https://i.pravatar.cc/80?img=12",
];

const groups = [
  {
    title: "ADHD Hub",
    members: "1.2k",
    background: "#F5EFFD",
    border: "#E4D8FF",
    accent: "#7545E8",
    badge: "#B069CB",
  },
  {
    title: "Sanctuary",
    members: "950",
    background: "#F0FAF7",
    border: "#DCD8FF",
    accent: "#2E735F",
    badge: "#DFF7F0",
    sanctuary: true,
  },
  {
    title: "HPI Thinkers",
    members: "820",
    background: "#FFF9EF",
    border: "#EBD6FF",
    accent: "#A14600",
    badge: "#FFF2CD",
    hpi: true,
  },
  {
    title: "HSP Calm",
    members: "1.1k",
    background: "#F7FCF3",
    border: "#E1D1FF",
    accent: "#2E735F",
    badge: "#B069CB",
  },
];

function GroupBadge({ group }: { group: (typeof groups)[number] }) {
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === 'dark' ? '#121212' : '#FFFFFF';

  if (group.sanctuary) {
    return (
      <View style={[styles.badgeCircle, { backgroundColor: group.badge, borderColor }]}>
        <Text style={styles.sanctuaryIcon}>☁</Text>
        <Text style={styles.badgeTinyText}>SANCTUARY</Text>
      </View>
    );
  }

  if (group.hpi) {
    return (
      <View style={[styles.badgeCircle, { backgroundColor: group.badge, borderColor }]}>
        <Text style={styles.hpiIcon}>◉</Text>
        <Text style={styles.badgeTinyText}>HPI COMMUNITY</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badgeCircle, { backgroundColor: group.badge, borderColor }]}>
      <View style={styles.badgeInner}>
        <Zap size={17} color="#F6F0FF" fill="#F6F0FF" strokeWidth={2.4} />
        <Text style={styles.badgeTinyText}>ADHD</Text>
      </View>
    </View>
  );
}

function GroupCard({ group, index }: { group: (typeof groups)[number]; index: number }) {
  const colorScheme = useColorScheme();
  
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/community-chat', params: { title: group.title } })}
      style={[
        styles.groupCard,
        {
          backgroundColor: colorScheme === 'dark' ? '#121212' : group.background,
          borderColor: colorScheme === 'dark' ? '#1C382F' : group.border,
        },
      ]}
    >
      <GroupBadge group={group} />
      <Text style={[styles.groupTitle, { color: colorScheme === 'dark' ? '#FFF' : '#222222' }]}>{group.title}</Text>
      <View style={styles.groupFooter}>
        <View style={styles.avatarStack}>
          {avatarUris.map((uri, avatarIndex) => (
            <Image
              key={`${group.title}-${uri}`}
              source={{ uri: `${uri + index}${avatarIndex}` }}
              style={[
                styles.memberAvatar,
                avatarIndex > 0 && styles.memberAvatarOverlap,
              ]}
            />
          ))}
        </View>
        <View style={styles.memberCount}>
          <Zap size={13} color={group.accent} />
          <Text style={[styles.memberText, { color: group.accent }]}>{group.members}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const background = useColor("background");
  const text = useColor("text");
  const card = useColor("card");
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.hero, colorScheme === 'dark' && styles.heroDark]}>
          <Text style={[styles.heroTitle, colorScheme === 'dark' && { color: '#8591A0' }]}>Find your community</Text>
          <Text style={[styles.heroBody, colorScheme === 'dark' && { color: '#2E735F' }]}>
            A low-pressure space to connect{"\n"}
            with people who share your{"\n"}
            neurotype and sensory{"\n"}
            preferences.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: text }]}>Community Rooms</Text>
          <Pressable style={[styles.filterButton, colorScheme === 'dark' && { backgroundColor: card }]}>
            <SlidersHorizontal size={23} color={colorScheme === 'dark' ? "#8591A0" : "#3E6F63"} />
          </Pressable>
        </View>

        <View style={[styles.searchBox, colorScheme === 'dark' && styles.searchBoxDark]}>
          <Search size={22} color={colorScheme === 'dark' ? "#2E735F" : "#9C786C"} />
          <TextInput
            placeholder="Search rooms or interests..."
            placeholderTextColor={colorScheme === 'dark' ? "#2E735F" : "#9C786C"}
            style={[styles.searchInput, { color: text }]}
          />
        </View>

        <Text style={[styles.exploreTitle, colorScheme === 'dark' && { color: '#8591A0' }]}>Explore Groups</Text>
        <View style={styles.groupGrid}>
          {groups.map((group, index) => (
            <GroupCard key={group.title} group={group} index={index} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 109,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 11,
  },
  logo: {
    width: 98,
    height: 55,
    marginLeft: 26,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 23,
  },
  notificationDot: {
    position: "absolute",
    right: 1,
    top: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DE4177",
  },
  profileButton: {
    width: 43,
    height: 43,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#EBF5F4",
  },
  onlineDot: {
    position: "absolute",
    right: 1,
    bottom: 5,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#25C45E",
    borderWidth: 2,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 118,
  },
  hero: {
    backgroundColor: "#E9F9F3",
    borderRadius: 10,
    minHeight: 218,
    paddingHorizontal: 32,
    paddingTop: 34,
    marginBottom: 30,
  },
  heroDark: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1C382F",
  },
  heroTitle: {
    color: "#9A3B00",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 15,
  },
  heroBody: {
    color: "#604F47",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "400",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#222222",
  },
  filterButton: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#F0EEE9",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    height: 55,
    borderRadius: 10,
    backgroundColor: "#F5F1EC",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  searchBoxDark: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1C382F",
  },
  searchInput: {
    flex: 1,
    color: "#5B4640",
    fontSize: 16,
    paddingVertical: 0,
  },
  exploreTitle: {
    color: "#3E6F63",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 18,
  },
  groupGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 16,
  },
  groupCard: {
    width: "47.7%",
    minHeight: 130,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 9,
    paddingBottom: 15,
  },
  badgeCircle: {
    width: 49,
    height: 49,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  badgeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTinyText: {
    fontSize: 4,
    color: "#FFFFFF",
    fontWeight: "800",
    marginTop: -1,
  },
  sanctuaryIcon: {
    color: "#61B7A5",
    fontSize: 16,
    lineHeight: 15,
  },
  hpiIcon: {
    color: "#F0B42A",
    fontSize: 19,
    lineHeight: 20,
  },
  groupTitle: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 14,
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  memberAvatarOverlap: {
    marginLeft: -7,
  },
  memberCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  memberText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
