import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useColor } from "@/hooks/useColor";
import { ShieldCheck, ShieldAlert, CheckCircle2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiClient } from "@/api/client";
import { useProfileStore } from "@/store/profileStore";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";

export default function VerificationPromptScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");
  const muted = useColor("textMuted");
  
  const { fetchProfile } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSkip = async () => {
    try {
      setIsLoading(true);
      // Update status to skipped so we don't ask again on every boot
      await apiClient.patch('/api/profile/me/', { face_verification_status: 'skipped' });
      await fetchProfile();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Failed to skip verification:", error);
      // Fallback
      router.replace("/(tabs)/home");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = () => {
    router.push("/onboarding/face-verification");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={{ width: "100%", flexDirection: "row", justifyContent: "flex-end", marginBottom: 12 }}>
          <LanguagePickerButton />
        </View>

        <View style={styles.iconContainer}>
          <ShieldCheck size={80} color={primary} />
          <View style={[styles.badge, { backgroundColor: background }]}>
            <CheckCircle2 size={32} color="#3B82F6" />
          </View>
        </View>

        <Text variant="title" style={[styles.title, { color: text }]}>
          {t("onboarding.verification_prompt.title", "Get the Blue Tick")}
        </Text>
        
        <Text style={[styles.subtitle, { color: muted }]}>
          {t("onboarding.verification_prompt.subtitle", "Stand out from the crowd! Verified profiles get up to 3x more matches and show others you're the real deal.")}
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color="#3B82F6" />
            <Text style={[styles.benefitText, { color: text }]}>
              {t("onboarding.verification_prompt.benefit1", "Prove you are a real person")}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color="#3B82F6" />
            <Text style={[styles.benefitText, { color: text }]}>
              {t("onboarding.verification_prompt.benefit2", "Get prioritized in the matching feed")}
            </Text>
          </View>
          <View style={styles.benefitRow}>
            <CheckCircle2 size={20} color="#3B82F6" />
            <Text style={[styles.benefitText, { color: text }]}>
              {t("onboarding.verification_prompt.benefit3", "Unlock the Verified Badge on your profile")}
            </Text>
          </View>
        </View>

      </View>

      <View style={styles.footer}>
        <Button
          variant="default"
          size="lg"
          onPress={handleVerify}
          style={styles.verifyButton}
        >
          {t("onboarding.verification_prompt.verify_btn", "Verify My Face Now")}
        </Button>
        
        <Pressable 
          onPress={handleSkip}
          disabled={isLoading}
          style={styles.skipButton}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={muted} />
          ) : (
            <Text style={[styles.skipText, { color: muted }]}>
              {t("onboarding.verification_prompt.skip_btn", "Skip for Now")}
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "relative",
    marginBottom: 32,
  },
  badge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    borderRadius: 16,
    padding: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  benefitsList: {
    width: "100%",
    gap: 16,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    gap: 16,
  },
  verifyButton: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 30,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
