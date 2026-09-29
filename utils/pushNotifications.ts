import { Platform } from 'react-native';
import { getMessaging, requestPermission, getToken, AuthorizationStatus } from '@react-native-firebase/messaging';
import { apiClient } from '@/api/client';

/**
 * registerForPushNotificationsAsync
 * ----------------------------------
 * Requests push notification permissions and registers the device FCM Push Token with the backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const messagingInstance = getMessaging();
    // Request permission (iOS only requires this, Android 13+ also requests)
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('⚠️ Push notification permissions not granted.');
      return null;
    }

    // Get the device token
    token = await getToken(messagingInstance);

    if (token) {
      // Send token to Django backend endpoint
      await apiClient.post('/api/auth/push-token/', { push_token: token });
      console.log('✅ Registered FCM Push Token with backend:', token);
    }
  } catch (error) {
    console.error('❌ Failed to get push token:', error);
  }

  return token;
}
