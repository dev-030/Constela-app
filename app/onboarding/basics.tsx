import { Icon } from "@/components/ui/icon";
import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { LANGUAGES } from "@/constants/languages";
import { ChevronDown, Check, Search } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

const MARITAL_STATUS = ["single", "married", "divorced", "widowed"];
const EDUCATION_OPTIONS = ["High School", "Bachelor's", "Master's", "PhD", "Other"];

export default function OnboardingStep2() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, update } = useOnboarding();
  const border = useColor("border");
  const muted = useColor("textMuted");
  const text = useColor("text");
  const card = useColor("card");
  const danger = useColor("red");
  const primary = useColor("primary");

  const [statusOpen, setStatusOpen] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");
  const [educationOpen, setEducationOpen] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [languagesError, setLanguagesError] = useState("");

  const validateAndContinue = () => {
    let ok = true;
    if (!data.maritalStatus) {
      setStatusError(t("onboarding.error_marital_status", "Please select your marital status"));
      ok = false;
    } else {
      setStatusError("");
    }
    if (data.spokenLanguages.length === 0) {
      setLanguagesError(t("onboarding.error_languages", "Please select at least one language"));
      ok = false;
    } else {
      setLanguagesError("");
    }
    if (ok) router.push("/onboarding/lifestyle");
  };

  const isFormValid =
    !!data.maritalStatus &&
    data.spokenLanguages.length > 0 &&
    !!data.city.trim() &&
    !!data.country.trim();

  return (
    <OnboardingShell
      title={t("onboarding.step2_title", "The Basics")}
      subtitle={t("onboarding.step2_subtitle", "Let's find someone whose life rhythm matches yours.")}
      onBack={() => router.back()}
      onContinue={validateAndContinue}
      continueDisabled={!isFormValid}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marital Status */}
        <FieldLabel>{t("onboarding.marital_status", "Marital Status")} *</FieldLabel>
        <Pressable
          onPress={() => setStatusOpen((o) => !o)}
          style={{
            borderWidth: 1,
            borderColor: statusError ? danger : border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: statusError ? 4 : 16,
          }}
        >
          <Text
            style={{
              color: data.maritalStatus ? text : muted,
              fontSize: 15,
            }}
          >
            {data.maritalStatus
              ? t(`onboarding.marital.${data.maritalStatus.toLowerCase()}`, data.maritalStatus)
              : t("onboarding.select_marital_status", "Select status")}
          </Text>
          <Icon
            name={ChevronDown}
            size={20}
            color={muted}
            style={{
              transform: [{ rotate: statusOpen ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>
        {statusError ? <ErrorText>{statusError}</ErrorText> : null}
        {statusOpen && (
          <View
            style={{
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              borderRadius: 12,
              marginBottom: 16,
              marginTop: -8,
              overflow: "hidden",
            }}
          >
            {MARITAL_STATUS.map((s, i) => (
              <Pressable
                key={s}
                onPress={() => {
                  update("maritalStatus", s);
                  setStatusOpen(false);
                  setStatusError("");
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: border,
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 15,
                    fontWeight: data.maritalStatus === s ? "600" : "400",
                  }}
                >
                  {t(`onboarding.marital.${s.toLowerCase()}`, s)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Spoken Languages */}
        <FieldLabel>{t("onboarding.languages", "Spoken Languages")} *</FieldLabel>
        <Pressable
          onPress={() => setLanguagesOpen(true)}
          style={{
            borderWidth: 1,
            borderColor: languagesError ? danger : border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: languagesError ? 4 : 16,
          }}
        >
          <Text
            style={{
              color: data.spokenLanguages.length > 0 ? text : muted,
              fontSize: 15,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {data.spokenLanguages.length > 0 
              ? data.spokenLanguages.join(", ") 
              : t("onboarding.select_languages", "Select languages")}
          </Text>
          <Icon name={ChevronDown} size={20} color={muted} />
        </Pressable>
        {languagesError ? <ErrorText>{languagesError}</ErrorText> : null}
        
        <BottomSheet
          isVisible={languagesOpen}
          onClose={() => setLanguagesOpen(false)}
          title={t("onboarding.select_languages", "Select Languages")}
          snapPoints={[0.6]}
          headerComponent={
            <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
              <View style={{ 
                marginBottom: 16, 
                backgroundColor: card, 
                borderRadius: 12, 
                paddingHorizontal: 12, 
                paddingVertical: 10, 
                flexDirection: 'row', 
                alignItems: 'center', 
                borderWidth: 1, 
                borderColor: border 
              }}>
                <Icon name={Search} size={20} color={muted} style={{ marginRight: 8 }} />
                <TextInput 
                    value={languageSearch}
                    onChangeText={setLanguageSearch}
                    placeholder={t("onboarding.search_languages", "Search languages...")}
                    placeholderTextColor={muted}
                    style={{ color: text, fontSize: 16, flex: 1, padding: 0 }}
                />
              </View>
            </View>
          }
        >
          <View style={{ paddingBottom: 24, paddingHorizontal: 16 }}>
            {LANGUAGES.filter(l => l.toLowerCase().includes(languageSearch.toLowerCase())).map((lang, i, arr) => {
              const isSelected = data.spokenLanguages.includes(lang);
              return (
                <Pressable
                  key={lang}
                  onPress={() => {
                    const current = data.spokenLanguages;
                    if (isSelected) {
                      update("spokenLanguages", current.filter((v) => v !== lang));
                    } else {
                      update("spokenLanguages", [...current, lang]);
                    }
                    setLanguagesError("");
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                    borderBottomColor: border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      color: text,
                      fontSize: 16,
                      fontWeight: isSelected ? "600" : "400",
                    }}
                  >
                    {lang}
                  </Text>
                  {isSelected && <Icon name={Check} size={20} color={primary} />}
                </Pressable>
              );
            })}
          </View>
        </BottomSheet>

        {/* City + Country */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel>{t("onboarding.city", "City")} *</FieldLabel>
            <View
              style={{
                borderWidth: 1,
                borderColor: border,
                backgroundColor: card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <TextInput
                value={data.city}
                onChangeText={(v) => update("city", v)}
                placeholder="London"
                placeholderTextColor={muted}
                style={{ color: text, fontSize: 15, padding: 0 }}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>{t("onboarding.country", "Country")} *</FieldLabel>
            <View
              style={{
                borderWidth: 1,
                borderColor: border,
                backgroundColor: card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <TextInput
                value={data.country}
                onChangeText={(v) => update("country", v)}
                placeholder="UK"
                placeholderTextColor={muted}
                style={{ color: text, fontSize: 15, padding: 0 }}
              />
            </View>
          </View>
        </View>

        {/* Divider with label */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 8,
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1, height: 1, backgroundColor: border }} />
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1.5,
              color: muted,
              marginHorizontal: 12,
            }}
          >
            {t("onboarding.optional_info", "OPTIONAL INFORMATION")}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: border }} />
        </View>

        {/* Weight */}
        <FieldLabel>{t("onboarding.weight", "Weight (kg)")}</FieldLabel>
        <View
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: 16,
          }}
        >
          <TextInput
            value={data.weight}
            onChangeText={(v) => update("weight", v.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={3}
            placeholder={t("common.optional", "Optional")}
            placeholderTextColor={muted}
            style={{ color: text, fontSize: 15, padding: 0 }}
          />
        </View>

        {/* Education */}
        <FieldLabel>{t("onboarding.education", "Education")}</FieldLabel>
        <Pressable
          onPress={() => setEducationOpen((o) => !o)}
          style={{
            borderWidth: 1,
            borderColor: border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: data.education ? text : muted,
              fontSize: 15,
            }}
          >
            {data.education
              ? t(`onboarding.education_levels.${data.education.toLowerCase().replace(/[^a-z]/g, '_')}`, data.education)
              : t("onboarding.select_education", "Select education (optional)")}
          </Text>
          <Icon
            name={ChevronDown}
            size={20}
            color={muted}
            style={{
              transform: [{ rotate: educationOpen ? "180deg" : "0deg" }],
            }}
          />
        </Pressable>
        {educationOpen && (
          <View
            style={{
              borderWidth: 1,
              borderColor: border,
              backgroundColor: card,
              borderRadius: 12,
              marginBottom: 16,
              marginTop: -8,
              overflow: "hidden",
            }}
          >
            {EDUCATION_OPTIONS.map((e, i) => (
              <Pressable
                key={e}
                onPress={() => {
                  update("education", e);
                  setEducationOpen(false);
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: border,
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 15,
                    fontWeight: data.education === e ? "600" : "400",
                  }}
                >
                  {t(`onboarding.education_levels.${e.toLowerCase().replace(/[^a-z]/g, '_')}`, e)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </OnboardingShell>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 13,
        fontWeight: "600",
        color: useColor("text"),
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function ErrorText({ children }: { children: string }) {
  return (
    <Text style={{ color: useColor("red"), fontSize: 12, marginBottom: 12 }}>
      {children}
    </Text>
  );
}
