import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

const INTEREST_CATEGORIES = [
  {
    title: "Logical & Structured",
    tags: ["Coding", "Math", "Patterns"],
  },
  {
    title: "Visual/Sensory",
    tags: ["Photography", "Design", "Colors"],
  },
  {
    title: "Animals & Nature",
    tags: ["Biology", "Pets", "Botany"],
  },
  {
    title: "Imaginary Universes",
    tags: ["Sci-Fi", "D&D", "Lore"],
  },
  {
    title: "Collecting",
    tags: ["History", "Antiques", "Cataloging"],
  },
  {
    title: "Language",
    tags: ["Linguistics", "Writing", "Etymology"],
  },
  {
    title: "Body & Movement",
    tags: ["Yoga", "Dance", "Proprioception"],
  },
  {
    title: "Mechanical",
    tags: ["Engines", "Electronics", "Systems"],
  },
  {
    title: "Psychology",
    tags: ["Behavior", "Neurodiversity", "Sociology"],
  },
];

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const toggleInterest = (category: string) => {
    const current = data.interests;
    if (current.includes(category)) {
      update("interests", current.filter((v) => v !== category));
    } else {
      update("interests", [...current, category]);
    }
  };

  const isFormValid = data.interests.length > 0;

  return (
    <OnboardingShell
      title="What sparks your curiosity?"
      subtitle="Interests are common ground. Select categories that resonate with you to find people who share your specializations and passions."
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/emotional")}
      continueDisabled={!isFormValid}
      onSkip={() => router.push("/onboarding/emotional")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_CATEGORIES.map((cat) => {
          const selected = data.interests.includes(cat.title);
          return (
            <Pressable
              key={cat.title}
              onPress={() => toggleInterest(cat.title)}
              style={{
                borderWidth: 1.5,
                borderColor: selected ? primary : border,
                borderRadius: 14,
                padding: 16,
                backgroundColor: selected ? primary + "0D" : card,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: selected ? primary : text,
                  marginBottom: 8,
                }}
              >
                {cat.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {cat.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: selected ? primary + "22" : muted + "22",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: selected ? primary : muted,
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}
