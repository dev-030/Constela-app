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
  Animated,
  Modal,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import { Image } from "expo-image";
import { Swipeable } from "react-native-gesture-handler";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
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
  ArrowUp,
  Square,
  Smile,
  Lock,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { File } from "expo-file-system";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
} from "expo-audio";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useDirectHistoryQuery } from "@/api/messages";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";
import { useChatSocket } from "@/api/ChatSocketProvider";
import { apiClient } from "@/api/client";
import { API_URL } from "@/constants/config";
import { useBlockUserMutation, useUnmatchMutation, useUnfriendMutation } from "@/api/matching";
import { useReportUserMutation } from "@/api/settings";
import type { DirectMessage } from "@/api/messages";
import { useTranslation } from "react-i18next";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { ReactionBar, ReactionPills, type ReactionAnchor } from "@/components/chat/message-reactions";

const QUICK_EMOJIS = [
  "😀", "😂", "🤣", "❤️", "😍", "🔥", "👍", "🙌",
  "🎉", "✨", "🥺", "🙏", "💯", "😎", "🥳", "👏",
  "😉", "🤔", "👀", "💪", "🥰", "😭", "😊", "🤩",
];

const HISTORY_PAGE_SIZE = 50;

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return format(date, "h:mm a");
}

function absoluteMediaUrl(url: string) {
  return /^(https?|file):/i.test(url) ? url : `${API_URL}${url}`;
}

function getReplyPreviewText(msg: { content?: string | null; image_url?: string | null; audio_url?: string | null }, t?: any) {
  if (msg.image_url) {
    return msg.content ? `📷 Photo: ${msg.content}` : "📷 Photo";
  }
  if (msg.audio_url) return t ? t('chat.voice_message', "Voice message") : "Voice message";
  return msg.content || "";
}

