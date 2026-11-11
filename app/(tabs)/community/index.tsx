import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEffect, useRef, useState } from "react";
import {
  Zap,
  Lock,
  Users,
  Sparkles,
  MessageCircle,
  Film,
  Cloud,
  Compass,
  Gamepad2,
  Music,
  Palette,
  BookOpen,
  Coffee,
  Dumbbell,
  Heart,
  Leaf,
  Brain,
} from "lucide-react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../../components/header";
import VerificationOverlay from "@/components/VerificationOverlay";
import { router } from "expo-router";
import {
  ChatRoom,
  isPremiumRequiredError,
  useChatRoomsQuery,
  useJoinRoomMutation,
} from "@/api/chat";
import { canAccessCommunity } from "@/api/profile";
import { syncSubscription } from "@/api/purchases";
import { useProfileStore } from "@/store/profileStore";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { showAlert } from "@/components/ui/app-alert";

// Cycle accent palettes so each room card has a distinctive visual identity.
// Mirrors the per-card backgrounds/borders/accent/badge styling in the original mock.
const ROOM_PALETTES = [
  {
    background: "#F5EFFD",
    border: "#E4D8FF",
    accent: "#7545E8",
    badge: "#7545E8",
  },
  {
    background: "#F0FAF7",
    border: "#BCEBDC",
    accent: "#0D7A5F",
    badge: "#0D7A5F",
  },
  {
    background: "#FFF9EF",
    border: "#FDE68A",
    accent: "#C25E00",
    badge: "#D97706",
  },
  {
    background: "#FFF1F2",
    border: "#FECDD3",
    accent: "#E11D48",
    badge: "#E11D48",
  },
  {
    background: "#F0F9FF",
    border: "#BAE6FD",
    accent: "#0284C7",
    badge: "#0284C7",
  },
  {
    background: "#F5F3FF",
    border: "#DDD6FE",
    accent: "#6D28D9",
    badge: "#6D28D9",
  },
];

