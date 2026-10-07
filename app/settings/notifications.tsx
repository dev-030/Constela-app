import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ChevronLeft, Sparkles, Users } from 'lucide-react-native';
import { useMemo, useState, useEffect } from 'react';
import { Pressable, StyleSheet, View, Switch, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useProfileStore } from '@/store/profileStore';
import { apiClient } from '@/api/client';
import { useThemeContext } from '@/providers/theme-context';
import { useTranslation } from 'react-i18next';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  useAndroidBack();
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const { colorScheme } = useThemeContext();

  const { profile, setProfile } = useProfileStore();

  const [matchesEnabled, setMatchesEnabled] = useState(profile?.likes_push ?? true);
  const [friendsEnabled, setFriendsEnabled] = useState(profile?.messages_push ?? true);

  useEffect(() => {
    if (profile) {
      setMatchesEnabled(profile.likes_push ?? true);
      setFriendsEnabled(profile.messages_push ?? true);
    }
  }, [profile]);

  const updateSetting = async (field: 'likes_push' | 'messages_push', value: boolean) => {
    try {
      if (field === 'likes_push') setMatchesEnabled(value);
      if (field === 'messages_push') setFriendsEnabled(value);

      const response = await apiClient.patch('/api/profile/me/', { [field]: value });
      setProfile(response.data);
    } catch (error) {
      // Revert on error
      if (field === 'likes_push') setMatchesEnabled(!value);
      if (field === 'messages_push') setFriendsEnabled(!value);
    }
  };

  const borderColor = colorScheme === 'dark' ? '#38383A' : '#E5E5EA';

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: text,
    },
    backBtn: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 24,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: muted,
      marginBottom: 8,
      marginLeft: 4,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    section: {
      marginBottom: 16,
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderColor,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 16,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: primary + '18',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    rowTitle: {
      fontSize: 16,
      color: text,
      fontWeight: '500',
    },
    rowSubtitle: {
      fontSize: 13,
      color: muted,
      marginTop: 2,
    },
  }), [background, cardColor, text, muted, primary, borderColor]);

  const renderRow = (
    title: string,
    subtitle: string,
    icon: any,
    value: boolean,
    onValueChange: (val: boolean) => void,
  ) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          <View style={styles.iconBox}>
            <Icon name={icon} size={18} color={primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{title}</Text>
            <Text style={styles.rowSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: muted + '55', true: primary }}
          thumbColor={Platform.OS === 'android' ? (value ? '#ffffff' : '#f4f3f4') : undefined}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('settings_pages.push_notifications')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {renderRow(
            t('settings_pages.new_matches'),
            t('settings_pages.new_matches_sub'),
            Sparkles,
            matchesEnabled,
            (val) => updateSetting('likes_push', val),
          )}
        </View>

        <View style={styles.section}>
          {renderRow(
            t('settings_pages.friend_requests'),
            t('settings_pages.friend_requests_sub'),
            Users,
            friendsEnabled,
            (val) => updateSetting('messages_push', val),
          )}
        </View>
      </ScrollView>
    </View>
  );
}
