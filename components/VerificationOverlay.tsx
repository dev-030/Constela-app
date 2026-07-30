import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Lock, ShieldAlert } from "lucide-react-native";
import { useProfileStore } from "@/store/profileStore";
import { router } from "expo-router";
import { useColor } from "@/hooks/useColor";

export default function VerificationOverlay({ children }: { children: React.ReactNode }) {
  const profile = useProfileStore((s) => s.profile);
  const background = useColor("background");
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  if (!profile) return <>{children}</>;

  const isFaceApproved = profile.face_verification_status === "approved";
  const isProfileComplete = profile.profile_completion_pct === 100;
  
  if (isFaceApproved && isProfileComplete) {
    return <>{children}</>;
  }

  let message = "Your profile is pending verification or completion. Please finish setting up your profile and wait for admin approval to unlock this feature.";
  if (!isProfileComplete && isFaceApproved) {
    message = "Your profile is incomplete. Please finish setting up your profile to unlock this feature.";
  } else if (isProfileComplete && !isFaceApproved) {
    message = "Your face verification is pending admin approval. Please wait for an admin to verify your account.";
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={styles.iconContainer}>
        <Icon name={!isFaceApproved ? ShieldAlert : Lock} size={48} color={primary} />
      </View>
      
      <Text variant="title" style={styles.title}>
        Feature Locked
      </Text>
      
      <Text style={[styles.message, { color: muted }]}>
        {message}
      </Text>

      <View style={styles.actions}>
        {!isProfileComplete && (
          <Button
            variant="default"
            size="lg"
            onPress={() => router.push("/profile")}
            style={styles.button}
          >
            Complete Profile
          </Button>
        )}
        
        {!isFaceApproved && profile.face_verification_status !== "pending" && (
          <Button
            variant="outline"
            size="lg"
            onPress={() => router.push("/onboarding/face-verification")}
            style={styles.button}
          >
            Verify Face
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(34, 197, 94, 0.1)", // A subtle green tint by default
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
    fontSize: 24,
  },
  message: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    fontSize: 16,
    maxWidth: 300,
  },
  actions: {
    width: "100%",
    maxWidth: 320,
    gap: 12,
  },
  button: {
    width: "100%",
  },
});
