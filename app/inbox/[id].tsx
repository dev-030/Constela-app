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
  Platform,
  Keyboard,
  Animated,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
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
  Camera,
  Mic,
  Play,
  Pause,
  Trash2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useDirectHistoryQuery } from "@/api/messages";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { apiClient } from "@/api/client";
import { useBlockUserMutation, useUnmatchMutation, useUnfriendMutation } from "@/api/matching";
import { useReportUserMutation } from "@/api/settings";
import type { DirectMessage } from "@/api/messages";
import { useAndroidBack } from "@/hooks/useAndroidBack";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "h:mm a");
}

function getReplyPreviewText(msg: { content?: string | null; image_url?: string | null; audio_url?: string | null }) {
  if (msg.image_url) {
    return msg.content ? `📷 Photo: ${msg.content}` : "📷 Photo";
  }
  if (msg.audio_url) return "🎤 Voice message";
  return msg.content || "";
}

function formatDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.round(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
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


// ─── LiveWaveform (Recording Visualizer) ──────────────────────────────────

function LiveWaveform({ isRecording, color }: { isRecording: boolean; color: string }) {
  const anim1 = useRef(new Animated.Value(0.3)).current;
  const anim2 = useRef(new Animated.Value(0.6)).current;
  const anim3 = useRef(new Animated.Value(0.2)).current;
  const anim4 = useRef(new Animated.Value(0.85)).current;
  const anim5 = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!isRecording) return;
    const makeLoop = (val: Animated.Value, high: number, low: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: high, duration, useNativeDriver: false }),
          Animated.timing(val, { toValue: low, duration: duration * 0.9, useNativeDriver: false }),
          Animated.timing(val, { toValue: (high + low) * 0.6, duration: duration * 0.75, useNativeDriver: false }),
          Animated.timing(val, { toValue: low * 1.3, duration: duration * 1.1, useNativeDriver: false }),
        ])
      );

    const a1 = makeLoop(anim1, 1.0, 0.2, 280);
    const a2 = makeLoop(anim2, 0.9, 0.15, 340);
    const a3 = makeLoop(anim3, 0.85, 0.25, 220);
    const a4 = makeLoop(anim4, 0.95, 0.18, 300);
    const a5 = makeLoop(anim5, 0.75, 0.22, 260);

    a1.start();
    a2.start();
    a3.start();
    a4.start();
    a5.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      a4.stop();
      a5.stop();
    };
  }, [isRecording]);

  const bars = [
    anim1, anim3, anim2, anim5, anim4,
    anim2, anim1, anim4, anim3, anim5,
    anim2, anim4, anim1, anim3, anim5,
    anim4, anim2, anim1,
  ];

  return (
    <View style={waveformStyles.wrap}>
      {bars.map((anim, idx) => {
        const barH = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 22],
        });
        return (
          <Animated.View
            key={idx}
            style={[
              waveformStyles.bar,
              {
                height: barH,
                backgroundColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const waveformStyles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 6,
    height: 30,
  },
  bar: {
    width: 2.5,
    borderRadius: 1.5,
    opacity: 0.85,
  },
});

// ─── MessageBubble ──────────────────────────────────────────────────────────

const VOICE_WAVEFORM_HEIGHTS = [
  6, 12, 18, 10, 16, 22, 14, 8, 18, 24,
  16, 10, 14, 20, 26, 18, 12, 8, 14, 22,
  18, 12, 16, 20, 14, 8, 12, 6,
];

function VoiceMessage({
  audioUrl,
  duration,
  isMe,
  timestamp,
  isRead,
}: {
  audioUrl: string;
  duration?: number | null;
  isMe: boolean;
  timestamp: string;
  isRead?: boolean;
}) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const shownDuration = status.duration || duration || 0;

  const togglePlayback = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (status.playing) {
      player.pause();
      return;
    }
    if (shownDuration && status.currentTime >= shownDuration) {
      player.seekTo(0);
    }
    player.play();
  };

  const progress = shownDuration > 0 ? Math.min(status.currentTime / shownDuration, 1) : 0;

  const handleSeek = (e: any) => {
    const { locationX } = e.nativeEvent;
    const totalWaveWidth = 140;
    const clampedX = Math.max(0, Math.min(locationX, totalWaveWidth));
    const seekPercent = clampedX / totalWaveWidth;
    if (shownDuration > 0) {
      player.seekTo(seekPercent * shownDuration);
    }
  };

  return (
    <View style={voiceStyles.container}>
      {/* Play/Pause circular button */}
      <Pressable
        onPress={togglePlayback}
        style={({ pressed }) => [
          voiceStyles.playBtn,
          {
            backgroundColor: isMe ? "#FFFFFF" : "#0084ff",
          },
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
        accessibilityLabel={status.playing ? "Pause voice message" : "Play voice message"}
        accessibilityRole="button"
      >
        {status.playing ? (
          <Pause
            size={16}
            color={isMe ? "#0084ff" : "#FFFFFF"}
            fill={isMe ? "#0084ff" : "#FFFFFF"}
          />
        ) : (
          <Play
            size={16}
            color={isMe ? "#0084ff" : "#FFFFFF"}
            fill={isMe ? "#0084ff" : "#FFFFFF"}
            style={{ marginLeft: 2 }}
          />
        )}
      </Pressable>

      {/* Waveform + Duration & Time Row */}
      <View style={voiceStyles.contentCol}>
        {/* Audio Waveform */}
        <Pressable onPress={handleSeek} style={voiceStyles.waveformRow}>
          {VOICE_WAVEFORM_HEIGHTS.map((h, i) => {
            const barFraction = i / (VOICE_WAVEFORM_HEIGHTS.length - 1);
            const isPlayed = progress >= barFraction;
            return (
              <View
                key={i}
                style={[
                  voiceStyles.waveformBar,
                  {
                    height: h,
                    backgroundColor: isMe
                      ? isPlayed
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.42)"
                      : isPlayed
                      ? "#0084ff"
                      : "rgba(0, 132, 255, 0.28)",
                  },
                ]}
              />
            );
          })}
        </Pressable>

        {/* Bottom meta row: Duration on left, Time + ticks on right */}
        <View style={voiceStyles.metaRow}>
          <Text
            style={[
              voiceStyles.durationText,
              { color: isMe ? "rgba(255, 255, 255, 0.9)" : "#4B5563" },
            ]}
          >
            {formatDuration(status.playing ? status.currentTime : shownDuration)}
          </Text>

          <View style={voiceStyles.timeWrap}>
            <Text
              style={[
                voiceStyles.timeText,
                { color: isMe ? "rgba(255, 255, 255, 0.75)" : "#9CA3AF" },
              ]}
            >
              {formatMessageTime(timestamp)}
            </Text>
            {isMe && (
              <View style={{ marginLeft: 3 }}>
                {isRead ? (
                  <CheckCheck size={12} color="#FFFFFF" />
                ) : (
                  <Check size={12} color="rgba(255, 255, 255, 0.75)" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const voiceStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 2,
    minWidth: 195,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  contentCol: {
    flex: 1,
    justifyContent: "center",
  },
  waveformRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 28,
    gap: 2.5,
    paddingVertical: 2,
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  durationText: {
    fontSize: 11.5,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.2,
  },
  timeWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 10.5,
  },
});

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

          {/* Audio Message (WhatsApp-style) */}
          {msg.audio_url ? (
            <VoiceMessage
              audioUrl={msg.audio_url}
              duration={msg.audio_duration}
              isMe={isMe}
              timestamp={msg.timestamp}
              isRead={!!msg.read_at}
            />
          ) : (
            <>
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
            </>
          )}

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
  row: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, marginVertical: 2 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  avatarCol: { marginRight: 6, marginBottom: 2 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
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
  useAndroidBack();
  const background = useColor("background");
  const primary = useColor("primary");
  const textColor = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const card = useColor("card");

  type ChatMenuItem = { key: string; label: string; onPress: () => void };
  const [chatMenuItems, setChatMenuItems] = useState<ChatMenuItem[]>([]);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const destructive = "#ef4444";

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
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const recordingStartedAt = useRef(0);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingDotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingDotOpacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
          Animated.timing(recordingDotOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      recordingDotOpacity.setValue(1);
    }
  }, [isRecording, recordingDotOpacity]);

  const { mutate: blockUser } = useBlockUserMutation();
  const { mutate: unmatchUser } = useUnmatchMutation();
  const { mutate: unfriendUser } = useUnfriendMutation();
  const { mutate: reportUser } = useReportUserMutation();

  const openActionMenu = useCallback(() => {
    const items: ChatMenuItem[] = [];

    if (type !== "friends") {
      items.push({
        key: "unmatch",
        label: "Remove from Matches",
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
      items.push({
        key: "unfriend",
        label: "Unfriend",
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

    items.push({
      key: "report",
      label: "Report User",
      onPress: () => {
        Alert.alert("Report User", "Please select a reason", [
          { text: "Fake Profile", onPress: () => reportUser({ reported_user: recipientId, reason: "fake_profile" }, { onSuccess: () => Alert.alert("Reported", "Thank you for keeping the community safe.") }) },
          { text: "Offensive Language", onPress: () => reportUser({ reported_user: recipientId, reason: "offensive_language" }, { onSuccess: () => Alert.alert("Reported", "Thank you for keeping the community safe.") }) },
          { text: "Harassment", onPress: () => reportUser({ reported_user: recipientId, reason: "harassment" }, { onSuccess: () => Alert.alert("Reported", "Thank you for keeping the community safe.") }) },
          { text: "Cancel", style: "cancel" },
        ]);
      },
    });

    items.push({
      key: "block",
      label: "Block User",
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

    setChatMenuItems(items);
    setChatMenuOpen(true);
  }, [recipientId, type, blockUser, unmatchUser, unfriendUser, reportUser]);

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
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    sendDirectMessage(recipientId, trimmed, undefined, undefined, undefined, replyingTo?.id);
    setText("");
    setReplyingTo(null);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTypingSent.current = false;
    sendTyping(recipientId, false);
  }, [text, recipientId, replyingTo, sendDirectMessage, sendTyping]);

  const uploadAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
    const filename = asset.fileName || asset.uri.split("/").pop() || "photo.jpg";
    const ext = /\.([a-zA-Z]+)$/.exec(filename)?.[1] ?? "jpeg";
    const formData = new FormData();
    formData.append("image", { uri: asset.uri, name: filename, type: `image/${ext}` } as any);
    setIsUploadingImage(true);
    try {
      const res = await apiClient.post<{ image_url: string }>("/api/chat/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendDirectMessage(recipientId, "", res.data.image_url, undefined, undefined, replyingTo?.id);
      setReplyingTo(null);
    } catch {
      Alert.alert("Upload Failed", "Couldn't upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const pickImage = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need gallery access to share photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      await uploadAndSendImage(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "We need camera access to take photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      await uploadAndSendImage(result.assets[0]);
    }
  };

  const cancelRecording = useCallback(async () => {
    if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
    setIsRecording(false);
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
  }, [audioRecorder]);

  const stopAndSendVoice = useCallback(async () => {
    if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
    setIsRecording(false);
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const duration = Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000));
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri) throw new Error("Recording file unavailable");

      const formData = new FormData();
      formData.append("audio", { uri, name: "voice-message.m4a", type: "audio/mp4" } as any);
      setIsUploadingAudio(true);
      const res = await apiClient.post<{ audio_url: string }>("/api/chat/upload-audio/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendDirectMessage(recipientId, "", undefined, res.data.audio_url, duration, replyingTo?.id);
      setReplyingTo(null);
    } catch {
      Alert.alert("Voice message failed", "Couldn't send the recording. Please try again.");
    } finally {
      setIsUploadingAudio(false);
    }
  }, [audioRecorder, recipientId, replyingTo, sendDirectMessage]);

  const handleMicPress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    if (isRecording) {
      await stopAndSendVoice();
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow microphone access to send voice messages.");
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      recordingStartedAt.current = Date.now();
      audioRecorder.record();
      setIsRecording(true);
      recordingTimeout.current = setTimeout(() => { void stopAndSendVoice(); }, 5 * 60 * 1000);
    } catch {
      await setAudioModeAsync({ allowsRecording: false });
      Alert.alert("Recording failed", "Couldn't start the microphone. Please try again.");
    }
  };

  useEffect(() => () => {
    if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
  }, []);

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
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={primary} />
          </View>
        ) : historyQuery.isError ? (
          <View style={styles.centered}>
            <Text style={{ color: muted, marginBottom: 12 }}>Couldn&apos;t load messages.</Text>
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
          <View
            style={[
              styles.replyBar,
              {
                backgroundColor: card,
                borderLeftColor: primary,
                borderColor: border + "35",
              },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={[styles.replyUser, { color: primary }]}>
                Replying to {replyingTo.sender === recipientId ? recipientUsername : "You"}
              </Text>
              <Text style={[styles.replyPreview, { color: muted }]} numberOfLines={1}>
                {getReplyPreviewText(replyingTo)}
              </Text>
            </View>
            {replyingTo.image_url && (
              <Image
                source={{ uri: replyingTo.image_url }}
                style={styles.replyThumbnail}
              />
            )}
            <Pressable
              onPress={() => setReplyingTo(null)}
              hitSlop={8}
              style={styles.replyCloseBtn}
              accessibilityLabel="Cancel reply"
            >
              <X size={16} color={muted} />
            </Pressable>
          </View>
        )}

        {/* ── Input bar ── */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: background,
              borderTopColor: border + "28",
              paddingBottom: Math.max(insets.bottom, 10),
              alignItems: isRecording ? "center" : "flex-end",
            },
          ]}
        >
          {/* Main Input Capsule */}
          <View
            style={[
              styles.inputPill,
              {
                backgroundColor: card,
                borderColor: isRecording ? primary + "55" : border + "45",
                minHeight: 48,
                height: isRecording ? 48 : undefined,
                paddingHorizontal: isRecording ? 8 : 6,
              },
            ]}
          >
            {isRecording ? (
              <View style={styles.recordingRow}>
                {/* Discard button */}
                <Pressable
                  onPress={() => {
                    try {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    } catch {}
                    cancelRecording();
                  }}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.discardBtn,
                    pressed && { opacity: 0.6, transform: [{ scale: 0.92 }] },
                  ]}
                  accessibilityLabel="Cancel recording"
                  accessibilityRole="button"
                >
                  <Trash2 size={18} color="#EF4444" />
                </Pressable>

                {/* Blinking Live Indicator + Monospace Timer */}
                <View style={styles.recTimerWrap}>
                  <Animated.View style={[styles.recDot, { opacity: recordingDotOpacity }]} />
                  <Text style={[styles.recTimerText, { color: textColor }]}>
                    {formatDuration(recorderState.durationMillis / 1000)}
                  </Text>
                </View>

                {/* Animated soundwave visualizer */}
                <LiveWaveform isRecording={isRecording} color={primary} />
              </View>
            ) : (
              <>
                <Pressable
                  onPress={pickImage}
                  hitSlop={8}
                  style={({ pressed }) => [styles.pillIconBtn, pressed && { opacity: 0.6 }]}
                  accessibilityLabel="Attach photo from gallery"
                  accessibilityRole="button"
                >
                  <Paperclip size={20} color={muted} />
                </Pressable>

                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: textColor }]}
                  value={text}
                  onChangeText={handleTextChange}
                  placeholder="Message…"
                  placeholderTextColor={muted}
                  multiline
                  maxLength={2000}
                  returnKeyType="default"
                />

                {!text.trim() && (
                  <Pressable
                    onPress={takePhoto}
                    hitSlop={8}
                    style={({ pressed }) => [styles.pillIconBtn, pressed && { opacity: 0.6 }]}
                    accessibilityLabel="Take photo with camera"
                    accessibilityRole="button"
                  >
                    <Camera size={20} color={muted} />
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* Action button: Vibrant Primary Send if text/uploading/recording, Tactile Mic if empty */}
          {text.trim() || isUploadingImage || isUploadingAudio || isRecording ? (
            <Pressable
              onPress={isRecording ? stopAndSendVoice : handleSend}
              disabled={isUploadingImage || isUploadingAudio}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: primary },
                Platform.OS === "ios" && { shadowColor: primary },
                pressed && { transform: [{ scale: 0.94 }], opacity: 0.92 },
              ]}
              accessibilityLabel={isRecording ? "Send voice message" : "Send message"}
              accessibilityRole="button"
            >
              {isUploadingImage || isUploadingAudio ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Send size={18} color="#FFFFFF" style={{ marginLeft: 1 }} />
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={handleMicPress}
              style={({ pressed }) => [
                styles.micBtn,
                {
                  backgroundColor: card,
                  borderColor: border + "45",
                },
                pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
              ]}
              accessibilityLabel="Record voice message"
              accessibilityRole="button"
            >
              <Mic size={20} color={primary} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ── Chat Action Menu ── */}
      <Modal
        visible={chatMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setChatMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setChatMenuOpen(false)}>
          <View style={styles.actionMenuOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.actionMenuSheet, { backgroundColor: card }]}>
                <Text
                  style={{
                    color: muted,
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    paddingHorizontal: 16,
                    paddingTop: 14,
                    paddingBottom: 8,
                  }}
                >
                  Chat Options
                </Text>
                {chatMenuItems.map((item, i) => (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setChatMenuOpen(false);
                      item.onPress();
                    }}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                      borderTopColor: border,
                    }}
                  >
                    <Text
                      style={{
                        color: destructive,
                        fontSize: 16,
                        fontWeight: "600",
                        textAlign: "center",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setChatMenuOpen(false)}
                  style={{
                    marginTop: 8,
                    marginHorizontal: 12,
                    marginBottom: 12,
                    paddingVertical: 14,
                    borderRadius: 12,
                    backgroundColor: background,
                    borderWidth: 1,
                    borderColor: border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: 16,
                      fontWeight: "700",
                    }}
                  >
                    Cancel
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
            <Pressable
              onPress={() => setReactingToMessage(null)}
              hitSlop={12}
              style={styles.reactionPickerCancel}
            >
              <X size={20} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "600", marginLeft: 6 }}>
                Cancel
              </Text>
            </Pressable>
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
    marginHorizontal: 12,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 3.5,
  },
  replyUser: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  replyPreview: { fontSize: 13 },
  replyCloseBtn: {
    padding: 4,
    marginLeft: 6,
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
  recordingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    height: 44,
  },
  discardBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  recTimerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
    marginRight: 4,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  recTimerText: {
    fontSize: 14.5,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.2,
  },
  pillIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    marginBottom: 1,
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
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  micBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  actionMenuSheet: {
    width: "100%",
    borderRadius: 16,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
  reactionPickerCancel: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  replyThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginLeft: 8,
  },
});
