import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook that provides safe area insets with Android gesture navigation adjustments
 */
export function useSafeAreaWithKeyboard() {
  const insets = useSafeAreaInsets();

  // Android devices with gesture navigation need extra bottom padding
  const adjustedBottom = Platform.OS === 'android'
    ? Math.max(insets.bottom, 20) // Minimum 20px for gesture bar
    : insets.bottom;

  return {
    ...insets,
    bottom: adjustedBottom,
    // Helper for content padding that accounts for gesture navigation
    contentPaddingBottom: adjustedBottom,
    // Helper for button containers at the bottom
    buttonContainerPaddingBottom: adjustedBottom + 8,
  };
}
