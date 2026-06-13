import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Info,
  LogOut,
  Send,
  Smile,
} from "lucide-react-native";
import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PRIMARY = "#DE4177";

export default function CommunityChatScreen() {
  const { title } = useLocalSearchParams();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const insets = useSafeAreaInsets();

  const MESSAGES = [
  {
    id: "m1",
    date: "Yesterday",
    items: [
      {
        id: "msg1",
        user: "Samantha",
        avatar: require("@/assets/profiles/mia.png"),
        time: "13:45",
        nameColor: "#C35A22",
        text: (
          <Text style={styles.messageText}>
            Hi <Text style={styles.mentionGreen}>@Nico Alexis</Text> I'm very excited to start working on this project. Can we begin by discussing the main goals and objectives of the design?
          </Text>
        ),
      },
      {
        id: "msg2",
        user: "Nico Alexis",
        avatar: require("@/assets/profiles/liam.png"),
        time: "13:50",
        nameColor: "#A34828",
        text: (
          <Text style={styles.messageText}>
            Of course, thank you for joining 🥳
          </Text>
        ),
      },
      {
        id: "msg3",
        user: "Samantha",
        avatar: require("@/assets/profiles/mia.png"),
        time: "14:00",
        nameColor: "#C35A22",
        text: (
          <Text style={styles.messageText}>
            That sounds great. Do we have any data on how users currently interact{"\n"}with our site?
          </Text>
        ),
      },
    ],
  },
  {
    id: "m2",
    date: "Today",
    items: [
      {
        id: "msg4",
        user: "Bima Algifari",
        avatar: null, // we'll render a letter avatar
        initials: "B",
        time: "8:30",
        nameColor: "#8B4B27",
        text: (
          <Text style={styles.messageText}>
            Thank you. Based on this data, we can start creating user personas{"\n"}
            <Text style={styles.mentionOrange}>@Samantha</Text>
          </Text>
        ),
      },
      {
        id: "msg5",
        user: "Samantha",
        avatar: require("@/assets/profiles/mia.png"),
        time: "9:00",
        nameColor: "#C35A22",
        text: (
          <Text style={styles.messageText}>
            I like this approach 👍
          </Text>
        ),
      },
    ],
  },
];

  const groupTitle = typeof title === "string" ? title : "ADHD Hub";
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Icon name={ArrowLeft} size={24} color={text} />
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: text }]}>{groupTitle}</Text>
          <Text style={styles.headerSubtitle}>1.2k members</Text>
        </View>
        <Pressable style={[styles.leaveButton, { backgroundColor: colorScheme === 'dark' ? '#222' : '#F2EBE5' }]}>
          <Icon name={LogOut} size={16} color={colorScheme === 'dark' ? '#FFF' : "#4A3B32"} />
          <Text style={[styles.leaveButtonText, { color: colorScheme === 'dark' ? '#FFF' : "#4A3B32" }]}>Leave</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MESSAGES.map((group) => (
          <View key={group.id}>
            {/* Date Divider */}
            <View style={styles.dateDivider}>
              <Text style={[styles.dateDividerText, colorScheme === 'dark' && { color: '#4A5B6B' }]}>{group.date}</Text>
            </View>

            {/* Messages */}
            {group.items.map((msg) => (
              <View key={msg.id} style={styles.messageRow}>
                {/* Avatar */}
                {msg.avatar ? (
                  <Image source={msg.avatar} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.initialsAvatar]}>
                    <Text style={styles.initialsText}>{msg.initials}</Text>
                  </View>
                )}

                {/* Message Content */}
                <View style={styles.messageContent}>
                  <View style={styles.messageHeader}>
                    <View style={styles.messageHeaderLeft}>
                      <Text style={[styles.senderName, { color: colorScheme === 'dark' ? '#8A9BA8' : msg.nameColor }]}>
                        {msg.user}
                      </Text>
                      <Text style={styles.messageTime}>{msg.time}</Text>
                    </View>
                    <Icon name={Info} size={16} color="#9BA4B5" />
                  </View>
                  <View style={[styles.bubble, { borderColor: colorScheme === 'dark' ? '#1C382F' : border, backgroundColor: colorScheme === 'dark' ? 'transparent' : '#FFF' }]}>
                    {React.cloneElement(msg.text as React.ReactElement, {
                      style: [styles.messageText, { color: text }]
                    })}
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: background, borderTopColor: colorScheme === 'dark' ? '#1C382F' : '#F4F4F4' }]}>
        <View style={[styles.inputContainer, { borderColor: colorScheme === 'dark' ? '#1C382F' : "#E8C8BE" }]}>
          <Icon name={Smile} size={24} color={colorScheme === 'dark' ? '#8C93A1' : "#554C49"} />
          <TextInput
            style={[styles.textInput, { color: text }]}
            placeholder={`Message ${groupTitle}`}
            placeholderTextColor="#8C93A1"
          />
        </View>
        <Pressable style={[styles.sendButton, { backgroundColor: PRIMARY }]}>
          <Icon name={Send} size={20} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0B2629",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#837066",
    marginTop: 2,
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2EBE5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  leaveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4A3B32",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  dateDivider: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  dateDividerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#88796F",
  },
  messageRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  initialsAvatar: {
    backgroundColor: "#316556",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    paddingRight: 4,
  },
  messageHeaderLeft: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  senderName: {
    fontSize: 15,
    fontWeight: "700",
  },
  messageTime: {
    fontSize: 12,
    color: "#8D8D8D",
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    borderTopLeftRadius: 4, // Make it look like a speech bubble from the left
    padding: 16,
    backgroundColor: "#FFF",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },
  mentionGreen: {
    backgroundColor: "#B3E2CD",
    color: "#2C6D54",
    overflow: "hidden",
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  mentionOrange: {
    backgroundColor: "#FBD6C2",
    color: "#8E4628",
    overflow: "hidden",
    paddingHorizontal: 2,
    borderRadius: 4,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F4F4F4",
    backgroundColor: "#FFF",
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 52,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
});
