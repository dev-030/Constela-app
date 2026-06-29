import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useForgotPasswordMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const forgotPassword = useForgotPasswordMutation();
  const muted = useColor("textMuted");
  const background = useColor("background");

  const handleSendCode = () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data) => {
          toast.success(data.message || "Reset code sent");
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
      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}>
            Forgot Password
          </Text>
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: muted, fontSize: 14 }}>
            Enter your email address and we'll send you a 6-digit code to reset your password.
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 24 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Email</Text>
            <Input
              placeholder="e.g. alex@example.com"
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
            Send Reset Code
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
