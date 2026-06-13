import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import Header from "../_components/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const datingConversations = [
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
    id: "jordan",
    name: "Jordan",
    message: "Would love to see that exhibit too!",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: "https://i.pravatar.cc/120?img=60",
  },
  {
    id: "alex",
    name: "Alex",
    message: "Thanks for a wonderful evening 🌙",
    time: "2 days ago",
    unread: 2,
    online: true,
    avatar: "https://i.pravatar.cc/120?img=45",
  },
];

const friendsConversations = [
  {
    id: "david",
    name: "David",
    message: "Are you still up for the quiet museum tour?",
    time: "Yesterday",
    unread: 0,
    online: false,
    avatar: "https://i.pravatar.cc/120?img=33",
  },
  {
    id: "emma",
    name: "Emma",
    message: "Movie night this Friday? 🍿",
    time: "3 days ago",
    unread: 1,
    online: true,
    avatar: "https://i.pravatar.cc/120?img=25",
  },
  {
    id: "mike",
    name: "Mike",
    message: "Check out this new cafe I found!",
    time: "1 week ago",
    unread: 0,
    online: true,
    avatar: "https://i.pravatar.cc/120?img=53",
  },
];

function ConversationList({
  conversations,
}: {
  conversations: typeof datingConversations;
}) {
  const background = useColor("background");

  return (
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
                  backgroundColor: conversation.online ? "#25C45E" : "#CFD5D8",
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
  );
}

export default function MessagesScreen() {
  const background = useColor("background");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />
      <Tabs defaultValue="Dating" enableSwipe>
        <TabsList style={styles.tabsList}>
          <TabsTrigger value="Dating" textStyle={styles.triggerText}>
            Dating
          </TabsTrigger>
          <TabsTrigger value="Friends" textStyle={styles.triggerText}>
            Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="Dating" style={{ paddingTop: 0 }}>
          <ConversationList conversations={datingConversations} />
        </TabsContent>

        <TabsContent value="Friends" style={{ paddingTop: 0 }}>
          <ConversationList conversations={friendsConversations} />
        </TabsContent>
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsList: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "800",
  },
  messageList: {
    paddingTop: 20,
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
    color: "#71717A",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 20,
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
