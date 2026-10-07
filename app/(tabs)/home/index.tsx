import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Heart,
  MessageCircle,
  User,
  PlayCircle,
  Search,
  Coffee,
  Users,
  MessageSquare,
  BookOpen,
  Sliders,
  Bell,
  HandHeart,
} from "lucide-react-native";
import { Image, Pressable, ScrollView, View, StyleSheet, RefreshControl, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CardList from "../../../components/feat-card";
import Header from "../../../components/header";
import { useProfileStore } from "@/store/profileStore";
import { ShieldAlert } from "lucide-react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { isCompact, horizontalPadding } = useResponsiveLayout();
  const background = useColor("background");
  const primary = useColor("primary");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const error = useColor("destructive");
  const isDark = useColorScheme() === "dark";
  
  const { profile, fetchProfile } = useProfileStore();
  const rawName = profile?.user?.first_name || profile?.username || "";
  const displayName = rawName ? rawName.charAt(0).toUpperCase() + rawName.slice(1) : "";
  const isFaceApproved = profile?.face_verification_status === "approved";
  const isProfileComplete = profile?.profile_completion_pct === 100;
  const isFacePending = profile?.face_verification_status === "pending";
  const showWarning = isFacePending;

  const [refreshing, setRefreshing] = useState(false);
  const hasFocused = useRef(false);

  // Startup already loaded the profile. Refresh silently on later visits.
  useFocusEffect(
    useCallback(() => {
      if (!hasFocused.current) {
        hasFocused.current = true;
        return;
      }
      fetchProfile();
    }, [fetchProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  // Poll every minute IF profile is complete but face is not yet approved
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    
    if (isProfileComplete && !isFaceApproved) {
      interval = setInterval(() => {
        fetchProfile();
      }, 60000); // 60 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProfileComplete, isFaceApproved, fetchProfile]);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: isCompact ? 10 : 16,
            paddingBottom: 130,
          },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Donation Banner */}
        <View
          style={[
            styles.donationBanner,
            isCompact && styles.donationBannerCompact,
            {
              backgroundColor: isDark ? "rgba(222, 65, 119, 0.15)" : "#FFF1F5",
              borderColor: isDark ? "rgba(222, 65, 119, 0.3)" : "#FFE4E6",
            },
          ]}
        >
          <View style={[styles.donationIconWrap, isCompact && styles.donationIconWrapCompact, { backgroundColor: primary }]}>
            <Icon name={HandHeart} size={isCompact ? 12 : 14} color="#FFF" />
          </View>
          <Text style={[styles.donationText, isCompact && styles.donationTextCompact, { color: primary }]}>
            {t('dashboard.donate_desc')}
          </Text>
        </View>

        {/* Greeting */}
        <View style={[styles.greetingContainer, isCompact && { marginBottom: 14 }]}>
          <Text
            style={[
              styles.greetingTitle,
              isCompact && { fontSize: 20, marginBottom: 2 },
              { color: isDark ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            {displayName ? `${t('dashboard.hello')}, ${displayName}` : t('dashboard.hello')}
          </Text>
          <Text
            style={[
              styles.greetingSubtitle,
              isCompact && { fontSize: 13, lineHeight: 17 },
              { color: isDark ? "#94A3B8" : "#64748B" },
            ]}
          >
            {t('dashboard.what_to_do')}
          </Text>
        </View>

        {showWarning && (
          <Pressable 
            style={[styles.warningBanner, { backgroundColor: error + "15", borderColor: error + "30" }]}
            onPress={() => {
              Alert.alert(
                "Verification Pending",
                "Your face verification is currently under review by our admin team. No action is required from you at this time."
              );
            }}
          >
            <Icon name={ShieldAlert} size={20} color={error} />
            <View style={styles.warningTextContainer}>
              <Text style={[styles.warningTitle, { color: error }]}>
                Verification Pending
              </Text>
              <Text style={[styles.warningDesc, { color: error }]}>
                Your face verification is pending admin approval.
              </Text>
            </View>
          </Pressable>
        )}

        {/* Feature Cards */}
        <CardList />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  donationBanner: {
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
  },
  donationBannerCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 8,
    marginBottom: 14,
    borderRadius: 12,
  },
  donationIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  donationIconWrapCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  donationText: {
    fontSize: 12.5,
    fontWeight: "500",
    flex: 1,
    lineHeight: 17,
  },
  donationTextCompact: {
    fontSize: 11.5,
    lineHeight: 15,
  },
  greetingContainer: {
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    marginBottom: 20,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13.5,
    fontWeight: "600",
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 12.5,
    fontWeight: "400",
    opacity: 0.9,
    lineHeight: 17,
  },
});
