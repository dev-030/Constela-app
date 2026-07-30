import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useSignUpMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const signup = useSignUpMutation();

  const orange = useColor("orange");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const border = useColor("border");

  const handleSignup = () => {
    if (!name || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    signup.mutate(
      { email, password, first_name: name },
      {
        onSuccess: (data) => {
          toast.success(data.message || "OTP sent to email");
          router.push({ pathname: "/(auth)/otp", params: { email } });
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.email?.[0] ||
            err?.response?.data?.error ||
            err?.message ||
            "Signup failed";
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}
    >
      <View style={{ flex: 1, padding: 24, paddingTop: 50 }}>
        {/* Header - Globe Icon */}

        {/* Logo */}
        <View style={{ alignItems: "center", marginTop: 10, marginBottom: 20 }}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 140, height: 140 }}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text
            variant="title"
            style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}
          >
            Welcome
          </Text>
          <Text style={{ color: muted, textAlign: "center" }}>
            Sign up to join your community.
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 12 }}>
          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Name</Text>
            <Input
              placeholder="e.g. Alex Smith"
              variant="outline"
              inputStyle={{ paddingVertical: 14 }}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Email</Text>
            <Input
              placeholder="e.g. alex@example.com"
              variant="outline"
              inputStyle={{ paddingVertical: 14 }}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Password</Text>
            <Input
              placeholder="........"
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

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>
              Confirm Password
            </Text>
            <Input
              placeholder="........"
              secureTextEntry={!showPassword}
              variant="outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
            onPress={handleSignup}
            disabled={signup.isPending}
          >
            Signup
          </Button>
        </View>

        {/* Footer */}
        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Text>
            Have an account?{" "}
            <Text
              style={{ color: orange }}
              onPress={() => router.push("/(auth)/login")}
            >
              Sign in
            </Text>
          </Text>
        </View>

        {/* Social Login */}
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: border }} />
            <Text style={{ marginHorizontal: 16, color: muted, fontSize: 12 }}>
              or continue with
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: border }} />
          </View>

          <View style={{ flexDirection: "row", gap: 16, width: "100%" }}>
            <Button variant="outline" style={{ flex: 1 }}>
              Google
            </Button>
            <Button variant="outline" style={{ flex: 1 }}>
              Apple
            </Button>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
