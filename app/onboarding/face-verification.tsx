import { useFaceVerifyMutation } from "@/api/auth";
import { useProfileStore } from "@/store/profileStore";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useRouter } from "expo-router";
import { ShieldOff, Check, ArrowLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  ActivityIndicator,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  runAsync,
} from "react-native-vision-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useFaceDetector } from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

type Step = "front" | "left" | "right" | "done";

const STEP_INSTRUCTIONS: Record<string, string> = {
  front: "1. Look straight at the camera",
  left: "2. Good! Now turn your head LEFT",
  right: "3. Great! Now turn your head RIGHT",
  done: "All photos captured (Testing Mode)",
};

// Yaw = rotationY from ML Kit (degrees)
// Positive = face turned right, Negative = face turned left
const YAW_FRONT_MAX = 15;  // ±15° = looking straight
const YAW_SIDE_MIN = 20;   // at least 20° side turn

export default function FaceVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const card = useColor("card");
  const border = useColor("border");

  // VisionCamera hooks
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);

  // ─── State (for rendering) ───
  const [step, setStep] = useState<Step>("front");
  const [photos, setPhotos] = useState<Record<string, string>>({ front: "", left: "", right: "" });
  const [error, setError] = useState("");
  const [faceInPosition, setFaceInPosition] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugAngles, setDebugAngles] = useState({ yaw: 0, roll: 0 });

  // ─── Refs (always fresh inside callbacks) ───
  const stepRef = useRef<Step>("front");
  const holdStartRef = useRef<number | null>(null);
  const activeCaptureIdRef = useRef<number | null>(null);
  const latestAnglesRef = useRef({ yaw: 0, roll: 0, time: 0 });

  useEffect(() => { stepRef.current = step; }, [step]);

  // ─── Animations ───
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const { fetchProfile } = useProfileStore();
  const faceVerify = useFaceVerifyMutation();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission]);

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    if (faceInPosition) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [faceInPosition]);

  useEffect(() => {
    const target = step === "left" ? 0.33 : step === "right" ? 0.66 : step === "done" ? 1 : 0;
    Animated.timing(progressAnim, { toValue: target, duration: 400, useNativeDriver: false }).start();
  }, [step]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const ringColor = faceInPosition ? "#22C55E" : border;

  // ─── Submit all 3 photos ───
  const submitPhotosRef = useRef(async (_: Record<string, string>) => {});
  submitPhotosRef.current = async (finalPhotos: Record<string, string>) => {
    try {
      setIsLoading(true);

      // Compress images before upload to avoid massive 45MB payloads
      const compress = async (uri: string) => {
        const fileUri = uri.startsWith("file://") ? uri : "file://" + uri;
        const result = await manipulateAsync(
          fileUri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        return result.uri;
      };

      const compressedFront = await compress(finalPhotos.front);
      const compressedLeft = await compress(finalPhotos.left);
      const compressedRight = await compress(finalPhotos.right);

      const formData = new FormData();
      formData.append("front", { uri: compressedFront, name: "front.jpg", type: "image/jpeg" } as any);
      formData.append("left", { uri: compressedLeft, name: "left.jpg", type: "image/jpeg" } as any);
      formData.append("right", { uri: compressedRight, name: "right.jpg", type: "image/jpeg" } as any);

      await faceVerify.mutateAsync(formData);
      await fetchProfile();
      
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("[FaceVerify] Submit error:", err?.response?.data || err?.message);
      setError(err?.response?.data?.error || err?.message || "Upload failed. Please try again.");
      setPhotos({ front: "", left: "", right: "" });
      stepRef.current = "front";
      setStep("front");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Capture high-quality photo with VisionCamera's takePhoto ───
  const capturePhotoRef = useRef(async (captureId: number) => {});
  capturePhotoRef.current = async (captureId: number) => {
    const currentStep = stepRef.current;
    if (!cameraRef.current || currentStep === "done") return;

    try {
      // takePhoto() → high quality photo, no looping
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
        enableShutterSound: false,
      });

      if (holdStartRef.current !== captureId) {
        console.log("[FaceVerify] User moved during capture, aborting.");
        return;
      }

      const path = photo.path; // VisionCamera returns path, not uri
      
      // -- POST-CAPTURE VERIFICATION --
      // Instead of running ML kit on the photo again (which adds a dependency and disk I/O),
      // we check the angles we recorded right before capture from the frame processor.
      const { yaw, roll, time } = latestAnglesRef.current;
      const timeSinceLastDetection = Date.now() - time;

      if (holdStartRef.current !== captureId) {
        console.log("[FaceVerify] User moved during verification, aborting.");
        return;
      }

      if (timeSinceLastDetection > 1000) {
        console.log("[FaceVerify] No face detected recently, silently retrying...");
        return;
      }

      const isUpright = Math.abs(roll) < 30;
      let isPhotoCorrect = false;

      if (isUpright) {
        if (currentStep === "front") isPhotoCorrect = Math.abs(yaw) < YAW_FRONT_MAX;
        else if (currentStep === "left") isPhotoCorrect = yaw > YAW_SIDE_MIN;
        else if (currentStep === "right") isPhotoCorrect = yaw < -YAW_SIDE_MIN;
      }

      if (!isPhotoCorrect) {
        console.log(`[FaceVerify] Face moved (yaw: ${yaw}, required: ${currentStep}), silently retrying...`);
        return;
      }

      console.log(`[FaceVerify] ✅ Verified & Captured ${currentStep}: ${path.slice(-40)}`);

      // Reset so we don't accidentally capture the next step instantly
      holdStartRef.current = null;
      setFaceInPosition(false);
      activeCaptureIdRef.current = null;

      let nextStep: Step;
      if (currentStep === "front") nextStep = "left";
      else if (currentStep === "left") nextStep = "right";
      else nextStep = "done";

      stepRef.current = nextStep;
      setStep(nextStep);

      setPhotos((prev) => {
        const updated = { ...prev, [currentStep]: path };
        if (nextStep === "done") {
          submitPhotosRef.current(updated);
        }
        return updated;
      });
    } catch (e: any) {
      console.log("[FaceVerify] takePhoto error:", e);
      // Silently fail and let the loop retry
    }
  };

  // ─── Frame Processor: Real-time face detection ───
  const handleFacesDetected = Worklets.createRunOnJS((faces: any[]) => {
    if (stepRef.current === "done") return;
    
    if (faces && faces.length > 0) {
      const face = faces[0];
      const yaw = face.yawAngle ?? 0;
      const roll = face.rollAngle ?? 0;
      
      latestAnglesRef.current = { yaw, roll, time: Date.now() };
      setDebugAngles({ yaw: Math.round(yaw), roll: Math.round(roll) });

      const isUpright = Math.abs(roll) < 30;
      let isCorrect = false;
      const s = stepRef.current;

      if (isUpright) {
        if (s === "front") {
          isCorrect = Math.abs(yaw) < YAW_FRONT_MAX;
        } else if (s === "left") {
          // Turning head to the user's LEFT means looking to the camera's RIGHT, resulting in a POSITIVE yaw.
          isCorrect = yaw > YAW_SIDE_MIN;
        } else if (s === "right") {
          // Turning head to the user's RIGHT means looking to the camera's LEFT, resulting in a NEGATIVE yaw.
          isCorrect = yaw < -YAW_SIDE_MIN;
        }
      }

      if (isCorrect) {
        setError(""); // Clear any previous errors
        if (holdStartRef.current === null) {
          holdStartRef.current = Date.now();
          setFaceInPosition(true);
        }
        const heldMs = Date.now() - holdStartRef.current;
        if (heldMs >= 250) {
          // Held the correct angle for 250ms → trigger capture if not already!
          if (activeCaptureIdRef.current !== holdStartRef.current) {
            activeCaptureIdRef.current = holdStartRef.current;
            capturePhotoRef.current(holdStartRef.current);
          }
        }
      } else {
        holdStartRef.current = null;
        setFaceInPosition(false);
      }
    } else {
      // No face
      holdStartRef.current = null;
      setFaceInPosition(false);
      setDebugAngles({ yaw: 0, roll: 0 });
    }
  });

  const { detectFaces } = useFaceDetector({ 
    performanceMode: "fast",
    landmarkMode: "none",
    contourMode: "none",
    classificationMode: "none",
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    runAsync(frame, () => {
      'worklet';
      const faces = detectFaces(frame);
      handleFacesDetected(faces);
    });
  }, [detectFaces, handleFacesDetected]);

  const getStepNumber = () => {
    if (step === "front") return "1 / 3";
    if (step === "left") return "2 / 3";
    if (step === "right") return "3 / 3";
    return "Done";
  };

  const getStepInstruction = (s: Step) => {
    switch (s) {
      case "front": return t("onboarding.face_step_front", "1. Look straight at the camera");
      case "left": return t("onboarding.face_step_left", "2. Good! Now turn your head LEFT");
      case "right": return t("onboarding.face_step_right", "3. Great! Now turn your head RIGHT");
      case "done": return t("onboarding.face_step_done", "All photos captured (Verifying...)");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: background }]} edges={["top", "bottom"]}>
      {/* Top Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, paddingBottom: 4 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <ArrowLeft size={24} color={text} />
        </Pressable>
        <LanguagePickerButton />
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { backgroundColor: border }]}>
        <Animated.View
          style={[styles.progressBar, {
            backgroundColor: primary,
            width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
          }]}
        />
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, { color: text }]}>{t("onboarding.face_verification_title", "Face Verification")}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{getStepInstruction(step)}</Text>
      </View>

      {/* Status badge */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, {
          borderColor: step === "done" || faceInPosition ? "#22C55E" : "#3B82F6",
          borderWidth: 1.5,
          backgroundColor: step === "done" || faceInPosition ? "#22C55E18" : "#3B82F618",
        }]}>
          <Text style={{
            color: step === "done" || faceInPosition ? "#22C55E" : "#3B82F6",
            fontSize: 13, fontWeight: "600",
          }}>
            {step === "done"
              ? t("onboarding.face_badge_done", "All Done! Verifying...")
              : faceInPosition
              ? t("onboarding.face_badge_holding", "✓ Hold still — capturing!")
              : t("onboarding.face_badge_position", "Step {{step}} — Position your face", { step: getStepNumber() })}
          </Text>
        </View>
      </View>

      {/* Camera circle */}
      <Animated.View style={[styles.frameWrapper, { transform: [{ scale: pulseAnim }] }]}>
        <View style={[styles.facePlaceholder, { backgroundColor: card, overflow: "hidden" }]}>
          {step === "done" ? (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <Check size={50} color={primary} />
              <Text style={{ color: text, marginTop: 12, fontWeight: "600" }}>{t("common.complete", "Complete")}</Text>
            </View>
          ) : !hasPermission ? (
            <Pressable onPress={requestPermission} style={{ alignItems: "center", justifyContent: "center", padding: 16 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>📷</Text>
              <Text style={{ fontSize: 12, color: muted, textAlign: "center" }}>{t("onboarding.face_grant_camera", "Tap to grant camera access")}</Text>
            </Pressable>
          ) : !device ? (
            <ActivityIndicator size="large" color={primary} />
          ) : (
            <>
              <Camera
                ref={cameraRef}
                device={device}
                isActive={true}
                pixelFormat="yuv"
                style={{ flex: 1, width: "100%", height: "100%" }}
                photo={true}
                frameProcessor={frameProcessor}
              />
              <Hologram3DFaceGuide step={step} isCorrect={faceInPosition} />
            </>
          )}
          {/* Circular mask */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute", width: 370, height: 370, borderRadius: 185,
              borderWidth: 60, borderColor: background, top: -60, left: -60,
            }}
          />
        </View>



        {/* Spinning arc */}
        <Animated.View
          pointerEvents="none"
          style={[styles.spinRing, { borderColor: ringColor, transform: [{ rotate: spin }] }]}
        />
        {/* Static ring */}
        <View pointerEvents="none" style={[styles.staticRing, { borderColor: ringColor }]} />
      </Animated.View>

      {/* Step thumbnails */}
      <View style={styles.thumbnailsRow}>
        {(["front", "left", "right"] as const).map((s) => (
          <View key={s} style={{ position: "relative" }}>
            <View style={[styles.thumbnail, { 
              borderColor: photos[s] ? "#22C55E" : border,
              borderStyle: photos[s] ? "solid" : "dashed",
            }]}>
              {photos[s] ? (
                <Image source={{ uri: "file://" + photos[s] }} style={styles.thumbImage} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 10, color: muted, textTransform: "capitalize" }}>{s}</Text>
              )}
            </View>
            {photos[s] && (
              <View style={styles.checkBadge}>
                <Check size={10} color="#fff" />
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {/* Instruction card */}
      <View style={[styles.hintCard, { backgroundColor: card, borderColor: border }]}>
        <View style={[styles.iconBox, { backgroundColor: muted + "22" }]}>
          <ShieldOff size={20} color={muted} />
        </View>
        <Text style={[styles.hintText, { color: text }]}>
          {t("onboarding.face_hint", "Hold each pose steady for 1 second. The photo captures automatically when the ring turns green.")}
        </Text>
      </View>

      {error ? (
        <Text style={{ color: "#EF4444", textAlign: "center", marginBottom: 20, paddingHorizontal: 20 }}>
          {error}
        </Text>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  progressContainer: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 12 },
  progressBar: { height: "100%" },
  titleBlock: { alignItems: "center", marginTop: 20, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 20, paddingHorizontal: 12 },
  badgeRow: { alignItems: "center", marginBottom: 20 },
  badge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  frameWrapper: {
    alignSelf: "center", width: 280, height: 280,
    alignItems: "center", justifyContent: "center",
  },
  spinRing: {
    position: "absolute", width: 290, height: 290, borderRadius: 145,
    borderWidth: 3, borderTopColor: "transparent", borderRightColor: "transparent",
  },
  staticRing: { position: "absolute", width: 276, height: 276, borderRadius: 138, borderWidth: 1.5 },
  facePlaceholder: { width: 250, height: 250, borderRadius: 125, alignItems: "center", justifyContent: "center" },
  debugBadge: {
    position: "absolute", bottom: -30, backgroundColor: "#00000099",
    paddingHorizontal: 14, borderRadius: 12, paddingVertical: 4,
  },
  debugText: { color: "white", fontSize: 10 },
  thumbnailsRow: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 50 },
  thumbnail: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  thumbImage: { width: "100%", height: "100%" },
  checkBadge: {
    position: "absolute", bottom: -2, right: -2, backgroundColor: "#22C55E",
    width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  hintCard: {
    flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16,
    borderWidth: 1, padding: 16, marginBottom: 24,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  hintText: { flex: 1, fontSize: 13, lineHeight: 19 },
});

import Svg, { Path, Ellipse, Circle, Defs, LinearGradient as SvgLinearGradient, Stop, G, ClipPath, Rect } from "react-native-svg";

// ─── Visual Guide Component ───
function Hologram3DFaceGuide({ step, isCorrect }: { step: Step; isCorrect: boolean }) {
  const turnAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(turnAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(turnAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isCorrect ? 0 : 0.85,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isCorrect]);

  if (step === "done") return null;

  // iOS mirrors the front camera preview, so the ghost must animate in the OPPOSITE
  // direction to what the user physically needs to do (right on screen = left in real life).
  // Android does NOT mirror the preview, so the ghost direction matches the step directly.
  const isLeft = Platform.OS === "ios" ? step === "right" : step === "left";
  const dir = isLeft ? -1 : (step === "left" || step === "right") ? 1 : 0;

  // Head rotates slightly opposite
  const headTranslateX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12 * dir] });

  // Face container moves
  const faceTranslateX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50 * dir] });
  const faceScaleX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] }); // Strong perspective squeeze

  // Nose pops out relative to face container
  const noseRelativeTransX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 18 * dir] });

  // Ears parallax
  const rightEarTransX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, isLeft ? -45 : 15] });
  const rightEarScaleX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, isLeft ? 1 : 0] });

  const leftEarTransX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0, isLeft ? -15 : 45] });
  const leftEarScaleX = turnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, isLeft ? 0 : 1] });

  return (
    <Animated.View
      style={{
        position: "absolute", width: 160, height: 200,
        opacity: opacityAnim, pointerEvents: "none", alignSelf: "center",
        justifyContent: "center", alignItems: "center"
      }}
    >
      {/* LEFT EAR */}
      <Animated.View style={{
        position: "absolute", left: -4, top: 85, width: 24, height: 48, borderRadius: 12,
        borderWidth: 3, borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.3)",
        transform: [{ translateX: leftEarTransX }, { scaleX: leftEarScaleX }]
      }} />

      {/* RIGHT EAR */}
      <Animated.View style={{
        position: "absolute", right: -4, top: 85, width: 24, height: 48, borderRadius: 12,
        borderWidth: 3, borderColor: "#3B82F6", backgroundColor: "rgba(59,130,246,0.3)",
        transform: [{ translateX: rightEarTransX }, { scaleX: rightEarScaleX }]
      }} />

      {/* HEAD BASE & STRUCTURAL GRID */}
      <Animated.View style={{
        width: 140, height: 180, borderRadius: 70, borderWidth: 4, borderColor: "#60A5FA",
        backgroundColor: "rgba(37,99,235,0.2)", position: "absolute",
        transform: [{ translateX: headTranslateX }], overflow: "hidden"
      }}>
        {/* Horizontal structure line */}
        <View style={{ position: "absolute", top: 88, width: "100%", height: 2, backgroundColor: "rgba(96,165,250,0.5)" }} />
        {/* Vertical structure line */}
        <View style={{ position: "absolute", left: 68, width: 2, height: "100%", backgroundColor: "rgba(96,165,250,0.5)" }} />
      </Animated.View>

      {/* FACE CONTAINER */}
      <Animated.View style={{
        position: "absolute", width: 140, height: 180,
        alignItems: "center", paddingTop: 45,
        transform: [{ translateX: faceTranslateX }]
      }}>
        {/* EYES */}
        <Animated.View style={{
          flexDirection: "row", gap: 16, marginBottom: 12,
          transform: [{ scaleX: faceScaleX }]
        }}>
          {/* Left Eye */}
          <View style={{
            width: 32, height: 20, borderRadius: 10, borderWidth: 3, borderColor: "#FFF",
            backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center"
          }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFF" }} />
          </View>
          {/* Right Eye */}
          <View style={{
            width: 32, height: 20, borderRadius: 10, borderWidth: 3, borderColor: "#FFF",
            backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center"
          }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFF" }} />
          </View>
        </Animated.View>

        {/* NOSE */}
        <Animated.View style={{
          width: 8, height: 35, backgroundColor: "#FFF", borderRadius: 4,
          shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10,
          transform: [{ translateX: noseRelativeTransX }]
        }} />

        {/* MOUTH */}
        <Animated.View style={{
          width: 44, height: 8, backgroundColor: "#FFF", borderRadius: 4, marginTop: 16,
          transform: [{ scaleX: faceScaleX }]
        }} />

        {/* JAWLINE INDICATION */}
        <Animated.View style={{
          position: "absolute", bottom: 15, width: 90, height: 40, borderRadius: 45,
          borderBottomWidth: 4, borderColor: "rgba(255,255,255,0.5)",
          transform: [{ scaleX: faceScaleX }]
        }} />
      </Animated.View>
    </Animated.View>
  );
}

