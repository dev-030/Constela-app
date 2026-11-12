import { PermissionsAndroid, Platform } from 'react-native';
import {
  getMessaging,
  requestPermission,
  hasPermission,
  getToken,
  deleteToken,
  onTokenRefresh,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { apiClient } from '@/api/client';
import { showPermissionBlockedAlert } from '@/utils/permissions';

export type PushNotificationData = Record<string, string>;

export interface ForegroundPush {
  title?: string;
  body?: string;
  data: PushNotificationData | undefined;
}

const registerToken = (token: string) =>
  apiClient.post('/api/auth/push-token/', { push_token: token, platform: Platform.OS });

const asData = (message: RemoteMessage | null | undefined) =>
  message?.data as PushNotificationData | undefined;

/**
 * Whether this device will actually show our notifications, checked WITHOUT
 * prompting the user. Covers the Android 13+ runtime grant, notifications
 * switched off in the system settings (any Android version) and iOS.
 * Errors count as "enabled" so we never nag because of a failed check.
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      if (!granted) return false;
    }
    const status = await hasPermission(getMessaging());
    return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
  } catch {
    return true;
  }
}

/**
 * Android 13+ only shows notifications after the POST_NOTIFICATIONS runtime grant;
 * Firebase's requestPermission does not ask for it on Android.
 */
async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const authStatus = await requestPermission(getMessaging());
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

const isAuthorized = (status: number) =>
  status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;

/**
 * Called when the user turns on a notification feature. Asks again if the OS
 * still allows it; if notifications are blocked, shows our "Open Settings"
 * dialog (the OS will not prompt any more). Registers the push token on success.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) showPermissionBlockedAlert('notifications');
          return false;
        }
      }
      // Covers notifications switched off in the system settings (any Android version).
      if (!isAuthorized(await hasPermission(getMessaging()))) {
        showPermissionBlockedAlert('notifications');
        return false;
      }
    } else {
      const status = await requestPermission(getMessaging());
      if (!isAuthorized(status)) {
        // iOS only shows its prompt once; after that the status is DENIED.
        if (status === AuthorizationStatus.DENIED) showPermissionBlockedAlert('notifications');
        return false;
      }
    }
  } catch (error) {
    console.warn('Failed to check notification permission:', error);
    return false;
  }

  void registerForPushNotificationsAsync();
  return true;
}

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
    if (!(await hasNotificationPermission())) {
      console.log('⚠️ Push notification permissions not granted.');
      return null;
    }

    // Get the device token
    token = await getToken(getMessaging());

    if (token) {
      // Send token to Django backend endpoint
      await registerToken(token);
      console.log('✅ Registered FCM Push Token with backend:', token);
    }
  } catch (error) {
    console.error('❌ Failed to get push token:', error);
  }

  return token;
}

/**
 * Removes this device from the signed-in account and discards its FCM token, so the
 * next account to sign in here gets a fresh one. Must run while still authenticated.
 */
export async function unregisterPushTokenAsync(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const messagingInstance = getMessaging();
    const token = await getToken(messagingInstance);
    if (token) {
      await apiClient.delete('/api/auth/push-token/', { data: { push_token: token } });
    }
    await deleteToken(messagingInstance);
  } catch (error) {
    console.warn('Failed to unregister push token:', error);
  }
}

/**
 * Keeps the backend token in sync when FCM rotates it, routes the user when they tap a
 * delivered notification, and hands pushes that arrive while the app is open to
 * onForeground (the OS does not display those). Returns an unsubscribe function.
 */
export function subscribeToPushNotifications({
  onOpen,
  onForeground,
}: {
  onOpen: (data: PushNotificationData | undefined) => void;
  onForeground: (push: ForegroundPush) => void;
}): () => void {
  const messagingInstance = getMessaging();

  const unsubRefresh = onTokenRefresh(messagingInstance, async (token) => {
    try {
      await registerToken(token);
    } catch (error) {
      console.warn('Failed to refresh push token:', error);
    }
  });

  const unsubMessage = onMessage(messagingInstance, (message) => {
    onForeground({
      title: message.notification?.title,
      body: message.notification?.body,
      data: asData(message),
    });
  });

  const unsubOpened = onNotificationOpenedApp(messagingInstance, (message) => {
    onOpen(asData(message));
  });

  // Cold start: the app was launched by tapping a notification.
  void getInitialNotification(messagingInstance)
    .then((message) => {
      if (message) onOpen(asData(message));
    })
    .catch(() => {});

  return () => {
    unsubRefresh();
    unsubMessage();
    unsubOpened();
  };
}
