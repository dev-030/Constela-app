import React from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { useColor } from "@/hooks/useColor";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  REACTION_EMOJIS,
  type MessageReactionSummary,
} from "@/utils/message-reactions";

export { REACTION_EMOJIS };
export type { MessageReactionSummary };

/** Screen-space rectangle of the message bubble a reaction bar is anchored to. */
export type ReactionAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ReactionPillsProps = {
  reactions?: MessageReactionSummary[] | null;
  myProfileId?: string | null;
  isMe: boolean;
  onOpenPicker?: () => void;
};

/**
 * Reactions render as small badges stamped on the bottom corner of the bubble,
 * exactly like Messenger — overlapping the bubble edge, taking no layout space.
 */
export function ReactionPills({
  reactions,
  myProfileId,
  onOpenPicker,
}: ReactionPillsProps) {
  const primary = useColor("primary");
  const isDark = useColorScheme() === "dark";

  if (!reactions?.length) return null;

  return (
    <View style={styles.badgeRow}>
      {reactions.map((reaction) => {
        const reactedByMe =
          !!myProfileId &&
          !!reaction.actor_ids?.some((id) => String(id) === String(myProfileId));

        return (
          <Pressable
            key={reaction.emoji}
            onPress={() => onOpenPicker?.()}
            onLongPress={onOpenPicker}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${reaction.emoji} ${reaction.count}`}
            style={({ pressed }) => [
              styles.badge,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{reaction.emoji}</Text>
            {reaction.count > 1 && (
              <Text
                style={[
                  styles.badgeCount,
                  {
                    color: reactedByMe
                      ? primary
                      : isDark
                        ? "#D1D1D6"
                        : "#6B7280",
                  },
                ]}
              >
                {reaction.count}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

type ReactionBarProps = {
  /** The reaction the current user already has on this message, if any. */
  myReaction?: string | null;
  onSelect: (emoji: string) => void;
  /** Closes the bar (tap outside, Android back button, emoji selected). */
  onClose: () => void;
  /** Screen-space rect of the message; the bar floats just below it. */
  anchor?: ReactionAnchor | null;
  align?: "left" | "right";
};

/**
 * Messenger-style reaction bar. It floats just below the message it belongs
 * to inside a transparent modal, so tapping anywhere else dismisses it.
 */
export function ReactionBar({
  myReaction,
  onSelect,
  onClose,
  anchor,
  align = "left",
}: ReactionBarProps) {
  const primary = useColor("primary");
  const isDark = useColorScheme() === "dark";
  const windowWidth = Dimensions.get("window").width;

  return (
    <Modal
      transparent
      visible={!!anchor}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Tap anywhere outside the bar to dismiss it. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {anchor ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.barOverlay,
            {
              top: anchor.y + anchor.height + 8,
              ...(align === "right"
                ? { right: windowWidth - (anchor.x + anchor.width) }
                : { left: anchor.x }),
            },
          ]}
        >
          <View
            style={[
              styles.bar,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                borderColor: isDark ? "rgba(255,255,255,0.10)" : "#E6E8EC",
                shadowColor: "#000",
              },
              align === "right" ? styles.barRight : styles.barLeft,
            ]}
          >
            {REACTION_EMOJIS.map((emoji) => {
              const isMine = myReaction === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => onSelect(emoji)}
                  style={({ pressed }) => [
                    styles.barEmoji,
                    isMine && { backgroundColor: `${primary}1F` },
                    pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={emoji}
                >
                  <Text style={{ fontSize: 16 }}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badge: {
    minWidth: 28,
    height: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  badgeCount: { fontSize: 9, fontWeight: "700" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  barOverlay: { position: "absolute" },
  barLeft: { alignSelf: "flex-start" },
  barRight: { alignSelf: "flex-end" },
  barEmoji: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
});
