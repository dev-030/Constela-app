import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const secondary = useColor('secondary');

  const [likesEnabled, setLikesEnabled] = useState(true);
  const [messagesEnabled, setMessagesEnabled] = useState(true);

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
      padding: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#555', // slightly darker muted
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    rowText: {
      fontSize: 16,
      color: text,
      fontWeight: '500',
    }
  }), [background, cardColor, text, muted, border, secondary]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Push Notification</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>PUSH NOTIFICATIONS</Text>

        <View style={styles.card}>
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowText}>Likes</Text>
            <Switch
              value={likesEnabled}
              onValueChange={setLikesEnabled}
              trackColor={{ false: muted + '55', true: secondary }}
            />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowText}>New Messages</Text>
            <Switch
              value={messagesEnabled}
              onValueChange={setMessagesEnabled}
              trackColor={{ false: muted + '55', true: secondary }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
