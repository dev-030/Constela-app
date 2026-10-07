import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ban, AlertTriangle, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';

export default function ManageProfileScreen({ name }: { name?: string }) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const destructive = useColor('red');

  const [isBlocked, setIsBlocked] = useState(false);

  return (
    <View>
      {/* Block User */}
      <View style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: border }]}>
          <Icon name={Ban} size={20} color={muted} />
        </View>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: text }]}>
            {name ? t('profile_detail.block_user_name', { name, defaultValue: `Block ${name}` }) : t('chat.block_user', 'Block User')}
          </Text>
          <Text style={[styles.rowSubtitle, { color: muted }]}>
            {t('profile_detail.block_user_desc', "They won't be able to message you or see your profile.")}
          </Text>
        </View>
        <Switch
          value={isBlocked}
          onValueChange={setIsBlocked}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: border }]} />

      {/* Report User */}
      <Pressable style={styles.row}>
        <View style={[styles.iconContainer, { backgroundColor: border }]}>
          <Icon name={AlertTriangle} size={20} color={destructive} />
        </View>
        <View style={styles.rowTextCol}>
          <Text style={[styles.rowTitle, { color: destructive }]}>
            {t('profile_detail.report_user', 'Report User')}
          </Text>
          <Text style={[styles.rowSubtitle, { color: destructive }]}>
            {t('profile_detail.report_user_desc', 'Flag this profile for safety or community guideline violations.')}
          </Text>
        </View>
        <Icon name={ChevronRight} size={20} color={destructive} />
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
  },
  grabberContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D7CCC8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
});
