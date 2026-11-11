import { useEffect, useRef } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AlertButton,
  type AlertOptions,
} from "react-native";
import { create } from "zustand";
import i18n from "@/app/i18n";
import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";

/**
 * App-styled replacement for React Native's `Alert.alert`.
 *
 * `showAlert` has the exact same signature as `Alert.alert` (title, message,
 * buttons with "default" | "cancel" | "destructive" styles, options), so call
 * sites switch over without any other change. It works outside components too
 * (utils, stores), and alerts raised while one is visible are queued — just
 * like the native ones.
 */

interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  options?: AlertOptions;
}

interface AlertState {
  queue: AlertRequest[];
  push: (request: AlertRequest) => void;
  shift: () => void;
}

const useAlertStore = create<AlertState>((set) => ({
  queue: [],
  push: (request) => set((state) => ({ queue: [...state.queue, request] })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));

let nextId = 1;

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void {
  const resolvedButtons =
    buttons && buttons.length > 0
      ? buttons
      : [{ text: i18n.t("settings_pages.ok", "OK"), style: "default" as const }];
  useAlertStore.getState().push({
    id: nextId++,
    title,
    message,
    buttons: resolvedButtons,
    options,
  });
}

/** Mount once at the app root (next to the toaster). */
export function AlertHost() {
  const current = useAlertStore((state) => state.queue[0]);
  const shift = useAlertStore((state) => state.shift);

  const scheme = useColorScheme() ?? "light";
  const isDark = scheme === "dark";
  const card = useColor("card");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const destructive = useColor("destructive");
  const border = useColor("border");

  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [current?.id, progress]);

  const cancelButton = current?.buttons.find((b) => b.style === "cancel");
  // Native Android alerts are dismissable by default; iOS ones only via a button.
  const cancelable = current?.options?.cancelable ?? Boolean(cancelButton);

  const close = (button?: AlertButton) => {
    // Remove first, so an onPress that opens another alert queues cleanly.
    shift();
    if (button) button.onPress?.();
    else current?.options?.onDismiss?.();
  };

  const dismiss = () => {
    if (!current) return;
    if (cancelButton) close(cancelButton);
    else if (cancelable) close();
  };

  useEffect(() => {
    if (!current) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  });

  if (!current) return null;

  // Cancel first (left / bottom), then the others in their given order.
  const ordered = [
    ...current.buttons.filter((b) => b.style === "cancel"),
    ...current.buttons.filter((b) => b.style !== "cancel"),
  ];
  const stacked = ordered.length > 2;

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={dismiss}>
      <Animated.View style={[styles.backdrop, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cancelable ? dismiss : undefined} />
        <Animated.View
          accessibilityRole="alert"
          style={[
            styles.card,
            {
              backgroundColor: isDark ? card : "#FFFFFF",
              borderColor: isDark ? border : "rgba(222, 65, 119, 0.12)",
              transform: [{ scale }],
            },
          ]}
        >
          <Text style={[styles.title, { color: text }]}>{current.title}</Text>
          {current.message ? (
            <Text style={[styles.message, { color: muted }]}>{current.message}</Text>
          ) : null}

          <View style={[styles.buttons, stacked ? styles.buttonsColumn : styles.buttonsRow]}>
            {(stacked ? [...ordered].reverse() : ordered).map((button, index) => {
              const isCancel = button.style === "cancel";
              const isDestructive = button.style === "destructive";
              const filled = !isCancel;
              const fill = isDestructive ? destructive : primary;
              return (
                <Pressable
                  key={`${button.text ?? "button"}-${index}`}
                  onPress={() => close(button)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.button,
                    !stacked && styles.buttonFlex,
                    filled
                      ? { backgroundColor: fill }
                      : { backgroundColor: "transparent", borderWidth: 1.5, borderColor: isDark ? border : "#E5E5EA" },
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text
                    numberOfLines={2}
                    style={[styles.buttonText, { color: filled ? "#FFFFFF" : text }]}
                  >
                    {button.text ?? i18n.t("settings_pages.ok", "OK")}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
  },
  buttons: {
    marginTop: 22,
    gap: 10,
  },
  buttonsRow: {
    flexDirection: "row",
  },
  buttonsColumn: {
    flexDirection: "column",
  },
  button: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFlex: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
