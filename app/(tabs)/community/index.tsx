import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect, useState } from "react";
import { Search, Zap, Lock } from "lucide-react-native";
import Header from "../../../components/header";
import { router } from "expo-router";
import {
  ChatRoom,
  isPremiumRequiredError,
  useChatRoomsQuery,
  useJoinRoomMutation,
  useLeaveRoomMutation,
} from "@/api/chat";

const SEARCH_DEBOUNCE_MS = 300;

// Cycle accent palettes so each room card has a distinctive visual identity.
// Mirrors the per-card backgrounds/borders/accent/badge styling in the original mock.
const ROOM_PALETTES = [
  {
    background: "#F5EFFD",
    border: "#E4D8FF",
    accent: "#7545E8",
    badge: "#B069CB",
  },
  {
    background: "#F0FAF7",
    border: "#DCD8FF",
    accent: "#2E735F",
    badge: "#DFF7F0",
  },
  {
    background: "#FFF9EF",
    border: "#EBD6FF",
    accent: "#A14600",
    badge: "#FFF2CD",
  },
  {
    background: "#F7FCF3",
    border: "#E1D1FF",
    accent: "#2E735F",
    badge: "#B069CB",
  },
];

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(count);
}

function GroupBadge({ name, badge }: { name: string; badge: string }) {
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === "dark" ? "#121212" : "#FFFFFF";

  // Derive a simple icon hint from the room name. Falls back to the Zap glyph.
  const upper = name.toUpperCase();
  if (upper.includes("SANCTUARY")) {
    return (
      <View
        style={[
          styles.badgeCircle,
          { backgroundColor: badge, borderColor },
        ]}
      >
        <Text style={styles.sanctuaryIcon}>☁</Text>
        <Text style={styles.badgeTinyText}>SANCTUARY</Text>
      </View>
    );
  }
  if (upper.includes("HPI")) {
    return (
      <View
        style={[
          styles.badgeCircle,
          { backgroundColor: badge, borderColor },
        ]}
      >
        <Text style={styles.hpiIcon}>◉</Text>
        <Text style={styles.badgeTinyText}>HPI COMMUNITY</Text>
      </View>
    );
  }

  // Default — extract a short acronym (up to 5 chars) for the badge label.
  const acronym = name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 5)
    .toUpperCase();

  return (
    <View
      style={[
        styles.badgeCircle,
        { backgroundColor: badge, borderColor },
      ]}
    >
      <View style={styles.badgeInner}>
        <Zap size={17} color="#F6F0FF" fill="#F6F0FF" strokeWidth={2.4} />
        <Text style={styles.badgeTinyText}>{acronym || "ROOM"}</Text>
      </View>
    </View>
  );
}

