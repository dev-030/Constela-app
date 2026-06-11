import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import Header from "../_components/header";

const conversations = [
  {
    id: "sam",
    name: "Sam",
    message: "That sounds like a great plan!",
    time: "10:45 AM",
    unread: 1,
    online: true,
    avatar: "https://i.pravatar.cc/120?img=12",
  },
  {
    id: "david",
    name: "David",
    message: "Are you still up for the quiet museum tour?",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: "https://i.pravatar.cc/120?img=33",
  },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const border = useColor("border");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 24,
            borderBottomColor: border + "66",
          },
        ]}
      >
        <Text style={styles.headerTitle}>Messages</Text>
      </View> */}
      <Header />
      <View style={styles.tabs}>
        <Pressable style={[styles.tabButton, styles.activeTab]}>
          <Text style={styles.activeTabText}>Dating</Text>
        </Pressable>
        <Pressable style={styles.tabButton}>
          <Text style={styles.tabText}>Friends</Text>
        </Pressable>
      </View>

      <View style={styles.messageList}>
        {conversations.map((conversation) => (
          <Pressable
            key={conversation.id}
            style={styles.conversationRow}
            onPress={() => {
               router.push(`/inbox/${conversation.id}`);
            }}
          >
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: conversation.avatar }}
                style={styles.avatar}
              />
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: conversation.online
                      ? "#25C45E"
                      : "#CFD5D8",
                    borderColor: background,
                  },
                ]}
              />
            </View>

            <View style={styles.conversationBody}>
              <View style={styles.conversationTop}>
                <Text style={styles.name}>{conversation.name}</Text>
                <Text style={styles.time}>{conversation.time}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text numberOfLines={1} style={styles.messagePreview}>
                  {conversation.message}
                </Text>
                {conversation.unread ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{conversation.unread}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 110,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
    justifyContent: "flex-start",
    paddingHorizontal: 18,
  },
  headerTitle: {
    color: "#0B3338",
    fontSize: 24,
    fontWeight: "800",
  },
  tabs: {
    height: 68,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E7ECEF",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#EF3D77",
  },
  activeTabText: {
    color: "#EF3D77",
    fontSize: 15,
    fontWeight: "800",
  },
  tabText: {
    color: "#0B3338",
    fontSize: 15,
    fontWeight: "800",
  },
  messageList: {
    paddingTop: 27,
  },
  conversationRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  statusDot: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  conversationBody: {
    flex: 1,
    minWidth: 0,
  },
  conversationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    color: "#1C1C1C",
    fontSize: 14,
    fontWeight: "800",
  },
  time: {
    color: "#A14200",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 10,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  messagePreview: {
    flex: 1,
    color: "#1C1C1C",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  unreadBadge: {
    width: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#9A3B00",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 14,
  },
});
