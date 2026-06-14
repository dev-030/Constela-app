import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ChevronLeft, Phone, Video, MoreVertical } from "lucide-react-native";
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

const OTHER_USER = {
  _id: 2,
  name: "Sam",
  avatar: "https://i.pravatar.cc/120?img=12",
};

const CURRENT_USER = {
  _id: 1,
  name: "You",
  avatar: "https://i.pravatar.cc/120?img=68",
};

const INITIAL_MESSAGES: IMessage[] = [
  {
    _id: 1,
    text: "Hey! How are you doing?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    user: OTHER_USER,
  },
  {
    _id: 2,
    text: "I'm doing great! Thanks for asking 😊",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 60000),
    user: CURRENT_USER,
  },
  {
    _id: 3,
    text: "Are you still up for the quiet museum tour this weekend?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    user: OTHER_USER,
  },
  {
    _id: 4,
    text: "That sounds like a great plan! What time were you thinking?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 + 120000),
    user: CURRENT_USER,
  },
  {
    _id: 5,
    text: "How about 2 PM? The sensory-friendly hours start then.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    user: OTHER_USER,
  },
  {
    _id: 6,
    text: "Perfect, 2 PM works for me! See you there 👋",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    user: CURRENT_USER,
  },
  {
    _id: 7,
    text: "Awesome! I'll send you the exact meetup spot in the morning.",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    user: OTHER_USER,
  },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Image
              source={{ uri: OTHER_USER.avatar }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerInfo}>
              <Text
                style={[
                  styles.headerName,
                  { color: text },
                ]}
              >
                {OTHER_USER.name}
              </Text>
              <Text style={[styles.headerStatus, { color: muted }]}>
                Online
              </Text>
            </View>
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
