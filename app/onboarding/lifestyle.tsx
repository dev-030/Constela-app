import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import {
  useOnboarding,
  type LookingFor,
  type YesNo,
} from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const LOOKING_FOR: LookingFor[] = [
  "Friendship",
  "Serious Relationship",
  "We'll See",
  "Going Out",
];

export default function OnboardingStep3() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const toggleLookingFor = (value: LookingFor) => {
    const current = data.lookingFor;
    if (current.includes(value)) {
      update("lookingFor", []);
    } else {
      update("lookingFor", [value]);
    }
  };

  const isFormValid =
    data.lookingFor.length > 0 &&
    data.hasChildren !== null &&
    data.wantChildren !== null;

  return (
    <OnboardingShell
      title="Lifestyle"
      subtitle="These help us understand your daily routine."
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/habits")}
      continueDisabled={!isFormValid}
      onSkip={() => router.push("/onboarding/habits")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Looking For */}
        <SectionLabel>WHAT ARE YOU LOOKING FOR?</SectionLabel>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {LOOKING_FOR.map((option) => (
            <SelectablePill
              key={option}
              label={option}
              selected={data.lookingFor.includes(option)}
              onPress={() => toggleLookingFor(option)}
            />
          ))}
        </View>

        {/* Have children */}
        <SectionLabel>DO YOU HAVE CHILDREN?</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.hasChildren === v}
              onPress={() => update("hasChildren", v)}
              size="lg"
              style={{ flex: 1 }}
            />
          ))}
        </View>

        {/* Want children */}
        <SectionLabel>DO YOU WANT CHILDREN?</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v}
              selected={data.wantChildren === v}
              onPress={() => update("wantChildren", v)}
              size="lg"
              style={{ flex: 1 }}
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
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.5,
        color: useColor("textMuted"),
        marginBottom: 14,
      }}
    >
      {children}
    </Text>
  );
}
