import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useRouter } from "expo-router";
import { ShieldOff } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
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

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={["top", "bottom"]}>
      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: text }]}>Face Verification</Text>
        <Text style={[styles.subtitle, { color: muted }]}>
          Position your face within the frame and ensure good lighting.
        </Text>
      </View>

      {/* Face Detected Badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { borderColor: "#22C55E", borderWidth: 1.5 }]}>
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
        <View
          style={[
            styles.staticRing,
            { borderColor: border },
          ]}
        />
        {/* Face placeholder */}
        <View style={[styles.facePlaceholder, { backgroundColor: card }]}>
          <Text style={{ fontSize: 80 }}>🧑</Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* Instruction card */}
      <View style={[styles.instructionCard, { backgroundColor: card, borderColor: border }]}>
        <View style={[styles.iconBox, { backgroundColor: muted + "22" }]}>
          <ShieldOff size={20} color={muted} />
        </View>
        <Text style={[styles.instructionText, { color: text }]}>
          Please remove any glasses, hats or face masks before starting.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          onPress={() => router.replace("/(tabs)/home")}
          style={{ borderRadius: 28, height: 52 }}
          textStyle={{ color: primaryForeground }}
        >
          Continue
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
