import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Link, router } from "expo-router";
import { ChevronDown, Eye, EyeOff, Globe } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { useLoginMutation } from "@/api/auth";
import { toast } from "sonner-native";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useLoginMutation();

  const orange = useColor("orange");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const border = useColor("border");

  const handleLogin = () => {
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          toast.success("Logged in successfully");
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
      }
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}
    >
      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Header - Globe Icon */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name={Globe} size={20} />
          <Text style={{ fontWeight: "600", fontSize: 12 }}>EN</Text>
          <Icon name={ChevronDown} size={16} />
        </View>

        {/* Logo */}
        <View style={{ alignItems: "center", marginTop: 30, marginBottom: 30 }}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 200, height: 100 }}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Text
            variant="title"
            style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}
          >
            Welcome
          </Text>
          <Text style={{ color: muted, textAlign: "center" }}>
            Sign in to reconnect with your community.
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

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Password</Text>
            <Input
              placeholder="password"
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
                  Forgot Password?
                </Text>
              </Pressable>
            </Link>
          </View>

          <Button
            style={{ marginTop: 8 }}
            onPress={handleLogin}
            disabled={login.isPending}
          >
            Log In
          </Button>
        </View>

        {/* Footer */}
        <View style={{ alignItems: "center", marginTop: 24 }}>
          <Text>
            Don't have an account?{" "}
            <Text
              style={{ color: orange }}
              onPress={() => router.push("/(auth)/signup")}
            >
              Sign Up
            </Text>
          </Text>
        </View>

        {/* Social Login */}
        <View style={{ marginTop: 40, alignItems: "center" }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 24,
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
