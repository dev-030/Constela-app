import { Linking } from "react-native";
import i18n from "@/app/i18n";
import { showAlert } from "@/components/ui/app-alert";

export type PermissionKind = "camera" | "gallery" | "microphone" | "notifications";

/** Minimal shape shared by expo-image-picker / expo-audio / expo-camera responses. */
interface ExpoPermissionResponse {
  granted: boolean;
  canAskAgain: boolean;
}

const MESSAGE_KEYS: Record<PermissionKind, [string, string]> = {
  camera: ["permissions.camera_message", "Camera access is turned off. Allow it in Settings to take photos."],
  gallery: ["permissions.gallery_message", "Photo access is turned off. Allow it in Settings to share photos."],
  microphone: ["permissions.microphone_message", "Microphone access is turned off. Allow it in Settings to send voice messages."],
  notifications: ["permissions.notifications_message", "Notifications are turned off. Allow them in Settings to get alerts for matches and messages."],
};

/**
 * Once a permission is permanently denied the OS no longer shows its own
 * prompt, so we show ours every time the feature is used, with a shortcut to
 * the app's system settings page.
 */
export function showPermissionBlockedAlert(kind: PermissionKind) {
  const [messageKey, messageFallback] = MESSAGE_KEYS[kind];
  showAlert(
    i18n.t("permissions.title", "Permission needed"),
    i18n.t(messageKey, messageFallback),
    [
      { text: i18n.t("permissions.not_now", "Not now"), style: "cancel" },
      {
        text: i18n.t("permissions.open_settings", "Open Settings"),
        onPress: () => {
          void Linking.openSettings().catch(() => {});
        },
      },
    ],
  );
}

/**
 * Ask for an expo-style permission every time a feature needs it:
 *  - already granted → true
 *  - OS can still ask → show the system prompt again
 *  - OS will no longer ask (blocked) → show our "Open Settings" dialog
 */
export async function ensureExpoPermission(
  kind: PermissionKind,
  request: () => Promise<ExpoPermissionResponse>,
): Promise<boolean> {
  const response = await request();
  if (response.granted) return true;
  if (!response.canAskAgain) showPermissionBlockedAlert(kind);
  return false;
}
