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
  Image,
  ActivityIndicator,
  Alert,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text as RNText,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Send,
  MoreVertical,
  Reply,
  LogOut,
} from "lucide-react-native";
import { format, isToday, isYesterday } from "date-fns";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useChatRoomQuery, useJoinRoomMutation, useLeaveRoomMutation, useRoomMessagesQuery } from "@/api/chat";
import { useProfileStore } from "@/store/profileStore";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/api/chat";

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
  // Always sort oldest→newest before grouping so the logic is stable
  // regardless of whether the data came from the REST API or WS cache updates.
  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const groups: { label: string; data: ChatMessage[] }[] = [];
  let lastLabel = "";
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
    // Only push day separator if it is NOT "Today"
    if (g.label !== "Today") {
      items.push({ type: "day", label: g.label });
    }
    for (const msg of g.data.reverse()) {
      items.push(msg);
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
}: {
  msg: ChatMessage;
  isMe: boolean;
  showAvatar: boolean;
  isLast: boolean;
  nameColor: string;
}) {
  return (
    <View
      style={[
        bubbleStyles.row,
        isMe ? bubbleStyles.rowRight : bubbleStyles.rowLeft,
      ]}
    >
      {/* Avatar on the left for received messages */}
      {!isMe && (
        <View style={bubbleStyles.avatarCol}>
          {showAvatar ? (
            msg.sender_photo ? (
              <Image source={{ uri: msg.sender_photo }} style={bubbleStyles.avatar} />
            ) : (
              <View style={[bubbleStyles.avatar, { backgroundColor: "#E5E7EB", alignItems: 'center', justifyContent: 'center' }]}>
                 <Text style={{ fontSize: 10, fontWeight: "700", color: "#666" }}>
                   {msg.sender_name.charAt(0).toUpperCase()}
                 </Text>
              </View>
            )
          ) : (
            <View style={{ width: 28 }} />
          )}
        </View>
      )}

      <View style={[
        bubbleStyles.bubble,
        isMe ? bubbleStyles.bubbleRight : bubbleStyles.bubbleLeft,
      ]}>
        {/* Name Label */}
        {!isMe && showAvatar && (
          <Text style={[bubbleStyles.senderName, { color: nameColor }]}>
            {msg.sender_name}
          </Text>
        )}

        {/* Text */}
        {!!msg.content && (
          <Text style={[bubbleStyles.text, isMe ? bubbleStyles.textRight : bubbleStyles.textLeft]}>
            {msg.content}
          </Text>
        )}

        {/* Time */}
        <View style={[bubbleStyles.footer, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
          <Text style={[bubbleStyles.time, { color: isMe ? "rgba(255,255,255,0.65)" : "#9CA3AF" }]}>
            {formatMessageTime(msg.timestamp)}
          </Text>
        </View>
      </View>

      {/* Reply swipe hint (right side spacer for received) */}
      {!isMe && <View style={{ width: 44 }} />}
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 8, marginVertical: 1 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarCol: { marginRight: 6, marginBottom: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: {
    maxWidth: "72%",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleRight: {
    backgroundColor: "#0084ff",
    borderBottomRightRadius: 4,
  },
  bubbleLeft: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 22 },
  textRight: { color: "#FFFFFF" },
  textLeft: { color: "#111827" },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  time: { fontSize: 11 },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function CommunityChatScreen() {
  const { title, roomId } = useLocalSearchParams<{ title: string; roomId: string }>();

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

  const isJoined = roomQuery.data?.is_joined ?? false;

  const { sendRoomMessage, joinRoom, leaveRoom } = useChatSocket();
  const queryClient = useQueryClient();

  // Subscribe to the WS room group when screen is open
  useEffect(() => {
    if (!roomId) return;
    joinRoom(roomId);
    return () => {
      leaveRoom(roomId);
    };
  }, [roomId, joinRoom, leaveRoom]);

  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const prevMsgCount = useRef(0);

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

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !roomId) return;

    // Optimistic insert for sender — backend will echo it back via WS with a real id
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      room: roomId,
      sender: String(currentUserId),
      sender_name: profile?.username ?? "You",
      sender_photo: profile?.photos?.find((p: any) => p.is_main)?.image ?? profile?.photos?.[0]?.image ?? "",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    queryClient.setQueryData(
      ['roomMessages', roomId],
      (oldData: ChatMessage[] | undefined) => {
        if (!oldData) return [optimisticMsg];
        return [optimisticMsg, ...oldData];
      }
    );

    sendRoomMessage(roomId, trimmed);
    setText("");
  }, [text, roomId, currentUserId, profile, queryClient, sendRoomMessage]);

  const handleJoin = useCallback(() => {
    if (!roomId) return;
    joinMutation.mutate(roomId, {
      onError: () => Alert.alert("Error", "Could not join room.")
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

  useEffect(() => {
    const count = rawMessages.length;
    if (count > prevMsgCount.current && prevMsgCount.current > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
    prevMsgCount.current = count;
  }, [rawMessages.length]);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      if (item.type === "day") {
        return (
          <View style={styles.daySep}>
            <View style={[styles.daySepLine, { backgroundColor: border }]} />
            <Text style={[styles.daySepText, { color: muted }]}>{item.label}</Text>
            <View style={[styles.daySepLine, { backgroundColor: border }]} />
          </View>
        );
      }
      const msg: ChatMessage = item;
      const isMe = String(msg.sender) === String(currentUserId);
      
      const nextItem = listData[index - 1]; // inverted list: next in array = older
      const showAvatar =
        !isMe &&
        (!nextItem || (nextItem as any).type === "day" || String((nextItem as ChatMessage).sender) !== String(msg.sender));

      return (
        <MessageBubble
          msg={msg}
          isMe={isMe}
          showAvatar={showAvatar}
          isLast={index === 0}
          nameColor={nameColors[msg.sender] || muted}
        />
      );
    },
    [currentUserId, listData, border, muted, nameColors]
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
              {roomQuery.data ? `${roomQuery.data.member_count} members` : 'Community Room'}
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
          </View>
        ) : historyQuery.isError ? (
          <View style={styles.centered}>
            <Text style={{ color: muted, marginBottom: 12 }}>Couldn't load messages.</Text>
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
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            windowSize={10}
            maxToRenderPerBatch={20}
            removeClippedSubviews={Platform.OS === "android"}
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
        {!isJoined ? (
          <View
            style={[
              styles.joinBar,
              {
                backgroundColor: background,
                borderTopColor: border + "33",
                paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
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
        ) : (
          <View
            style={[
              styles.inputBar,
              {
                backgroundColor: background,
                borderTopColor: border + "33",
                paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
              },
            ]}
          >
            <View style={[styles.inputPill, { backgroundColor: card, borderColor: border + "55" }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: textColor }]}
                value={text}
                onChangeText={setText}
                placeholder="Message…"
                placeholderTextColor={muted}
                maxLength={2000}
                returnKeyType="default"
              />
            </View>

            <Pressable
              onPress={handleSend}
              disabled={!text.trim()}
              style={[
                styles.sendBtn,
                { backgroundColor: text.trim() ? "#0084ff" : card, borderColor: border + "55" },
              ]}
            >
              <Send size={18} color={text.trim() ? "#FFF" : muted} />
            </Pressable>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  daySepLine: { flex: 1, height: StyleSheet.hairlineWidth },
  daySepText: { fontSize: 12, fontWeight: "600" },

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
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  joinBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Input
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 0,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 0,
    paddingHorizontal: 4,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});