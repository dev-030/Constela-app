import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { Check, ChevronLeft, Globe } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAndroidBack } from '@/hooks/useAndroidBack';

export default function LanguageScreen() {
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    headerLeft: {
      flex: 1,
      alignItems: 'flex-start',
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerRight: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: text,
    },
    content: {
      flex: 1,
      padding: 24,
    },
    description: {
      fontSize: 16,
      color: text,
      marginBottom: 32,
      lineHeight: 24,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 12,
    },
    optionCardSelected: {
      backgroundColor: primary + '10', // lighter pink background
      borderColor: primary,
    },
    optionCardUnselected: {
      backgroundColor: cardColor,
      borderColor: border,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconSelected: {
      backgroundColor: primary + '20',
    },
    iconUnselected: {
      backgroundColor: '#F3F4F6',
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: text,
    },
    optionSubtitle: {
      fontSize: 12,
      color: muted,
      marginTop: 2,
    },
    radioSelected: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioUnselected: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#D1D5DB', // light gray border
    },
    footer: {
      flexDirection: 'row',
      padding: 24,
      gap: 16,
    },
    saveBtn: {
      flex: 1,
      backgroundColor: primary,
      borderRadius: 24,
    }
  }), [background, cardColor, text, muted, border, primary]);

  const handleSave = () => {
    i18n.changeLanguage(selectedLanguage);
    router.back();
  };

  const renderOption = (id: string, title: string, monogram: string, subtitle?: string) => {
    const isSelected = selectedLanguage === id;

    return (
      <Pressable
        onPress={() => setSelectedLanguage(id)}
        style={[styles.optionCard, isSelected ? styles.optionCardSelected : styles.optionCardUnselected]}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.iconContainer, isSelected ? styles.iconSelected : styles.iconUnselected]}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: isSelected ? primary : '#6B7280' }}>
              {monogram}
            </Text>
          </View>
          <View>
            <Text style={styles.optionTitle}>{title}</Text>
            {subtitle && <Text style={styles.optionSubtitle}>{subtitle}</Text>}
          </View>
        </View>

        {isSelected ? (
          <View style={styles.radioSelected}>
            <Icon name={Check} size={14} color="#FFF" />
          </View>
        ) : (
          <View style={styles.radioUnselected} />
        )}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Icon name={ChevronLeft} size={24} color={text} />
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{t('settings.select_language')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          {t('settings.choose_preferred')}
        </Text>

        {renderOption('en', 'English', 'EN')}
        {renderOption('fr', 'French', 'FR')}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button 
          style={styles.saveBtn} 
          onPress={handleSave}
          disabled={selectedLanguage === i18n.language}
        >
          {t('settings.save')}
        </Button>
      </View>
    </View>
  );
}
