import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  Platform,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Send,
  MoreVertical,
  Smile,
  Lock,
} from "lucide-react-native";

import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  useChatRoomQuery,
  useJoinRoomMutation,
  useLeaveRoomMutation,
  useRoomMessagesQuery,
  ROOM_HISTORY_PAGE_SIZE,
} from "@/api/chat";
import { apiClient } from "@/api/client";
import { useProfileStore } from "@/store/profileStore";
import { useChatSocket } from "@/api/ChatSocketProvider";
import type { ChatMessage } from "@/api/chat";
import { useAndroidBack } from "@/hooks/useAndroidBack";

const QUICK_EMOJIS = [
  "😀", "😂", "🤣", "❤️", "😍", "🔥", "👍", "🙌",
  "🎉", "✨", "🥺", "🙏", "💯", "😎", "🥳", "👏",
  "😉", "🤔", "👀", "💪", "🥰", "😭", "😊", "🤩",
];

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "h:mm a");
}

function formatDayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

// Stable palette for the username-label color band on incoming messages.
function hashStringToColor(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 40%)`;
}

// Group messages by day so we can render day-separator labels
function groupMessagesByDay(messages: ChatMessage[]) {
  const groups: { label: string; data: ChatMessage[] }[] = [];
  let lastLabel = "";
  // messages are newest-first; reverse to oldest-first for grouping
  const sorted = [...messages].reverse();
  for (const msg of sorted) {
    const label = formatDayLabel(msg.timestamp);
    if (label !== lastLabel) {
      groups.push({ label, data: [msg] });
      lastLabel = label;
    } else {
      groups[groups.length - 1].data.push(msg);
    }
  }
  // Flatten back to a render-list (newest at index 0 for inverted FlatList)
  const items: Array<ChatMessage | { type: "day"; label: string }> = [];
  for (const g of groups.reverse()) {
    for (const msg of g.data.reverse()) {
      items.push(msg);
    }
    // In an inverted list, appending the separator makes it render above its day.
    if (g.label !== "Today") {
      items.push({ type: "day", label: g.label });
    }
  }
  return items;
}

// ─── MessageBubble ──────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  showAvatar,
  isLast,
  nameColor,
  onLongPress,
}: {
  msg: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  isLast: boolean;
  nameColor: string;
  onLongPress?: (msg: ChatMessage) => void;
}) {
  const isDark = useColorScheme() === "dark";
  const leftBubbleBg = isDark ? "#242529" : "#F8F9FB";
  const leftBorderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#ECEFF3";
  const leftTextColor = isDark ? "#F9FAFB" : "#111827";
  const leftTimeColor = isDark ? "rgba(255, 255, 255, 0.55)" : "#6B7280";

  return (
    <View
      style={[
        bubbleStyles.row,
        isMe ? bubbleStyles.rowRight : bubbleStyles.rowLeft,
        isLast && bubbleStyles.rowGroupEnd,
      ]}
    >
      {/* Avatar on the left for received messages */}
      {!isMe && (
        <View style={bubbleStyles.avatarCol}>
          {showAvatar ? (
            <Pressable
              onPress={() => {
                if (msg.sender) {
                  router.push({
                    pathname: "/profile/[id]",
                    params: { id: msg.sender },
                  } as any);
                }
              }}
              hitSlop={8}
            >
              {msg.sender_photo ? (
                <Image
                  source={{ uri: msg.sender_photo }}
                  style={bubbleStyles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              ) : (
                <View style={[bubbleStyles.avatar, { backgroundColor: isDark ? "#38383A" : "#E5E7EB", alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: isDark ? "#A1A1AA" : "#666" }}>
                    {msg.sender_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </Pressable>
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>
      )}

      <Pressable
        onLongPress={() => onLongPress?.(msg)}
        style={[
          bubbleStyles.bubble,
          isMe
            ? [bubbleStyles.bubbleRight, isLast && bubbleStyles.bubbleRightTail]
            : [
                bubbleStyles.bubbleLeft,
                { backgroundColor: leftBubbleBg, borderColor: leftBorderColor },
                isLast && bubbleStyles.bubbleLeftTail,
              ],
        ]}
      >
        {/* Name Label */}
        {!isMe && showAvatar && (
          <Text style={[bubbleStyles.senderName, { color: nameColor }]}>
            {msg.sender_name}
          </Text>
        )}

        {/* Text */}
        {!!msg.content && (
          <Text style={[bubbleStyles.text, isMe ? bubbleStyles.textRight : [bubbleStyles.textLeft, { color: leftTextColor }]]}>
            {msg.content}
          </Text>
        )}

        {/* Time */}
        <View style={[bubbleStyles.footer, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
          <Text style={[bubbleStyles.time, { color: isMe ? "rgba(255,255,255,0.65)" : leftTimeColor }]}>
            {formatMessageTime(msg.timestamp)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}


const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, marginTop: 2, marginBottom: 4 },
  rowGroupEnd: { marginBottom: 10 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarCol: { marginRight: 6, marginBottom: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: {
    maxWidth: "76%",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  bubbleRight: {
    backgroundColor: "#0A84FF",
  },
  bubbleRightTail: { borderBottomRightRadius: 5 },
  bubbleLeft: {
    backgroundColor: "#F8F9FB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  bubbleLeftTail: { borderBottomLeftRadius: 5 },
  senderName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 22 },
  textRight: { color: "#FFFFFF" },
  textLeft: { color: "#111827" },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  time: { fontSize: 11 },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function CommunityChatScreen() {
  const { title, roomId, isJoined: joinedParam, memberCount: memberCountParam } = useLocalSearchParams<{
    title: string;
    roomId: string;
    isJoined?: string;
    memberCount?: string;
  }>();
  useAndroidBack();

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const textColor = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const card = useColor("card");

  const { profile, fetchProfile } = useProfileStore();
  useEffect(() => { if (!profile) fetchProfile(); }, [profile, fetchProfile]);

  const currentUserId = profile?.id ?? profile?.user.id ?? "";

  const roomQuery = useChatRoomQuery(roomId);
  const historyQuery = useRoomMessagesQuery(roomId);
  const joinMutation = useJoinRoomMutation();
  const leaveMutation = useLeaveRoomMutation();

  const hasInitialMembership = joinedParam === "0" || joinedParam === "1";
  const isMembershipLoading = roomQuery.isLoading && !roomQuery.data && !hasInitialMembership;
  const isJoined = roomQuery.data?.is_joined ?? joinedParam === "1";
  const memberCount = roomQuery.data?.member_count ?? Number(memberCountParam ?? 0);

  const { sendRoomMessage, joinRoom, leaveRoom, isConnected } = useChatSocket();

  // Subscribe to the WS room group when screen is open.
  // Also re-fires when isConnected flips to true (socket reconnected after a drop),
  // ensuring we always have a live room subscription.
  useEffect(() => {
    if (!roomId || !isConnected) return;
    joinRoom(roomId);
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom, isConnected]);

  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const prevMsgCount = useRef(0);
  const isAtBottom = useRef(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [noMoreMessages, setNoMoreMessages] = useState(false);
  const hasStartedPaging = useRef(false);

  const openActionMenu = useCallback(() => {
    const options: any[] = [];

    if (isJoined) {
      options.push({
        text: "Leave Room",
        style: "destructive",
        onPress: () => {
          Alert.alert("Leave room?", `You'll stop receiving messages from ${title}.`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Leave",
              style: "destructive",
              onPress: () =>
                leaveMutation.mutate(roomId, {
                  onSuccess: () => router.back(),
                  onError: () => Alert.alert("Couldn't leave", "Please try again."),
                }),
            },
          ]);
        },
      });
    }

    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert("Room Options", "Choose an action", options);
  }, [roomId, title, isJoined, leaveMutation]);

  const commQuota = profile?.access?.quotas.community_messages;
  const isCommQuotaExhausted =
    commQuota?.remaining != null &&
    commQuota.remaining <= 0 &&
    (!commQuota.resets_at || new Date(commQuota.resets_at).getTime() > Date.now());

  const handleMessageLongPress = useCallback((msg: ChatMessage) => {
    const isMe = String(msg.sender) === String(currentUserId);
    const options: any[] = [];
    if (!isMe && msg.sender) {
      options.push({
        text: "View Profile",
        onPress: () => {
          router.push({
            pathname: "/profile/[id]",
            params: { id: msg.sender },
          } as any);
        },
      });
    }
    options.push({ text: "Cancel", style: "cancel" });
    Alert.alert(msg.sender_name || "Message", undefined, options);
  }, [currentUserId]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;
    if (isCommQuotaExhausted) {
      Alert.alert(
        "Daily Limit Reached",
        "You've reached your daily community message limit. Upgrade your subscription or wait until midnight to send more."
      );
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    sendRoomMessage(roomId, trimmed);
    setText("");
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  }, [text, roomId, isCommQuotaExhausted, sendRoomMessage]);

  const handleJoin = useCallback(() => {
    if (!roomId) return;
    joinMutation.mutate(roomId, {
      onError: (err: any) => Alert.alert("Error", err?.response?.data?.error || err?.message || "Could not join room.")
    });
  }, [roomId, joinMutation]);

  // Build the flat-list data
  const rawMessages = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const listData = useMemo(() => groupMessagesByDay(rawMessages), [rawMessages]);

  const nameColors = useMemo(() => {
    const map: Record<string, string> = {};
    rawMessages.forEach((m) => {
      if (m.sender !== currentUserId && !map[m.sender]) {
        map[m.sender] = hashStringToColor(m.sender);
      }
    });
    return map;
  }, [rawMessages, currentUserId]);

  // If the first page came back with fewer messages than the page size, there are no older
  // messages to paginate — mark that immediately so onEndReached doesn't fire a wasted request.
  const hasInitializedPaging = useRef(false);
  useEffect(() => {
    if (!historyQuery.isSuccess || hasInitializedPaging.current) return;
    hasInitializedPaging.current = true;
    setNoMoreMessages(rawMessages.length < ROOM_HISTORY_PAGE_SIZE);
  }, [historyQuery.isSuccess, rawMessages.length]);

  const fetchOlderMessages = useCallback(async () => {
    if (isLoadingOlder || noMoreMessages || !roomId) return;
    const oldestMsg = rawMessages[rawMessages.length - 1];
    if (!oldestMsg) return;

    setIsLoadingOlder(true);
    try {
      const response = await apiClient.get<ChatMessage[]>(
        `/api/chat/rooms/${roomId}/messages/`,
        { params: { before: oldestMsg.timestamp } }
      );
      const rawOlder = response.data ?? [];
      if (rawOlder.length < ROOM_HISTORY_PAGE_SIZE) {
        setNoMoreMessages(true);
      }
      if (rawOlder.length > 0) {
        let olderMessages = rawOlder;
        if (olderMessages.length > 1) {
          const firstTime = new Date(olderMessages[0].timestamp).getTime();
          const lastTime = new Date(olderMessages[olderMessages.length - 1].timestamp).getTime();
          if (firstTime < lastTime) {
            olderMessages = [...olderMessages].reverse();
          }
        }
        queryClient.setQueryData(
          ['roomMessages', roomId],
          (old: ChatMessage[] | undefined) => {
            if (!old) return olderMessages;
            const existingIds = new Set(old.map((m) => String(m.id)));
            const newM = olderMessages.filter((m) => !existingIds.has(String(m.id)));
            return [...old, ...newM];
          }
        );
      }
    } catch (e) {
      console.warn("Failed to fetch older room messages:", e);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, noMoreMessages, rawMessages, roomId, queryClient]);

  // When a new message arrives and the user is near the bottom, snap to it instantly.
  useEffect(() => {
    const count = rawMessages.length;
    if (count > prevMsgCount.current && prevMsgCount.current > 0) {
      if (isAtBottom.current) {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }
    prevMsgCount.current = count;
  }, [rawMessages.length]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.type === "day") {
        return (
          <View style={styles.daySep}>
            <View
              style={[
                styles.daySepPill,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(0, 0, 0, 0.06)",
                },
              ]}
            >
              <Text
                style={[
                  styles.daySepText,
                  { color: isDark ? "rgba(255, 255, 255, 0.75)" : muted },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </View>
        );
      }
      const msg: ChatMessage = item;
      const isMe = String(msg.sender) === String(currentUserId);
      
      const nextItem = listData[index - 1]; // inverted list: next in array = older
      const isLast = !nextItem || (nextItem as any).type === "day" || String((nextItem as ChatMessage).sender) !== String(msg.sender);
      const showAvatar = !isMe && isLast;

      return (
        <MessageBubble
          msg={msg}
          isMe={isMe}
          showAvatar={showAvatar}
          isLast={isLast}
          nameColor={nameColors[msg.sender] || muted}
          onLongPress={handleMessageLongPress}
        />
      );
    },
    [currentUserId, listData, isDark, muted, nameColors, handleMessageLongPress]
  );


  const isLoading = historyQuery.isLoading && rawMessages.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: border + "44", backgroundColor: background }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: card }]}>
            <Text style={{ color: muted, fontWeight: "700", fontSize: 16 }}>
              {title?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.headerName, { color: textColor }]}>{title}</Text>
            <Text style={[styles.headerSub, { color: muted }]}>
              {roomQuery.data || hasInitialMembership
                ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                : "Community Room"}
            </Text>
          </View>
        </View>

        <Pressable onPress={openActionMenu} hitSlop={12} style={styles.backBtn}>
          <MoreVertical size={24} color={textColor} />
        </Pressable>
      </View>

      {/* ── Message list ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
          </View>
        ) : historyQuery.isError ? (
          <View style={styles.centered}>
            <Text style={{ color: muted, marginBottom: 12 }}>{"Couldn't load messages."}</Text>
            <Pressable onPress={() => historyQuery.refetch()}>
              <Text style={{ color: primary, fontWeight: "700" }}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={listData}
            renderItem={renderItem}
            keyExtractor={(item, i) =>
              (item as any).type === "day" ? `day-${i}` : String((item as ChatMessage).id)
            }
            inverted
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            windowSize={10}
            maxToRenderPerBatch={20}
            removeClippedSubviews={Platform.OS === "android"}
            onScroll={(e) => {
              isAtBottom.current = e.nativeEvent.contentOffset.y < 50;
            }}
            onScrollBeginDrag={() => {
              hasStartedPaging.current = true;
            }}
            scrollEventThrottle={16}
            onEndReached={() => {
              if (hasStartedPaging.current) void fetchOlderMessages();
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              isLoadingOlder ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator color={primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>👋</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>
                  Welcome to {title}!
                </Text>
                <Text style={[styles.emptySub, { color: muted }]}>
                  This is the beginning of the community conversation.
                </Text>
              </View>
            }
          />
        )}

        {/* ── Input bar / Join Gate ── */}
        {isMembershipLoading ? (
          <View
            style={[
              styles.joinBar,
              {
                backgroundColor: background,
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : border + "28",
                paddingBottom: Math.max(
                  insets.bottom + (Platform.OS === "android" ? 8 : 4),
                  Platform.OS === "android" ? 22 : 14,
                ),
              },
            ]}
          >
            <ActivityIndicator color={primary} />
          </View>
        ) : !isJoined ? (
          <View
            style={[
              styles.joinBar,
              {
                backgroundColor: background,
                borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : border + "28",
                paddingBottom: Math.max(
                  insets.bottom + (Platform.OS === "android" ? 8 : 4),
                  Platform.OS === "android" ? 22 : 14,
                ),
              },
            ]}
          >
            <Pressable 
              style={[styles.joinBtn, { backgroundColor: primary }]} 
              onPress={handleJoin}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.joinBtnText}>Join Room to Chat</Text>
              )}
            </Pressable>
          </View>
        ) : isCommQuotaExhausted ? (
          <View
            style={[
              styles.limitBanner,
              {
                backgroundColor: isDark ? "#2C2C2E" : "#F3F4F6",
                borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : border + "45",
                paddingBottom: Math.max(
                  insets.bottom + (Platform.OS === "android" ? 8 : 4),
                  Platform.OS === "android" ? 22 : 14,
                ),
              },
            ]}
          >
            <Lock size={18} color="#EF4444" />
            <Text style={[styles.limitBannerText, { color: textColor }]}>
              Daily limit reached ({commQuota?.used}/{commQuota?.limit}). Resets at midnight.
            </Text>
          </View>
        ) : (
          <>
            {/* ── Quick Emoji Bar ── */}

            {showEmojiPicker && (
              <View style={[styles.emojiBar, { backgroundColor: card, borderTopColor: border + "25" }]}>
                <FlatList
                  data={QUICK_EMOJIS}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 10 }}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch {}
                        setText((prev) => prev + item);
                      }}
                      style={({ pressed }) => [
                        styles.emojiItem,
                        pressed && { transform: [{ scale: 1.25 }] },
                      ]}
                    >
                      <Text style={{ fontSize: 24 }}>{item}</Text>
                    </Pressable>
                  )}
                />
              </View>
            )}

            {/* ── Input bar ── */}
            <View
              style={[
                styles.inputBar,
                {
                  backgroundColor: background,
                  borderTopColor: isDark ? "rgba(255, 255, 255, 0.08)" : border + "28",
                  paddingBottom: Math.max(
                    insets.bottom + (Platform.OS === "android" ? 8 : 4),
                    Platform.OS === "android" ? 22 : 14,
                  ),
                },
              ]}
            >
              {/* Main Input Capsule */}
              <View
                style={[
                  styles.inputPill,
                  {
                    backgroundColor: isDark ? "#1C1C1E" : card,
                    borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : border + "45",
                    minHeight: 48,
                    paddingHorizontal: 6,
                  },
                ]}
              >
                {/* Emoji button */}
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } catch {}
                    setShowEmojiPicker((prev) => !prev);
                  }}
                  hitSlop={6}
                  style={({ pressed }) => [
                    styles.pillIconBtn,
                    { backgroundColor: showEmojiPicker ? primary + "22" : isDark ? "rgba(255, 255, 255, 0.08)" : border + "35" },
                    pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                  ]}
                  accessibilityLabel="Choose emoji"
                  accessibilityRole="button"
                >
                  <Smile size={18} color={showEmojiPicker ? primary : muted} />
                </Pressable>

                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: textColor }]}
                  value={text}
                  onChangeText={setText}
                  onFocus={() => setShowEmojiPicker(false)}
                  placeholder="Message…"
                  placeholderTextColor={muted}
                  multiline
                  maxLength={2000}
                  returnKeyType="default"
                />
              </View>

              {/* Send button */}
              <Pressable
                onPress={handleSend}
                disabled={!text.trim()}
                style={({ pressed }) => [
                  styles.sendBtn,
                  {
                    backgroundColor: text.trim()
                      ? primary
                      : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                  },
                  text.trim() && Platform.OS === "ios" && { shadowColor: primary },
                  pressed && text.trim() && { transform: [{ scale: 0.94 }], opacity: 0.92 },
                ]}
                accessibilityLabel="Send message"
                accessibilityRole="button"
              >
                <Send
                  size={20}
                  color={text.trim() ? "#FFFFFF" : muted}
                  strokeWidth={2.4}
                  style={{ marginLeft: 2 }}
                />
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", marginLeft: 2 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerAvatarFallback: { alignItems: "center", justifyContent: "center" },
  headerName: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 1 },

  // Day separator
  daySep: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  daySepPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daySepText: {
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Empty state
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Join Bar
  joinBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  limitBannerText: {
    fontSize: 13,
    fontWeight: "600",
  },
  joinBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  joinBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Emoji Bar
  emojiBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  emojiItem: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  pillIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
    marginBottom: Platform.OS === "ios" ? 1 : 0,
  },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 4 : 2,
    minHeight: 48,
    maxHeight: 120,
  },
  input: {
    flex: 1,
    fontSize: 15.5,
    lineHeight: 20,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "ios" ? 8 : 6,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    textAlignVertical: "center",
    maxHeight: 110,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
});
