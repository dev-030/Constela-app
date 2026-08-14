import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ChatSocketProvider } from '@/api/ChatSocketProvider';
import { Toaster } from 'sonner-native';
import { useAuthStore } from '@/store/authStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/theme/colors';
import { ThemeProvider } from '@/theme/theme-provider';
import { osName } from 'expo-device';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { setBackgroundColorAsync } from 'expo-system-ui';
import React, { useEffect } from 'react';
import { BackHandler, LogBox, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

LogBox.ignoreAllLogs();

import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '504633031372-14dbhe821adkj85sarl3g1otq3gu10um.apps.googleusercontent.com',
  offlineAccess: true,
});

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

import { ThemeContextProvider } from '@/providers/theme-context';

function RootLayoutContent() {
  const colorScheme = useColorScheme() || 'light';

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(
        colorScheme === 'light' ? 'dark' : 'light'
      );
    }
  }, [colorScheme]);

  // Keep the root view background color in sync with the current theme
  useEffect(() => {
    setBackgroundColorAsync(
      colorScheme === 'dark' ? Colors.dark.background : Colors.light.background
    );
  }, [colorScheme]);

  return (
    <ThemeProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />

        <Stack screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background } 
        }}>
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />

          <Stack.Screen
            name='sheet'
            options={{
              headerShown: false,
              sheetGrabberVisible: true,
              sheetAllowedDetents: [1],
              contentStyle: {
                backgroundColor: isLiquidGlassAvailable()
                  ? 'transparent'
                  : colorScheme === 'dark'
                  ? Colors.dark.card
                  : Colors.light.card,
              },
              headerTransparent: Platform.OS === 'ios' ? true : false,
              headerLargeTitle: false,
              title: '',
              presentation: 'modal',
              sheetInitialDetentIndex: 0,
              headerStyle: {
                backgroundColor:
                  Platform.OS === 'ios'
                    ? 'transparent'
                    : colorScheme === 'dark'
                    ? Colors.dark.card
                    : Colors.light.card,
              },
              headerBlurEffect: isLiquidGlassAvailable()
                ? undefined
                : colorScheme === 'dark'
                ? 'dark'
                : 'light',
            }}
          />
          <Stack.Screen
            name='drawer'
            options={{
              presentation: 'transparentModal',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name='filters'
            options={{
              presentation: 'transparentModal',
              animation: 'fade',
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
            }}
          />
          <Stack.Screen
            name='profile'
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='community-chat'
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name='notifications'
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen name='+not-found' />
        </Stack>
      </ThemeProvider>
  );
}

const queryClient = new QueryClient();

import { useProfileStore } from '@/store/profileStore';

export default function RootLayout() {
  const { restoreAuth, isAuthenticated, isRestoring } = useAuthStore();
  const { profile } = useProfileStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreAuth();
  }, []);

  useEffect(() => {
    if (isRestoring) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }
  }, [isAuthenticated, isRestoring, segments]);

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
