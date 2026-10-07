import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useForgotPasswordMutation } from "@/api/auth";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const forgotPassword = useForgotPasswordMutation();
  const muted = useColor("textMuted");
  const background = useColor("background");
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isCompact, size } = useResponsiveLayout();

  const handleSendCode = () => {
    if (!email) {
      toast.error(t("auth.email_placeholder", "Please enter your email"));
      return;
    }

    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data) => {
          toast.success(data.message || t("auth.resend_success", "Reset code sent"));
          router.push({ pathname: "/(auth)/reset-password", params: { email } });
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.error || err?.message || "Failed to send code";
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 480,
          alignSelf: "center",
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + (isCompact ? 20 : 32),
          paddingBottom: 32,
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: size(24, 18) }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <Icon name={ArrowLeft} size={24} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 12 }}>
              {t("auth.forgot_password_title", "Forgot Password")}
            </Text>
          </View>
          <LanguagePickerButton />
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: size(32, 24) }}>
          <Text style={{ color: muted, fontSize: 14 }}>
            {t("auth.forgot_password_desc", "Enter your email address and we'll send you a 6-digit code to reset your password.")}
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: size(24, 18) }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>{t("auth.email", "Email")}</Text>
            <Input
              placeholder={t("auth.email_placeholder", "e.g. alex@example.com")}
              variant="outline"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Button
            style={{ marginTop: 8 }}
            onPress={handleSendCode}
            disabled={forgotPassword.isPending || !email}
          >
            {t("auth.send_reset_code", "Send Reset Code")}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
