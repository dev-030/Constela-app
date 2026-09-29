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
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";

export default function NewPasswordScreen() {
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
      toast.error("Please enter a new password");
      return;
    }

    resetPassword.mutate(
      { email: email || "", code: code || "", new_password: newPassword },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Password reset successfully");
          router.replace("/(auth)/login");
        },
        onError: (err: any) => toast.error(err?.response?.data?.error || err?.message || "Failed to reset password"),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: 480, alignSelf: "center", paddingHorizontal: horizontalPadding, paddingTop: insets.top + (isCompact ? 20 : 32), paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: size(24, 18) }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>Create New Password</Text>
        </View>
        <View style={{ marginBottom: size(32, 24) }}>
          <Text style={{ color: muted, fontSize: 14 }}>Your code is verified. Choose a new password for your account.</Text>
        </View>
        <View style={{ gap: size(24, 18) }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>New Password</Text>
            <Input placeholder="New password" secureTextEntry={!showPassword} variant="outline" value={newPassword} onChangeText={setNewPassword} rightComponent={() => (
              <Pressable onPress={() => setShowPassword((visible) => !visible)}>
                <Icon name={showPassword ? EyeOff : Eye} size={20} color={muted} />
              </Pressable>
            )} />
          </View>
          <Button style={{ marginTop: 8 }} onPress={handleReset} disabled={resetPassword.isPending || !newPassword}>Reset Password</Button>
        </View>
      </View>
    </ScrollView>
  );
}
