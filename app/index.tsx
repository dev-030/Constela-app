import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Redirect } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View, Text, Pressable, StyleSheet } from "react-native";
import { useColor } from "@/hooks/useColor";
import { WifiOff } from "lucide-react-native";

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { profile, fetchProfile, isLoading: isProfileLoading, error } = useProfileStore();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");

  useEffect(() => {
    if (isAuthenticated && !profile && !isProfileLoading && !error) {
      fetchProfile();
    }
  }, [isAuthenticated, profile, isProfileLoading, error]);

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
    const isNetworkError = error === 'Failed to fetch profile' || error.includes('Network');
    
    return (
      <View style={{ flex: 1, backgroundColor: background, justifyContent: "center", alignItems: "center", padding: 24 }}>
        <View style={{ 
          width: 80, 
          height: 80, 
          borderRadius: 40, 
          backgroundColor: primary + '15', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginBottom: 24
        }}>
          <WifiOff size={32} color={primary} />
        </View>
        
        <Text style={{ color: text, fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 }}>
          {isNetworkError ? "Connection Error" : "Oops, something went wrong"}
        </Text>
        
        <Text style={{ color: useColor("textMuted"), fontSize: 15, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          {isNetworkError 
            ? "We couldn't reach the server. Please check your internet connection."
            : error}
        </Text>
        
        <Pressable
          onPress={() => fetchProfile()}
          style={({ pressed }) => ({
            backgroundColor: primary,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 30,
            width: '100%',
            opacity: pressed ? 0.8 : 1,
            shadowColor: primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, textAlign: 'center' }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (profile) {
    if (!profile.onboarding_part1_completed) {
      return <Redirect href={"/onboarding"} />;
    }

    if (profile.face_verification_status === "not_submitted") {
      return <Redirect href={"/onboarding/verification-prompt"} />;
    }

    return <Redirect href={"/(tabs)/home"} />;
  }

  return null;
}
