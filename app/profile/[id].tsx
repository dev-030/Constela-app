import React from "react";
import { View, StyleSheet, ScrollView, Image, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useSwipeActionMutation } from "@/api/matching";
import { useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  X,
  Star,
  Heart,
  Gamepad2,
  Palette,
  Rocket,
  Coffee,
  Lightbulb,
  VolumeX,
  CheckCircle2,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { FilterPill } from "@/components/ui/filter-pill";
import { useColor } from "@/hooks/useColor";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { ActionButtons } from "@/components/matches/action-buttons";
import ManageProfileScreen from "../manage-profile";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAndroidBack } from "@/hooks/useAndroidBack";

export default function ProfileDetailScreen() {
  const { id, name, age, photo } = useLocalSearchParams<{ id: string; name?: string; age?: string; photo?: string }>();

  // Secondary fetch for heavy data
  const { data: fullProfile, isLoading: isLoadingFull } = useGetProfileDetailsQuery(id as string);
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const cardColor = useColor("card");
  const { isVisible, open, close } = useBottomSheet();
  const swipeMutation = useSwipeActionMutation();
  const queryClient = useQueryClient();

  const handleAction = (action: 'liked' | 'disliked' | 'superliked') => {
    swipeMutation.mutate({ targetId: id as string, action: action as any }, {
      onSuccess: () => {
        router.back();
      }
    });
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: muted }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Icon name={X} size={20} color={text} />
        </Pressable>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.headerName}>
            {fullProfile?.name || name}{(fullProfile?.age || age) ? `, ${fullProfile?.age || age}` : ""}
          </Text>
          {fullProfile?.is_verified && <CheckCircle2 size={24} color="#3B82F6" />}
        </View>
        <View />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Images */}
        <View style={styles.heroImageContainer}>
          {fullProfile?.photos && fullProfile.photos.length > 0 ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {fullProfile.photos.map((p: any) => (
                <Image
                  key={p.id}
                  source={{ uri: p.image }}
                  style={{ width: Dimensions.get('window').width - 40, height: Dimensions.get('window').width - 40, borderRadius: 24 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : (
            <Image
              source={{ uri: photo || fullProfile?.face_selfie || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop' }}
              style={{ width: Dimensions.get('window').width - 40, height: Dimensions.get('window').width - 40, borderRadius: 24 }}
              resizeMode="cover"
            />
          )}
        </View>

        {isLoadingFull && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: muted }}>Loading complete profile...</Text>
          </View>
        )}

        {/* Neurotype */}
        {fullProfile?.neurotype_labels && fullProfile.neurotype_labels.length > 0 && (
          <>
            <SectionHeader title="NEUROTYPE" />
            <View style={styles.pillRow}>
              {fullProfile.neurotype_labels.map((label: string, index: number) => (
                <View key={index} style={[styles.pill, { backgroundColor: "#B2EBF2" }]}>
                  <Text style={[styles.pillText, { color: "#006064" }]}>{label}</Text>
                </View>
              ))}
              {fullProfile.is_neurodivergent && (
                <View style={[styles.pill, { backgroundColor: "#B2DFDB" }]}>
                  <Text style={[styles.pillText, { color: "#004D40" }]}>i'm neurodivergent</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Bio */}
        {/* Note: Bio doesn't exist on the backend yet, but we can show looking_for or relationship goals */}
        {fullProfile?.looking_for && (
          <>
            <SectionHeader title="LOOKING FOR" />
            <Text style={[styles.bio, { color: text }]}>
              {fullProfile.looking_for.charAt(0).toUpperCase() + fullProfile.looking_for.slice(1)}
            </Text>
          </>
        )}

        {/* Interests */}
        {fullProfile?.interests && fullProfile.interests.length > 0 && (
          <>
            <SectionHeader title="INTERESTS" />
            <View style={styles.pillRow}>
              {fullProfile.interests.map((interest: string, index: number) => (
                <View key={index} style={[styles.interestPill, { backgroundColor: "#F5E6D3" }]}>
                  <Text style={[styles.interestText, { color: "#3E2723" }]}>{interest}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Qualities */}
        {fullProfile?.qualities && fullProfile.qualities.length > 0 && (
          <>
            <SectionHeader title="QUALITIES" />
            <View style={styles.pillRow}>
              {fullProfile.qualities.map((quality: string, index: number) => (
                <View key={index} style={[styles.interestPill, { backgroundColor: "#E1BEE7" }]}>
                  <Text style={[styles.interestText, { color: "#4A148C" }]}>{quality}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Sensory Needs */}
        {fullProfile?.recharge_methods && fullProfile.recharge_methods.length > 0 && (
          <>
            <SectionHeader title="HOW I RECHARGE" />
            {fullProfile.recharge_methods.map((method: string, index: number) => (
              <View key={index} style={[styles.sensoryRow, { backgroundColor: cardColor }]}>
                <View style={styles.sensoryLeft}>
                  <Icon name={Lightbulb} size={20} color={text} />
                  <Text style={[styles.sensoryText, { color: text }]}>{method}</Text>
                </View>
                <View style={styles.checkCircle}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Exhaust Triggers */}
        {fullProfile?.exhaust_triggers && fullProfile.exhaust_triggers.length > 0 && (
          <>
            <SectionHeader title="WHAT EXHAUSTS ME" />
            {fullProfile.exhaust_triggers.map((trigger: string, index: number) => (
              <View key={index} style={[styles.sensoryRow, { backgroundColor: cardColor }]}>
                <View style={styles.sensoryLeft}>
                  <Icon name={VolumeX} size={20} color={text} />
                  <Text style={[styles.sensoryText, { color: text }]}>{trigger}</Text>
                </View>
                <View style={[styles.checkCircle, { backgroundColor: '#FFEBEE' }]}>
                  <Text style={[styles.checkIcon, { color: '#C62828' }]}>✕</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      {(fullProfile?.connection_status === 'match' || fullProfile?.connection_status === 'friend') ? (
        <View
          style={[styles.fabContainer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}
        >
          <Button onPress={() => router.push(`/inbox/${id}`)}>Message</Button>
        </View>
      ) : (
        <View style={[styles.fabContainer, { paddingBottom: insets.bottom, backgroundColor: background }]}>
          <ActionButtons
            onReject={() => handleAction('disliked')}
            onSuper={() => handleAction('superliked')}
            onLike={() => handleAction('liked')}
            disabled={swipeMutation.isPending}
            likePending={swipeMutation.isPending}
          />
        </View>
      )}

      <BottomSheet
        isVisible={isVisible}
        onClose={close}
        title="Manage Profile"
        snapPoints={[0.5, 0.9]}
      >
        <ManageProfileScreen />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroImageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontWeight: "bold",
    fontSize: 14,
  },
  bio: {
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 24,
  },
  interestPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EFEBE1",
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
  },
  sensoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  sensoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sensoryText: {
    fontSize: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#004D40",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIcon: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    // Gradient overlay could go here, but transparent background for now
  },
  fab: {
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  fabLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
