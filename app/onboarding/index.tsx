import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { SelectablePill } from "@/components/ui/selectable-pill";
import { Text } from "@/components/ui/text";
import { useOnboarding, type Gender } from "@/providers/onboarding-context";
import { useColor } from "@/hooks/useColor";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, Check, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Image, Pressable, ScrollView, TextInput, View, ActivityIndicator } from "react-native";
import { useCheckUsernameQuery } from "@/api/auth";

const GENDERS: Gender[] = ["Woman", "Man", "Non-binary", "Other"];

export default function OnboardingStep1() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const border = useColor("border");
  const muted = useColor("textMuted");
  const text = useColor("text");
  const card = useColor("card");
  const danger = useColor("red");
  const primary = useColor("primary");

  const [ageError, setAgeError] = useState("");
  const [heightError, setHeightError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  const [debouncedUsername, setDebouncedUsername] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(data.username);
    }, 500);
    return () => clearTimeout(handler);
  }, [data.username]);

  const { data: usernameCheck, isFetching: isCheckingUsername } = useCheckUsernameQuery(debouncedUsername);

  // We are checking if the query is loading/fetching or if the user is typing (debounce pending)
  const isChecking = isCheckingUsername || (data.username !== debouncedUsername && data.username.length >= 3);

  const handlePickPhoto = async (slot: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const next = [...data.photos];
      next[slot] = result.assets[0].uri;
      update("photos", next);
    }
  };

  const validateAndContinue = () => {
    let ok = true;
    if (!data.username.trim()) {
      setUsernameError("Username is required");
      ok = false;
    } else if (isChecking) {
      setUsernameError("Checking username availability...");
      ok = false;
    } else if (usernameCheck && !usernameCheck.available) {
      setUsernameError("Username is already taken");
      ok = false;
    } else {
      setUsernameError("");
    }
    if (!data.age.trim()) {
      setAgeError("Age is required");
      ok = false;
    } else {
      setAgeError("");
    }
    if (!data.height.trim()) {
      setHeightError("Height is required");
      ok = false;
    } else {
      setHeightError("");
    }
    if (ok) {
      router.push("/onboarding/basics");
    }
  };

  const PhotoSlot = ({
    slot,
    label,
    showLabel,
  }: {
    slot: number;
    label: string;
    showLabel: boolean;
  }) => {
    const uri = data.photos[slot];
    return (
      <Pressable
        onPress={() => handlePickPhoto(slot)}
        style={{
          flex: 1,
          aspectRatio: 0.85,
          borderRadius: 16,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: primary,
          backgroundColor: uri ? "transparent" : "transparent",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1.2,
                borderColor: primary,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {slot === 0 ? (
                <Camera size={20} color={primary} />
              ) : (
                <ImagePlus size={20} color={primary} />
              )}
            </View>
            {showLabel && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "500",
                  color: text,
                }}
              >
                {label}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const isFormValid =
    !!(data.photos[0] && data.photos[1] && data.photos[2]) &&
    data.username.trim().length >= 3 &&
    !isChecking &&
    usernameCheck?.available === true &&
    data.age.trim().length > 0 &&
    data.height.trim().length > 0 &&
    data.gender !== null;

  return (
    <OnboardingShell
      title="About You"
      subtitle="Help us understand you better to find the most compatible connections."
      showBack={false}
      onContinue={validateAndContinue}
      continueDisabled={!isFormValid}
      onSkip={() => router.push("/onboarding/basics")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Upload Photos */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
              color: muted,
            }}
          >
            UPLOAD PHOTOS
          </Text>
          <Text style={{ fontSize: 12, fontWeight: "500", color: danger }}>
            3 required
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          <PhotoSlot slot={0} label="Main Photo" showLabel />
          <PhotoSlot slot={1} label="" showLabel={false} />
          <PhotoSlot slot={2} label="" showLabel={false} />
        </View>

        {/* Username */}
        <FieldLabel>Username *</FieldLabel>
        <View
          style={{
            borderWidth: 1,
            borderColor: usernameError ? danger : border,
            backgroundColor: card,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: usernameError || data.username.length >= 3 ? 4 : 16,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <TextInput
            value={data.username}
            onChangeText={(v) => update("username", v)}
            placeholder="e.g. SamiWander"
            placeholderTextColor={muted}
            style={{ color: text, fontSize: 15, padding: 0, flex: 1 }}
          />
          {isChecking ? (
            <ActivityIndicator size="small" color={muted} />
          ) : (
            usernameCheck && data.username.length >= 3 && data.username === debouncedUsername && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {usernameCheck.available ? (
                  <Check size={16} color="#22C55E" />
                ) : (
                  <X size={16} color={danger} />
                )}
                <Text
                  style={{
                    color: usernameCheck.available ? "#22C55E" : danger,
                    fontSize: 13,
                    fontWeight: "600",
                  }}
                >
                  {usernameCheck.available ? "Available" : "Taken"}
                </Text>
              </View>
            )
          )}
        </View>
        {usernameError ? <ErrorText>{usernameError}</ErrorText> : null}

        {/* Age + Height */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <FieldLabel>Age *</FieldLabel>
            <View
              style={{
                borderWidth: 1,
                borderColor: ageError ? danger : border,
                backgroundColor: card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <TextInput
                value={data.age}
                onChangeText={(v) => update("age", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="25"
                placeholderTextColor={muted}
                style={{ color: text, fontSize: 15, padding: 0 }}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <FieldLabel>Height (cm) *</FieldLabel>
            <View
              style={{
                borderWidth: 1,
                borderColor: heightError ? danger : border,
                backgroundColor: card,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <TextInput
                value={data.height}
                onChangeText={(v) => update("height", v.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="175"
                placeholderTextColor={muted}
                style={{ color: text, fontSize: 15, padding: 0 }}
              />
            </View>
          </View>
        </View>
        {ageError || heightError ? (
          <ErrorText>{ageError || heightError}</ErrorText>
        ) : null}

        {/* Gender */}
        <FieldLabel>Gender *</FieldLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {GENDERS.map((g) => (
            <SelectablePill
              key={g}
              label={g}
              selected={data.gender === g}
              onPress={() => update("gender", g)}
            />
          ))}
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