function formatMemberCount(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`;
  }
  return String(count);
}

function getRoomIcon(name: string) {
  const upper = name.toUpperCase();

  // Gaming, Coding & Tech
  if (
    upper.includes("GAME") ||
    upper.includes("PLAY") ||
    upper.includes("PIXEL") ||
    upper.includes("ARCADE") ||
    upper.includes("CODE") ||
    upper.includes("TECH") ||
    upper.includes("GEEK") ||
    upper.includes("NERD") ||
    upper.includes("CONSOLE") ||
    upper.includes("DEV")
  ) {
    return <Gamepad2 size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Music, Sound & Instruments
  if (
    upper.includes("MUSIC") ||
    upper.includes("SONG") ||
    upper.includes("BEAT") ||
    upper.includes("AUDIO") ||
    upper.includes("BAND") ||
    upper.includes("JAZZ") ||
    upper.includes("ROCK") ||
    upper.includes("MELODY") ||
    upper.includes("TUNE") ||
    upper.includes("RHYTHM") ||
    upper.includes("SOUND")
  ) {
    return <Music size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Art, Crafting & Design
  if (
    upper.includes("ART") ||
    upper.includes("DRAW") ||
    upper.includes("PAINT") ||
    upper.includes("DESIGN") ||
    upper.includes("CRAFT") ||
    upper.includes("SKETCH") ||
    upper.includes("COLOR") ||
    upper.includes("CREATIVE") ||
    upper.includes("STUDIO")
  ) {
    return <Palette size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Books, Reading, Writing & Poetry
  if (
    upper.includes("BOOK") ||
    upper.includes("READ") ||
    upper.includes("WRITE") ||
    upper.includes("NOVEL") ||
    upper.includes("STORY") ||
    upper.includes("POEM") ||
    upper.includes("POET") ||
    upper.includes("LIBRARY") ||
    upper.includes("LIT") ||
    upper.includes("STUDY")
  ) {
    return <BookOpen size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Food, Drinks, Cooking & Coffee
  if (
    upper.includes("COFFEE") ||
    upper.includes("TEA") ||
    upper.includes("CAFE") ||
    upper.includes("FOOD") ||
    upper.includes("COOK") ||
    upper.includes("BAKE") ||
    upper.includes("EAT") ||
    upper.includes("RECIPE") ||
    upper.includes("BREW") ||
    upper.includes("KITCHEN")
  ) {
    return <Coffee size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Fitness, Gym, Sports & Movement
  if (
    upper.includes("FIT") ||
    upper.includes("GYM") ||
    upper.includes("SPORT") ||
    upper.includes("WORKOUT") ||
    upper.includes("RUN") ||
    upper.includes("YOGA") ||
    upper.includes("HEALTH") ||
    upper.includes("HIKE") ||
    upper.includes("ATHLET")
  ) {
    return <Dumbbell size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Movies, TV, Cinema & Shows
  if (
    upper.includes("FILM") ||
    upper.includes("MOVIE") ||
    upper.includes("CINEMA") ||
    upper.includes("PEDIA") ||
    upper.includes("ANIME") ||
    upper.includes("SHOW") ||
    upper.includes("SERIES") ||
    upper.includes("WATCH") ||
    upper.includes("TV") ||
    upper.includes("STREAM")
  ) {
    return <Film size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Nature, Plants, Flowers & Outdoors
  if (
    upper.includes("FLOWER") ||
    upper.includes("GARDEN") ||
    upper.includes("NATURE") ||
    upper.includes("PLANT") ||
    upper.includes("FOREST") ||
    upper.includes("GREEN") ||
    upper.includes("TREE") ||
    upper.includes("EARTH") ||
    upper.includes("BOTANY")
  ) {
    return <Leaf size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Calm, Relaxation, Sleep & Sanctuary
  if (
    upper.includes("SANCTUARY") ||
    upper.includes("CALM") ||
    upper.includes("ZEN") ||
    upper.includes("PEACE") ||
    upper.includes("REST") ||
    upper.includes("SLEEP") ||
    upper.includes("SOOTHE") ||
    upper.includes("COZY") ||
    upper.includes("MEDITAT") ||
    upper.includes("RECHARGE") ||
    upper.includes("BREATHE")
  ) {
    return <Cloud size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.4} />;
  }

  // Neurodiversity, Psychology & Mind
  if (
    upper.includes("ADHD") ||
    upper.includes("AUTIS") ||
    upper.includes("AUDHD") ||
    upper.includes("ASPIE") ||
    upper.includes("NEURO") ||
    upper.includes("BRAIN") ||
    upper.includes("MIND") ||
    upper.includes("PSYCH") ||
    upper.includes("HPI") ||
    upper.includes("HSP") ||
    upper.includes("SENSORY") ||
    upper.includes("MASK")
  ) {
    return <Brain size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Friendship, Love, Dating & Support
  if (
    upper.includes("LOVE") ||
    upper.includes("DATE") ||
    upper.includes("HEART") ||
    upper.includes("FRIEND") ||
    upper.includes("BOND") ||
    upper.includes("CARE") ||
    upper.includes("SAFE") ||
    upper.includes("WARM") ||
    upper.includes("SUPPORT")
  ) {
    return <Heart size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.4} />;
  }

  // Socializing, Talking & Chatting
  if (
    upper.includes("CHAT") ||
    upper.includes("TALK") ||
    upper.includes("BOX") ||
    upper.includes("SPEAK") ||
    upper.includes("LOUNGE") ||
    upper.includes("VOICE") ||
    upper.includes("CORNER") ||
    upper.includes("HUB") ||
    upper.includes("CONVERS") ||
    upper.includes("MEET")
  ) {
    return <MessageCircle size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.4} />;
  }

  // Magic, Stars & Special Interests
  if (
    upper.includes("SPARK") ||
    upper.includes("MAGIC") ||
    upper.includes("STAR") ||
    upper.includes("COSMIC") ||
    upper.includes("ASTRO") ||
    upper.includes("CONSTELA") ||
    upper.includes("SPACE") ||
    upper.includes("GALAXY") ||
    upper.includes("FANTASY")
  ) {
    return <Sparkles size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.4} />;
  }

  // Exploration, Travel & Quest
  if (
    upper.includes("THINK") ||
    upper.includes("IDEA") ||
    upper.includes("JOURNEY") ||
    upper.includes("COMPASS") ||
    upper.includes("QUEST") ||
    upper.includes("EXPLOR") ||
    upper.includes("DISCOVER")
  ) {
    return <Compass size={20} color="#FFFFFF" strokeWidth={2.4} />;
  }

  // Universal Fallback
  return <Zap size={20} color="#FFFFFF" fill="#FFFFFF" strokeWidth={2.4} />;
}

function GroupBadge({ name, badge }: { name: string; badge: string }) {
  const colorScheme = useColorScheme();
  const borderColor = colorScheme === "dark" ? "#121212" : "#FFFFFF";

  return (
    <View
      style={[
        styles.badgeCircle,
        { backgroundColor: badge, borderColor },
      ]}
    >
      {getRoomIcon(name)}
    </View>
  );
}

function GroupCard({
  room,
  index,
  onJoin,
  onOpen,
  joinPending,
}: {
  room: ChatRoom;
  index: number;
  onJoin: (id: string) => void;
  onOpen: (room: ChatRoom) => void;
  joinPending: boolean;
}) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const { isCompact } = useResponsiveLayout();
  const palette = ROOM_PALETTES[index % ROOM_PALETTES.length];
  const avatars = room.member_avatars.slice(0, 3);
  const isToggling = joinPending;

  return (
    <Pressable
      onPress={() => onOpen(room)}
      style={[
        styles.groupCard,
        isCompact && styles.groupCardCompact,
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
          isCompact && styles.groupTitleCompact,
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
          <Users size={13} color={palette.accent} />
          <Text style={[styles.memberText, { color: palette.accent }]}>
            {formatMemberCount(room.member_count)}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          if (room.is_joined) {
            onOpen(room);
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
          {room.is_joined ? t('community.open_chat') : joinPending ? t('community.joining') : t('community.join')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function PremiumUpsell() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={[styles.upsell, isDark && { backgroundColor: "#1C1C1E", borderColor: "#38383A" }]}>
      <View style={styles.upsellBadge}>
        <Lock size={22} color="#FFFFFF" />
      </View>
      <Text style={[styles.upsellTitle, isDark && { color: "#FFFFFF" }]}>{t('community.premium_title')}</Text>
      <Text style={[styles.upsellBody, isDark && { color: "#A1A1AA" }]}>
        {t('community.premium_body')}
      </Text>
      <Pressable
        onPress={() => router.push("/settings/subscription")}
        style={styles.upsellBtn}
      >
        <Text style={styles.upsellBtnText}>{t('community.upgrade_btn')}</Text>
      </Pressable>
    </View>
  );
}

export default function CommunityScreen() {
  const { t } = useTranslation();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");
  const colorScheme = useColorScheme();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const { profile, fetchProfile } = useProfileStore();
  const hasCommunityAccess = canAccessCommunity(profile);

  const roomsQuery = useChatRoomsQuery("", Boolean(profile && hasCommunityAccess));
  const joinMutation = useJoinRoomMutation();
  const { refetch: refetchRooms } = roomsQuery;

  const isPremiumBlocked = roomsQuery.isError && isPremiumRequiredError(roomsQuery.error);
  const isGenericError = roomsQuery.isError && !isPremiumBlocked;
  const accessRetryAttempted = useRef(false);
  const [isVerifyingAccess, setIsVerifyingAccess] = useState(false);
  const [accessVerificationFailed, setAccessVerificationFailed] = useState(false);

  useEffect(() => {
    if (!isPremiumBlocked) {
      accessRetryAttempted.current = false;
      setAccessVerificationFailed(false);
      return;
    }
    if (accessRetryAttempted.current) return;

    accessRetryAttempted.current = true;
    setIsVerifyingAccess(true);
    void (async () => {
      try {
        await syncSubscription();
        const result = await refetchRooms();
        if (result.isError && !isPremiumRequiredError(result.error)) {
          setAccessVerificationFailed(true);
        }
      } catch {
        setAccessVerificationFailed(true);
      } finally {
        setIsVerifyingAccess(false);
      }
    })();
  }, [isPremiumBlocked, refetchRooms]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProfile();
      if (canAccessCommunity(useProfileStore.getState().profile)) {
        await refetchRooms();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryAccessVerification = async () => {
    setIsVerifyingAccess(true);
    accessRetryAttempted.current = true;
    setAccessVerificationFailed(false);
    try {
      await syncSubscription();
      const result = await refetchRooms();
      setAccessVerificationFailed(result.isError && !isPremiumRequiredError(result.error));
    } catch {
      setAccessVerificationFailed(true);
    } finally {
      setIsVerifyingAccess(false);
    }
  };

  const isResolvingPremiumBlock =
    isPremiumBlocked && (!accessRetryAttempted.current || isVerifyingAccess);

  const handleOpen = (room: ChatRoom) => {
    router.push({
      pathname: "/community-chat",
      params: {
        roomId: room.id,
        title: room.name,
        isJoined: room.is_joined ? "1" : "0",
        memberCount: String(room.member_count),
      },
    });
  };

  const handleJoin = (roomId: string) => {
    joinMutation.mutate(roomId, {
      onError: (err: any) => {
        if (isPremiumRequiredError(err)) {
          showAlert(t('community.premium_required_alert'), t('community.upgrade_alert_desc'));
        } else {
          showAlert(t('community.join_error_alert'), t('community.join_error_desc'));
        }
      },
    });
  };

  return (
    <VerificationOverlay>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isCompact ? 14 : 23,
            paddingBottom: 110,
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={primary}
          />
        }
      >
        <LinearGradient
          colors={colorScheme === "dark" ? ["#0F291E", "#0B1D15"] : ["#ECFDF5", "#D1FAE5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, isCompact && styles.heroCompact, colorScheme === "dark" && styles.heroDark]}
        >
          <View style={[styles.heroTopRow, isCompact && { marginBottom: 8 }]}>
            <View style={[styles.heroTag, isCompact && styles.heroTagCompact, colorScheme === "dark" && { backgroundColor: "rgba(52, 211, 153, 0.15)" }]}>
              <Text style={[styles.heroTagText, isCompact && { fontSize: 10 }, colorScheme === "dark" && { color: "#6EE7B7" }]}>
                {t('community.safe_spaces')}
              </Text>
            </View>
            <View style={[styles.heroIconContainer, isCompact && styles.heroIconContainerCompact, colorScheme === "dark" && { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "rgba(52, 211, 153, 0.25)" }]}>
              <Ionicons name="planet" size={isCompact ? 18 : 23} color={colorScheme === "dark" ? "#6EE7B7" : "#059669"} />
            </View>
          </View>

          <Text
            style={[
              styles.heroTitle,
              isCompact && { fontSize: 18, marginBottom: 3 },
              colorScheme === "dark" && { color: "#F0FDF4" },
            ]}
          >
            {t('community.hero_title')}
          </Text>
          <Text
            style={[
              styles.heroBody,
              isCompact && { fontSize: 12.5, lineHeight: 17 },
              colorScheme === "dark" && { color: "#A7F3D0" },
            ]}
          >
            {t('community.hero_body')}
          </Text>
        </LinearGradient>

        <Text style={[styles.exploreTitle, isCompact && { fontSize: 15, marginBottom: 12 }, { color: text }]}>
          {t('community.explore_groups')}
        </Text>

        {!profile ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
          </View>
        ) : !hasCommunityAccess ? (
          <PremiumUpsell />
        ) : isResolvingPremiumBlock ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
            <Text style={{ color: text }}>{t('community.checking_sub')}</Text>
          </View>
        ) : accessVerificationFailed ? (
          <View style={styles.centered}>
            <Text style={{ color: text }}>{t('community.verify_sub_error')}</Text>
            <Pressable onPress={retryAccessVerification}>
              <Text style={styles.retryText}>{t('community.retry')}</Text>
            </Pressable>
          </View>
        ) : isPremiumBlocked ? (
          <PremiumUpsell />
        ) : roomsQuery.isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
          </View>
        ) : isGenericError ? (
          <View style={styles.centered}>
            <Text style={{ color: text }}>{t('community.rooms_error')}</Text>
            <Pressable onPress={() => roomsQuery.refetch()}>
              <Text style={styles.retryText}>{t('community.retry')}</Text>
            </Pressable>
          </View>
        ) : (roomsQuery.data ?? []).length === 0 ? (
          <Text style={styles.emptyText}>
            {t('community.empty_rooms')}
          </Text>
        ) : (
          <View style={[styles.groupGrid, isCompact && { columnGap: 8, rowGap: 8 }]}>
            {(roomsQuery.data ?? []).map((room, index) => (
              <GroupCard
                key={room.id}
                room={room}
                index={index}
                onJoin={handleJoin}
                onOpen={handleOpen}
                joinPending={
                  joinMutation.isPending && joinMutation.variables === room.id
                }
              />
            ))}
          </View>
        )}
        </ScrollView>
      </View>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 23,
    paddingBottom: 130,
  },
  hero: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroCompact: {
    padding: 13,
    marginBottom: 14,
    borderRadius: 16,
  },
  heroDark: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    shadowOpacity: 0,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  heroTag: {
    backgroundColor: "rgba(5, 150, 105, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroTagCompact: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: "#064E3B",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  heroBody: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  heroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(5, 150, 105, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  heroIconContainerCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  groupCardCompact: {
    width: "48%",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    minHeight: 150,
    borderRadius: 16,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  groupTitle: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 14,
  },
  groupTitleCompact: {
    fontSize: 13,
    marginBottom: 8,
  },
  groupFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 22,
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
