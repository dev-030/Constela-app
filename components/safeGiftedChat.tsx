
import { useSafeAreaWithKeyboard } from "@/hooks/useSafeAreaKeyboard";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SafeGiftedChatProps = React.ComponentProps<typeof GiftedChat>;

/**
 * Wrapper around GiftedChat that handles Android navigation gesture bar properly
 */
export function SafeGiftedChat(props: SafeGiftedChatProps) {
  const insets = useSafeAreaInsets();
  const { buttonContainerPaddingBottom } = useSafeAreaWithKeyboard();

  // Calculate proper keyboard offset accounting for tab bar and safe areas
  const tabbarHeight = 0;
  const keyboardTopToolbarHeight = Platform.select({ ios: 40, default: 0 });
  const keyboardVerticalOffset = Platform.select({
    ios: insets.bottom + tabbarHeight + keyboardTopToolbarHeight,
    android: 50, // Android handles this differently
  }) || 0;

  const renderInputToolbar = (toolbarProps: any) => {
    // Use custom input toolbar if provided, otherwise use default with safe area padding
    if (props.renderInputToolbar) {
      return (props.renderInputToolbar as any)(toolbarProps);
    }

    return (
      <InputToolbar
        {...toolbarProps}
        containerStyle={[
          styles.defaultInputToolbar,
          {
            paddingBottom: Platform.OS === 'android'
              ? buttonContainerPaddingBottom
              : insets.bottom + 8,
          },
        ]}
        primaryStyle={{
          alignItems: "center",
          paddingHorizontal: 8,
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <GiftedChat
        {...props}
        keyboardAvoidingViewProps={{
          keyboardVerticalOffset,
          behavior: (Platform.OS === 'ios' ? 'padding' : 'height') as any,
          ...props.keyboardAvoidingViewProps,
        }}
        renderInputToolbar={renderInputToolbar}
        minInputToolbarHeight={
          Platform.OS === 'android'
            ? (props.minInputToolbarHeight || 60) + buttonContainerPaddingBottom
            : props.minInputToolbarHeight || 60
        }
        // @ts-ignore - bottomOffset exists but not in types
        bottomOffset={
          Platform.OS === 'android'
            ? buttonContainerPaddingBottom
            : (props as any).bottomOffset || 0
        }
        // @ts-ignore - keyboardShouldPersistTaps exists but not in types
        keyboardShouldPersistTaps={(props as any).keyboardShouldPersistTaps || "never"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
   //  backgroundColor: COLORS.white,
  },
  defaultInputToolbar: {
   //  backgroundColor: COLORS.inputbg,
    borderTopWidth: 1,
   //  borderTopColor: COLORS.borderColor,
    paddingHorizontal: 8,
    paddingTop: 8,
    minHeight: 60,
  },
});
