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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import VerificationOverlay from "@/components/VerificationOverlay";
import { Search, SlidersHorizontal } from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import Header from "../../../components/header";
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendSuggestionsQuery,
  usePendingFriendRequestsQuery,
  useSendFriendRequestMutation,
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

  const suggestionsQuery = useFriendSuggestionsQuery({
    search: debouncedSearch || undefined,
  });
  const requestsQuery = usePendingFriendRequestsQuery();

  useFocusEffect(
    useCallback(() => {
      suggestionsQuery.refetch();
      requestsQuery.refetch();
    }, [suggestionsQuery.refetch, requestsQuery.refetch])
  );

  const sendMutation = useSendFriendRequestMutation();
  const acceptMutation = useAcceptFriendRequestMutation();
  const declineMutation = useDeclineFriendRequestMutation();

  const suggestions = suggestionsQuery.data ?? [];
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

  return (
    <VerificationOverlay>
      <View style={[styles.container, { backgroundColor: background }]}>
        <Header title="Friends" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={primary}
              colors={[primary]}
            />
          }
        >
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
            {requests.length > 0 && (
              <View style={[styles.badge, { backgroundColor: primary }]}>
                <Text style={styles.badgeText}>
                  {requests.length} New
                </Text>
              </View>
            )}
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
                <View
                  key={req.id}
                  style={[
                    styles.requestCard,
                    { borderColor: border, backgroundColor: cardColor },
                  ]}
                >
                  <View style={styles.requestInfo}>
                    <Image
                      source={{ uri: req.photo }}
                      style={styles.requestAvatar}
                    />
                    <View style={styles.requestTextCol}>
                      <Text style={styles.requestName}>{req.username}</Text>
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
                </View>
              );
            })
          )}

          <View style={{ height: 24 }} />

          {/* Recommendations Grid */}
          {suggestionsQuery.isError ? (
            <View style={styles.inlineMessage}>
              <Text style={{ color: muted }}>Couldn&apos;t load suggestions.</Text>
              <Pressable onPress={() => suggestionsQuery.refetch()}>
                <Text style={{ color: primary, fontWeight: "600" }}>Retry</Text>
              </Pressable>
            </View>
          ) : suggestions.length === 0 ? (
            <Text style={[styles.emptyText, { color: muted }]}>
              No suggestions right now.
            </Text>
          ) : (
            <View style={styles.grid}>
              {suggestions.map((person) => {
                const isSending =
                  sendMutation.isPending && sendMutation.variables === person.id;
                return (
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
                        source={{ uri: person.photo }}
                        style={styles.personImage}
                      />
                      <View style={styles.personImageOverlay} />
                      <View style={styles.personNameContainer}>
                        <Text style={styles.personNameAge}>
                          {person.username}, {person.age}
                        </Text>
                      </View>
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
                              style={[
                                styles.smallPillText,
                                { color: "#2B4A4A" },
                              ]}
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
                        style={[
                          styles.addFriendBtn,
                          {
                            backgroundColor: primary,
                            opacity: isSending ? 0.6 : 1,
                          },
                        ]}
                        disabled={isSending}
                        onPress={() => handleAddFriend(person.id)}
                      >
                        <Text style={[styles.addFriendText, { color: "#FFF" }]}>
                          {isSending ? "Sending…" : "Add Friend"}
                        </Text>
                      </Pressable>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
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