function GroupCard({
  room,
  index,
  onJoin,
  onLeave,
  onOpen,
  joinPending,
  leavePending,
}: {
  room: ChatRoom;
  index: number;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onOpen: (room: ChatRoom) => void;
  joinPending: boolean;
  leavePending: boolean;
}) {
  const colorScheme = useColorScheme();
  const palette = ROOM_PALETTES[index % ROOM_PALETTES.length];
  const avatars = room.member_avatars.slice(0, 3);
  const isToggling = joinPending || leavePending;

  return (
    <Pressable
      onPress={() => onOpen(room)}
      style={[
        styles.groupCard,
        {
          backgroundColor:
            colorScheme === "dark" ? "#121212" : palette.background,
          borderColor: colorScheme === "dark" ? "#1C382F" : palette.border,
        },
      ]}
    >
      <GroupBadge name={room.name} badge={palette.badge} />
      <Text
        style={[
          styles.groupTitle,
          { color: colorScheme === "dark" ? "#FFF" : "#222222" },
        ]}
      >
        {room.name}
      </Text>
      <View style={styles.groupFooter}>
        <View style={styles.avatarStack}>
          {avatars.map((uri, avatarIndex) => (
            <Image
              key={`${room.id}-${uri}-${avatarIndex}`}
              source={{ uri }}
              style={[
                styles.memberAvatar,
                avatarIndex > 0 && styles.memberAvatarOverlap,
              ]}
            />
          ))}
        </View>
        <View style={styles.memberCount}>
          <Zap size={13} color={palette.accent} />
          <Text style={[styles.memberText, { color: palette.accent }]}>
            {formatMemberCount(room.member_count)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          if (room.is_joined) {
            onLeave(room.id);
          } else {
            onJoin(room.id);
          }
        }}
        disabled={isToggling}
        style={[
          styles.joinBtn,
          {
            backgroundColor: room.is_joined ? "transparent" : palette.accent,
            borderColor: palette.accent,
            opacity: isToggling ? 0.6 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.joinBtnText,
            { color: room.is_joined ? palette.accent : "#FFFFFF" },
          ]}
        >
          {room.is_joined ? "Joined" : joinPending ? "Joining…" : "Join"}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function PremiumUpsell() {
  return (
    <View style={styles.upsell}>
      <View style={styles.upsellBadge}>
        <Lock size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.upsellTitle}>Premium Community</Text>
      <Text style={styles.upsellBody}>
        Upgrade to Premium to access community chat rooms and connect with
        people who share your neurotype.
      </Text>
      <Pressable
        onPress={() => router.push("/settings/subscription")}
        style={styles.upsellBtn}
      >
        <Text style={styles.upsellBtnText}>Upgrade to Premium</Text>
      </Pressable>
    </View>
  );
}

export default function CommunityScreen() {
  const background = useColor("background");
  const text = useColor("text");
  const colorScheme = useColorScheme();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const roomsQuery = useChatRoomsQuery(debouncedSearch);
  const joinMutation = useJoinRoomMutation();
  const leaveMutation = useLeaveRoomMutation();

  const isPremiumBlocked = roomsQuery.isError && isPremiumRequiredError(roomsQuery.error);
  const isGenericError = roomsQuery.isError && !isPremiumBlocked;
  const isRefreshing = roomsQuery.isFetching;

  const handleOpen = (room: ChatRoom) => {
    router.push({
      pathname: "/community-chat",
      params: { roomId: room.id, title: room.name },
    });
  };

  const handleJoin = (roomId: string) => {
    joinMutation.mutate(roomId, {
      onError: (err: any) => {
        if (isPremiumRequiredError(err)) {
          Alert.alert("Premium required", "Upgrade to join community rooms.");
        } else {
          Alert.alert("Couldn't join", "Please try again in a moment.");
        }
      },
    });
  };

  const handleLeave = (roomId: string) => {
    leaveMutation.mutate(roomId, {
      onError: () => {
        Alert.alert("Couldn't leave", "Please try again in a moment.");
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => roomsQuery.refetch()}
            tintColor={colorScheme === "dark" ? "#FFF" : "#222222"}
          />
        }
      >
        <View style={[styles.hero, colorScheme === "dark" && styles.heroDark]}>
          <Text
            style={[
              styles.heroTitle,
              colorScheme === "dark" && { color: "#8591A0" },
            ]}
          >
            Find your community
          </Text>
          <Text
            style={[
              styles.heroBody,
              colorScheme === "dark" && { color: "#2E735F" },
            ]}
          >
            A low-pressure space to connect with people who share your neurotype
            and sensory preferences.
          </Text>
        </View>

        <Text
          style={[
            styles.exploreTitle,
            colorScheme === "dark" && { color: "#8591A0" },
          ]}
        >
          Explore Groups
        </Text>

        {isPremiumBlocked ? (
          <PremiumUpsell />
        ) : roomsQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colorScheme === "dark" ? "#FFF" : "#222222"} />
          </View>
        ) : isGenericError ? (
          <View style={styles.centered}>
            <Text style={{ color: text }}>Couldn&apos;t load rooms.</Text>
            <Pressable onPress={() => roomsQuery.refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (roomsQuery.data ?? []).length === 0 ? (
          <Text style={styles.emptyText}>
            {debouncedSearch
              ? "No rooms match your search."
              : "No community rooms available yet."}
          </Text>
        ) : (
          <View style={styles.groupGrid}>
            {(roomsQuery.data ?? []).map((room, index) => (
              <GroupCard
                key={room.id}
                room={room}
                index={index}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onOpen={handleOpen}
                joinPending={
                  joinMutation.isPending && joinMutation.variables === room.id
                }
                leavePending={
                  leaveMutation.isPending && leaveMutation.variables === room.id
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 118,
  },
  hero: {
    backgroundColor: "#E9F9F3",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  heroDark: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1C382F",
  },
  heroTitle: {
    color: "#9A3B00",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  heroBody: {
    color: "#604F47",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17,
  },
  searchBox: {
    height: 45,
    borderRadius: 10,
    backgroundColor: "#F5F1EC",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "85%",
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
    fontSize: 16,
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
    width: "47%",
    minHeight: 170,
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
    marginBottom: 12,
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
  joinBtn: {
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 8,
  },
  retryText: {
    color: "#7545E8",
    fontWeight: "700",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: "#9C786C",
    paddingVertical: 24,
    textAlign: "center",
  },
  upsell: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 22,
    backgroundColor: "#F5EFFD",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4D8FF",
  },
  upsellBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7545E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  upsellTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#222222",
    marginBottom: 8,
  },
  upsellBody: {
    fontSize: 14,
    color: "#604F47",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },
  upsellBtn: {
    backgroundColor: "#7545E8",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  upsellBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
