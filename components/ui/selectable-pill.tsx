import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Pressable, ViewStyle } from "react-native";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
};

export function SelectablePill({
  label,
  selected,
  onPress,
  style,
  size = "md",
}: Props) {
  const primary = useColor("primary");
  const border = useColor("border");
  const text = useColor("text");
  const textMuted = useColor("textMuted");

  const padding =
    size === "lg"
      ? { paddingHorizontal: 32, paddingVertical: 14 }
      : size === "sm"
        ? { paddingHorizontal: 14, paddingVertical: 6 }
        : { paddingHorizontal: 20, paddingVertical: 10 };

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          borderRadius: 24,
          borderWidth: 1,
          borderColor: selected ? primary + "30" : border,
          backgroundColor: selected ? primary + "15" : "transparent",
          alignItems: "center",
          justifyContent: "center",
        },
        padding,
        style,
      ]}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: selected ? "600" : "500",
          color: selected ? primary : text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
