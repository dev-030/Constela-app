import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState, useEffect } from "react";
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

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const primary = useColor("primary");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const error = useColor("error") || "#ef4444";
  
  const { profile, fetchProfile } = useProfileStore();
  const isFaceApproved = profile?.face_verification_status === "approved";
  const isProfileComplete = profile?.profile_completion_pct === 100;
  const isFacePending = profile?.face_verification_status === "pending";
  const showWarning = isFacePending;

  const [refreshing, setRefreshing] = useState(false);

  // Automatically refresh profile data silently when returning to this tab
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

  // Poll every minute IF profile is complete but face is not yet approved
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
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
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />
        }
      >
        {/* Donation Banner */}
        <View
          style={[styles.donationBanner, { backgroundColor: primary + 30 }]}
        >
          <Icon name={HandHeart} size={20} color={primary} />
          <Text style={[styles.donationText, { color: primary }]}>
            {t('dashboard.donate_desc')}
          </Text>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text variant="title" style={styles.greetingTitle}>
            {t('dashboard.hello')} {profile?.user?.first_name || profile?.username || ""}
          </Text>
          <Text style={{ color: muted, fontSize: 16, fontWeight: "500" }}>{t('dashboard.what_to_do')}</Text>
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
    borderRadius: BORDER_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E25687" + 60,
  },
  donationText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    lineHeight: 20,
  },
  greetingContainer: {
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 24,
    borderRadius: BORDER_RADIUS,
    borderWidth: 1,
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  warningDesc: {
    fontSize: 13,
    opacity: 0.9,
    lineHeight: 18,
  },
});
