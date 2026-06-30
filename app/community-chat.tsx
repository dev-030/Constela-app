import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, LogOut, Users } from "lucide-react-native";
import {
  Bubble,
  InputToolbar,
  Send,
  Time,
  Avatar,
  Composer,
  SystemMessage,
  IMessage,
} from "react-native-gifted-chat";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { SafeGiftedChat } from "@/components/safeGiftedChat";
import {
  useJoinRoomMutation,
  useLeaveRoomMutation,
  useRoomMessagesQuery,
  useSendRoomMessageMutation,
  isPremiumRequiredError,
} from "@/api/chat";
import { useProfileStore } from "@/store/profileStore";

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

// Backend returns messages oldest-first. GiftedChat wants newest-first.
function mapApiMessageToIMessage(
  msg: {
    id: string;
    sender: string;
    sender_name: string;
    sender_photo: string;
    content: string;
    timestamp: string;
  },
  currentUserId: string,
  currentUserName: string,
  currentUserAvatar: string
): IMessage {
  const isCurrentUser = msg.sender === currentUserId;
  return {
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.timestamp),
    user: {
      _id: msg.sender,
      name: isCurrentUser ? currentUserName : msg.sender_name,
      avatar: isCurrentUser ? currentUserAvatar : msg.sender_photo,
    },
  };
}

