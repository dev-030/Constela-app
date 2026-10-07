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
import { useTranslation } from "react-i18next";

const SPORT: Sport[] = ["Intense", "Moderate", "No Sport"];
const EATING: EatingHabits[] = [
  "Balanced",
  "Fast Food",
  "Vegetarian",
  "Vegan",
  "Other",
];

export default function OnboardingStep4() {
  const { t } = useTranslation();
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

  const isFormValid =
    data.smoking !== null &&
    data.alcohol !== null &&
    data.pets !== null &&
    data.sport !== null &&
    data.eatingHabits.length > 0;

  return (
    <OnboardingShell
      title={t("onboarding.step4_title", "Daily Habits")}
      subtitle={t("onboarding.step4_subtitle", "Your daily routine and lifestyle habits.")}
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/qualities")}
      continueDisabled={!isFormValid}
      onSkip={() => router.push("/onboarding/qualities")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Smoking */}
        <SectionLabel>{t("onboarding.habits.smoking", "Smoking")}</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v === "Yes" ? t("common.yes", "Yes") : t("common.no", "No")}
              selected={data.smoking === v}
              onPress={() => update("smoking", v)}
            />
          ))}
        </View>

        {/* Alcohol */}
        <SectionLabel>{t("onboarding.habits.alcohol", "Alcohol")}</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v === "Yes" ? t("common.yes", "Yes") : t("common.no", "No")}
              selected={data.alcohol === v}
              onPress={() => update("alcohol", v)}
            />
          ))}
        </View>

        {/* Pets */}
        <SectionLabel>{t("onboarding.habits.pets", "Pets")}</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v === "Yes" ? t("common.yes", "Yes") : t("common.no", "No")}
              selected={data.pets === v}
              onPress={() => update("pets", v)}
            />
          ))}
        </View>

        {/* Sport */}
        <SectionLabel>{t("onboarding.habits.sport", "Sport")}</SectionLabel>
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
              label={t(`onboarding.habits.sport_${v.toLowerCase().replace(/[^a-z]/g, '_')}`, v)}
              selected={data.sport === v}
              onPress={() => update("sport", v)}
            />
          ))}
        </View>

        {/* Eating Habits */}
        <SectionLabel>{t("onboarding.habits.eating_habits", "Eating Habits")}</SectionLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {EATING.map((v) => (
            <SelectablePill
              key={v}
              label={t(`onboarding.habits.eating_${v.toLowerCase().replace(/[^a-z]/g, '_')}`, v)}
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
