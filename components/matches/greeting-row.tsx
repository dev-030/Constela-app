import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";

interface GreetingRowProps {
  displayName: string;
  tierLabel: string;
  tier: "plus" | "light" | string | undefined;
}

export function GreetingRow({ displayName, tierLabel, tier }: GreetingRowProps) {
  const text = useColor("text");
  const muted = useColor("textMuted");
  const border = useColor("border");
  const primary = useColor("primary");

  const isPremium = tier === "plus" || tier === "light";

  return (
    <View style={styles.row}>
      <View>
        <Text style={[styles.greeting, { color: text }]}>Hello {displayName}</Text>
        <Text style={[styles.tierLabel, { color: muted }]}>{tierLabel}</Text>
      </View>
      <Pressable
        onPress={() => router.push("/settings/subscription")}
        style={[
          styles.tierPill,
          {
            backgroundColor: isPremium ? primary : border,
          },
        ]}
      >
        <Star
          color={isPremium ? "#fff" : muted}
          fill={isPremium ? "#fff" : "transparent"}
          size={16}
        />
        <Text
          style={[
            styles.tierPillText,
            {
              color: isPremium ? "#fff" : text,
            },
          ]}
        >
          {tierLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
  },
  tierLabel: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },
  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tierPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
});