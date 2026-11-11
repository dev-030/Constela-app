import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Link, router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View, Platform } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useLoginMutation, useGoogleAuthMutation } from "@/api/auth";
import { toast } from "sonner-native";
import { FontAwesome } from "@expo/vector-icons";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { useTranslation } from "react-i18next";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useAuthLayout } from "@/hooks/useAuthLayout";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";

export default function LoginScreen() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLoginMutation();
  const googleAuth = useGoogleAuthMutation();

  const orange = useColor("orange");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const border = useColor("border");
  const layout = useAuthLayout();

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.signOut(); // Ensure previous sessions are cleared

      await GoogleSignin.hasPlayServices();
      const userInfo = (await GoogleSignin.signIn()) as any;

      if (userInfo.type === "cancelled") {
        return;
      }

      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        toast.error("Google Sign-In failed: No ID Token returned");
        return;
      }

      toast.info("Verifying Google Sign-In...");
      googleAuth.mutate(
        { id_token: idToken, is_login: true },
        {
          onSuccess: () => {
            toast.success("Signed in with Google");
            router.replace("/");
          },
          onError: (err: any) => {
            const errMsg =
              err?.response?.data?.error ||
              err?.message ||
              "Google Sign-In failed";
            toast.error(errMsg);
          },
        },
      );
    } catch (error: any) {
      if (error.code === "SIGN_IN_CANCELLED") {
        // user cancelled the login flow
      } else if (error.code === "IN_PROGRESS") {
        // operation (e.g. sign in) is in progress already
        toast.error("Sign-in in progress");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        // play services not available or outdated
        toast.error("Play services not available");
      } else {
        // some other error happened
        toast.error(error.message || "Unknown error during Google Sign-In");
      }
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          router.replace("/");
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.detail ||
            err?.response?.data?.error ||
            err?.message ||
            "Invalid credentials";
          toast.error(errMsg);
        },
      },
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: background }}
      edges={["top", "bottom"]}
    >
      <KeyboardAwareScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingHorizontal: layout.horizontalPadding,
          paddingBottom: layout.isCompact ? 24 : 40,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={60}
      >
        <View style={{ width: "100%", maxWidth: layout.contentMaxWidth }}>
          {/* Top Bar with Language Switcher */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              width: "100%",
              paddingTop: layout.isCompact ? 2 : 6,
              paddingBottom: 4,
            }}
          >
            <LanguagePickerButton />
          </View>

          {/* Logo Section */}
          <View
            style={{
              flex: layout.isCompact ? undefined : 1,
              justifyContent: "center",
              alignItems: "center",
              minHeight: layout.logoSectionMinHeight,
              paddingVertical: layout.logoSectionPadding,
            }}
          >
            <Image
              source={require("@/assets/images/constela_logo.png")}
              style={{ width: layout.logoWidth, height: layout.logoHeight }}
              contentFit="contain"
            />
          </View>

          <View style={{ gap: layout.sectionGap }}>
          {/* Title */}
          <View style={{ alignItems: "center" }}>
            <Text
              variant="title"
              style={{ fontSize: layout.titleSize, fontWeight: "bold", marginBottom: 8 }}
            >
              {t("auth.welcome")}
            </Text>
            <Text style={{ color: muted, textAlign: "center", fontSize: layout.subtitleSize }}>
              {t("auth.sign_in_prompt")}
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: 16 }}>
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                {t("auth.email")}
              </Text>
              <Input
                placeholder={t("auth.email_placeholder")}
                variant="outline"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: "600", fontSize: 14 }}>
                {t("auth.password")}
              </Text>
              <Input
                placeholder={t("auth.password_placeholder")}
                secureTextEntry={!showPassword}
                variant="outline"
                value={password}
                onChangeText={setPassword}
                rightComponent={() => (
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Icon
                      name={showPassword ? EyeOff : Eye}
                      size={20}
                      color={muted}
                    />
                  </Pressable>
                )}
              />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <></>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable>
                  <Text style={{ color: orange, fontSize: 14 }}>
                    {t("auth.forgot_password")}
                  </Text>
                </Pressable>
              </Link>
            </View>

            <Button
              style={{ marginTop: 8 }}
              onPress={handleLogin}
              disabled={login.isPending}
              loading={login.isPending}
            >
              {t("auth.log_in")}
            </Button>
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: layout.isCompact ? 8 : 16 }}>
            <Text>
              {t("auth.no_account")}{" "}
              <Text
                style={{ color: orange }}
                onPress={() => router.push("/(auth)/signup")}
              >
                {t("auth.sign_up")}
              </Text>
            </Text>
          </View>

          {/* Social Login */}
          <View style={{ marginTop: layout.isCompact ? 0 : 8, alignItems: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: border }} />
              <Text
                style={{
                  marginHorizontal: 16,
                  color: muted,
                  fontSize: 13,
                  fontWeight: "500",
                }}
              >
                {t("auth.or_continue")}
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: border }} />
            </View>

            <View style={{ flexDirection: layout.socialDirection, gap: 12, width: "100%" }}>
              <Button
                variant="outline"
                style={{ height: 50, gap: 10, ...(layout.socialDirection === "row" ? { flex: 1 } : { width: "100%" }) }}
                onPress={handleGoogleSignIn}
                disabled={googleAuth.isPending}
                loading={googleAuth.isPending}
              >
                <GoogleIcon width={20} height={20} />
                <Text style={{ fontWeight: "600" }}>Continue with Google</Text>
              </Button>
              {Platform.OS === "ios" && (
                <Button
                  variant="outline"
                  style={{ height: 50, gap: 10, ...(layout.socialDirection === "row" ? { flex: 1 } : { width: "100%" }) }}
                >
                  <FontAwesome name="apple" size={22} color={text} />
                  <Text style={{ fontWeight: "600" }}>Apple</Text>
                </Button>
              )}
            </View>
          </View>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
