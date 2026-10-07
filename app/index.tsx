import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View, Text, Pressable } from "react-native";
import { useColor } from "@/hooks/useColor";
import { WifiOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function IndexScreen() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const { profile, fetchProfile, isLoading: isProfileLoading, error, hasHydrated } = useProfileStore();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");
  const textMuted = useColor("textMuted");

  React.useEffect(() => {
    if (isAuthenticated && hasHydrated && !profile && !isProfileLoading && !error) {
      fetchProfile();
    }
  }, [isAuthenticated, hasHydrated, profile, isProfileLoading, error, fetchProfile]);

  // Wait for storage hydration before making any routing decision
  if (isRestoring || !hasHydrated) {
    return null;
  }

  // Not authenticated -> go to login
  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }

  // Fast path: Profile already cached locally -> route immediately with zero wait & zero spinner!
  if (profile) {
    if (!profile.onboarding_part1_completed) {
      return <Redirect href={"/onboarding"} />;
    }

    if (profile.face_verification_status === "not_submitted") {
      return <Redirect href={"/onboarding/verification-prompt"} />;
    }

    return <Redirect href={"/(tabs)/home"} />;
  }

  // Offline / Network error state when there is no cached profile
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
          {isNetworkError ? t('common.connection_error', "Connection Error") : t('common.something_went_wrong', "Oops, something went wrong")}
        </Text>
        
        <Text style={{ color: textMuted, fontSize: 15, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
          {isNetworkError 
            ? t('common.network_error_desc', "We couldn't reach the server. Please check your internet connection.")
            : error}
        </Text>
        
        <Pressable
          disabled={isProfileLoading}
          onPress={() => fetchProfile()}
          style={({ pressed }) => ({
            backgroundColor: primary,
            paddingHorizontal: 32,
            paddingVertical: 16,
            borderRadius: 30,
            width: '100%',
            opacity: pressed || isProfileLoading ? 0.8 : 1,
            shadowColor: primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
          })}
        >
          {isProfileLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16, textAlign: 'center' }}>
              {t('common.try_again', "Try Again")}
            </Text>
          )}
        </Pressable>
      </View>
    );
  }

  // Profile is still being fetched on cold start without cache:
  // Return null so the native splash screen remains smoothly visible without showing an ugly spinner!
  return null;
}
