import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useColor } from '@/hooks/useColor';
import { Text } from '@/components/ui/text';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LanguageOption {
  id: string;
  title: string;
  monogram: string;
  subtitle: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: 'en', title: 'English', monogram: 'EN', subtitle: 'English (US)' },
  { id: 'fr', title: 'Français', monogram: 'FR', subtitle: 'French' },
];

interface LanguagePickerButtonProps {
  style?: any;
}

const INITIAL_TRANSLATE_Y = 400;

export function LanguagePickerButton({ style }: LanguagePickerButtonProps) {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const isDark = useColorScheme() === 'dark';
  const pillBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : '#E5E7EB';
  const iconColor = isDark ? 'rgba(255, 255, 255, 0.85)' : '#374151';
  const chevronColor = isDark ? 'rgba(255, 255, 255, 0.5)' : '#6B7280';
  const primary = useColor('primary');
  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');

  const currentLangCode = (i18n.language || 'en').slice(0, 2).toLowerCase();
  const currentLang = LANGUAGES.find((l) => l.id === currentLangCode) || LANGUAGES[0];

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(INITIAL_TRANSLATE_Y);

  const openModal = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setModalVisible(true);
    backdropOpacity.value = 0;
    translateY.value = INITIAL_TRANSLATE_Y;

    backdropOpacity.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
    translateY.value = withTiming(0, {
      duration: 260,
      easing: Easing.bezier(0.16, 1, 0.3, 1), // Apple standard modal deceleration curve (0 bounce)
    });
  };

  const closeModal = (onClosed?: () => void) => {
    backdropOpacity.value = withTiming(0, {
      duration: 180,
      easing: Easing.in(Easing.quad),
    });
    translateY.value = withTiming(
      INITIAL_TRANSLATE_Y,
      {
        duration: 200,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false);
          if (onClosed) {
            runOnJS(onClosed)();
          }
        }
      }
    );
  };

  const handleSelectLanguage = (langId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    i18n.changeLanguage(langId);
    closeModal();
  };

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <>
      {/* Top Header Pill Button */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Change language, current is ${currentLang.title}`}
        onPress={openModal}
        style={({ pressed }) => [
          styles.pillButton,
          {
            backgroundColor: pillBg,
            borderColor: pillBorder,
            opacity: pressed ? 0.75 : 1,
            transform: [{ scale: pressed ? 0.96 : 1 }],
          },
          style,
        ]}
        hitSlop={12}
      >
        <Globe size={16} color={iconColor} strokeWidth={2} />
        <Text style={[styles.pillText, { color: text }]}>{currentLang.monogram}</Text>
        <ChevronDown size={13.5} color={chevronColor} strokeWidth={2.2} />
      </Pressable>

      {/* Language Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => closeModal()}
      >
        <View style={styles.modalOverlay}>
          {/* Animated Backdrop */}
          <TouchableWithoutFeedback onPress={() => closeModal()}>
            <Animated.View style={[styles.backdropFill, animatedBackdropStyle]} />
          </TouchableWithoutFeedback>

          {/* Animated Sheet Container */}
          <Animated.View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: background,
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                paddingBottom: Math.max(insets.bottom + 16, 32),
              },
              animatedSheetStyle,
            ]}
          >
            {/* Drag Handle Indicator */}
            <View style={styles.handleContainer}>
              <View
                style={[
                  styles.handle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.2)'
                      : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              />
            </View>

            {/* Modal Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text variant="title" style={[styles.sheetTitle, { color: text }]}>
                  {t('settings.select_language', 'Select Language')}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: muted }]}>
                  {t('settings.choose_preferred', 'Choose your preferred language')}
                </Text>
              </View>
              <Pressable
                onPress={() => closeModal()}
                style={({ pressed }) => [
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
                hitSlop={10}
              >
                <X size={18} color={text} />
              </Pressable>
            </View>

            {/* Language Options */}
            <View style={styles.optionsList}>
              {LANGUAGES.map((lang) => {
                const isSelected = currentLangCode === lang.id;
                return (
                  <Pressable
                    key={lang.id}
                    onPress={() => handleSelectLanguage(lang.id)}
                    style={({ pressed }) => [
                      styles.optionCard,
                      {
                        borderColor: isSelected
                          ? primary
                          : isDark
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.08)',
                        backgroundColor: isSelected
                          ? primary + '14'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : '#FFFFFF',
                        opacity: pressed ? 0.8 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      },
                    ]}
                  >
                    <View style={styles.optionLeft}>
                      <View
                        style={[
                          styles.monogramBadge,
                          {
                            backgroundColor: isSelected
                              ? primary
                              : isDark
                              ? 'rgba(255, 255, 255, 0.08)'
                              : 'rgba(0, 0, 0, 0.05)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monogramText,
                            { color: isSelected ? '#FFFFFF' : text },
                          ]}
                        >
                          {lang.monogram}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.optionTitle,
                            {
                              color: text,
                              fontWeight: isSelected ? '700' : '600',
                            },
                          ]}
                        >
                          {lang.title}
                        </Text>
                        <Text style={[styles.optionSubtitle, { color: muted }]}>
                          {lang.subtitle}
                        </Text>
                      </View>
                    </View>

                    {/* Selected Indicator Checkmark / Radio */}
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? primary : muted + '60',
                          backgroundColor: isSelected ? primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7.5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: 14,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  monogramBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionTitle: {
    fontSize: 15.5,
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
