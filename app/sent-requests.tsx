import React from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import {
  useSentFriendRequestsQuery,
  useCancelFriendRequestMutation,
} from "@/api/friends";
import { useAndroidBack } from "@/hooks/useAndroidBack";

export default function SentRequestsScreen() {
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor("background");
  const cardColor = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const border = useColor("border");

  const sentRequestsQuery = useSentFriendRequestsQuery();
  const cancelMutation = useCancelFriendRequestMutation();
  const sentRequests = sentRequestsQuery.data ?? [];

  const handleCancel = (friendshipId: string) => {
    cancelMutation.mutate(friendshipId, {
      onError: () => {
        Alert.alert("Something went wrong", "Please try again.");
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={28} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Sent Requests</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sentRequestsQuery.isLoading ? (
          <Text style={[styles.emptyText, { color: muted }]}>Loading...</Text>
        ) : sentRequestsQuery.isError ? (
          <View style={styles.inlineMessage}>
            <Text style={{ color: muted }}>Couldn&apos;t load sent requests.</Text>
            <Pressable onPress={() => sentRequestsQuery.refetch()}>
              <Text style={{ color: primary, fontWeight: "600", marginTop: 8 }}>Retry</Text>
            </Pressable>
          </View>
        ) : sentRequests.length === 0 ? (
          <Text style={[styles.emptyText, { color: muted }]}>
            You haven&apos;t sent any friend requests yet.
          </Text>
        ) : (
          <View style={styles.grid}>
            {sentRequests.map((req) => {
              const isPending =
                cancelMutation.isPending && cancelMutation.variables === req.id;
              return (
                <AnimatedPressable
                  key={req.id}
                  layout={Layout.springify()}
                  entering={FadeIn}
                  exiting={FadeOut.duration(300)}
                  style={styles.personCard}
                  onPress={() => router.push({ pathname: `/profile/${req.receiver_id}`, params: { name: req.name, photo: req.photo } } as any)}
                >
                  {/* Photo */}
                  <View style={styles.personImageContainer}>
                    <Image
                      source={{ uri: req.photo }}
                      style={styles.personImage}
                    />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.18)", "rgba(0,0,0,0.72)"]}
                      style={styles.personImageOverlay}
                    />
                    <View style={styles.personNameContainer}>
                      <Text style={styles.personNameAge}>{req.name}</Text>
                    </View>
                  </View>
                  
                  {/* Info & Actions */}
                  <View style={styles.personContent}>
                    <Text style={[styles.personBio, { color: muted }]} numberOfLines={2}>
                      {req.subtitle}
                    </Text>
                    
                    <Pressable
                      style={[
                        styles.addFriendBtn,
                        { backgroundColor: '#F8F9FA' },
                      ]}
                      disabled={isPending}
                      onPress={() => handleCancel(req.id)}
                    >
                      <Text style={[styles.addFriendText, { color: '#C62828' }]}>
                        {isPending ? "Canceling…" : "Cancel"}
                      </Text>
                    </Pressable>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        )}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 40,
  },
  inlineMessage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
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
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
