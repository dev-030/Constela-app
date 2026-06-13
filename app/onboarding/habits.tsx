import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  useOnboarding,
  type EatingHabits,
  type Sport,
  type YesNo,
} from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const SPORT: Sport[] = ["Intense", "Moderate", "No Sport"];
const EATING: EatingHabits[] = [
  "Balanced",
  "Fast Food",
  "Vegetarian",
  "Vegan",
  "Other",
];

export default function OnboardingStep4() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const toggleEating = (value: EatingHabits) => {
    const current = data.eatingHabits;
    if (current.includes(value)) {
      update(
        "eatingHabits",
        current.filter((v) => v !== value),
      );
    } else {
      update("eatingHabits", [...current, value]);
    }
  };

  return (
    <OnboardingShell
      title="Lifestyle Habits"
      subtitle="These help us understand your daily routine."
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/qualities")}
      onSkip={() => router.push("/onboarding/qualities")}
      continueLabel="Continue"
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Smoking */}
        <SectionLabel>Smoking</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.smoking === v}
              onPress={() => update("smoking", v)}
            />
          ))}
        </View>

        {/* Alcohol */}
        <SectionLabel>Alcohol</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.alcohol === v}
              onPress={() => update("alcohol", v)}
            />
          ))}
        </View>

        {/* Pets */}
        <SectionLabel>Pets</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.pets === v}
              onPress={() => update("pets", v)}
            />
          ))}
        </View>

        {/* Sport */}
        <SectionLabel>Sport</SectionLabel>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {SPORT.map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.sport === v}
              onPress={() => update("sport", v)}
            />
          ))}
        </View>

        {/* Eating Habits */}
        <SectionLabel>Eating Habits</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {EATING.map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.eatingHabits.includes(v)}
              onPress={() => toggleEating(v)}
            />
          ))}
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 14,
        fontWeight: "600",
        color: useColor("text"),
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}
