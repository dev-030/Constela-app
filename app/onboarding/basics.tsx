import { Icon } from "@/components/ui/icon";
import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { ChevronDown } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";

const MARITAL_STATUS = ["single", "married", "divorced", "widowed"];

export default function OnboardingStep2() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const border = useColor("border");
  const muted = useColor("textMuted");
  const text = useColor("text");
  const card = useColor("card");
  const danger = useColor("red");

  const [statusOpen, setStatusOpen] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [languagesError, setLanguagesError] = useState("");

  const validateAndContinue = () => {
    let ok = true;
    if (!data.maritalStatus) {
      setStatusError("Please select your marital status");
      ok = false;
    } else {
      setStatusError("");
    }
    if (!data.spokenLanguages.trim()) {
      setLanguagesError("Spoken languages are required");
      ok = false;
    } else {
      setLanguagesError("");
    }
    if (ok) router.push("/onboarding/lifestyle");
  };

  return (
    <OnboardingShell
      title="The Basics"
      subtitle="Let's find someone whose life rhythm matches yours."
      onBack={() => router.back()}
      onContinue={validateAndContinue}
      onSkip={() => router.push("/onboarding/lifestyle")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marital Status */}
        <FieldLabel>Marital Status *</FieldLabel>
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
            {data.maritalStatus || "Select status"}
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
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Spoken Languages */}
        <FieldLabel>Spoken Languages *</FieldLabel>
        <View
          style={{
            borderWidth: 1,
            borderColor: languagesError ? danger : border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: languagesError ? 4 : 16,
          }}
        >
          <TextInput
            value={data.spokenLanguages}
            onChangeText={(v) => update("spokenLanguages", v)}
            placeholder="e.g. English, ASL"
            placeholderTextColor={muted}
            style={{ color: text, fontSize: 15, padding: 0 }}
          />
        </View>
        {languagesError ? <ErrorText>{languagesError}</ErrorText> : null}

        {/* City + Country */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel>City *</FieldLabel>
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
            <FieldLabel>Country *</FieldLabel>
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
            OPTIONAL INFORMATION
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: border }} />
        </View>

        {/* Weight */}
        <FieldLabel>Weight (kg)</FieldLabel>
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
            placeholder="Optional"
            placeholderTextColor={muted}
            style={{ color: text, fontSize: 15, padding: 0 }}
          />
        </View>

        {/* Education */}
        <FieldLabel>Education</FieldLabel>
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
            value={data.education}
            onChangeText={(v) => update("education", v)}
            placeholder="Optional"
            placeholderTextColor={muted}
            style={{ color: text, fontSize: 15, padding: 0 }}
          />
        </View>
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
