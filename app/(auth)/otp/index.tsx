import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InputOTP } from "@/components/ui/input-otp";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Mail } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { useState } from "react";
import { useVerifyOtpMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function OtpScreen() {
  const secondary = useColor("secondary");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const primaryForeground = useColor("primaryForeground");

  const { email } = useLocalSearchParams<{ email?: string }>();
  const [otp, setOtp] = useState("");

  const verifyOtp = useVerifyOtpMutation();

  const handleVerify = () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter a valid OTP");
      return;
    }

    if (!email) {
      toast.error("Email not found. Please sign up again.");
      return;
    }

    verifyOtp.mutate(
      { email, otp },
      {
        onSuccess: (data) => {
          toast.success(data.message || "OTP verified successfully");
          router.replace("/onboarding");
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.error || err?.message || "Invalid OTP";
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}
    >
      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Header - Back Button & Title */}
        <View
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text
            variant="title"
            style={{ fontSize: 20, fontWeight: "bold", marginLeft: 16 }}
          >
            OTP Verification
          </Text>
        </View>

        {/* Instructions */}
        <View
          style={{
            alignItems: "center",
            marginBottom: 40,
            paddingHorizontal: 20,
          }}
        >
          <Text style={{ color: muted, textAlign: "center", fontSize: 14 }}>
            Enter the 4-digit code you received via email
          </Text>
          <Text
            style={{
              color: secondary,
              textAlign: "center",
              fontSize: 14,
              fontWeight: "600",
              marginTop: 4,
            }}
          >
            {email || "example@gmail.com"}
          </Text>
        </View>

        {/* Pink Envelope Icon */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: secondary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Icon name={Mail} size={40} color={primaryForeground} />
          </View>
        </View>

        {/* OTP Input */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <InputOTP
            length={4}
            value={otp}
            onChangeText={setOtp}
            slotStyle={{ width: 64, height: 64, borderRadius: 12 }}
          />
        </View>

        {/* Buttons */}
        <View style={{ gap: 24, marginTop: "auto", marginBottom: 40 }}>
          <Button
            textStyle={{ color: primaryForeground }}
            onPress={handleVerify}
            disabled={verifyOtp.isPending || otp.length < 4}
          >
            Continue
          </Button>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: muted }}>Resend new code</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
