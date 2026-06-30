import React, { useCallback, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
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
  useDirectHistoryQuery,
  useSendDirectMessageMutation,
} from "@/api/messages";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";

function mapApiMessageToIMessage(
  msg: {
    id: string;
    sender: string;
    receiver: string;
    sender_name: string;
    sender_photo: string;
    content: string;
    timestamp: string;
  },
  currentUserId: string,
  currentUserName: string,
  currentUserPhoto: string
): IMessage {
  const isCurrentUser = msg.sender === currentUserId;
  return {
    _id: msg.id,
    text: msg.content,
    createdAt: new Date(msg.timestamp),
    user: {
      _id: msg.sender,
      name: isCurrentUser ? currentUserName : msg.sender_name,
      avatar: isCurrentUser ? currentUserPhoto : msg.sender_photo,
    },
  };
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipientId = typeof id === "string" ? id : "";

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

  const recipientProfileQuery = useGetProfileDetailsQuery(recipientId);

  const currentUserId = profile?.user.id ?? "";
  const currentUserName = profile?.username ?? "You";
  const currentUserPhoto =
    profile?.photos?.find((p) => p.is_main)?.image ??
    profile?.photos?.[0]?.image ??
    "";

  const giftedUser = useMemo(
    () => ({
      _id: currentUserId || "me",
      name: currentUserName,
      avatar: currentUserPhoto,
    }),
    [currentUserId, currentUserName, currentUserPhoto]
  );

  const historyQuery = useDirectHistoryQuery(recipientId);
  const sendMutation = useSendDirectMessageMutation(recipientId);

  const apiMessages = useMemo(
    () => historyQuery.data ?? [],
    [historyQuery.data]
  );

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
          currentUserPhoto
        )
      )
      .sort((a, b) => +b.createdAt - +a.createdAt);
  }, [apiMessages, currentUserId, currentUserName, currentUserPhoto]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const text = newMessages[0]?.text?.trim();
      if (!text || !recipientId) {
        return;
      }
      sendMutation.mutate(text, {
        onError: (err: any) => {
          const status = err?.response?.status;
          const message =
            err?.response?.data?.error || "Please try again in a moment.";

          if (status === 400) {
            Alert.alert("Cannot send", message);
          } else if (status === 403) {
            Alert.alert("Limit reached", message);
          } else {
            Alert.alert("Couldn't send", message);
          }
        },
      });
    },
    [recipientId, sendMutation]
  );

  const recipientUsername =
    recipientProfileQuery.data?.username ?? "Conversation";
  const recipientPhoto =
    recipientProfileQuery.data?.photos?.find((p) => p.is_main)?.image ??
    recipientProfileQuery.data?.photos?.[0]?.image ??
    "";

  const renderBubble = useCallback(
    (props: any) => {
      return (
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
      );
    },
    [primary, card, text, muted]
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
  }, []);

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
    historyQuery.isLoading && apiMessages.length === 0;

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
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>

          <View style={styles.headerCenter}>
            {recipientPhoto ? (
              <Image source={{ uri: recipientPhoto }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                <Text style={{ color: muted, fontWeight: "700" }}>
                  {recipientUsername.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, { color: text }]}>
                {recipientUsername}
              </Text>
              <Text style={[styles.headerStatus, { color: muted }]}>
                {historyQuery.isLoading ? "Loading…" : "Direct message"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {isInitialLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primary} />
        </View>
      ) : historyQuery.isError ? (
        <View style={styles.centered}>
          <Text style={{ color: muted }}>Couldn&apos;t load messages.</Text>
          <Pressable onPress={() => historyQuery.refetch()}>
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
            placeholder: "Message...",
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerAvatarFallback: {
    backgroundColor: "rgba(128,128,128,0.15)",
    alignItems: "center",
    justifyContent: "center",
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