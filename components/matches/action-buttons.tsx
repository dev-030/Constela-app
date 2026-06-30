import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { Heart, Star, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface ActionButtonsProps {
  onReject: () => void;
  onSuper: () => void;
  onLike: () => void;
  disabled: boolean;
  likePending: boolean;
}

export function ActionButtons({
  onReject,
  onSuper,
  onLike,
  disabled,
  likePending,
}: ActionButtonsProps) {
  const primary = useColor("primary");

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Reject"
        style={styles.rejectButton}
        onPress={onReject}
        disabled={disabled}
      >
        <Icon name={X} size={28} color="#FFF" strokeWidth={3} />
      </Pressable>

      <Pressable
        accessibilityLabel="Super like"
        style={styles.superLikeButton}
        onPress={onSuper}
        disabled={disabled}
      >
        <Icon name={Star} size={22} color="#E65100" fill="#E65100" />
      </Pressable>

      <Pressable
        accessibilityLabel="Like"
        style={[
          styles.likeButton,
          {
            backgroundColor: primary,
            opacity: disabled || likePending ? 0.5 : 1,
          },
        ]}
        onPress={onLike}
        disabled={disabled || likePending}
      >
        <Icon name={Heart} size={28} color="#FFF" fill="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  rejectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#004D40",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  superLikeButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});