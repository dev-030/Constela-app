import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InputOTP } from "@/components/ui/input-otp";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVerifyPasswordResetCodeMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const verifyCode = useVerifyPasswordResetCodeMutation();
  const muted = useColor("textMuted");
  const background = useColor("background");
  const insets = useSafeAreaInsets();
  const { horizontalPadding, isCompact, size } = useResponsiveLayout();

  const handleVerifyCode = () => {
    if (!code || code.length < 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    verifyCode.mutate(
      { email: email || "", code },
      {
        onSuccess: () => {
          router.push({ pathname: "/(auth)/new-password", params: { email, code } });
        },
        onError: (err: any) => {
          const errMsg = err?.response?.data?.error || err?.message || "Failed to verify code";
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
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: size(24, 18) }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
            Reset Password
          </Text>
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: size(32, 24) }}>
          <Text style={{ color: muted, fontSize: 14 }}>
            Enter the 6-digit code sent to {email}.
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: size(24, 18) }}>
          <View style={{ gap: 8, alignItems: "center" }}>
            <Text style={{ fontWeight: "600", fontSize: 14, alignSelf: "flex-start" }}>Reset Code</Text>
            <InputOTP
              length={6}
              value={code}
              onChangeText={setCode}
              slotStyle={{ height: 56, borderRadius: 8, marginHorizontal: 2 }}
            />
          </View>
          <Button
            style={{ marginTop: 8 }}
            onPress={handleVerifyCode}
            disabled={verifyCode.isPending || code.length < 6}
          >
            Continue
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
