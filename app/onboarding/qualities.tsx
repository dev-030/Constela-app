import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { ScrollView, View, Pressable } from "react-native";
import { X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

// Removed MAX constant since unlimited selections are allowed

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

const QUALITIES_FR: Record<string, string> = {
  "Authenticity": "Authenticité",
  "Loyalty": "Loyauté",
  "Reliability": "Fiabilité",
  "Emotional Sensitivity": "Sensibilité émotionnelle",
  "Kindness": "Bienveillance",
  "Honesty": "Honnêteté",
  "Respect for Boundaries": "Respect des limites",
  "Hyperfocus": "Hyperfocalisation",
  "Creativity": "Créativité",
  "Deep Thinking": "Pensée profonde",
  "Tree-like Thinking": "Pensée en arborescence",
  "Attention to Detail": "Souci du détail",
  "Strong Memory": "Excellente mémoire",
  "Intense Curiosity": "Curiosité intense",
  "Rich Imagination": "Imagination débordante",
  "Artistic Sense": "Sens artistique",
  "Originality": "Originalité",
  "Aesthetic Sense": "Sens esthétique",
  "Deep Empathy": "Empathie profonde",
  "Active Listening": "Écoute active",
  "Sincere Communication": "Communication sincère",
  "Respect for Personal Space": "Respect de l'espace personnel",
  "Authentic Commitment": "Engagement authentique",
  "Positive Intensity": "Intensité positive",
  "Resilience": "Résilience",
  "Perseverance": "Persévérance",
  "Sense of Justice": "Sens de la justice",
  "Reliability in Routines": "Régularité dans les routines",
};

export default function OnboardingQualitiesScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, update } = useOnboarding();
  const primary = useColor("primary");
  const muted = useColor("textMuted");

  const isFrench = i18n.language?.startsWith("fr");
  const getQualityLabel = (q: string) => (isFrench ? QUALITIES_FR[q] || q : q);

  const toggle = (q: string) => {
    const current = data.qualities;
    if (current.includes(q)) {
      update("qualities", current.filter((v) => v !== q));
    } else {
      update("qualities", [...current, q]);
    }
  };

  return (
    <OnboardingShell
      title={t("onboarding.step5_title", "Top Qualities")}
      subtitle={t("onboarding.step5_subtitle", "Pick qualities that represent you best.")}
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/interests")}
      onSkip={() => router.push("/onboarding/interests")}
      continueDisabled={data.qualities.length === 0}
    >
      {/* Selection container */}
      <View
        style={{
          borderWidth: 1,
          borderColor: muted + "44",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 10,
          marginBottom: 20,
          minHeight: 56,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: data.qualities.length > 0 ? 12 : 0 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: muted, letterSpacing: 0.5 }}>
            {t("onboarding.your_selection", "YOUR SELECTION")}
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "700", color: primary }}>
            {t("onboarding.selected_count", "Selected ({{count}})", { count: data.qualities.length })}
          </Text>
        </View>

        {data.qualities.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {data.qualities.map((q) => (
              <Pressable
                key={q}
                onPress={() => toggle(q)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: primary,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 16,
                  gap: 4
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{getQualityLabel(q)}</Text>
                <Icon name={X} size={14} color="#fff" />
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, flexDirection: "row", flexWrap: "wrap", gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {QUALITIES.map((q) => (
          <SelectablePill
            key={q}
            label={getQualityLabel(q)}
            selected={data.qualities.includes(q)}
            onPress={() => toggle(q)}
          />
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}
