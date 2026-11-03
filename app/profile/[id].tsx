import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useGetProfileDetailsQuery } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";
import { Alert } from "react-native";
import { useSwipeActionMutation } from "@/api/matching";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Lightbulb,
  VolumeX,
  CheckCircle2,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { ActionButtons } from "@/components/matches/action-buttons";
import ManageProfileScreen from "../manage-profile";
import { Button } from "@/components/ui/button";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { useTranslation } from "react-i18next";
import { useProfileLabels } from "@/hooks/use-profile-labels";

export default function ProfileDetailScreen() {
  const { t } = useTranslation();
  const { label, listLabel, rechargeTitle, interestCategory } = useProfileLabels();
  const { id, name, age, photo, is_verified } = useLocalSearchParams<{
    id: string;
    name?: string;
    age?: string;
    photo?: string;
    is_verified?: string;
  }>();

  // Profile details cached with 5min staleTime
  const { data: fullProfile, isLoading: isLoadingFull } = useGetProfileDetailsQuery(id as string);
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const cardColor = useColor("card");
  const isDark = useColorScheme() === "dark";
  const { isVisible, open, close } = useBottomSheet();
  const swipeMutation = useSwipeActionMutation();
  const queryClient = useQueryClient();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const imageWidth = Dimensions.get("window").width - 40;

  // Stable photos list — always keep first item stable so React never unmounts the primary image
  const photos = useMemo(() => {
    if (fullProfile?.photos && fullProfile.photos.length > 0) {
      const sorted = [...fullProfile.photos].sort((a: any, b: any) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
      return sorted.map((p: any) => (typeof p === "string" ? p : p.image));
    }
    const fallback = photo || (fullProfile as any)?.face_selfie;
    return fallback ? [fallback] : [];
  }, [fullProfile?.photos, (fullProfile as any)?.face_selfie, photo]);

  const handleAction = (action: "liked" | "disliked" | "superliked") => {
    if (action !== "disliked") {
      const currentQuota = useProfileStore.getState().profile?.access?.quotas.likes;
      const isQuotaDepleted =
        currentQuota?.remaining != null &&
        currentQuota.remaining <= 0 &&
        (!currentQuota.resets_at || new Date(currentQuota.resets_at).getTime() > Date.now());
      if (isQuotaDepleted) {
        Alert.alert(
          t('profile_detail.daily_limit_reached'),
          t('profile_detail.daily_limit_desc')
        );
        return;
      }
    }

    swipeMutation.mutate(
      { targetId: id as string, action: action as any },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (err: any) => {
          const status = err?.response?.status;
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Something went wrong. Please try again.";
          
          if (status === 429 || status === 403) {
            Alert.alert(t('profile_detail.limit_reached'), message);
          } else if (status === 404) {
            Alert.alert(t('profile_detail.already_decided'), t('profile_detail.already_decided_desc'));
          } else {
            Alert.alert(t('profile_detail.action_failed'), message);
          }
        }
      }
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: muted }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.05)",
              borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "rgba(0, 0, 0, 0.06)",
              transform: [{ scale: pressed ? 0.92 : 1 }],
            },
          ]}
          hitSlop={8}
          onPress={() => router.back()}
        >
          <Icon name={X} size={18} color={text} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerName}>
            {fullProfile?.name || name}
            {fullProfile?.age || age ? `, ${fullProfile?.age || age}` : ""}
          </Text>
          {(fullProfile?.is_verified ?? is_verified === "true") && (
            <CheckCircle2 size={22} color="#3B82F6" />
          )}
        </View>

        {/* Symmetrical spacer to ensure title stays centered */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Images - Stable container so expo-image uses memory cache with zero flicker */}
        <View style={styles.heroImageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={photos.length > 1}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
              setActivePhotoIndex(idx);
            }}
            style={styles.imageScroll}
          >
            {photos.map((uri: string, index: number) => (
              <Image
                key={index === 0 ? "hero-main-photo" : `photo-${index}-${uri}`}
                source={{ uri }}
                style={{ width: imageWidth, height: imageWidth, borderRadius: 24 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                priority={index === 0 ? "high" : "normal"}
              />
            ))}
          </ScrollView>

          {/* Carousel Segment Indicators (story-style) */}
          {photos.length > 1 && (
            <View style={styles.carouselIndicators} pointerEvents="none">
              {photos.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.indicatorBar,
                    idx === activePhotoIndex && styles.indicatorBarActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Loading Skeleton Placeholder when not yet cached */}
        {isLoadingFull && !fullProfile && (
          <View style={styles.skeletonContainer}>
            <View
              style={[
                styles.skeletonHeader,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" },
              ]}
            />
            <View
              style={[
                styles.skeletonText,
                { width: "45%", backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
              ]}
            />

            <View
              style={[
                styles.skeletonHeader,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", marginTop: 24 },
              ]}
            />
            <View style={styles.skeletonPillRow}>
              {[88, 130, 96, 115].map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.skeletonPill,
                    { width: w, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
                  ]}
                />
              ))}
            </View>

            <View
              style={[
                styles.skeletonHeader,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", marginTop: 24 },
              ]}
            />
            <View style={styles.skeletonPillRow}>
              {[105, 95, 140].map((w, i) => (
                <View
                  key={i}
                  style={[
                    styles.skeletonPill,
                    { width: w, backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Neurotype */}
        {fullProfile?.neurotype_labels && fullProfile.neurotype_labels.length > 0 && (
          <>
            <SectionHeader title={t('profile_detail.neurotype')} />
            <View style={styles.pillRow}>
              {fullProfile.neurotype_labels.map((label: string, index: number) => (
                <View key={index} style={[styles.pill, { backgroundColor: "#B2EBF2" }]}>
                  <Text style={[styles.pillText, { color: "#006064" }]}>{listLabel('neurotypes', label)}</Text>
                </View>
              ))}
              {(fullProfile as any)?.is_neurodivergent && (
                <View style={[styles.pill, { backgroundColor: "#B2DFDB" }]}>
                  <Text style={[styles.pillText, { color: "#004D40" }]}>{t('profile_detail.im_neurodivergent')}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Bio / Looking For */}
        {fullProfile?.looking_for && (
          <>
            <SectionHeader title={t('profile_detail.looking_for')} />
            <Text style={[styles.bio, { color: text }]}>
              {label(fullProfile.looking_for)}
            </Text>
          </>
        )}

        {/* Interests */}
        {fullProfile?.interests && fullProfile.interests.length > 0 && (
          <>
            <SectionHeader title={t('profile_detail.interests')} />
            <View style={styles.pillRow}>
              {fullProfile.interests.map((interest: string, index: number) => (
                <View key={index} style={[styles.interestPill, { backgroundColor: "#F5E6D3" }]}>
                  <Text style={[styles.interestText, { color: "#3E2723" }]}>{interestCategory(interest)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Qualities */}
        {fullProfile?.qualities && fullProfile.qualities.length > 0 && (
          <>
            <SectionHeader title={t('profile_detail.qualities')} />
            <View style={styles.pillRow}>
              {fullProfile.qualities.map((quality: string, index: number) => (
                <View key={index} style={[styles.interestPill, { backgroundColor: "#E1BEE7" }]}>
                  <Text style={[styles.interestText, { color: "#4A148C" }]}>{listLabel('qualities', quality)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Sensory Needs */}
        {fullProfile?.recharge_methods && fullProfile.recharge_methods.length > 0 && (
          <>
            <SectionHeader title={t('profile_detail.how_i_recharge')} />
            {fullProfile.recharge_methods.map((method: string, index: number) => (
              <View key={index} style={[styles.sensoryRow, { backgroundColor: cardColor }]}>
                <View style={styles.sensoryLeft}>
                  <Icon name={Lightbulb} size={20} color={text} />
                  <Text style={[styles.sensoryText, { color: text }]}>{rechargeTitle(method)}</Text>
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
            <SectionHeader title={t('profile_detail.what_exhausts_me')} />
            {fullProfile.exhaust_triggers.map((trigger: string, index: number) => (
              <View key={index} style={[styles.sensoryRow, { backgroundColor: cardColor }]}>
                <View style={styles.sensoryLeft}>
                  <Icon name={VolumeX} size={20} color={text} />
                  <Text style={[styles.sensoryText, { color: text }]}>{listLabel('exhausts', trigger)}</Text>
                </View>
                <View style={[styles.checkCircle, { backgroundColor: "#FFEBEE" }]}>
                  <Text style={[styles.checkIcon, { color: "#C62828" }]}>✕</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      {fullProfile?.connection_status === "match" || fullProfile?.connection_status === "friend" ? (
        <View
          style={[styles.fabContainer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}
        >
          <Button onPress={() => router.push(`/inbox/${id}`)}>{t('profile_detail.message')}</Button>
        </View>
      ) : (
        <View style={[styles.fabContainer, { paddingBottom: insets.bottom, backgroundColor: background }]}>
          <ActionButtons
            onReject={() => handleAction("disliked")}
            onSuper={() => handleAction("superliked")}
            onLike={() => handleAction("liked")}
            disabled={swipeMutation.isPending}
            likePending={swipeMutation.isPending}
          />
        </View>
      )}

      <BottomSheet
        isVisible={isVisible}
        onClose={close}
        title={t('profile_detail.manage_profile')}
        snapPoints={[0.5, 0.9]}
      >
        <ManageProfileScreen name={fullProfile?.name || (fullProfile as any)?.username || (name as string)} />
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerName: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroImageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 20,
    position: "relative",
  },
  imageScroll: {
    borderRadius: 24,
  },
  carouselIndicators: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    gap: 6,
    zIndex: 10,
  },
  indicatorBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  indicatorBarActive: {
    backgroundColor: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 22,
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
  skeletonContainer: {
    paddingTop: 8,
  },
  skeletonHeader: {
    width: 90,
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonText: {
    height: 20,
    borderRadius: 6,
  },
  skeletonPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skeletonPill: {
    height: 34,
    borderRadius: 18,
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
  },
});
