import { useFaceVerifyMutation } from "@/api/auth";
import { useProfileStore } from "@/store/profileStore";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useRouter } from "expo-router";
import { ArrowLeft, Camera as CameraIcon, RefreshCw, ShieldCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { showPermissionBlockedAlert } from "@/utils/permissions";
import { showAlert } from "@/components/ui/app-alert";

/**
 * Photo verification.
 *
 * The user opens the live front camera, takes one photo of their face and
 * submits it. An admin then compares it with the profile pictures and approves
 * or rejects it. Only the live camera is offered (no gallery) so the photo is
 * taken now, by the person using the account.
 */
export default function PhotoVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const card = useColor("card");
  const border = useColor("border");

  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { fetchProfile } = useProfileStore();
  const faceVerify = useFaceVerifyMutation();

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission]);

  // Ask again; if the OS no longer shows its prompt, offer the Settings shortcut.
  const handleGrantCamera = async () => {
    const granted = await requestPermission();
    if (!granted) showPermissionBlockedAlert("camera");
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    setError("");
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: "off", enableShutterSound: true });
      const uri = photo.path.startsWith("file://") ? photo.path : `file://${photo.path}`;
      // Keep uploads small but sharp enough for a side-by-side review.
      const resized = await manipulateAsync(uri, [{ resize: { width: 1080 } }], {
        compress: 0.85,
        format: SaveFormat.JPEG,
      });
      setCapturedUri(resized.uri);
    } catch (e: any) {
      console.log("[PhotoVerify] takePhoto error:", e?.message);
      setError(t("onboarding.photo_verify_capture_failed", "Couldn't take the photo. Please try again."));
    } finally {
      setIsCapturing(false);
    }
  };

  const submit = async () => {
    if (!capturedUri || isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("photo", { uri: capturedUri, name: "verification.jpg", type: "image/jpeg" } as any);
      await faceVerify.mutateAsync(formData);
      await fetchProfile();
      showAlert(
        t("onboarding.photo_verify_submitted_title", "Photo submitted"),
        t(
          "onboarding.photo_verify_submitted_desc",
          "Thanks! Our team will compare it with your profile pictures. You'll be notified once it's reviewed.",
        ),
        [{ text: t("settings_pages.ok", "OK"), onPress: () => router.replace("/(tabs)/home") }],
      );
    } catch (err: any) {
      console.log("[PhotoVerify] Submit error:", err?.response?.data || err?.message);
      setError(
        err?.response?.data?.error ||
          t("onboarding.photo_verify_upload_failed", "Upload failed. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCameraArea = () => {
    if (capturedUri) {
      return <Image source={{ uri: capturedUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
    }
    if (!hasPermission) {
      return (
        <Pressable onPress={handleGrantCamera} style={styles.centerFill}>
          <CameraIcon size={40} color={muted} />
          <Text style={{ fontSize: 14, color: muted, textAlign: "center", marginTop: 10, paddingHorizontal: 24 }}>
            {t("onboarding.face_grant_camera", "Tap to grant camera access")}
          </Text>
        </Pressable>
      );
    }
    if (!device) {
      return (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      );
    }
    return (
      <>
        <Camera
          ref={cameraRef}
          device={device}
          isActive={!capturedUri}
          photo
          style={StyleSheet.absoluteFill}
        />
        {/* Face guide */}
        <View pointerEvents="none" style={styles.guideWrap}>
          <View style={styles.guideOval} />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <ArrowLeft size={24} color={text} />
        </Pressable>
        <LanguagePickerButton />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ShieldCheck size={22} color={primary} />
          <Text style={[styles.title, { color: text }]}>
            {t("onboarding.photo_verify_title", "Photo verification")}
          </Text>
        </View>
        <Text style={[styles.subtitle, { color: muted }]}>
          {capturedUri
            ? t("onboarding.photo_verify_review", "Make sure your face is clear and well lit, then submit.")
            : t(
                "onboarding.photo_verify_instructions",
                "Take a live photo of your face. Our team compares it with your profile pictures to confirm it's really you.",
              )}
        </Text>

        <View style={[styles.cameraFrame, { backgroundColor: card, borderColor: capturedUri ? primary : border }]}>
          {renderCameraArea()}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!capturedUri ? (
          <View style={styles.shutterRow}>
            <Pressable
              onPress={takePicture}
              disabled={!hasPermission || !device || isCapturing}
              accessibilityRole="button"
              accessibilityLabel={t("onboarding.photo_verify_take", "Take photo")}
              style={({ pressed }) => [
                styles.shutterOuter,
                { borderColor: primary, opacity: !hasPermission || !device ? 0.4 : pressed ? 0.8 : 1 },
              ]}
            >
              <View style={[styles.shutterInner, { backgroundColor: primary }]}>
                {isCapturing ? <ActivityIndicator color="#FFFFFF" /> : <CameraIcon size={28} color="#FFFFFF" />}
              </View>
            </Pressable>
            <Text style={[styles.hint, { color: muted }]}>
              {t("onboarding.photo_verify_hint", "Center your face in the oval and tap the button.")}
            </Text>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            <Pressable
              onPress={() => {
                setCapturedUri(null);
                setError("");
              }}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.secondaryBtn, { borderColor: border, opacity: pressed ? 0.8 : 1 }]}
            >
              <RefreshCw size={18} color={text} />
              <Text style={[styles.secondaryBtnText, { color: text }]}>
                {t("onboarding.photo_verify_retake", "Retake")}
              </Text>
            </Pressable>
            <Pressable
              onPress={submit}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: primary, opacity: pressed ? 0.85 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t("onboarding.photo_verify_submit", "Submit")}</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 14.5, lineHeight: 21, marginTop: 6, marginBottom: 16 },
  cameraFrame: {
    flex: 1,
    minHeight: 260,
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
  },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
  guideWrap: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  guideOval: {
    width: "62%",
    aspectRatio: 0.78,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    borderStyle: "dashed",
  },
  error: { color: "#EF4444", fontSize: 13.5, textAlign: "center", marginTop: 10 },
  shutterRow: { alignItems: "center", marginTop: 16 },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 66, height: 66, borderRadius: 33, alignItems: "center", justifyContent: "center" },
  hint: { fontSize: 13, marginTop: 10, textAlign: "center" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 28,
    paddingVertical: 15,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "700" },
  primaryBtn: { flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 28, paddingVertical: 15 },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
