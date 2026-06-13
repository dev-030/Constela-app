import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { ScrollView, View } from "react-native";

const MAX = 3;

const QUALITIES = [
  "Authenticity",
  "Loyalty",
  "Reliability",
  "Emotional Sensitivity",
  "Kindness",
  "Honesty",
  "Respect for Boundaries",
  "Hyperfocus",
  "Creativity",
  "Deep Thinking",
  "Tree-like Thinking",
  "Attention to Detail",
  "Strong Memory",
  "Intense Curiosity",
  "Rich Imagination",
  "Artistic Sense",
  "Originality",
  "Aesthetic Sense",
  "Deep Empathy",
  "Active Listening",
  "Sincere Communication",
  "Respect for Personal Space",
  "Authentic Commitment",
  "Positive Intensity",
  "Resilience",
  "Perseverance",
  "Sense of Justice",
  "Reliability in Routines",
];

export default function OnboardingQualitiesScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  const toggle = (q: string) => {
    const current = data.qualities;
    if (current.includes(q)) {
      update("qualities", current.filter((v) => v !== q));
    } else if (current.length < MAX) {
      update("qualities", [...current, q]);
    }
  };

  return (
    <OnboardingShell
      title={`Choose ${MAX} Qualities That Best Describe You`}
      subtitle={`${MAX} selections required`}
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/interests")}
      onSkip={() => router.push("/onboarding/interests")}
      continueDisabled={data.qualities.length < MAX}
    >
      {/* Selection counter */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderWidth: 1,
          borderColor: muted + "44",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: "600", color: muted, letterSpacing: 0.5 }}>
          YOUR SELECTION
        </Text>
        <Text style={{ fontSize: 12, fontWeight: "700", color: primary }}>
          Selected ({data.qualities.length})
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, flexDirection: "row", flexWrap: "wrap", gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {QUALITIES.map((q) => (
          <SelectablePill
            key={q}
            label={q}
            selected={data.qualities.includes(q)}
            onPress={() => toggle(q)}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}
