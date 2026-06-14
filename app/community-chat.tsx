import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, LogOut, Users } from "lucide-react-native";
import {
  GiftedChat,
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

const CURRENT_USER = {
  _id: 1,
  name: "You",
  avatar: "https://i.pravatar.cc/120?img=68",
};

const GROUP_MEMBERS = {
  samantha: {
    _id: 2,
    name: "Samantha",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
  nico: {
    _id: 3,
    name: "Nico Alexis",
    avatar: "https://i.pravatar.cc/120?img=47",
  },
  bima: {
    _id: 4,
    name: "Bima Algifari",
    avatar: "https://i.pravatar.cc/120?img=12",
  },
};

const GROUP_NAME_COLORS: Record<number, string> = {
  [GROUP_MEMBERS.samantha._id]: "#C35A22",
  [GROUP_MEMBERS.nico._id]: "#A34828",
  [GROUP_MEMBERS.bima._id]: "#8B4B27",
};

const MEMBER_COUNT = "1.2k members";

// GiftedChat expects messages sorted newest-first (reverse chronological)
const INITIAL_MESSAGES: IMessage[] = [
  {
    _id: 8,
    text: "Let me share some initial findings from the user research phase.",
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
    user: GROUP_MEMBERS.nico,
  },
  {
    _id: 7,
    text: "I like this approach 👍",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    user: GROUP_MEMBERS.samantha,
  },
  {
    _id: 6,
    text: "Thank you. Based on this data, we can start creating user personas @Samantha",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    user: GROUP_MEMBERS.bima,
  },
  {
    _id: 5,
    text: "That sounds great. Do we have any data on how users currently interact with our site?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    user: GROUP_MEMBERS.samantha,
  },
  {
    _id: 4,
    text: "Of course, thank you for joining 🥳",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 120000),
    user: GROUP_MEMBERS.nico,
  },
  {
    _id: 3,
    text: "Hi @Nico Alexis I'm very excited to start working on this project. Can we begin by discussing the main goals and objectives of the design?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    user: GROUP_MEMBERS.samantha,
  },
  {
    _id: 2,
    text: "Hi everyone! Excited to be here 🙌",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 60000),
    user: CURRENT_USER,
  },
  {
    _id: 1,
    text: "Welcome to the ADHD Hub! 🎉 Feel free to introduce yourselves.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    user: GROUP_MEMBERS.samantha,
  },
];

export default function CommunityChatScreen() {
  const { title } = useLocalSearchParams();
  const groupTitle = typeof title === "string" ? title : "ADHD Hub";

  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const card = useColor("card");

  const [messages, setMessages] = useState<IMessage[]>(INITIAL_MESSAGES);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  const renderBubble = useCallback(
    (props: any) => {
      const { currentMessage } = props;
      const isCurrentUser = currentMessage.user._id === CURRENT_USER._id;

      return (
        <View>
          {/* Username label for group chat — only shown on others' messages */}
          {!isCurrentUser && (
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: GROUP_NAME_COLORS[currentMessage.user._id] || muted,
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
          }}
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
    [primary]
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
    // Don't show avatar for own messages in group chat
    if (props.currentMessage.user._id === CURRENT_USER._id) {
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
                {MEMBER_COUNT}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              hitSlop={8}
              style={[styles.headerActionBtn, styles.leaveBtn]}
            >
              <Icon name={LogOut} size={16} color={muted} />
              <Text style={[styles.leaveText, { color: muted }]}>Leave</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Chat */}
      <SafeGiftedChat
        messages={messages}
        onSend={(newMessages) => onSend(newMessages)}
        user={CURRENT_USER}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
