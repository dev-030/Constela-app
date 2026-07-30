import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColor } from "@/hooks/useColor";

export default function FaceVerificationScreen() {
  const router = useRouter();
  const background = useColor("background");
  const text = useColor("text");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");

  const handleBypass = () => {
    console.log("Simulator Bypass: Skipping Face Verification.");
    router.replace("/(tabs)/home");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: "700", color: text, marginBottom: 20, textAlign: "center" }}>
          Face Verification
        </Text>
        
        <Text style={{ fontSize: 16, color: text, textAlign: "center", marginBottom: 40, lineHeight: 24 }}>
          The Face Detection feature has been temporarily disabled so you can test the app on the iOS Simulator without the Google ML Kit compilation errors.
        </Text>

        <Pressable
          onPress={handleBypass}
          style={{
            backgroundColor: primary,
            paddingVertical: 16,
            paddingHorizontal: 32,
            borderRadius: 30,
            width: "100%",
            alignItems: "center"
          }}
        >
          <Text style={{ color: primaryForeground, fontSize: 18, fontWeight: "600" }}>
            Bypass & Continue to App
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
