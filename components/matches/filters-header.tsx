import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SlidersHorizontal } from "lucide-react-native";

interface FiltersHeaderProps {
  title?: string;
}

export function FiltersHeader({ title }: FiltersHeaderProps) {
  const primary = useColor("primary");
  const text = useColor("text");

  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: text }]}>
        {title ?? "Find Your Perfect Match by Filters"}
      </Text>
      <Link href="/filters" asChild>
        <Pressable hitSlop={20}>
          <SlidersHorizontal color={primary} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    zIndex: 999,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
});