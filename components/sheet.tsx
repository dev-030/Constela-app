import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Heart, MoreHorizontal, Star, X } from "lucide-react-native";
import { Image, ScrollView, StyleSheet, View, Pressable, ActivityIndicator, Alert } from "react-native";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useBlockUserMutation, useUnmatchMutation, useUnfriendMutation } from "@/api/matching";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const PRIMARY = "#DE4177";

export default function ProfileSheet() {
  const background = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const insets = useSafeAreaInsets();
  
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isLoading, isError } = useGetProfileDetailsQuery(id || "");
  const { mutate: blockUser } = useBlockUserMutation();
  const { mutate: unmatchUser } = useUnmatchMutation();
  const { mutate: unfriendUser } = useUnfriendMutation();

  const openActionMenu = () => {
    if (!profile) return;
    Alert.alert(
      "Profile Options",
      "Choose an action",
      [
        {
          text: "Remove from Matches",
          style: "destructive",
          onPress: () => {
            unmatchUser(profile.id, {
              onSuccess: () => {
                Alert.alert("Success", "User unmatched.");
                router.back();
              }
            });
          },
        },
        {
          text: "Unfriend",
          style: "destructive",
          onPress: () => {
            unfriendUser(profile.id, {
              onSuccess: () => {
                Alert.alert("Success", "Removed from friends.");
                router.back();
              }
            });
          },
        },
        {
          text: "Block User",
          style: "destructive",
          onPress: () => {
            Alert.alert("Confirm Block", "Are you sure you want to block this user?", [
              { text: "Cancel", style: "cancel" },
              { text: "Block", style: "destructive", onPress: () => {
                blockUser(profile.id, {
                  onSuccess: () => {
                    Alert.alert("Blocked", "User has been blocked.");
                    router.back();
                  }
                });
              }}
            ]);
          },
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: "red" }}>Failed to load profile.</Text>
        <Button style={{ marginTop: 16 }} onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}

      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Icon name={X} size={24} color={text} />
        </Pressable>
        <Text style={[styles.name, { color: text }]}>{profile.username}, {profile.age}</Text>
        <Pressable onPress={openActionMenu}>
          <Icon name={MoreHorizontal} size={24} color={text} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo */}
        {(() => {
          const photoUri = profile.photos?.find((p: any) => p.is_main)?.image || profile.photos?.[0]?.image;
          return photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photo, { backgroundColor: border, justifyContent: "center", alignItems: "center" }]}>
              <Text>No Photo</Text>
            </View>
          );
        })()}

        {/* Neurotype */}
        {profile.neurotype_labels && profile.neurotype_labels.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>NEUROTYPE</Text>
            <View style={styles.pillContainer}>
              {profile.neurotype_labels.map((label) => (
                <View key={label} style={[styles.pill, { backgroundColor: "#A7F3D0" }]}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#065F46" }}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bio */}
        {profile.bio && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>BIO</Text>
            <Text style={[styles.bioText, { color: text }]}>"{profile.bio}"</Text>
          </View>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: muted }]}>INTERESTS</Text>
            <View style={styles.pillContainer}>
              {profile.interests.map((interest) => (
                <View key={interest} style={[styles.pillOutline, { borderColor: border }]}>
                  <Text style={{ fontSize: 13, color: text }}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Sensory Profile */}
        <View style={[styles.section, { paddingBottom: 100 }]}>
          <Text style={[styles.sectionTitle, { color: muted }]}>SENSORY PROFILE</Text>
          <View style={styles.sensoryContainer}>
            {profile.emotional_needs?.map((need) => (
              <View key={need} style={[styles.sensoryItem, { borderColor: border }]}>
                <Text style={{ fontSize: 14, color: text }}>{need}</Text>
                <Icon name={Check} size={20} color="#059669" />
              </View>
            ))}
            {profile.soothe_methods?.map((soothe) => (
              <View key={soothe} style={[styles.sensoryItem, { borderColor: border }]}>
                <Text style={{ fontSize: 14, color: text }}>{soothe}</Text>
                <Icon name={Check} size={20} color="#059669" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtonsRow, { bottom: insets.bottom || 24 }]}>
        <Pressable style={styles.rejectButton}>
          <Icon name={X} size={32} color="#FFF" />
        </Pressable>

        <Pressable style={styles.superLikeButton}>
          <Icon name={Star} size={24} color="#E65100" />
        </Pressable>

        <Pressable style={[styles.likeButton, { backgroundColor: PRIMARY }]}>
          <Icon name={Heart} size={32} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    //  justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120, // increased padding to ensure content isn't hidden behind buttons
  },
  photo: {
    width: 380,
    height: 380,
    aspectRatio: 1,
    borderRadius: 20,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 12,
  },
  pillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bioText: {
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
  },
  pillOutline: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  sensoryContainer: {
    gap: 12,
  },
  sensoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionButtonsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    zIndex: 10,
  },
  rejectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#004D40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  superLikeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
