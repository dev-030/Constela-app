import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { Eye, EyeOff, Square, CheckSquare } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, View, Platform, Modal, TouchableOpacity, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSignUpMutation, useGoogleAuthMutation } from "@/api/auth";
import { toast } from "sonner-native";
import { FontAwesome } from "@expo/vector-icons";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";
import { WebView } from 'react-native-webview';

const SNAP_POINTS = [0.55, 0.9];

const CheckboxRow = ({ value, onValueChange, children }: any) => {
  const orange = useColor("orange");
  const muted = useColor("textMuted");
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 }}
    >
      <View style={{ paddingTop: 2 }}>
        <Icon name={value ? CheckSquare : Square} size={20} color={value ? orange : muted} />
      </View>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </Pressable>
  );
};

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeNeuro, setAgreeNeuro] = useState(false);
  const [agreeBiometric, setAgreeBiometric] = useState(false);
  const [pendingAction, setPendingAction] = useState<"signup" | "google" | null>(null);
  const [webViewUrl, setWebViewUrl] = useState<string | null>(null);
  
  const bottomSheet = useBottomSheet();

  const signup = useSignUpMutation();
  const googleAuth = useGoogleAuthMutation();

  const orange = useColor("orange");
  const muted = useColor("textMuted");
  const background = useColor("background");
  const border = useColor("border");

  const handleGoogleSignIn = async () => {
    Keyboard.dismiss();
    if (!agreeTerms || !agreeNeuro || !agreeBiometric) {
      setPendingAction("google");
      bottomSheet.open();
      return;
    }

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn() as any;

      if (userInfo.type === 'cancelled') {
        return;
      }
      
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        toast.error("Google Sign-In failed: No ID Token returned");
        return;
      }

      toast.info("Verifying Google Sign-In...");
      googleAuth.mutate(
        { id_token: idToken },
        {
          onSuccess: () => {
            toast.success("Signed in with Google");
            router.replace("/");
          },
          onError: (err: any) => {
            const errMsg = err?.response?.data?.error || err?.message || "Google Sign-In failed";
            toast.error(errMsg);
          },
        }
      );
    } catch (error: any) {
      if (error.code === 'SIGN_IN_CANCELLED') {
        // user cancelled the login flow
      } else if (error.code === 'IN_PROGRESS') {
        // operation (e.g. sign in) is in progress already
        toast.error("Sign-in in progress");
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        // play services not available or outdated
        toast.error("Play services not available");
      } else {
        // some other error happened
        toast.error(error.message || "Unknown error during Google Sign-In");
      }
    }
  };

  const handleSignup = () => {
    Keyboard.dismiss();
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreeTerms || !agreeNeuro || !agreeBiometric) {
      setPendingAction("signup");
      bottomSheet.open();
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

  const processPendingAction = () => {
    if (!agreeTerms || !agreeNeuro || !agreeBiometric) {
      toast.error("Please agree to all mandatory consents to proceed");
      return;
    }
    bottomSheet.close();
    
    setTimeout(() => {
      if (pendingAction === "google") {
        handleGoogleSignIn();
      } else if (pendingAction === "signup") {
        handleSignup();
      }
    }, 300);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24, paddingTop: 10 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={60}
      >
        {/* Header - Globe Icon */}

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 280, height: 140 }}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
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
        <View style={{ gap: 10 }}>
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
            loading={signup.isPending}
          >
            Sign Up
          </Button>
        </View>

        {/* Footer */}
        <View style={{ alignItems: "center", marginTop: 12 }}>
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
        <View style={{ marginTop: 16, alignItems: "center" }}>
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
            <Button variant="outline" style={{ flex: 1, height: 50, gap: 10 }} onPress={handleGoogleSignIn} disabled={googleAuth.isPending} loading={googleAuth.isPending}>
              <GoogleIcon width={20} height={20} />
              <Text style={{ fontWeight: "600" }}>Continue with Google</Text>
            </Button>
            {Platform.OS === "ios" && (
              <Button variant="outline" style={{ flex: 1, height: 50, gap: 10 }}>
                <FontAwesome name="apple" size={22} color={muted} />
                <Text style={{ fontWeight: "600" }}>Apple</Text>
              </Button>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      <BottomSheet isVisible={bottomSheet.isVisible} onClose={bottomSheet.close} snapPoints={SNAP_POINTS}>
        <View style={{ gap: 16, marginTop: 8 }}>
          <CheckboxRow value={agreeTerms} onValueChange={setAgreeTerms}>
            <Text style={{ fontSize: 13, lineHeight: 18, color: muted }}>
              I am 18 years or older and I agree to the <Text style={{ color: orange, fontWeight: "bold" }} onPress={() => setWebViewUrl('https://constela-dating.com/privacy')}>Terms of Service and Privacy Policy</Text>.
            </Text>
          </CheckboxRow>

          <CheckboxRow value={agreeNeuro} onValueChange={setAgreeNeuro}>
            <Text style={{ fontSize: 13, lineHeight: 18, color: muted }}>
              I explicitly consent to Constela processing my neurodivergent traits, sensory preferences, and emotional profile to provide tailored matching suggestions. (You can update these traits or withdraw your consent at any time in your profile settings).
            </Text>
          </CheckboxRow>

          <CheckboxRow value={agreeBiometric} onValueChange={setAgreeBiometric}>
            <Text style={{ fontSize: 13, lineHeight: 18, color: muted }}>
              I consent to the biometric processing of my face images solely to verify the authenticity of my account. I understand that these verification frames are permanently deleted immediately after the check is complete.
            </Text>
          </CheckboxRow>

          <Button 
            onPress={processPendingAction} 
            disabled={!agreeTerms || !agreeNeuro || !agreeBiometric}
            style={{ marginTop: 12, marginBottom: 24 }}
          >
            Accept & Continue
          </Button>
        </View>
      </BottomSheet>

      <Modal visible={!!webViewUrl} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setWebViewUrl(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
            <TouchableOpacity onPress={() => setWebViewUrl(null)}>
              <Text style={{ color: orange, fontWeight: 'bold', fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>
          {webViewUrl && <WebView source={{ uri: webViewUrl }} style={{ flex: 1 }} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