export default function CommunityChatScreen() {
  const params = useLocalSearchParams<{ title?: string; roomId?: string }>();
  const groupTitle = typeof params.title === "string" ? params.title : "Community";
  const roomId = typeof params.roomId === "string" ? params.roomId : "";

  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const card = useColor("card");

  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  const currentUserId = profile?.user.id ?? "";
  const currentUserName = profile?.username ?? "You";
  const currentUserAvatar =
    profile?.photos?.find((p) => p.is_main)?.image ??
    profile?.photos?.[0]?.image ??
    "";

  const giftedUser = useMemo(
    () => ({
      _id: currentUserId || "me",
      name: currentUserName,
      avatar: currentUserAvatar,
    }),
    [currentUserId, currentUserName, currentUserAvatar]
  );

  const messagesQuery = useRoomMessagesQuery(roomId);
  const sendMutation = useSendRoomMessageMutation(roomId);
  const joinMutation = useJoinRoomMutation();
  const leaveMutation = useLeaveRoomMutation();

  const apiMessages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const messages = useMemo<IMessage[]>(() => {
    if (!currentUserId) {
      return [];
    }
    return apiMessages
      .map((msg) =>
        mapApiMessageToIMessage(
          msg,
          currentUserId,
          currentUserName,
          currentUserAvatar
        )
      )
      .sort((a, b) => +b.createdAt - +a.createdAt);
  }, [apiMessages, currentUserId, currentUserName, currentUserAvatar]);

  // For the username-label palette, build a memo of sender-id → color.
  const nameColors = useMemo(() => {
    const map: Record<string, string> = {};
    apiMessages.forEach((m) => {
      if (m.sender !== currentUserId && !map[m.sender]) {
        map[m.sender] = hashStringToColor(m.sender);
      }
    });
    return map;
  }, [apiMessages, currentUserId]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text?.trim();
      if (!text || !roomId) {
        return;
      }
      sendMutation.mutate(text, {
        onError: (err: any) => {
          if (err?.response?.status === 400) {
            Alert.alert("Cannot send", err.response.data?.error || "Message cannot be empty.");
          } else if (err?.response?.status === 403) {
            const message =
              err.response.data?.error ||
              "You must join this room before you can send messages.";
            const isJoined = (err.response.data?.error || "")
              .toLowerCase()
              .includes("join");
            if (isJoined) {
              Alert.alert("Join required", message, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Join room",
                  onPress: () => joinMutation.mutate(roomId),
                },
              ]);
            } else if (isPremiumRequiredError(err)) {
              Alert.alert("Premium required", message);
            } else {
              Alert.alert("Cannot send", message);
            }
          } else {
            Alert.alert("Couldn't send", "Please try again.");
          }
        },
      });
    },
    [roomId, sendMutation, joinMutation]
  );

  const handleLeave = useCallback(() => {
    if (!roomId) {
      return;
    }
    Alert.alert("Leave room?", `You'll stop receiving messages from ${groupTitle}.`, [
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
  }, [roomId, groupTitle, leaveMutation]);

  const renderBubble = useCallback(
    (props: any) => {
      const { currentMessage } = props;
      const isCurrentUser = currentMessage.user._id === giftedUser._id;

      return (
        <View>
          {!isCurrentUser && (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color:
                  nameColors[currentMessage.user._id as string] || muted,
                marginBottom: 2,
                marginLeft: isCurrentUser ? 0 : 12,
              }}
            >
              {currentMessage.user.name}
            </Text>
          )}
          <Bubble
            {...props}
            wrapperStyle={{
              right: {
                backgroundColor: primary,
                borderRadius: 20,
                borderBottomRightRadius: 4,
                paddingHorizontal: 2,
                paddingVertical: 1,
                marginVertical: 2,
              },
              left: {
                backgroundColor: card,
                borderRadius: 20,
                borderBottomLeftRadius: 4,
                paddingHorizontal: 2,
                paddingVertical: 1,
                marginVertical: 2,
              },
            }}
            textStyle={{
              right: {
                color: "#FFFFFF",
                fontSize: 16,
                lineHeight: 21,
              },
              left: {
                color: text,
                fontSize: 16,
                lineHeight: 21,
              },
            }}
            timeTextStyle={{
              right: {
                color: "rgba(255,255,255,0.7)",
                fontSize: 11,
                marginTop: 4,
              },
              left: {
                color: muted,
                fontSize: 11,
                marginTop: 4,
              },
            }}
            tickStyle={{
              color: "rgba(255,255,255,0.8)",
            }}
          />
        </View>
      );
    },
    [primary, card, text, muted, giftedUser._id, nameColors]
  );

  const renderInputToolbar = useCallback(
    (props: any) => {
      return (
        <InputToolbar
          {...props}
          containerStyle={{
            backgroundColor: background,
            borderTopWidth: 1,
            borderTopColor: border + "66",
            paddingHorizontal: 8,
            paddingVertical: 6,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          }}
          primaryStyle={{
            alignItems: "center",
          }}
        />
      );
    },
    [background, border, insets.bottom]
  );

  const renderComposer = useCallback(
    (props: any) => {
      return (
        <Composer
          {...props}
          textInputStyle={{
            backgroundColor: card,
            color: text,
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 16,
            lineHeight: 21,
            maxHeight: 120,
            borderWidth: 1,
            borderColor: border + "44",
          }}
          placeholderTextColor={muted}
        />
      );
    },
    [card, text, muted, border]
  );

  const renderSend = useCallback(
    (props: any) => {
      return (
        <Send
          {...props}
          containerStyle={{
            justifyContent: "center",
            alignItems: "center",
            marginLeft: 8,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: primary,
            opacity: sendMutation.isPending ? 0.4 : 1,
          }}
          disabled={sendMutation.isPending}
          disabledStyle={{
            opacity: 0.4,
          }}
        >
          <View style={styles.sendArrow}>
            <View style={[styles.sendArrowHead, { borderColor: "#FFFFFF" }]} />
            <View style={[styles.sendArrowShaft, { backgroundColor: "#FFFFFF" }]} />
          </View>
        </Send>
      );
    },
    [primary, sendMutation.isPending]
  );

  const renderTime = useCallback(
    (props: any) => {
      return (
        <Time
          {...props}
          timeTextStyle={{
            right: {
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
            },
            left: {
              color: muted,
              fontSize: 11,
            },
          }}
        />
      );
    },
    [muted]
  );

  const renderAvatar = useCallback((props: any) => {
    if (props.currentMessage.user._id === giftedUser._id) {
      return null;
    }
    return (
      <Avatar
        {...props}
        imageStyle={{
          left: {
            width: 36,
            height: 36,
            borderRadius: 18,
          },
          right: {
            width: 36,
            height: 36,
            borderRadius: 18,
          },
        }}
      />
    );
  }, [giftedUser._id]);

  const renderSystemMessage = useCallback(
    (props: any) => {
      return (
        <SystemMessage
          {...props}
          textStyle={{
            color: muted,
            fontSize: 12,
            fontWeight: "600",
          }}
        />
      );
    },
    [muted]
  );

  const scrollToBottomComponent = useCallback(() => {
    return (
      <View
        style={[
          styles.scrollToBottomBtn,
          { backgroundColor: primary, borderColor: background },
        ]}
      >
        <View style={styles.scrollToBottomArrow}>
          <View
            style={[
              styles.scrollArrowLeft,
              { backgroundColor: "#FFFFFF" },
            ]}
          />
          <View
            style={[
              styles.scrollArrowRight,
              { backgroundColor: "#FFFFFF" },
            ]}
          />
        </View>
      </View>
    );
  }, [primary, background]);

  const isInitialLoading =
    messagesQuery.isLoading && apiMessages.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: border + "66",
            backgroundColor: background,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.headerBackBtn}
          >
            <Icon name={ArrowLeft} size={24} color={text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <View style={styles.headerGroupAvatar}>
              <Users size={18} color={primary} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: text }]}>
                {groupTitle}
              </Text>
              <Text style={[styles.headerStatus, { color: muted }]}>
                {messagesQuery.isLoading ? "Loading…" : "Community room"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              hitSlop={8}
              onPress={handleLeave}
              disabled={leaveMutation.isPending}
              style={[
                styles.headerActionBtn,
                styles.leaveBtn,
                { opacity: leaveMutation.isPending ? 0.6 : 1 },
              ]}
            >
              <Icon name={LogOut} size={16} color={muted} />
              <Text style={[styles.leaveText, { color: muted }]}>Leave</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {isInitialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primary} />
        </View>
      ) : messagesQuery.isError && isPremiumRequiredError(messagesQuery.error) ? (
        <View style={styles.centered}>
          <Text style={{ color: text, marginBottom: 8 }}>Premium required</Text>
          <Text style={{ color: muted, textAlign: "center", paddingHorizontal: 24 }}>
            {(messagesQuery.error as any)?.response?.data?.error ||
              "Upgrade to Premium to access this community room."}
          </Text>
        </View>
      ) : messagesQuery.isError ? (
        <View style={styles.centered}>
          <Text style={{ color: muted }}>Couldn&apos;t load messages.</Text>
          <Pressable onPress={() => messagesQuery.refetch()}>
            <Text style={{ color: primary, fontWeight: "700" }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <SafeGiftedChat
          messages={messages}
          onSend={(newMessages) => onSend(newMessages)}
          user={giftedUser}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderComposer={renderComposer}
          renderSend={renderSend}
          renderTime={renderTime}
          renderAvatar={renderAvatar}
          renderSystemMessage={renderSystemMessage}
          isScrollToBottomEnabled
          scrollToBottomComponent={scrollToBottomComponent}
          scrollToBottomOffset={120}
          isSendButtonAlwaysVisible
          isUserAvatarVisible
          locale="en"
          minInputToolbarHeight={52}
          maxComposerHeight={120}
          minComposerHeight={44}
          textInputProps={{
            accessibilityLabel: "Message input",
            placeholder: `Message ${groupTitle}...`,
          }}
          messagesContainerStyle={{
            backgroundColor: background,
          }}
          listProps={{
            keyboardShouldPersistTaps: "never",
            style: {
              backgroundColor: background,
            },
            contentContainerStyle: {
              paddingBottom: 8,
            },
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
    height: 56,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
  },
  headerGroupAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(128,128,128,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerInfo: {
    justifyContent: "center",
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerStatus: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveBtn: {
    width: "auto",
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(128,128,128,0.08)",
  },
  leaveText: {
    fontSize: 13,
    fontWeight: "600",
  },

  sendArrow: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendArrowHead: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 8,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#FFFFFF",
    position: "absolute",
    right: 2,
  },
  sendArrowShaft: {
    width: 14,
    height: 2.5,
    borderRadius: 1,
    position: "absolute",
    right: 10,
  },
  scrollToBottomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollToBottomArrow: {
    width: 16,
    height: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
  },
  scrollArrowLeft: {
    width: 7,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "-45deg" }, { translateY: 3 }],
  },
  scrollArrowRight: {
    width: 7,
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }, { translateY: 3 }],
  },
});