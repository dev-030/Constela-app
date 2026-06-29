import { updateMyProfile } from "@/api/profile";
import { useOnboarding } from "@/providers/onboarding-context";
import { useProfileStore } from "@/store/profileStore";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useRouter } from "expo-router";
import { ShieldOff } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FaceVerificationScreen() {
  const router = useRouter();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const card = useColor("card");
  const border = useColor("border");

  const [faceDetected] = useState(true); // simulated
  const spinAnim = useRef(new Animated.Value(0)).current;

  const { data } = useOnboarding();
  const { fetchProfile } = useProfileStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("age", data.age);
      if (data.height) formData.append("height_cm", data.height);
      if (data.weight) formData.append("weight_kg", data.weight);

      const genderMap: any = {
        Woman: "woman",
        Man: "man",
        "Non-binary": "non_binary",
        Other: "other",
      };
      if (data.gender)
        formData.append("gender", genderMap[data.gender] || data.gender);

      if (data.maritalStatus)
        formData.append("marital_status", data.maritalStatus);
      if (data.education) formData.append("education_level", data.education);
      if (data.spokenLanguages)
        formData.append("spoken_languages", data.spokenLanguages);
      if (data.city) formData.append("city", data.city);
      if (data.country) formData.append("country", data.country);

      const lookingForMap: any = {
        "Serious Relationship": "serious",
        Friendship: "friendship",
        "We'll See": "casual",
        "Going Out": "casual",
      };
      if (data.lookingFor && data.lookingFor.length > 0) {
        formData.append(
          "looking_for",
          lookingForMap[data.lookingFor[0]] || data.lookingFor[0],
        );
      }

      if (data.hasChildren)
        formData.append(
          "has_children",
          data.hasChildren === "Yes" ? "true" : "false",
        );
      if (data.wantChildren)
        formData.append(
          "wants_children",
          data.wantChildren === "Yes" ? "true" : "false",
        );
      if (data.smoking)
        formData.append("smoking", data.smoking === "Yes" ? "true" : "false");
      if (data.alcohol)
        formData.append("alcohol", data.alcohol === "Yes" ? "true" : "false");
      if (data.pets)
        formData.append("pets", data.pets === "Yes" ? "true" : "false");
      if (data.sport) formData.append("sport", data.sport);
      if (data.eatingHabits && data.eatingHabits.length > 0)
        formData.append("eating_habits", data.eatingHabits[0]);

      if (data.humor)
        formData.append(
          "second_degree_humor",
          data.humor === "Yes" ? "true" : "false",
        );

      if (data.qualities && data.qualities.length > 0)
        formData.append("qualities", JSON.stringify(data.qualities));
      if (data.interests && data.interests.length > 0)
        formData.append("interests", JSON.stringify(data.interests));
      if (data.rechargeMethods && data.rechargeMethods.length > 0)
        formData.append(
          "recharge_methods",
          JSON.stringify(data.rechargeMethods),
        );
      if (data.exhaustTriggers && data.exhaustTriggers.length > 0)
        formData.append(
          "exhaust_triggers",
          JSON.stringify(data.exhaustTriggers),
        );
      if (data.emotionalNeeds && data.emotionalNeeds.length > 0)
        formData.append("emotional_needs", JSON.stringify(data.emotionalNeeds));
      if (data.soothesMethods && data.soothesMethods.length > 0)
        formData.append("soothe_methods", JSON.stringify(data.soothesMethods));

      if (data.photos[0]) {
        formData.append("photo1", {
          uri: data.photos[0],
          name: "photo1.jpg",
          type: "image/jpeg",
        } as any);
      }
      if (data.photos[1]) {
        formData.append("photo2", {
          uri: data.photos[1],
          name: "photo2.jpg",
          type: "image/jpeg",
        } as any);
      }
      if (data.photos[2]) {
        formData.append("photo3", {
          uri: data.photos[2],
          name: "photo3.jpg",
          type: "image/jpeg",
        } as any);
      }

      await updateMyProfile(formData);
      await fetchProfile();
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("Onboarding API Error:", err);
      if (err.response) {
        console.log("Error Response Data:", JSON.stringify(err.response.data, null, 2));
      }
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to submit profile",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      edges={["top", "bottom"]}
    >
      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: text }]}>Face Verification</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Position your face within the frame and ensure good lighting.
        </Text>
      </View>

      {/* Face Detected Badge */}
      <View style={styles.badgeRow}>
        <View
          style={[styles.badge, { borderColor: "#22C55E", borderWidth: 1.5 }]}
        >
          <Text style={{ color: "#22C55E", fontSize: 13, fontWeight: "600" }}>
            {faceDetected ? "Face Detected" : "No Face Detected"}
          </Text>
        </View>
      </View>

      {/* Camera Frame */}
      <View style={styles.frameWrapper}>
        {/* Spinning arc border */}
        <Animated.View
          style={[
            styles.spinRing,
            {
              borderColor: "#22C55E",
              transform: [{ rotate: spin }],
            },
          ]}
        />
        {/* Static ring */}
        <View style={[styles.staticRing, { borderColor: border }]} />
        {/* Face placeholder */}
        <View style={[styles.facePlaceholder, { backgroundColor: card }]}>
          <Text style={{ fontSize: 80 }}>🧑</Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Instruction card */}
      <View
        style={[
          styles.instructionCard,
          { backgroundColor: card, borderColor: border },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: muted + "22" }]}>
          <ShieldOff size={20} color={muted} />
        </View>
        <Text style={[styles.instructionText, { color: text }]}>
          Please remove any glasses, hats or face masks before starting.
        </Text>
      </View>

      {error ? (
        <Text
          style={{
            color: "#EF4444",
            textAlign: "center",
            marginBottom: 8,
            paddingHorizontal: 20,
          }}
        >
          {error}
        </Text>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          onPress={handleSubmit}
          style={{ borderRadius: 28, height: 52 }}
          textStyle={{ color: primaryForeground }}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={primaryForeground} />
          ) : (
            "Complete Profile"
          )}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  titleBlock: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  badgeRow: {
    alignItems: "center",
    marginBottom: 24,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  frameWrapper: {
    alignSelf: "center",
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  spinRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
  staticRing: {
    position: "absolute",
    width: 208,
    height: 208,
    borderRadius: 104,
    borderWidth: 1.5,
  },
  facePlaceholder: {
    width: 192,
    height: 192,
    borderRadius: 96,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 8,
  },
});
