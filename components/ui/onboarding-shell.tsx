import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  showFooter?: boolean;
};

export function OnboardingShell({
  title,
  subtitle,
  onBack,
  onContinue,
  onSkip,
  continueLabel = "Continue",
  continueDisabled = false,
  showBack = true,
  children,
  contentStyle,
  showFooter = true,
}: Props) {
  const background = useColor("background");
  const primaryForeground = useColor("primaryForeground");
  const border = useColor("border");
  const { isKeyboardVisible } = useKeyboardHeight();
  const { horizontalPadding, isCompact, size } = useResponsiveLayout();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: background }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        {showBack && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: horizontalPadding,
              paddingVertical: size(12, 10),
            }}
          >
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon name={ArrowLeft} size={22} color={useColor("text")} />
              <Text style={{ fontSize: 18, fontWeight: "600" }}>Back</Text>
            </Pressable>
          </View>
        )}

        {/* Title block */}
        <View
          style={{ paddingHorizontal: horizontalPadding, paddingTop: 4, paddingBottom: size(16, 12) }}
        >
          <Text
            style={{
              fontSize: size(28, 24),
              fontWeight: "700",
              color: useColor("text"),
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontSize: 14,
                color: useColor("textMuted"),
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Body */}
        <View style={[{ flex: 1, paddingHorizontal: horizontalPadding }, contentStyle]}>
          {children}
        </View>

        {/* Footer */}
        {showFooter && (
          <View
            style={{
              paddingHorizontal: horizontalPadding,
              paddingTop: size(12, 10),
              paddingBottom: isKeyboardVisible ? 8 : size(20, 14),
              backgroundColor: background,
              borderTopWidth: isKeyboardVisible ? 0 : 0,
            }}
          >
            <Button
              onPress={onContinue}
              disabled={continueDisabled}
              style={{ borderRadius: 28, height: isCompact ? 48 : 52 }}
            >
              {continueLabel}
            </Button>
            {onSkip ? (
              <Pressable
                onPress={onSkip}
                style={{ alignItems: "center", paddingVertical: 14 }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: useColor("text"),
                  }}
                >
                  Skip
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
