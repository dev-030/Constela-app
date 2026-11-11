import { useResetPasswordMutation } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

export default function NewPasswordScreen() {
  const { t } = useTranslation();
  const { email, code } = useLocalSearchParams<{ email?: string; code?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const resetPassword = useResetPasswordMutation();
  const muted = useColor("textMuted");
  const background = useColor("background");
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isCompact, size } = useResponsiveLayout();

  const handleReset = () => {
    if (!newPassword) {
      toast.error(t("auth.password_placeholder", "Please enter a new password"));
      return;
    }

    resetPassword.mutate(
      { email: email || "", code: code || "", new_password: newPassword },
      {
        onSuccess: (data) => {
          toast.success(data.message || t("auth.reset_password_success", "Password reset successfully"));
          router.replace("/(auth)/login");
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || err?.message || "Failed to reset password"),
      },
    );
  };

  return (
    <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingTop: insets.top + (isCompact ? 20 : 32), paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: size(24, 18) }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
              <Icon name={ArrowLeft} size={24} />
            </Pressable>
            <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
              {t("auth.create_new_password_title", "Create New Password")}
            </Text>
          </View>
          <LanguagePickerButton />
        </View>
        <View style={{ marginBottom: size(32, 24) }}>
          <Text style={{ color: muted, fontSize: 14 }}>
            {t("auth.create_new_password_desc", "Your code is verified. Choose a new password for your account.")}
          </Text>
        </View>
        <View style={{ gap: size(24, 18) }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>
              {t("auth.new_password", "New Password")}
            </Text>
            <Input
              placeholder={t("auth.new_password_placeholder", "New password")}
              secureTextEntry={!showPassword}
              variant="outline"
              value={newPassword}
              onChangeText={setNewPassword}
              rightComponent={() => (
                <Pressable onPress={() => setShowPassword((visible) => !visible)}>
                  <Icon name={showPassword ? EyeOff : Eye} size={20} color={muted} />
                </Pressable>
              )}
            />
          </View>
          <Button style={{ marginTop: 8 }} onPress={handleReset} disabled={resetPassword.isPending || !newPassword}>
            {t("auth.reset_password_btn", "Reset Password")}
          </Button>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
