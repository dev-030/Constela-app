import { OnboardingProvider } from "@/providers/onboarding-context";
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="basics" options={{ headerShown: false }} />
        <Stack.Screen name="lifestyle" options={{ headerShown: false }} />
        <Stack.Screen name="habits" options={{ headerShown: false }} />
        <Stack.Screen name="qualities" options={{ headerShown: false }} />
        <Stack.Screen name="interests" options={{ headerShown: false }} />
        <Stack.Screen name="emotional" options={{ headerShown: false }} />
        <Stack.Screen name="verification-prompt" options={{ headerShown: false }} />
        <Stack.Screen name="face-verification" options={{ headerShown: false }} />
      </Stack>
    </OnboardingProvider>
  );
}

