import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { Heart, Star, X, RotateCcw } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface ActionButtonsProps {
  onReject: () => void;
  onSuper: () => void;
  onLike: () => void;
  disabled: boolean;
  likePending: boolean;
  onUndo?: () => void;
  canUndo?: boolean;
}

export function ActionButtons({
  onReject,
  onSuper,
  onLike,
  disabled,
  likePending,
  onUndo,
  canUndo,
}: ActionButtonsProps) {
  const primary = useColor("primary");

  return (
    <View style={styles.row}>
      {onUndo ? (
        <Pressable
          accessibilityLabel="Undo"
          style={[styles.undoButton, { opacity: canUndo ? 1 : 0.4 }]}
          onPress={onUndo}
          disabled={!canUndo}
        >
          <Icon name={RotateCcw} size={24} color="#F59E0B" strokeWidth={2.5} />
        </Pressable>
      ) : <View style={{ width: 52 }} />}

      <Pressable
        accessibilityLabel="Reject"
        style={styles.rejectButton}
        onPress={onReject}
        disabled={disabled}
      >
        <Icon name={X} size={32} color="#EF4444" strokeWidth={3} />
      </Pressable>

      <Pressable
        accessibilityLabel="Super like"
        style={styles.superLikeButton}
        onPress={onSuper}
        disabled={disabled}
      >
        <Icon name={Star} size={24} color="#3B82F6" fill="#3B82F6" />
      </Pressable>

      <Pressable
        accessibilityLabel="Like"
        style={[
          styles.likeButton,
          { opacity: disabled || likePending ? 0.5 : 1 },
        ]}
        onPress={onLike}
        disabled={disabled || likePending}
      >
        <Icon name={Heart} size={32} color="#10B981" fill="#10B981" />
      </Pressable>

      {/* Spacer to perfectly balance the Undo button on the left side */}
      <View style={{ width: 52 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 16,
    width: "100%",
    paddingHorizontal: 8,
  },
  rejectButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  superLikeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  undoButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
});