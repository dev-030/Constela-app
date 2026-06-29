import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { InputOTP } from "@/components/ui/input-otp";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useResetPasswordMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetPassword = useResetPasswordMutation();
  const muted = useColor("textMuted");
  const background = useColor("background");

  const handleReset = () => {
    if (!code || code.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    resetPassword.mutate(
      { email: email || "", code, new_password: newPassword },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Password reset successfully");
          router.replace("/(auth)/login");
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.error || err?.message || "Failed to reset password";
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}>
      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
            Reset Password
          </Text>
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: muted, fontSize: 14 }}>
            Enter the 6-digit code sent to {email} and your new password.
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 24 }}>
          <View style={{ gap: 8, alignItems: "center" }}>
            <Text style={{ fontWeight: "600", fontSize: 14, alignSelf: "flex-start" }}>Reset Code</Text>
            <InputOTP
              length={6}
              value={code}
              onChangeText={setCode}
              slotStyle={{ width: 44, height: 56, borderRadius: 8, marginHorizontal: 2 }}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>New Password</Text>
            <Input
              placeholder="New password"
              secureTextEntry={!showPassword}
              variant="outline"
              value={newPassword}
              onChangeText={setNewPassword}
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

          <Button
            style={{ marginTop: 8 }}
            onPress={handleReset}
            disabled={resetPassword.isPending || code.length < 6 || !newPassword}
          >
            Reset Password
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
