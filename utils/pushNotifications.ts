import { Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  getToken,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { apiClient } from '@/api/client';

export type PushNotificationData = Record<string, string>;

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

/**
 * Keeps the backend token in sync when FCM rotates it, and routes the user when
 * they tap a delivered notification. Returns an unsubscribe function.
 */
export function subscribeToPushNotifications(
  onOpen: (data: PushNotificationData | undefined) => void,
): () => void {
  const messagingInstance = getMessaging();

  const unsubRefresh = onTokenRefresh(messagingInstance, async (token) => {
    try {
      await apiClient.post('/api/auth/push-token/', { push_token: token });
    } catch (error) {
      console.warn('Failed to refresh push token:', error);
    }
  });

  const unsubOpened = onNotificationOpenedApp(messagingInstance, (message) => {
    onOpen(message?.data as PushNotificationData | undefined);
  });

  // Cold start: the app was launched by tapping a notification.
  void getInitialNotification(messagingInstance)
    .then((message) => {
      if (message) onOpen(message?.data as PushNotificationData | undefined);
    })
    .catch(() => {});

  return () => {
    unsubRefresh();
    unsubOpened();
  };
}
