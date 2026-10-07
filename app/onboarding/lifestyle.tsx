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
import { useTranslation } from "react-i18next";

const LOOKING_FOR: LookingFor[] = [
  "Friendship",
  "Serious Relationship",
  "We'll See",
  "Going Out",
];

export default function OnboardingStep3() {
  const { t } = useTranslation();
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
      title={t("onboarding.step3_title", "Lifestyle")}
      subtitle={t("onboarding.step3_subtitle", "Tell us about how you spend your time.")}
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
        <SectionLabel>{t("onboarding.what_looking_for", "WHAT ARE YOU LOOKING FOR?")}</SectionLabel>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {LOOKING_FOR.map((option) => {
            const keyMap: Record<string, string> = {
              "Friendship": "friendship",
              "Serious Relationship": "serious",
              "We'll See": "well_see",
              "Going Out": "going_out",
            };
            const label = t(`onboarding.looking_for.${keyMap[option]}`, option);
            return (
              <SelectablePill
                key={option}
                label={label}
                selected={data.lookingFor.includes(option)}
                onPress={() => toggleLookingFor(option)}
              />
            );
          })}
        </View>

        {/* Have children */}
        <SectionLabel>{t("onboarding.have_children", "DO YOU HAVE CHILDREN?")}</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v === "Yes" ? t("common.yes", "Yes") : t("common.no", "No")}
              selected={data.hasChildren === v}
              onPress={() => update("hasChildren", v)}
              size="lg"
              style={{ flex: 1 }}
            />
          ))}
        </View>

        {/* Want children */}
        <SectionLabel>{t("onboarding.want_children", "DO YOU WANT CHILDREN?")}</SectionLabel>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 28 }}>
          {(["Yes", "No"] as YesNo[]).map((v) => (
            <SelectablePill
              key={v}
              label={v === "Yes" ? t("common.yes", "Yes") : t("common.no", "No")}
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
