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
  Keyboard,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import {
  ChevronLeft,
  Paperclip,
  Send,
  X,
  Reply,
  CheckCheck,
  Check,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useDirectHistoryQuery } from "@/api/messages";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { apiClient } from "@/api/client";
import { useBlockUserMutation, useUnmatchMutation, useUnfriendMutation } from "@/api/matching";
import type { DirectMessage } from "@/api/messages";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "h:mm a");
}

function getReplyPreviewText(msg: { content?: string | null; image_url?: string | null }) {
  if (msg.image_url) {
    return msg.content ? `📷 Photo: ${msg.content}` : "📷 Photo";
  }
  return msg.content || "";
}

function formatDayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d, yyyy");
}

// Group messages by day so we can render day-separator labels
function groupMessagesByDay(messages: DirectMessage[]) {
  const groups: { label: string; data: DirectMessage[] }[] = [];
  let lastLabel = "";
  // messages are newest-first; reverse to oldest-first for grouping
  const sorted = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
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
  const items: Array<DirectMessage | { type: "day"; label: string }> = [];
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

// ─── TypingDots ─────────────────────────────────────────────────────────────

function TypingDots({ recipientPhoto }: { recipientPhoto: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      );
    const a1 = anim(dot1, 0);
    const a2 = anim(dot2, 150);
    const a3 = anim(dot3, 300);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={typingStyles.row}>
      {recipientPhoto ? (
        <Image source={{ uri: recipientPhoto }} style={typingStyles.avatar} />
      ) : (
        <View style={[typingStyles.avatar, { backgroundColor: "#E5E7EB" }]} />
      )}
      <View style={typingStyles.bubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 6 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#9CA3AF" },
});

// ─── MessageBubble ──────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  showAvatar,
  recipientPhoto,
  onReply,
  isLast,
  onLongPress,
}: {
  msg: DirectMessage;
  isMe: boolean;
  showAvatar: boolean;
  recipientPhoto: string;
  onReply: (msg: DirectMessage) => void;
  isLast: boolean;
  onLongPress: (msg: DirectMessage) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [0, 40, 80],
      outputRange: [-15, 0, 8],
      extrapolate: 'clamp',
    });
    return (
      <View style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Reply size={18} color="#0084ff" />
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={isMe ? undefined : renderLeftActions}
      renderRightActions={isMe ? renderLeftActions : undefined}
      friction={2}
      leftThreshold={30}
      rightThreshold={30}
      onSwipeableWillOpen={() => {
        onReply(msg);
        setTimeout(() => {
          swipeableRef.current?.close();
        }, 100);
      }}
    >
      <Pressable
        onLongPress={() => onLongPress(msg)}
        style={[
          bubbleStyles.row,
          isMe ? bubbleStyles.rowRight : bubbleStyles.rowLeft,
          msg.reaction ? { marginBottom: 10 } : null
        ]}
      >
        {/* Avatar on the left for received messages */}
        {!isMe && (
          <View style={bubbleStyles.avatarCol}>
            {showAvatar ? (
              recipientPhoto ? (
                <Image source={{ uri: recipientPhoto }} style={bubbleStyles.avatar} />
              ) : (
                <View style={[bubbleStyles.avatar, { backgroundColor: "#E5E7EB" }]} />
              )
            ) : (
              <View style={{ width: 28 }} />
            )}
          </View>
        )}

        <View style={[
          bubbleStyles.bubble,
          isMe ? bubbleStyles.bubbleRight : bubbleStyles.bubbleLeft,
          msg.reply_to_info ? { minWidth: 220 } : null
        ]}>
          {/* Reply preview */}
          {msg.reply_to_info && (
            <View style={[bubbleStyles.replyQuote, isMe ? bubbleStyles.replyQuoteRight : bubbleStyles.replyQuoteLeft]}>
              <View style={[bubbleStyles.replyBar, { backgroundColor: isMe ? "rgba(255,255,255,0.7)" : "#0084ff" }]} />
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={[bubbleStyles.replyText, { color: isMe ? "rgba(255,255,255,0.8)" : "#4B5563" }]} numberOfLines={2}>
                  {getReplyPreviewText(msg.reply_to_info)}
                </Text>
              </View>
              {msg.reply_to_info.image_url && (
                <Image
                  source={{ uri: msg.reply_to_info.image_url }}
                  style={bubbleStyles.replyThumbnail}
                />
              )}
            </View>
          )}

          {/* Image */}
          {msg.image_url && (
            <Image
              source={{ uri: msg.image_url }}
              style={bubbleStyles.image}
              resizeMode="cover"
            />
          )}

          {/* Text */}
          {!!msg.content && (
            <Text style={[bubbleStyles.text, isMe ? bubbleStyles.textRight : bubbleStyles.textLeft]}>
              {msg.content}
            </Text>
          )}

          {/* Time + read tick */}
          <View style={[bubbleStyles.footer, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
            <Text style={[bubbleStyles.time, { color: isMe ? "rgba(255,255,255,0.65)" : "#9CA3AF" }]}>
              {formatMessageTime(msg.timestamp)}
            </Text>
            {isMe && (
              <View style={{ marginLeft: 4 }}>
                {msg.read_at ? (
                  <CheckCheck size={13} color="rgba(255,255,255,0.85)" />
                ) : (
                  <Check size={13} color="rgba(255,255,255,0.65)" />
                )}
              </View>
            )}
          </View>

          {/* Reaction badge */}
          {msg.reaction && (
            <View style={[
              bubbleStyles.reactionBadge,
              isMe ? bubbleStyles.reactionBadgeRight : bubbleStyles.reactionBadgeLeft
            ]}>
              <Text style={{ fontSize: 12 }}>{msg.reaction}</Text>
            </View>
          )}
        </View>

        {/* Reply swipe hint (right side spacer for received) */}
        {!isMe && <View style={{ width: 44 }} />}
      </Pressable>
    </Swipeable>
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
  replyQuote: {
    flexDirection: "row",
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    gap: 6,
    overflow: "hidden",
  },
  replyQuoteRight: { backgroundColor: "rgba(0,0,0,0.12)" },
  replyQuoteLeft: { backgroundColor: "rgba(0,132,255,0.06)" },
  replyBar: { width: 4, borderRadius: 2, minHeight: 28 },
  replyUser: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  replyText: { fontSize: 12 },
  reactionBadge: {
    position: "absolute",
    bottom: -10,
    right: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionBadgeRight: {
    right: 12,
  },
  reactionBadgeLeft: {
    left: 12,
  },
  image: { width: 200, height: 200, borderRadius: 14, marginBottom: 4 },
  text: { fontSize: 16, lineHeight: 22 },
  textRight: { color: "#FFFFFF" },
  textLeft: { color: "#111827" },
  footer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  time: { fontSize: 11 },
  replyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginLeft: 8,
  },
});

// ─── Main Screen ────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const recipientId = typeof id === "string" ? id : (Array.isArray(id) ? id[0] : "");

  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const textColor = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const card = useColor("card");

  const { profile, fetchProfile } = useProfileStore();
  useEffect(() => { if (!profile) fetchProfile(); }, [profile, fetchProfile]);

  const recipientQuery = useGetProfileDetailsQuery(recipientId);
  const recipientUsername = recipientQuery.data?.username ?? "Conversation";
  const recipientPhoto =
    recipientQuery.data?.photos?.find((p: any) => p.is_main)?.image ??
    recipientQuery.data?.photos?.[0]?.image ??
    "";

  const currentUserId = profile?.id ?? "";
  const currentUserName = profile?.username ?? "You";

  const historyQuery = useDirectHistoryQuery(recipientId);

  const { sendDirectMessage, sendTyping, onTyping, setActiveRecipientId, onlineUsers, sendMessageReaction } = useChatSocket();

  useEffect(() => {
    setActiveRecipientId(recipientId);
    return () => {
      setActiveRecipientId(null);
    };
  }, [recipientId, setActiveRecipientId]);

  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [reactingToMessage, setReactingToMessage] = useState<DirectMessage | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);

  const { mutate: blockUser } = useBlockUserMutation();
  const { mutate: unmatchUser } = useUnmatchMutation();
  const { mutate: unfriendUser } = useUnfriendMutation();

  const openActionMenu = useCallback(() => {
    const options: any[] = [];

    if (type !== "friends") {
      options.push({
        text: "Remove from Matches",
        style: "destructive",
        onPress: () => {
          unmatchUser(recipientId, {
            onSuccess: () => {
              Alert.alert("Success", "User unmatched.");
              router.back();
            }
          });
        },
      });
    }

    if (type !== "dating") {
      options.push({
        text: "Unfriend",
        style: "destructive",
        onPress: () => {
          unfriendUser(recipientId, {
            onSuccess: () => {
              Alert.alert("Success", "Removed from friends.");
              router.back();
            }
          });
        },
      });
    }

    options.push({
      text: "Block User",
      style: "destructive",
      onPress: () => {
        Alert.alert("Confirm Block", "Are you sure you want to block this user?", [
          { text: "Cancel", style: "cancel" },
          { text: "Block", style: "destructive", onPress: () => {
            blockUser(recipientId, {
              onSuccess: () => {
                Alert.alert("Blocked", "User has been blocked.");
                router.back();
              }
            });
          }}
        ]);
      },
    });

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Chat Options", "Choose an action", options);
  }, [recipientId, type, blockUser, unmatchUser, unfriendUser]);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSent = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const prevMsgCount = useRef(0);

  // Subscribe to typing events from the global socket
  useEffect(() => {
    const unsub = onTyping((senderId, isTyp) => {
      if (String(senderId) === String(recipientId)) {
        setRecipientTyping(isTyp);
        if (isTyp) {
          // auto-clear after 5s in case stop event is missed
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setRecipientTyping(false), 5000);
        }
      }
    });
    return unsub;
  }, [onTyping, recipientId]);

  const handleTextChange = useCallback((val: string) => {
    setText(val);
    if (!isTypingSent.current && val.length > 0) {
      isTypingSent.current = true;
      sendTyping(recipientId, true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingSent.current = false;
      sendTyping(recipientId, false);
    }, 2000);
  }, [recipientId, sendTyping]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || !recipientId) return;
    sendDirectMessage(recipientId, trimmed, undefined, replyingTo?.id);
    setText("");
    setReplyingTo(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTypingSent.current = false;
    sendTyping(recipientId, false);
  }, [text, recipientId, replyingTo, sendDirectMessage, sendTyping]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need gallery access to share photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      const filename = asset.fileName || asset.uri.split("/").pop() || "photo.jpg";
      const ext = /\.([a-zA-Z]+)$/.exec(filename)?.[1] ?? "jpeg";
      const formData = new FormData();
      formData.append("image", { uri: asset.uri, name: filename, type: `image/${ext}` } as any);
      setIsUploadingImage(true);
      try {
        const res = await apiClient.post<{ image_url: string }>("/api/chat/upload-image/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        sendDirectMessage(recipientId, "", res.data.image_url, replyingTo?.id);
        setReplyingTo(null);
      } catch {
        Alert.alert("Upload Failed", "Couldn't upload image. Please try again.");
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  // Build the flat-list data
  const rawMessages = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const listData = useMemo(() => groupMessagesByDay(rawMessages), [rawMessages]);

  // When a new message arrives, scroll the inverted list to offset 0 (= newest)
  // without animation so there is no visible "bounce".
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
      const msg: DirectMessage = item;
      const isMe = String(msg.sender) === String(currentUserId);
      // show avatar only on last message in a run from this sender
      const nextItem = listData[index - 1]; // inverted list: next in array = older
      const showAvatar =
        !isMe &&
        (!nextItem || (nextItem as any).type === "day" || String((nextItem as DirectMessage).sender) !== String(msg.sender));

      return (
        <MessageBubble
          msg={msg}
          isMe={isMe}
          showAvatar={showAvatar}
          recipientPhoto={recipientPhoto}
          onReply={setReplyingTo}
          isLast={index === 0}
          onLongPress={setReactingToMessage}
        />
      );
    },
    [currentUserId, listData, recipientPhoto, border, muted]
  );

  const isLoading = historyQuery.isLoading && rawMessages.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: border + "44", backgroundColor: background }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </Pressable>

        <Pressable style={styles.headerCenter} onPress={() => {}}>
          {recipientPhoto ? (
            <View>
              <Image source={{ uri: recipientPhoto }} style={styles.headerAvatar} />
              {onlineUsers[recipientId] && <View style={styles.onlineDot} />}
            </View>
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: card }]}>
              <Text style={{ color: muted, fontWeight: "700", fontSize: 16 }}>
                {recipientUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.headerName, { color: textColor }]}>{recipientUsername}</Text>
            <Text style={[styles.headerSub, { color: muted }]}>
              {recipientTyping ? "typing…" : onlineUsers[recipientId] ? "Active now" : "Offline"}
            </Text>
          </View>
        </Pressable>

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
              (item as any).type === "day" ? `day-${i}` : String((item as DirectMessage).id)
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
                  Say hi to {recipientUsername}!
                </Text>
                <Text style={[styles.emptySub, { color: muted }]}>
                  This is the beginning of your conversation.
                </Text>
              </View>
            }
          />
        )}

        {/* ── Typing indicator ── */}
        {recipientTyping && (
          <View style={{ backgroundColor: background }}>
            <TypingDots recipientPhoto={recipientPhoto} />
          </View>
        )}

        {/* ── Reply preview bar ── */}
        {replyingTo && (
          <View style={[styles.replyBar, { backgroundColor: card, borderTopColor: border + "44" }]}>
            <Reply size={16} color={primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={[styles.replyPreview, { color: muted }]} numberOfLines={2}>
                {getReplyPreviewText(replyingTo)}
              </Text>
            </View>
            {replyingTo.image_url && (
              <Image
                source={{ uri: replyingTo.image_url }}
                style={styles.replyThumbnail}
              />
            )}
            <Pressable onPress={() => setReplyingTo(null)} hitSlop={10} style={{ marginLeft: 8 }}>
              <X size={18} color={muted} />
            </Pressable>
          </View>
        )}

        {/* ── Input bar ── */}
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
            <Pressable onPress={pickImage} hitSlop={8} style={styles.pillIcon}>
              <Paperclip size={20} color={muted} />
            </Pressable>

            <TextInput
              ref={inputRef}
              style={[styles.input, { color: textColor }]}
              value={text}
              onChangeText={handleTextChange}
              placeholder="Message…"
              placeholderTextColor={muted}
              maxLength={2000}
              returnKeyType="default"
            />
          </View>

          <Pressable
            onPress={handleSend}
            disabled={!text.trim() && !isUploadingImage}
            style={[
              styles.sendBtn,
              { backgroundColor: text.trim() ? "#0084ff" : card, borderColor: border + "55" },
            ]}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Send size={18} color={text.trim() ? "#FFF" : muted} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* ── Reaction Picker Overlay ── */}
      <Modal
        visible={!!reactingToMessage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setReactingToMessage(null)}
      >
        <TouchableWithoutFeedback onPress={() => setReactingToMessage(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.reactionPickerContainer}>
              {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => (
                <Pressable
                  key={emoji}
                  onPress={() => {
                    if (reactingToMessage) {
                      sendMessageReaction(reactingToMessage.id, emoji, recipientId);
                    }
                    setReactingToMessage(null);
                  }}
                  style={styles.reactionEmojiBtn}
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFF",
  },

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

  // Reply bar
  replyBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyUser: { fontSize: 13, fontWeight: "700", marginBottom: 1 },
  replyPreview: { fontSize: 13 },
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
  pillIcon: { paddingRight: 6 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  reactionPickerContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  reactionEmojiBtn: {
    padding: 2,
    transform: [{ scale: 1 }],
  },
  replyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginLeft: 8,
  },
});