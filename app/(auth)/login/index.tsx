import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { Link, router } from "expo-router";
import { ChevronDown, Eye, EyeOff, Globe } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

export default function LoginScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const orange = useColor("orange");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const border = useColor("border");

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
            <Input placeholder="e.g. alex@example.com" variant="outline" />
          </View>

          <View style={{ gap: 8 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>Password</Text>
            <Input
              placeholder="password"
              secureTextEntry={!showPassword}
              variant="outline"
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
            <Link href="/(auth)/otp" asChild>
              <Pressable>
                <Text style={{ color: orange, fontSize: 14 }}>
                  Forgot Password?
                </Text>
              </Pressable>
            </Link>
          </View>

          <Button
            style={{ marginTop: 8 }}
            onPress={() => router.replace("/(auth)/otp")}
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
