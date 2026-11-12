import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import { BellOff } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { areNotificationsEnabled, ensureNotificationPermission } from "@/utils/pushNotifications";

/**
 * Shown for as long as push notifications are not allowed on this device.
 * "Turn on" asks again, or opens the system settings when Android/iOS will no
 * longer show its own prompt. Re-checks when the app returns to the
 * foreground, so it disappears as soon as the user enables notifications.
 */
export function NotificationPermissionBanner() {
  const { t } = useTranslation();
  const primary = useColor("primary");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void areNotificationsEnabled().then(setEnabled);
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  if (enabled) return null;

  const turnOn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Asks again if allowed; otherwise shows the "Open Settings" dialog.
      const granted = await ensureNotificationPermission();
      if (granted) setEnabled(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.banner, { backgroundColor: primary + "12", borderColor: primary + "40" }]}>
      <View style={[styles.iconWrap, { backgroundColor: primary + "22" }]}>
        <BellOff size={20} color={primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: text }]}>
          {t("notifications.permission_title", "Notifications are turned off")}
        </Text>
        <Text style={[styles.desc, { color: muted }]}>
          {t(
            "notifications.permission_desc",
            "Turn them on so you don't miss new matches, messages and friend requests.",
          )}
        </Text>
      </View>
      <Pressable
        onPress={turnOn}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [styles.button, { backgroundColor: primary, opacity: pressed || busy ? 0.8 : 1 }]}
      >
        <Text style={styles.buttonText}>{t("notifications.permission_button", "Turn on")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  desc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "700",
  },
});
