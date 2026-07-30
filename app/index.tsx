import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Redirect } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { useColor } from "@/hooks/useColor";

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { profile, fetchProfile, isLoading: isProfileLoading, error } = useProfileStore();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");

  useEffect(() => {
    if (isAuthenticated && !profile && !isProfileLoading) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, isProfileLoading]);

  if (isRestoring) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  if (isProfileLoading || (!profile && !error)) {
    return (
      <View style={{ flex: 1, backgroundColor: background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: background, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ color: text, fontSize: 16, textAlign: "center", marginBottom: 20 }}>
          {error}
        </Text>
        <Pressable
          onPress={() => fetchProfile()}
          style={{
            backgroundColor: primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 24,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 16 }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (profile) {
    // If the user hasn't completed face verification (onboarding final step)
    if (profile.face_verification_status === "not_submitted") {
      const hasCoreData = profile.photos && profile.photos.length >= 3 && profile.age !== null;
      if (profile.onboarding_part1_completed && hasCoreData) {
        return <Redirect href={"/onboarding/face-verification"} />;
      }
      return <Redirect href={"/onboarding"} />;
    }
    return <Redirect href={"/(tabs)/home"} />;
  }

  return null;
}
