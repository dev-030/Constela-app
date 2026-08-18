import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import VerificationOverlay from "@/components/VerificationOverlay";
import { Search } from "lucide-react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import Header from "../../../components/header";
import {
  useInfiniteFriendSuggestionsQuery,
  usePendingFriendRequestsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
} from "@/api/friends";

const SEARCH_DEBOUNCE_MS = 300;

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  const suggestionsQuery = useInfiniteFriendSuggestionsQuery({
    search: debouncedSearch || undefined,
  });
  const requestsQuery = usePendingFriendRequestsQuery();

  const sendMutation = useSendFriendRequestMutation();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const suggestions = suggestionsQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const requests = requestsQuery.data ?? [];

  const isRefreshing =
    suggestionsQuery.isFetching || requestsQuery.isFetching;
  const isInitialLoading =
    (suggestionsQuery.isLoading || requestsQuery.isLoading) &&
    !suggestionsQuery.data &&
    !requestsQuery.data;

  const handleAccept = (friendshipId: string) => {
    acceptMutation.mutate(friendshipId, {
      onError: (err: any) => {
        if (err?.response?.status === 403) {
          Alert.alert(
            "Not allowed",
            err.response.data?.error || "You can&apos;t accept this request."
          );
        } else {
          Alert.alert("Something went wrong", "Please try again.");
        }
      },
    });
  };

  const handleDecline = (friendshipId: string) => {
    declineMutation.mutate(friendshipId, {
      onError: () => {
        Alert.alert("Something went wrong", "Please try again.");
      },
    });
  };

  const handleAddFriend = (userId: string) => {
    sendMutation.mutate(userId, {
      onError: (err: any) => {
        if (err?.response?.status === 400) {
          Alert.alert(
            "Cannot send request",
            err.response.data?.error || "You can&apos;t send a request to this user."
          );
        } else {
          Alert.alert("Something went wrong", "Please try again.");
        }
      },
    });
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      suggestionsQuery.refetch(),
      requestsQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator color={primary} />
        </View>
      </View>
    );
  }

  const renderHeader = () => (
    <>
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
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Friend Requests */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          {requests.length > 0 && (
            <View style={[styles.badge, { backgroundColor: primary }]}>
              <Text style={styles.badgeText}>
                {requests.length} New
              </Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => router.push("/sent-requests")}>
          <Text style={{ color: primary, fontWeight: "600", fontSize: 14 }}>
            Sent Requests
          </Text>
        </Pressable>
      </View>

      {requestsQuery.isError ? (
        <View style={styles.inlineMessage}>
          <Text style={{ color: muted }}>Couldn&apos;t load friend requests.</Text>
          <Pressable onPress={() => requestsQuery.refetch()}>
            <Text style={{ color: primary, fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      ) : requests.length === 0 ? (
        <Text style={[styles.emptyText, { color: muted }]}>
          No pending requests right now.
        </Text>
      ) : (
        requests.map((req) => {
          const isPending =
            acceptMutation.isPending || declineMutation.isPending;
          return (
            <AnimatedPressable
              key={req.id}
              layout={Layout.springify()}
              entering={FadeIn}
              exiting={FadeOut.duration(300)}
              style={[
                styles.requestCard,
                { borderColor: border, backgroundColor: cardColor },
              ]}
              onPress={() => router.push({ pathname: `/profile/${req.sender_id}`, params: { name: req.name, photo: req.photo } } as any)}
            >
              <View style={styles.requestInfo}>
                <Image
                  source={{ uri: req.photo }}
                  style={styles.requestAvatar}
                />
                <View style={styles.requestTextCol}>
                  <Text style={styles.requestName}>{req.name}</Text>
                  <Text style={[styles.requestSubtitle, { color: muted }]}>
                    {req.subtitle}
                  </Text>
                </View>
              </View>
              <View style={styles.requestActions}>
                <Pressable
                  style={[
                    styles.actionBtn,
                    { backgroundColor: primary, opacity: isPending ? 0.6 : 1 },
                  ]}
                  disabled={isPending}
                  onPress={() => handleAccept(req.id)}
                >
                  <Text style={[styles.actionBtnText, { color: "#FFF" }]}>
                    {acceptMutation.isPending &&
                    acceptMutation.variables === req.id
                      ? "Accepting…"
                      : "Accept"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: primary + "20",
                      opacity: isPending ? 0.6 : 1,
                    },
                  ]}
                  disabled={isPending}
                  onPress={() => handleDecline(req.id)}
                >
                  <Text style={[styles.actionBtnText, { color: "#2B4A4A" }]}>
                    {declineMutation.isPending &&
                    declineMutation.variables === req.id
                      ? "Declining…"
                      : "Decline"}
                  </Text>
                </Pressable>
              </View>
            </AnimatedPressable>
          );
        })
      )}

      <View style={{ height: 24 }} />

      {suggestionsQuery.isError && (
        <View style={styles.inlineMessage}>
          <Text style={{ color: muted }}>Couldn&apos;t load suggestions.</Text>
          <Pressable onPress={() => suggestionsQuery.refetch()}>
            <Text style={{ color: primary, fontWeight: "600" }}>Retry</Text>
          </Pressable>
        </View>
      )}
      {!suggestionsQuery.isError && suggestions.length === 0 && !suggestionsQuery.isLoading && (
        <Text style={[styles.emptyText, { color: muted }]}>
          No suggestions right now.
        </Text>
      )}
    </>
  );

  return (
    <VerificationOverlay>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header title="Friends" />

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14, justifyContent: "space-between", marginBottom: 14 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          onEndReached={() => {
            if (suggestionsQuery.hasNextPage && !suggestionsQuery.isFetchingNextPage) {
              suggestionsQuery.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            suggestionsQuery.isFetchingNextPage ? (
              <ActivityIndicator color={primary} style={{ marginVertical: 20 }} />
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
              colors={[primary]}
            />
          }
          renderItem={({ item: person }) => {
            const isSending = sendMutation.isPending && sendMutation.variables === person.id;
            return (
              <AnimatedPressable
                key={person.id}
                layout={Layout.springify()}
                entering={FadeIn}
                exiting={FadeOut.duration(300)}
                style={styles.personCard}
                onPress={() => router.push({ pathname: `/profile/${person.id}`, params: { name: person.name, photo: person.photo } } as any)}
              >
                <View style={styles.personImageContainer}>
                  <Image
                    source={{ uri: person.photo }}
                    style={styles.personImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.72)"]}
                    locations={[0.4, 0.7, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.personNameContainer}>
                    <Text style={styles.personNameAge}>
                      {person.name}, {person.age}
                    </Text>
                  </View>
                </View>

                <View style={styles.personContent}>
                  <View style={styles.personTags}>
                    {person.tags.slice(0, 2).map((tag) => (
                      <View
                        key={tag}
                        style={[styles.smallPill, { backgroundColor: primary + "18" }]}
                      >
                        <Text style={[styles.smallPillText, { color: primary }]}>
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
                    style={[
                      styles.addFriendBtn,
                      { backgroundColor: primary, opacity: isSending ? 0.6 : 1 },
                    ]}
                    disabled={isSending}
                    onPress={() => handleAddFriend(person.id)}
                  >
                    <Text style={styles.addFriendText}>
                      {isSending ? "Sending…" : "Add Friend"}
                    </Text>
                  </Pressable>
                </View>
              </AnimatedPressable>
            );
          }}
        />
      </View>
    </VerificationOverlay>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    gap: 14,
    justifyContent: "space-between",
  },
  personCard: {
    width: "47%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.07)",
    // Soft floating shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
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
    bottom: 10,
    left: 10,
    right: 10,
  },
  personNameAge: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  personContent: {
    padding: 10,
    paddingTop: 10,
    gap: 6,
  },
  personTags: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
  },
  smallPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  smallPillText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  personBio: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  addFriendBtn: {
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 2,
  },
  addFriendText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  inlineMessage: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    paddingVertical: 12,
  },
});