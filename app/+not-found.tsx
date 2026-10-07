import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Link } from '@/components/ui/link';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('common.not_found_title', 'Oops!') }} />
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Text>{t('common.not_found_desc', 'This screen does not exist.')}</Text>
        <Link href='/'>{t('common.go_home', 'Go to home screen!')}</Link>
      </View>
    </>
  );
}
