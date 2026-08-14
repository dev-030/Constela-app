import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SlidersHorizontal } from "lucide-react-native";

interface GreetingRowProps {
  displayName: string;
}

export function GreetingRow({ displayName }: GreetingRowProps) {
  const text = useColor("text");
  const primary = useColor("primary");

  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: text }]}>Hello {displayName}</Text>
      <Link href="/filters" asChild>
        <Pressable hitSlop={20}>
          <SlidersHorizontal color={primary} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    marginTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
  },
});