function formatDuration(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function formatDayLabel(timestamp: string, t: any): { label: string; isToday: boolean } {
  const date = new Date(timestamp);
  if (isToday(date)) return { label: t ? t('chat.today', "Today") : "Today", isToday: true };
  if (isYesterday(date)) return { label: t ? t('chat.yesterday', "Yesterday") : "Yesterday", isToday: false };
  return { label: format(date, "MMMM d, yyyy"), isToday: false };
}

// Group messages by day so we can render day-separator labels
function groupMessagesByDay(messages: DirectMessage[], t: any) {
  const groups: { label: string; isToday: boolean; data: DirectMessage[] }[] = [];
  let lastLabel = "";
  // messages are newest-first; reverse to oldest-first for grouping
  const sorted = [...messages].reverse();
  for (const msg of sorted) {
    const { label, isToday: msgIsToday } = formatDayLabel(msg.timestamp, t);
    if (label !== lastLabel) {
      groups.push({ label, isToday: msgIsToday, data: [msg] });
      lastLabel = label;
    } else {
      groups[groups.length - 1].data.push(msg);
    }
  }
  // Flatten back to a render-list (newest at index 0 for inverted FlatList)
  const items: Array<DirectMessage | { type: "day"; label: string }> = [];
  for (const g of groups.reverse()) {
    for (const msg of g.data.reverse()) {
      items.push(msg);
    }
    // In an inverted list, appending the separator makes it render above its day.
    if (!g.isToday) items.push({ type: "day", label: g.label });
  }
  return items;
}

// ─── TypingDots ─────────────────────────────────────────────────────────────

function TypingDots({ recipientPhoto }: { recipientPhoto: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const isDark = useColorScheme() === "dark";
  const bubbleBg = isDark ? "#262626" : "#E5E7EB";
  const dotColor = isDark ? "#9CA3AF" : "#6B7280";

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
        <Image
          source={{ uri: recipientPhoto }}
          style={typingStyles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : (
        <View style={[typingStyles.avatar, { backgroundColor: bubbleBg }]} />
      )}
      <View style={[typingStyles.bubble, { backgroundColor: bubbleBg }]}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View
            key={i}
            style={[typingStyles.dot, { backgroundColor: dotColor, transform: [{ translateY: dot }] }]}
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
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});


// ─── LiveWaveform (Recording Visualizer) ──────────────────────────────────

const LIVE_WAVEFORM_PEAKS = [
  0.45, 0.8, 0.6, 1, 0.7, 0.5, 0.85, 0.65,
  0.55, 0.95, 0.7, 0.5, 0.8, 0.6, 1, 0.7,
  0.5, 0.85, 0.65, 0.55, 0.95, 0.7, 0.5, 0.8,
  0.6, 1, 0.7, 0.5, 0.85, 0.65, 0.55, 0.9,
];

function LiveWaveform({ level, color }: { level: Animated.Value; color: string }) {

  return (
    <View style={waveformStyles.wrap}>
      {LIVE_WAVEFORM_PEAKS.map((peak, idx) => {
        return (
          <Animated.View
            key={idx}
            style={[
              waveformStyles.bar,
              {
                backgroundColor: color,
                transform: [{
                  scaleY: level.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.12, peak],
                  }),
                }],
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
    justifyContent: "space-between",
    paddingLeft: 10,
    paddingRight: 6,
    height: 30,
  },
  bar: {
    width: 2.5,
    height: 22,
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

const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 22050,
  numberOfChannels: 1,
  bitRate: 32000,
  isMeteringEnabled: true,
};

function VoiceMessage({
  messageId,
  audioUrl,
  audioUrlExpiresAt,
  duration,
  isMe,
  timestamp,
  isRead,
}: {
  messageId: string;
  audioUrl: string;
  audioUrlExpiresAt?: string | null;
  duration?: number | null;
  isMe: boolean;
  timestamp: string;
  isRead?: boolean;
}) {
  const isDark = useColorScheme() === "dark";

  // Ensure the audio URL is absolute, but ignore local file:// paths
  const fullAudioUrl = absoluteMediaUrl(audioUrl);
  const currentExpiry = useRef(audioUrlExpiresAt);
  const lastPropUrl = useRef(fullAudioUrl);
  const refreshingRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stream voice messages instead of retaining every recording in Expo's disk cache.
  const player = useAudioPlayer(fullAudioUrl);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    currentExpiry.current = audioUrlExpiresAt;
    if (lastPropUrl.current !== fullAudioUrl) {
      lastPropUrl.current = fullAudioUrl;
      player.replace(fullAudioUrl);
    }
  }, [audioUrlExpiresAt, fullAudioUrl, player]);

  const shownDuration = status.duration || duration || 0;

  const togglePlayback = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (status.playing) {
      player.pause();
      return;
    }

    const expiresAt = currentExpiry.current ? Date.parse(currentExpiry.current) : NaN;
    if (Number.isFinite(expiresAt) && Date.now() >= expiresAt - 5 * 60 * 1000) {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      setIsRefreshing(true);
      try {
        const response = await apiClient.get<DirectMessage>(`/api/chat/direct/${messageId}/`);
        if (!response.data.audio_url) throw new Error("Voice message is unavailable");
        const refreshedUrl = absoluteMediaUrl(response.data.audio_url);
        currentExpiry.current = response.data.audio_url_expires_at;
        player.replace(refreshedUrl);
      } catch {
        Alert.alert("Playback failed", "Couldn't refresh this voice message. Please try again.");
        return;
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
      }
    }
    // Ensure that audio plays even if the hardware silent switch is on (iOS)
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

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

  const primary = useColor("primary");
  const accentColor = primary;
  const playedWaveColor = primary;

  return (
    <View style={voiceStyles.container}>
      {/* Play/Pause circular button */}
      <Pressable
        onPress={togglePlayback}
        style={({ pressed }) => [
          voiceStyles.playBtn,
          {
            backgroundColor: isMe ? "#FFFFFF" : accentColor,
          },
          pressed && { transform: [{ scale: 0.92 }], opacity: 0.9 },
        ]}
        accessibilityLabel={status.playing ? "Pause voice message" : "Play voice message"}
        accessibilityRole="button"
      >
        {isRefreshing ? (
          <ActivityIndicator size="small" color={isMe ? accentColor : "#FFFFFF"} />
        ) : status.playing ? (
          <Pause
            size={16}
            color={isMe ? accentColor : "#FFFFFF"}
            fill={isMe ? accentColor : "#FFFFFF"}
          />
        ) : (
          <Play
            size={16}
            color={isMe ? accentColor : "#FFFFFF"}
            fill={isMe ? accentColor : "#FFFFFF"}
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
                      ? playedWaveColor
                      : isDark
                      ? "rgba(255, 255, 255, 0.22)"
                      : `${primary}47`,
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
              {
                color: isMe
                  ? "rgba(255, 255, 255, 0.9)"
                  : isDark
                  ? "rgba(255, 255, 255, 0.85)"
                  : "#374151",
              },
            ]}
          >
            {formatDuration(status.playing ? status.currentTime : shownDuration)}
          </Text>

          <View style={voiceStyles.timeWrap}>
            <Text
              style={[
                voiceStyles.timeText,
                {
                  color: isMe
                    ? "rgba(255, 255, 255, 0.75)"
                    : isDark
                    ? "rgba(255, 255, 255, 0.52)"
                    : "#9CA3AF",
                },
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

function ChatMessageImage({
  messageId,
  imageUrl,
  imageUrlExpiresAt,
  style,
  transition = 100,
}: {
  messageId: string;
  imageUrl: string;
  imageUrlExpiresAt?: string | null;
  style: any;
  transition?: number;
}) {
  const fullImageUrl = absoluteMediaUrl(imageUrl);
  const [sourceUrl, setSourceUrl] = useState(fullImageUrl);
  const refreshingRef = useRef(false);
  const retriedRef = useRef(false);

  const refreshImage = useCallback(async () => {
    if (refreshingRef.current || retriedRef.current) return;
    refreshingRef.current = true;
    retriedRef.current = true;
    try {
      const response = await apiClient.get<DirectMessage>(`/api/chat/direct/${messageId}/`);
      if (response.data.image_url) setSourceUrl(absoluteMediaUrl(response.data.image_url));
    } catch {
      // Keep the existing source; the user can retry by reopening the conversation.
    } finally {
      refreshingRef.current = false;
    }
  }, [messageId]);

  useEffect(() => {
    setSourceUrl(fullImageUrl);
    retriedRef.current = false;
  }, [fullImageUrl]);

  useEffect(() => {
    const expiresAt = imageUrlExpiresAt ? Date.parse(imageUrlExpiresAt) : NaN;
    if (Number.isFinite(expiresAt) && Date.now() >= expiresAt - 5 * 60 * 1000) {
      void refreshImage();
    }
  }, [imageUrlExpiresAt, refreshImage]);

  return (
    <Image
      source={{ uri: sourceUrl }}
      style={style}
      contentFit="cover"
      cachePolicy="memory"
      transition={transition}
      onError={() => { void refreshImage(); }}
    />
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
  onOpenPicker,
  myProfileId,
}: {
  msg: DirectMessage;
  isMe: boolean;
  showAvatar: boolean;
  recipientPhoto: string;
  onReply: (msg: DirectMessage) => void;
  isLast: boolean;
  onOpenPicker?: (anchor: ReactionAnchor) => void;
  myProfileId?: string | null;
}) {
  const swipeableRef = useRef<Swipeable>(null);
  const bubbleRef = useRef<View>(null);
  const isDark = useColorScheme() === "dark";
  const primary = useColor("primary");
  const leftBubbleBg = isDark ? "#242529" : "#F8F9FB";
  const leftBorderColor = isDark ? "rgba(255, 255, 255, 0.08)" : "#ECEFF3";
  const leftTextColor = isDark ? "#F9FAFB" : "#111827";
  const leftTimeColor = isDark ? "rgba(255, 255, 255, 0.55)" : "#6B7280";

  // Measure the bubble so the reaction bar can float right below it.
  const openReactionBar = () => {
    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onOpenPicker?.({ x, y, width, height });
    });
  };

  const renderLeftActions = (progress: any, dragX: any) => {
    const trans = dragX.interpolate({
      inputRange: [0, 40, 80],
      outputRange: [-15, 0, 8],
      extrapolate: 'clamp',
    });
    return (
      <View style={{ width: 50, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Reply size={18} color={primary} />
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
        onLongPress={openReactionBar}
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
              recipientPhoto ? (
                <Image
                  source={{ uri: recipientPhoto }}
                  style={bubbleStyles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={0}
                />
              ) : (
                <View style={[bubbleStyles.avatar, { backgroundColor: isDark ? "#38383A" : "#E5E7EB" }]} />
              )
            ) : (
              <View style={{ width: 28 }} />
            )}
          </View>
        )}

        <View style={bubbleStyles.bubbleColumn}>
        <View
          ref={bubbleRef}
          style={[
            bubbleStyles.bubble,
            isMe ? bubbleStyles.alignEnd : bubbleStyles.alignStart,
            isMe
              ? [bubbleStyles.bubbleRight, { backgroundColor: primary }, isLast && bubbleStyles.bubbleRightTail]
              : [
                  bubbleStyles.bubbleLeft,
                  { backgroundColor: leftBubbleBg, borderColor: leftBorderColor },
                  isLast && bubbleStyles.bubbleLeftTail,
                ],
            msg.reply_to_info ? { minWidth: 220 } : null,
          ]}
        >
          {/* Reply preview */}
          {msg.reply_to_info && (
            <View style={[
              bubbleStyles.replyQuote,
              isMe
                ? bubbleStyles.replyQuoteRight
                : [bubbleStyles.replyQuoteLeft, { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : `${primary}0F` }]
            ]}>
              <View style={[bubbleStyles.replyBar, { backgroundColor: isMe ? "rgba(255,255,255,0.7)" : primary }]} />
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={[bubbleStyles.replyText, { color: isMe ? "rgba(255,255,255,0.8)" : (isDark ? "#E5E7EB" : "#4B5563") }]} numberOfLines={2}>
                  {getReplyPreviewText(msg.reply_to_info)}
                </Text>
              </View>
              {msg.reply_to_info.image_url && (
                <ChatMessageImage
                  messageId={msg.reply_to_info.id}
                  imageUrl={msg.reply_to_info.image_url}
                  imageUrlExpiresAt={msg.reply_to_info.image_url_expires_at}
                  style={bubbleStyles.replyThumbnail}
                  transition={0}
                />
              )}
            </View>
          )}

          {/* Image */}
          {msg.image_url && (
            <ChatMessageImage
              messageId={msg.id}
              imageUrl={msg.image_url}
              imageUrlExpiresAt={msg.image_url_expires_at}
              style={bubbleStyles.image}
              transition={100}
            />
          )}

          {/* Audio Message (WhatsApp-style) */}
          {msg.audio_url ? (
            <VoiceMessage
              messageId={msg.id}
              audioUrl={msg.audio_url}
              audioUrlExpiresAt={msg.audio_url_expires_at}
              duration={msg.audio_duration}
              isMe={isMe}
              timestamp={msg.timestamp}
              isRead={!!msg.read_at}
            />
          ) : (
            <>
              {/* Text */}
              {!!msg.content && (
                <Text style={[bubbleStyles.text, isMe ? bubbleStyles.textRight : [bubbleStyles.textLeft, { color: leftTextColor }]]}>
                  {msg.content}
                </Text>
              )}

              {/* Time + read tick */}
              {isLast && (
                <View style={[bubbleStyles.footer, { justifyContent: isMe ? "flex-end" : "flex-start" }]}>
                  <Text style={[bubbleStyles.time, { color: isMe ? "rgba(255,255,255,0.65)" : leftTimeColor }]}>
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
              )}
            </>
          )}

          {/* Reaction badge stamped on the bubble corner */}
          <View
            style={[
              { position: "absolute", bottom: -12, zIndex: 10 },
              isMe ? { left: -14 } : { right: -8 },
            ]}
          >
            <ReactionPills
              reactions={msg.reactions}
              myProfileId={myProfileId}
              isMe={isMe}
              onOpenPicker={openReactionBar}
            />
          </View>
        </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, marginTop: 2, marginBottom: 4 },
  rowGroupEnd: { marginBottom: 10 },
  rowRight: { justifyContent: "flex-end" },
  rowLeft: { justifyContent: "flex-start" },
  // 20px matches bubbleColumn's reserved band so the avatar still lines up with the bubble.
  avatarCol: { marginRight: 6, marginBottom: 22 },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  bubbleColumn: {
    position: "relative",
    flexDirection: "column",
    flexShrink: 1,
    maxWidth: "76%",
    // Reserved band so a reaction badge never changes the row height.
    paddingBottom: 20,
  },
  alignEnd: { alignSelf: "flex-end" },
  alignStart: { alignSelf: "flex-start" },
  bubble: {
    maxWidth: "100%",
    // Gives short messages room at the corner for the reaction badge.
    minWidth: 100,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOpacity: 0,
    elevation: 0,
  },
  bubbleRight: {},
  bubbleRightTail: { borderBottomRightRadius: 5 },
  bubbleLeft: {
    backgroundColor: "#F8F9FB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  bubbleLeftTail: { borderBottomLeftRadius: 5 },
  replyQuote: {
    flexDirection: "row",
    borderRadius: 6,
    padding: 6,
    marginBottom: 4,
    gap: 6,
    overflow: "hidden",
  },
  replyQuoteRight: { backgroundColor: "rgba(0,0,0,0.12)" },
  replyQuoteLeft: {},
  replyBar: { width: 4, borderRadius: 2, minHeight: 28 },
  replyUser: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  replyText: { fontSize: 12 },
  reactionBadge: {
    position: "absolute",
    bottom: -10,
    right: 12,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1.5,
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
  const { id, type, photo: paramPhoto, username: paramUsername, name: paramName } = useLocalSearchParams();
  const recipientId = typeof id === "string" ? id : (Array.isArray(id) ? id[0] : "");
  const initialPhoto = typeof paramPhoto === "string" ? paramPhoto : "";
  const initialName = typeof paramName === "string" ? paramName : (typeof paramUsername === "string" ? paramUsername : "");

  const isDark = useColorScheme() === "dark";
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const goToMessages = useCallback(() => {
    router.dismissTo("/(tabs)/messages");
  }, []);
  useAndroidBack("/(tabs)/messages", true);
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
  const recipientUsername = initialName || recipientQuery.data?.name || recipientQuery.data?.username || "Conversation";
  const queryPhoto =
    recipientQuery.data?.photos?.find((p: any) => p.is_main)?.image ??
    recipientQuery.data?.photos?.[0]?.image;
  // Always prioritize initialPhoto from route params so the avatar never switches URI or blinks
  const recipientPhoto = initialPhoto || queryPhoto || "";

  const currentUserId = profile?.id ?? "";
  const currentUserName = profile?.username ?? "You";

  const dmQuota = profile?.access?.quotas.personal_messages;
  const isDmQuotaExhausted =
    dmQuota?.remaining != null &&
    dmQuota.remaining <= 0 &&
    (!dmQuota.resets_at || new Date(dmQuota.resets_at).getTime() > Date.now());

  const historyQuery = useDirectHistoryQuery(recipientId);
  const queryClient = useQueryClient();
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [noMoreMessages, setNoMoreMessages] = useState(false);

  const { sendDirectMessage, sendTyping, onTyping, setActiveRecipientId, onlineUsers, sendMessageReaction, queryPresence } = useChatSocket();

  useEffect(() => {
    setActiveRecipientId(recipientId);
    if (recipientId) {
      queryPresence(recipientId);
      const interval = setInterval(() => {
        queryPresence(recipientId);
      }, 15000);
      return () => {
        clearInterval(interval);
        setActiveRecipientId(null);
      };
    }
    return () => {
      setActiveRecipientId(null);
    };
  }, [recipientId, setActiveRecipientId, queryPresence]);

  const isRecipientOnline = useMemo(() => {
    if (!recipientId) return false;
    const rId = String(recipientId);
    return !!onlineUsers[rId] || !!onlineUsers[rId.toLowerCase()];
  }, [recipientId, onlineUsers]);

  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DirectMessage | null>(null);
  const [reactingToMessage, setReactingToMessage] = useState<DirectMessage | null>(null);
  const [reactionAnchor, setReactionAnchor] = useState<ReactionAnchor | null>(null);

  // Opens the reaction bar below a message (long press on the bubble).
  const openReactionBar = useCallback((message: DirectMessage, anchor: ReactionAnchor) => {
    setReactingToMessage(message);
    setReactionAnchor(anchor);
  }, []);

  // Dismisses the reaction bar (tap outside, emoji picked, ...).
  const closeReactionBar = useCallback(() => {
    setReactingToMessage(null);
    setReactionAnchor(null);
  }, []);

  // The server toggles on the same emoji, so every tap is a single toggle.
  // Always send the emoji instead of guessing null locally — that guess was
  // wrong whenever the cached actor_ids were stale, needing a second tap.
  const handleReact = useCallback(
    (message: DirectMessage, emoji: string) => {
      sendMessageReaction(message.id, emoji, recipientId);
    },
    [recipientId, sendMessageReaction],
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [recordDurationSeconds, setRecordDurationSeconds] = useState(0);
  const audioRecorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recordingStartedAt = useRef(0);
  const recordingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingDotOpacity = useRef(new Animated.Value(1)).current;
  const recordingLevel = useRef(new Animated.Value(0)).current;
  const smoothedRecordingLevel = useRef(0);

  useEffect(() => {
    if (!isRecording) {
      setRecordDurationSeconds(0);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const elapsedMs = Date.now() - recordingStartedAt.current;
      setRecordDurationSeconds(Math.floor(elapsedMs / 1000));
      timer = setTimeout(tick, Math.max(50, 1000 - (elapsedMs % 1000)));
    };
    tick();
    return () => clearTimeout(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      smoothedRecordingLevel.current = 0;
      recordingLevel.setValue(0);
      return;
    }

    const updateLevel = () => {
      const decibels = audioRecorder.getStatus().metering ?? -160;
      const rawLevel = decibels <= -48 ? 0 : Math.min(1, (decibels + 48) / 38);
      const previous = smoothedRecordingLevel.current;
      const next = rawLevel > previous
        ? previous * 0.2 + rawLevel * 0.8
        : previous * 0.72 + rawLevel * 0.28;
      smoothedRecordingLevel.current = next;
      Animated.timing(recordingLevel, {
        toValue: next,
        duration: rawLevel > previous ? 70 : 140,
        useNativeDriver: true,
      }).start();
    };

    updateLevel();
    const meter = setInterval(updateLevel, 100);
    return () => clearInterval(meter);
  }, [audioRecorder, isRecording, recordingLevel]);

  useEffect(() => {
    if (!isRecording) {
      recordingDotOpacity.setValue(1);
      return;
    }

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(recordingDotOpacity, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(recordingDotOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
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
        label: t('chat.unmatch_user', "Remove from Matches"),
        onPress: () => {
          unmatchUser(recipientId, {
            onSuccess: () => {
              Alert.alert(t('settings_pages.success', "Success"), t('chat.user_unmatched', "User unmatched."));
              goToMessages();
            }
          });
        },
      });
    }

    if (type !== "dating") {
      items.push({
        key: "unfriend",
        label: t('chat.unfriend_user', "Unfriend"),
        onPress: () => {
          unfriendUser(recipientId, {
            onSuccess: () => {
              Alert.alert(t('settings_pages.success', "Success"), t('chat.removed_from_friends', "Removed from friends."));
              goToMessages();
            }
          });
        },
      });
    }

    items.push({
      key: "report",
      label: t('chat.report_user', "Report User"),
      onPress: () => {
        Alert.alert(t('chat.report_user', "Report User"), t('chat.report_reason_prompt', "Please select a reason"), [
          { text: t('chat.report_fake', "Fake Profile"), onPress: () => reportUser({ reported_user: recipientId, reason: "fake_profile" }, { onSuccess: () => Alert.alert(t('chat.reported', "Reported"), t('chat.report_thank_you', "Thank you for keeping the community safe.")) }) },
          { text: t('chat.report_offensive', "Offensive Language"), onPress: () => reportUser({ reported_user: recipientId, reason: "offensive_language" }, { onSuccess: () => Alert.alert(t('chat.reported', "Reported"), t('chat.report_thank_you', "Thank you for keeping the community safe.")) }) },
          { text: t('chat.report_harassment', "Harassment"), onPress: () => reportUser({ reported_user: recipientId, reason: "harassment" }, { onSuccess: () => Alert.alert(t('chat.reported', "Reported"), t('chat.report_thank_you', "Thank you for keeping the community safe.")) }) },
          { text: t('chat.cancel', "Cancel"), style: "cancel" },
        ]);
      },
    });

    items.push({
      key: "block",
      label: t('chat.block_user', "Block User"),
      onPress: () => {
        Alert.alert(t('chat.confirm_block', "Confirm Block"), t('chat.confirm_block_desc', "Are you sure you want to block this user?"), [
          { text: t('chat.cancel', "Cancel"), style: "cancel" },
          { text: t('chat.block', "Block"), style: "destructive", onPress: () => {
            blockUser(recipientId, {
              onSuccess: () => {
                Alert.alert(t('chat.block', "Blocked"), t('chat.user_blocked', "User has been blocked."));
                goToMessages();
              }
            });
          }}
        ]);
      },
    });

    setChatMenuItems(items);
    setChatMenuOpen(true);
  }, [recipientId, type, blockUser, unmatchUser, unfriendUser, reportUser, goToMessages, t]);

  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSent = useRef(false);
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);
  const isAtBottom = useRef(true);
  const prevMsgCount = useRef(0);
  const hasStartedPaging = useRef(false);
  const initialHistoryPageFor = useRef<string | null>(null);

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
    if (isDmQuotaExhausted) {
      Alert.alert(
        "Daily Limit Reached",
        "You've reached your daily message limit. Upgrade your subscription or wait until midnight to send more."
      );
      return;
    }
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    sendDirectMessage(recipientId, trimmed, undefined, undefined, undefined, replyingTo?.id);
    setText("");
    setReplyingTo(null);
    // Scroll AFTER the render that inserts the optimistic message
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    isTypingSent.current = false;
    sendTyping(recipientId, false);
  }, [text, recipientId, replyingTo, isDmQuotaExhausted, sendDirectMessage, sendTyping]);

  const uploadAndSendImage = async (asset: ImagePicker.ImagePickerAsset) => {
    if (isDmQuotaExhausted) {
      Alert.alert(
        "Daily Limit Reached",
        "You've reached your daily message limit. Upgrade your subscription or wait until midnight to send more."
      );
      return;
    }
    const filename = asset.fileName || asset.uri.split("/").pop() || "photo.jpg";
    const ext = /\.([a-zA-Z]+)$/.exec(filename)?.[1] ?? "jpeg";
    const formData = new FormData();
    formData.append("image", { uri: asset.uri, name: filename, type: `image/${ext}` } as any);
    setIsUploadingImage(true);
    try {
      const res = await apiClient.post<{ image_url: string; image_ref: string }>("/api/chat/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendDirectMessage(recipientId, "", res.data.image_url, undefined, undefined, replyingTo?.id, undefined, res.data.image_ref);
      setReplyingTo(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
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
    let recordedUri = audioRecorder.uri;
    try {
      await audioRecorder.stop();
      recordedUri = audioRecorder.uri || recordedUri;
      await setAudioModeAsync({ allowsRecording: false });
    } catch {}
    if (recordedUri) {
      try {
        new File(recordedUri).delete();
      } catch {}
    }
  }, [audioRecorder]);

  const stopAndSendVoice = useCallback(async () => {
    if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
    setIsRecording(false);
    // If the quota is exhausted, stop the recording and discard it.
    if (isDmQuotaExhausted) {
      try {
        await audioRecorder.stop();
        await setAudioModeAsync({ allowsRecording: false });
        const uri = audioRecorder.uri;
        if (uri) { try { new File(uri).delete(); } catch {} }
      } catch {}
      Alert.alert(
        "Daily Limit Reached",
        "You've reached your daily message limit. Upgrade your subscription or wait until midnight to send more."
      );
      return;
    }
    let recordedUri: string | null = null;
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      recordedUri = uri;
      const duration = Math.max(1, Math.round((Date.now() - recordingStartedAt.current) / 1000));
      await setAudioModeAsync({ allowsRecording: false });
      if (!uri) throw new Error("Recording file unavailable");

      const formData = new FormData();
      formData.append("audio", { uri, name: "voice-message.m4a", type: "audio/mp4" } as any);
      setIsUploadingAudio(true);
      const res = await apiClient.post<{ audio_url: string; audio_ref: string }>("/api/chat/upload-audio/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendDirectMessage(recipientId, "", undefined, res.data.audio_url, duration, replyingTo?.id, res.data.audio_ref);
      setReplyingTo(null);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch {
      Alert.alert("Voice message failed", "Couldn't send the recording. Please try again.");
    } finally {
      if (recordedUri) {
        try {
          new File(recordedUri).delete();
        } catch {}
      }
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
  const listData = useMemo(() => groupMessagesByDay(rawMessages, t), [rawMessages, t]);

  useEffect(() => {
    if (!historyQuery.isSuccess || initialHistoryPageFor.current === recipientId) return;
    initialHistoryPageFor.current = recipientId;
    setNoMoreMessages(rawMessages.length < HISTORY_PAGE_SIZE);
  }, [historyQuery.isSuccess, rawMessages.length, recipientId]);

  const fetchOlderMessages = useCallback(async () => {
    if (isLoadingOlder || noMoreMessages || rawMessages.length === 0) return;
    setIsLoadingOlder(true);
    const oldestMsg = rawMessages[rawMessages.length - 1];
    try {
      const response = await apiClient.get<DirectMessage[]>(
        `/api/chat/direct/history/${recipientId}/`,
        { params: { before: oldestMsg.timestamp } }
      );
      const olderMessages = response.data;
      if (olderMessages.length < HISTORY_PAGE_SIZE) {
        setNoMoreMessages(true);
      }
      if (olderMessages.length > 0) {
        queryClient.setQueryData(
          ['directHistory', recipientId],
          (old: DirectMessage[] | undefined) => {
            if (!old) return olderMessages;
            // append strictly older ones (avoid duplicates just in case)
            const existingIds = new Set(old.map(m => m.id));
            const newM = olderMessages.filter(m => !existingIds.has(m.id));
            return [...old, ...newM];
          }
        );
      }
    } catch (e) {
      console.warn("Failed to fetch older messages:", e);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [isLoadingOlder, noMoreMessages, rawMessages, recipientId, queryClient]);

  // When a new message arrives and the user is near the bottom, snap to it instantly.
  // animated:false avoids competing with the FlatList's own scroll adjustments.
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
      const msg: DirectMessage = item;
      const isMe = String(msg.sender) === String(currentUserId);
      // The list is newest-first. The newest message in each sender run carries
      // the tail, timestamp, and (for received messages) the avatar.
      const nextItem = listData[index - 1]; // inverted list: next in array = older
      const isLast = !nextItem || (nextItem as any).type === "day" || String((nextItem as DirectMessage).sender) !== String(msg.sender);
      const showAvatar = !isMe && isLast;

      return (
        <MessageBubble
          msg={msg}
          isMe={isMe}
          showAvatar={showAvatar}
          recipientPhoto={recipientPhoto}
          onReply={setReplyingTo}
          isLast={isLast}
          onOpenPicker={(anchor) => openReactionBar(msg, anchor)}
          myProfileId={currentUserId}
        />
      );
    },
    [
      currentUserId, listData, recipientPhoto, border, muted,
      openReactionBar,
    ]
  );

  const isLoading = historyQuery.isLoading && rawMessages.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: border + "44", backgroundColor: background }]}>
        <Pressable onPress={goToMessages} hitSlop={12} style={styles.backBtn}>
          <ChevronLeft size={24} color={textColor} />
        </Pressable>

        <Pressable style={styles.headerCenter} onPress={() => {}}>
          {recipientPhoto ? (
            <View>
              <Image
                source={{ uri: recipientPhoto }}
                style={styles.headerAvatar}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
              />
              {isRecipientOnline && (
                <View style={[styles.onlineDot, { borderColor: background }]} />
              )}
            </View>
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: card }]}>
              <Text style={{ color: muted, fontWeight: "700", fontSize: 16 }}>
                {recipientUsername.charAt(0).toUpperCase()}
              </Text>
              {isRecipientOnline && (
                <View style={[styles.onlineDot, { borderColor: background }]} />
              )}
            </View>
          )}
          <View style={{ marginLeft: 10 }}>
            <Text style={[styles.headerName, { color: textColor }]}>{recipientUsername}</Text>
            <Text style={[styles.headerSub, { color: isRecipientOnline ? "#22C55E" : muted, fontWeight: isRecipientOnline ? "600" : "400" }]}>
              {recipientTyping ? t('chat.typing', "typing…") : isRecipientOnline ? t('chat.active_now', "Active now") : t('chat.offline', "Offline")}
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
            <Text style={{ color: muted, marginBottom: 12 }}>{t('chat.couldnt_load_messages', "Couldn't load messages.")}</Text>
            <Pressable onPress={() => historyQuery.refetch()}>
              <Text style={{ color: primary, fontWeight: "700" }}>{t('common.retry', "Retry")}</Text>
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
                  {t('chat.say_hi', { name: recipientUsername, defaultValue: `Say hi to ${recipientUsername}!` })}
                </Text>
                <Text style={[styles.emptySub, { color: muted }]}>
                  {t('chat.beginning_conversation_dm', "This is the beginning of your conversation.")}
                </Text>
              </View>
            }
          />
        )}

        {/* ── Reaction bar (single screen-level instance) ── */}
        <ReactionBar
          anchor={reactionAnchor}
          align={
            String(reactingToMessage?.sender) === String(currentUserId)
              ? "right"
              : "left"
          }
          myReaction={
            reactingToMessage?.reactions?.find((r) =>
              r.actor_ids?.some((id) => String(id) === String(currentUserId)),
            )?.emoji ?? null
          }
          onSelect={(emoji) => {
            if (reactingToMessage) handleReact(reactingToMessage, emoji);
            closeReactionBar();
          }}
          onClose={closeReactionBar}
        />

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
                {t("chat.replying_to", "Replying to")} {replyingTo.sender === recipientId ? recipientUsername : "You"}
              </Text>
              <Text style={[styles.replyPreview, { color: muted }]} numberOfLines={1}>
                {getReplyPreviewText(replyingTo)}
              </Text>
            </View>
            {replyingTo.image_url && (
              <ChatMessageImage
                messageId={replyingTo.id}
                imageUrl={replyingTo.image_url}
                imageUrlExpiresAt={replyingTo.image_url_expires_at}
                style={styles.replyThumbnail}
                transition={0}
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

        {/* ── Daily limit banner OR emoji + input bar ── */}
        {isDmQuotaExhausted ? (
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
              {t('chat.limit_banner', { used: dmQuota?.used, limit: dmQuota?.limit, defaultValue: `Daily limit reached (${dmQuota?.used}/${dmQuota?.limit}). Resets at midnight.` })}
            </Text>
          </View>
        ) : (
          <>
            {/* ── Quick Emoji Bar ── */}
            {showEmojiPicker && (
              <View style={[styles.emojiBar, { backgroundColor: card, borderTopColor: border + "25" }]}>
                <FlatList showsVerticalScrollIndicator={false}
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
                        handleTextChange(text + item);
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
                  alignItems: isRecording ? "center" : "flex-end",
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
                    height: isRecording ? 48 : undefined,
                    paddingHorizontal: isRecording ? 0 : 6,
                  },
                ]}
              >
                {isRecording ? (
                  <View style={styles.recordingRow}>
                    {/* Big Cancel Button with slight borders */}
                    <Pressable
                      onPress={() => {
                        try {
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        } catch {}
                        cancelRecording();
                      }}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.cancelBtn,
                        {
                          borderColor: border + "85",
                          backgroundColor: background,
                        },
                        pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] },
                      ]}
                      accessibilityLabel="Cancel recording"
                      accessibilityRole="button"
                    >
                      <Text style={[styles.cancelBtnText, { color: "#EF4444" }]}>{t('common.cancel', "Cancel")}</Text>
                    </Pressable>

                    {/* Blinking Live Indicator + Monospace Timer */}
                    <View style={styles.recTimerWrap}>
                      <Animated.View style={[styles.recDot, { opacity: recordingDotOpacity }]} />
                      <Text style={[styles.recTimerText, { color: textColor }]}>
                        {formatDuration(recordDurationSeconds)}
                      </Text>
                    </View>

                    {/* Animated soundwave visualizer */}
                    <LiveWaveform level={recordingLevel} color={primary} />
                  </View>
                ) : (
                  <>
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

                    {/* Attach photo button */}
                    <Pressable
                      onPress={pickImage}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.pillIconBtn,
                        { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : border + "35" },
                        pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                      ]}
                      accessibilityLabel="Attach photo from gallery"
                      accessibilityRole="button"
                    >
                      <Paperclip size={18} color={muted} />
                    </Pressable>

                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: textColor }]}
                      value={text}
                      onChangeText={handleTextChange}
                      onFocus={() => setShowEmojiPicker(false)}
                      placeholder={t('chat.message_placeholder', "Message…")}
                      placeholderTextColor={muted}
                      multiline
                      maxLength={2000}
                      returnKeyType="default"
                    />

                    {/* Camera button with transparent background */}
                    <Pressable
                      onPress={takePhoto}
                      hitSlop={6}
                      style={({ pressed }) => [
                        styles.pillIconBtn,
                        { backgroundColor: isDark ? "rgba(255, 255, 255, 0.08)" : border + "35" },
                        pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] },
                      ]}
                      accessibilityLabel="Take photo with camera"
                      accessibilityRole="button"
                    >
                      <Camera size={18} color={muted} />
                    </Pressable>
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
                  ) : isRecording ? (
                    <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
                  ) : (
                    <Send size={20} color="#FFFFFF" strokeWidth={2.4} style={{ marginLeft: 2 }} />
                  )}
                </Pressable>
              ) : (
                <Pressable
                  onPress={handleMicPress}
                  style={({ pressed }) => [
                    styles.micBtn,
                    {
                      backgroundColor: isDark ? "#1C1C1E" : card,
                      borderColor: isDark ? "rgba(255, 255, 255, 0.12)" : border + "45",
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
          </>
        )}
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
                  {t('chat.chat_options', "Chat Options")}
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
                    {t('common.cancel', "Cancel")}
                  </Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
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
    paddingLeft: 0,
    paddingRight: 6,
    height: 48,
  },
  cancelBtn: {
    height: 40,
    paddingLeft: 18,
    paddingRight: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    marginRight: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  recTimerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 4,
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  recTimerText: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3,
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
});
