import "./i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ChatSocketProvider } from "@/api/ChatSocketProvider";
import { Toaster, toast } from "sonner-native";
import { useAuthStore } from "@/store/authStore";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/theme/colors";
import { ThemeProvider } from "@/theme/theme-provider";
import { usePrefetchOnAppStart } from "@/hooks/usePrefetchOnAppStart";
import { useProfileStore } from "@/store/profileStore";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect, useRef } from "react";
import { LogBox, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { ThemeContextProvider } from "@/providers/theme-context";

LogBox.ignoreAllLogs();

GoogleSignin.configure({
  webClientId:
    "504633031372-14dbhe821adkj85sarl3g1otq3gu10um.apps.googleusercontent.com",
});

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});
void SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const colorScheme = useColorScheme() || "light";
  const { profile } = useProfileStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useRouter();
  // Read from push listeners without resubscribing on every navigation.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // Warm common tabs immediately and gated tabs only when local access allows it.
  usePrefetchOnAppStart(isAuthenticated ? profile : null);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        colorScheme === "light" ? "dark" : "light",
      );
    }
  }, [colorScheme]);

  // Keep the root view background color in sync with the current theme
  useEffect(() => {
    setBackgroundColorAsync(
      colorScheme === "dark" ? Colors.dark.background : Colors.light.background,
    );
  }, [colorScheme]);

  useEffect(() => {
    if (!isAuthenticated || !profile?.id) return;
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    void import("@/utils/pushNotifications")
      .then((m) => {
        if (disposed) return;
        m.registerForPushNotificationsAsync().catch(console.error);
        const openPush = (data: Record<string, string> | undefined) => {
          if (data?.type === "message" && data.profile_id) {
            router.push(`/inbox/${data.profile_id}`);
          } else if (data?.type === "match") {
            router.push("/(tabs)/matches");
          } else if (
            data?.type === "friend_request_received" ||
            data?.type === "friend_request_accepted"
          ) {
            router.push("/(tabs)/friends");
          }
        };
        unsubscribe = m.subscribeToPushNotifications({
          onOpen: openPush,
          onForeground: ({ title, body, data }) => {
            // The open conversation already shows the message live.
            if (
              data?.type === "message" &&
              pathnameRef.current === `/inbox/${data.profile_id}`
            ) {
              return;
            }
            if (!title && !body) return;
            toast(title || body || "", {
              description: title ? body : undefined,
              onPress: () => openPush(data),
            });
          },
        });
      })
      .catch(console.error);

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [isAuthenticated, profile?.id, router]);

  return (
    <ThemeProvider>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} animated />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor:
              colorScheme === "dark"
                ? Colors.dark.background
                : Colors.light.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen
          name="sheet"
          options={{
            headerShown: false,
            sheetGrabberVisible: true,
            sheetAllowedDetents: [1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colorScheme === "dark"
                  ? Colors.dark.card
                  : Colors.light.card,
            },
            headerTransparent: Platform.OS === "ios" ? true : false,
            headerLargeTitle: false,
            title: "",
            presentation: "modal",
            sheetInitialDetentIndex: 0,
            headerStyle: {
              backgroundColor:
                Platform.OS === "ios"
                  ? "transparent"
                  : colorScheme === "dark"
                    ? Colors.dark.card
                    : Colors.light.card,
            },
            headerBlurEffect: isLiquidGlassAvailable()
              ? undefined
              : colorScheme === "dark"
                ? "dark"
                : "light",
          }}
        />
        <Stack.Screen
          name="drawer"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="filters"
          options={{
            presentation: "transparentModal",
            animation: "fade",
            headerShown: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="community-chat"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="inbox/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="connections"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

const queryClient = new QueryClient();

export default function RootLayout() {
  const { restoreAuth, isAuthenticated, isRestoring, accessToken } = useAuthStore();
  const {
    profile,
    hasHydrated,
    fetchProfile,
    clearProfile,
    error: profileError,
  } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();
  const refreshedToken = React.useRef<string | null>(null);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  useEffect(() => {
    if (!isRestoring && hasHydrated && isAuthenticated && accessToken && refreshedToken.current !== accessToken) {
      refreshedToken.current = accessToken;
      void fetchProfile();
    }
    if (!isRestoring && !isAuthenticated) {
      refreshedToken.current = null;
      queryClient.clear();
      if (profile) clearProfile();
    }
  }, [
    accessToken,
    clearProfile,
    fetchProfile,
    hasHydrated,
    isAuthenticated,
    isRestoring,
    profile,
  ]);

  useEffect(() => {
    if (
      !isRestoring &&
      (!isAuthenticated || (hasHydrated && (Boolean(profile) || Boolean(profileError))))
    ) {
      void SplashScreen.hideAsync();
    }
  }, [hasHydrated, isAuthenticated, isRestoring, profile, profileError]);

  useEffect(() => {
    // Safety fallback: ensure splash screen never hangs indefinitely
    const safetyTimer = setTimeout(() => {
      void SplashScreen.hideAsync();
    }, 4000);
    return () => clearTimeout(safetyTimer);
  }, []);

  useEffect(() => {
    if (isRestoring) return;

    const inAuthGroup = segments[0] === "(auth)";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }
  }, [isAuthenticated, isRestoring, router, segments]);

  return (
    <KeyboardProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ChatSocketProvider>
            <ThemeContextProvider>
              <RootLayoutContent />
              <Toaster />
            </ThemeContextProvider>
          </ChatSocketProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
}
