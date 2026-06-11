import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Search,
  SlidersHorizontal,
  Heart,
  HeartOff,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/ui/filter-pill";
import { useColor } from "@/hooks/useColor";
import Header from "../_components/header";

// Mock Data
const FRIEND_REQUESTS = [
  {
    id: "1",
    name: "Elena Rodriguez",
    info: "2 mutual friends • North Bondi",
    image: "https://i.pravatar.cc/150?img=47",
  },
  {
    id: "2",
    name: "Marcus Chen",
    info: "Banani East",
    image: "https://i.pravatar.cc/150?img=11",
  },
];

const RECOMMENDATIONS = [
  {
    id: "1",
    name: "Sam",
    age: 28,
    tags: ["Creative", "Yoga"],
    bio: "Loves art, books, and meaningful talks",
    image: "https://i.pravatar.cc/300?img=5",
    liked: true,
  },
  {
    id: "2",
    name: "Elodie",
    age: 32,
    tags: ["Yoga", "Nature"],
    bio: "Open-minded, loves nature and growth",
    image: "https://i.pravatar.cc/300?img=35",
    liked: true,
  },
  {
    id: "3",
    name: "David",
    age: 45,
    tags: ["Creative", "Personal"],
    bio: "Enjoys good conversations and connection",
    image: "https://i.pravatar.cc/300?img=12",
    liked: true,
  },
  {
    id: "4",
    name: "Julian",
    age: 30,
    tags: ["Music", "Hiking"],
    bio: "Always exploring new paths and sounds",
    image: "https://i.pravatar.cc/300?img=68",
    liked: false,
  },
];

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  const [search, setSearch] = useState("");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchContainer,
              { borderColor: border, backgroundColor: cardColor },
            ]}
          >
            <Icon name={Search} size={20} color={muted} />
            <TextInput
              style={[styles.searchInput, { color: text }]}
              placeholder="Find people..."
              placeholderTextColor={muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <Pressable
            onPress={() => router.push("/filters")}
            style={[
              styles.filterBtn,
              { borderColor: border, backgroundColor: cardColor },
            ]}
          >
            <Icon name={SlidersHorizontal} size={20} color={primary} />
          </Pressable>
        </View>

        {/* Friend Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          <View style={[styles.badge, { backgroundColor: primary }]}>
            <Text style={styles.badgeText}>3 New</Text>
          </View>
        </View>

        {FRIEND_REQUESTS.map((req) => (
          <View
            key={req.id}
            style={[
              styles.requestCard,
              { borderColor: border, backgroundColor: cardColor },
            ]}
          >
            <View style={styles.requestInfo}>
              <Image source={{ uri: req.image }} style={styles.requestAvatar} />
              <View style={styles.requestTextCol}>
                <Text style={styles.requestName}>{req.name}</Text>
                <Text style={[styles.requestSubtitle, { color: muted }]}>
                  {req.info}
                </Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: primary }]}
              >
                <Text style={[styles.actionBtnText, { color: "#FFF" }]}>
                  Accept
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: primary + "20" }]}
              >
                <Text style={[styles.actionBtnText, { color: "#2B4A4A" }]}>
                  Decline
                </Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={{ height: 24 }} />

        {/* Recommendations Grid */}
        <View style={styles.grid}>
          {RECOMMENDATIONS.map((person) => (
            <Pressable
              key={person.id}
              style={[
                styles.personCard,
                { borderColor: border, backgroundColor: cardColor },
              ]}
              onPress={() => router.push("/friend-profile")}
            >
              <View style={styles.personImageContainer}>
                <Image
                  source={{ uri: person.image }}
                  style={styles.personImage}
                />
                <View style={styles.personImageOverlay} />
                <View style={styles.personNameContainer}>
                  <Text style={styles.personNameAge}>
                    {person.name}, {person.age}
                  </Text>
                </View>
                <Pressable style={styles.likeBtn}>
                  <Icon
                    name={person.liked ? Heart : HeartOff}
                    size={20}
                    color={person.liked ? "#10B981" : "#FFF"}
                  />
                </Pressable>
              </View>

              <View style={styles.personContent}>
                <View style={styles.personTags}>
                  {person.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.smallPill,
                        { backgroundColor: primary + "15" },
                      ]}
                    >
                      <Text
                        style={[styles.smallPillText, { color: "#2B4A4A" }]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text
                  style={[styles.personBio, { color: muted }]}
                  numberOfLines={2}
                >
                  {person.bio}
                </Text>

                <Pressable
                  style={[styles.addFriendBtn, { backgroundColor: primary }]}
                >
                  <Text style={[styles.addFriendText, { color: "#FFF" }]}>
                    Add Friend
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  requestCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  requestTextCol: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  requestSubtitle: {
    fontSize: 14,
  },
  requestActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    justifyContent: "space-between",
  },
  personCard: {
    width: "47%",
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  personImageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  personImage: {
    width: "100%",
    height: "100%",
  },
  personImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  personNameContainer: {
    position: "absolute",
    bottom: 12,
    left: 12,
  },
  personNameAge: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  likeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  personContent: {
    padding: 12,
  },
  personTags: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  smallPillText: {
    fontSize: 10,
    fontWeight: "600",
  },
  personBio: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  addFriendBtn: {
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },
  addFriendText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
