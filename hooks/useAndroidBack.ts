import { useCallback } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect, router } from 'expo-router';

/**
 * useAndroidBack
 * ──────────────
 * Intercepts the Android hardware/system back button while the calling screen
 * is focused and navigates back via expo-router instead of letting the OS
 * close the activity.
 *
 * If the history stack cannot go back, it falls back to navigating to `fallbackRoute`
 * (defaults to '/(tabs)', i.e., Home), ensuring the app never forcibly exits.
 * Set `alwaysUseFallback` for screens with a fixed parent route.
 *
 * Drop this single line into any sub-screen component:
 *   useAndroidBack();
 */
export function useAndroidBack(
  fallbackRoute: string = '/(tabs)',
  alwaysUseFallback = false,
) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;

      const onBackPress = () => {
        if (alwaysUseFallback) {
          router.dismissTo(fallbackRoute as any);
        } else if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(fallbackRoute as any);
        }
        return true; // ALWAYS return true so Android hardware back NEVER forcibly exits the app!
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [alwaysUseFallback, fallbackRoute])
  );
}
