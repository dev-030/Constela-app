import { OnboardingProvider } from "@/providers/onboarding-context";
import { Stack } from "expo-router";
import { useColor } from "@/hooks/useColor";

export default function OnboardingLayout() {
  const background = useColor("background");
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="basics" />
        <Stack.Screen name="lifestyle" />
        <Stack.Screen name="habits" />
      </Stack>
    </OnboardingProvider>
  );
}
