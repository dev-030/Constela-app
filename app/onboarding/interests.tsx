import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useProfileLabels } from "@/hooks/use-profile-labels";

import { INTEREST_CATEGORIES } from "@/constants/interests";

export default function OnboardingInterestsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, update } = useOnboarding();
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const { interestCategory, interestTag } = useProfileLabels();
  const getCategoryTitle = (title: string) => interestCategory(title);
  const getTagLabel = (categoryTitle: string, tag: string) => interestTag(categoryTitle, tag);

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
      title={t("onboarding.step6_title", "Interests")}
      subtitle={t("onboarding.step6_subtitle", "Select topics you enjoy exploring.")}
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
                  marginBottom: cat.tags.length > 0 ? 8 : 0,
                }}
              >
                {getCategoryTitle(cat.title)}
              </Text>
              {cat.tags.length > 0 && (
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
                        {getTagLabel(cat.title, tag)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}
