import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { Check, ChevronLeft, Globe } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const secondary = useColor('secondary');

  const [selectedLanguage, setSelectedLanguage] = useState('en');

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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: text,
      marginLeft: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: text,
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: '#4A5568', // distinct muted color for readability
      marginBottom: 32,
      lineHeight: 24,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 16,
    },
    optionCardSelected: {
      backgroundColor: secondary + '15', // light pink background
      borderColor: secondary,
    },
    optionCardUnselected: {
      backgroundColor: cardColor,
      borderColor: border,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconSelected: {
      backgroundColor: secondary + '33', // slightly darker pink background for icon
    },
    iconUnselected: {
      backgroundColor: '#F5F5F5',
    },
    optionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
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
      backgroundColor: secondary,
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
      padding: 24,
    },
    saveBtn: {
      backgroundColor: secondary,
      borderRadius: 12,
    }
  }), [background, cardColor, text, muted, border, secondary]);

  const renderOption = (id: string, title: string, subtitle?: string) => {
    const isSelected = selectedLanguage === id;

    return (
      <Pressable
        style={[styles.optionCard, isSelected ? styles.optionCardSelected : styles.optionCardUnselected]}
        onPress={() => setSelectedLanguage(id)}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.iconContainer, isSelected ? styles.iconSelected : styles.iconUnselected]}>
            <Icon name={Globe} size={20} color={isSelected ? secondary : '#718096'} />
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
        <Pressable onPress={() => router.back()} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Icon name={ChevronLeft} size={24} color={text} />
          <Text style={styles.headerTitle}>Back</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Language</Text>
        <Text style={styles.description}>
          Choose your preferred language for the Constela app interface.
        </Text>

        {renderOption('en', 'English', 'System default')}
        {renderOption('fr', 'French')}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button style={styles.saveBtn}>
          Save
        </Button>
      </View>
    </View>
  );
}
