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

  if (!profile.must_verify_face) {
    return <>{children}</>;
  }

  const message = "Your account has received multiple reports from different users. To protect our community, you must verify your face to continue using the app.";

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={styles.iconContainer}>
        <Icon name={ShieldAlert} size={48} color={primary} />
      </View>
      
      <Text variant="title" style={styles.title}>
        Action Required
      </Text>
      
      <Text style={[styles.message, { color: muted }]}>
        {message}
      </Text>

      <View style={styles.actions}>
        <Button
          variant="default"
          size="lg"
          onPress={() => router.push("/onboarding/face-verification")}
          style={styles.button}
        >
          Verify Face Now
        </Button>
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
