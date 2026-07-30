import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Star, User } from "lucide-react-native";

interface GreetingRowProps {
  displayName: string;
  tierLabel: string;
  tier: "plus" | "light" | string | undefined;
}

export function GreetingRow({ displayName, tierLabel, tier }: GreetingRowProps) {
  const text = useColor("text");
  const muted = useColor("textMuted");

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: text }]}>Hello {displayName}</Text>

      <View style={styles.pillsRow}>
        <View style={styles.pillContainer}>
          <View style={[styles.iconCircle, { backgroundColor: "#E91E63" }]}>
            <User size={16} color="#FFF" />
          </View>
          <View>
            <Text style={[styles.pillTextTop, { color: muted }]}>Perfect Match</Text>
            <Text style={[styles.pillTextBottom, { color: muted }]}>Analysis</Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push("/settings/subscription")}
          style={styles.pillContainer}
        >
          <View style={[styles.iconCircle, { backgroundColor: "#10B981" }]}>
            <Star size={16} color="#FFF" fill="#FFF" />
          </View>
          <View>
            <Text style={[styles.pillTextTop, { color: muted }]}>Premium</Text>
            <Text style={[styles.pillTextBottom, { color: muted }]}>Membership</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    marginTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  pillTextTop: {
    fontSize: 12,
    lineHeight: 14,
  },
  pillTextBottom: {
    fontSize: 12,
    lineHeight: 14,
  },
});