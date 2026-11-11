import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useKeyboardHeight } from "@/hooks/useKeyboardHeight";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { ArrowLeft } from "lucide-react-native";
import React from "react";
import { Pressable, View, ViewStyle } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LanguagePickerButton } from "@/components/LanguagePickerButton";

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
  continueLabel,
  continueDisabled = false,
  showBack = true,
  children,
  contentStyle,
  showFooter = true,
}: Props) {
  const { t } = useTranslation();
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
      {/* keyboard-controller works with Android edge-to-edge, where the window no longer resizes. */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: showBack ? "space-between" : "flex-end",
            paddingHorizontal: horizontalPadding,
            paddingVertical: size(12, 10),
          }}
        >
          {showBack ? (
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Icon name={ArrowLeft} size={22} color={useColor("text")} />
              <Text style={{ fontSize: 18, fontWeight: "600" }}>{t("common.back", "Back")}</Text>
            </Pressable>
          ) : <View />}
          <LanguagePickerButton />
        </View>

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
              {continueLabel || t("common.continue", "Continue")}
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
                  {t("common.skip", "Skip")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
