import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { BORDER_RADIUS } from "@/theme/globals";
import { RotateCcw } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

interface UndoButtonProps {
  disabled: boolean;
  onPress: () => void;
}

export function UndoButton({ disabled, onPress }: UndoButtonProps) {
  const muted = useColor("textMuted");

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        hitSlop={10}
        style={[styles.button, { opacity: disabled ? 0.4 : 1 }]}
      >
        <Icon
          name={RotateCcw}
          size={18}
          color={disabled ? muted + "88" : muted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 8,
    borderRadius: BORDER_RADIUS,
  },
});