import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { AtSign, ChevronLeft, Info, Lock } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChangeEmailScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const secondary = useColor('secondary');

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: text,
      marginLeft: 8,
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
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: text,
      marginBottom: 8,
    },
    inputContainer: {
      marginBottom: 24,
    },
    readOnlyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#E8E8E8', // Light gray background for badge
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    readOnlyText: {
      fontSize: 12,
      color: '#555',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: -16,
    },
    infoText: {
      fontSize: 12,
      color: muted,
    },
    footer: {
      flexDirection: 'row',
      padding: 24,
      gap: 16,
    },
    discardBtn: {
      flex: 1,
      borderRadius: 24,
    },
    updateBtn: {
      flex: 1,
      backgroundColor: secondary,
      borderRadius: 24,
    }
  }), [background, text, muted, border, secondary]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Email</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Keep your account secure by ensuring your email address is up to date.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Email</Text>
          <Input
            value="alex.nd@example.com"
            disabled
            icon={AtSign}
            rightComponent={
              <View style={styles.readOnlyBadge}>
                <Icon name={Lock} size={10} color="#555" />
                <Text style={styles.readOnlyText}>Read Only</Text>
              </View>
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Email</Text>
          <Input
            placeholder="Enter your new email address"
          />
        </View>

        <View style={styles.infoContainer}>
          <Icon name={Info} size={14} color={muted} />
          <Text style={styles.infoText}>We'll send a confirmation link to this address.</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button variant="outline" style={styles.discardBtn} onPress={() => router.back()}>
          Discard
        </Button>
        <Button style={styles.updateBtn}>
          Update Email
        </Button>
      </View>
    </View>
  );
}
