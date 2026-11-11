import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChangePasswordMutation } from '@/api/settings';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from 'react-i18next';
import { showAlert } from "@/components/ui/app-alert";

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen() {
  const { t } = useTranslation();
  useAndroidBack();
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const changePassword = useChangePasswordMutation();

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
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: text,
      marginBottom: 8,
    },
    inputContainer: {
      marginBottom: 24,
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
    },
  }), [background, text, muted, border, primary]);

  const validate = (): string | null => {
    if (!current) {
      return 'Please enter your current password.';
    }
    if (!next || next.length < MIN_PASSWORD_LENGTH) {
      return `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (next !== confirm) {
      return 'New password and confirmation do not match.';
    }
    if (next === current) {
      return 'New password must be different from the current one.';
    }
    return null;
  };

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      showAlert('Check your input', validationError);
      return;
    }

    changePassword.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          showAlert(
            'Password updated',
            'Your password has been changed successfully.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          setCurrent('');
          setNext('');
          setConfirm('');
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            'We couldn\u2019t change your password. Please try again.';
          showAlert('Couldn\u2019t change password', message);
        },
      }
    );
  };

  const isBusy = changePassword.isPending;
  const isFormValid = current.length > 0 && next.length > 0 && confirm.length > 0 && next === confirm;

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
          <Text style={styles.headerTitle} numberOfLines={1}>{t('settings_pages.change_password')}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Keep your account secure by updating your password regularly.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('settings_pages.current_password')}</Text>
          <Input
            placeholder="Enter current password"
            secureTextEntry={!showCurrent}
            value={current}
            onChangeText={setCurrent}
            editable={!isBusy}
            containerStyle={{ borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}
            rightComponent={
              <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={10}>
                <Icon name={showCurrent ? EyeOff : Eye} size={20} color={muted} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('settings_pages.new_password')}</Text>
          <Input
            placeholder="Enter new password"
            secureTextEntry={!showNew}
            value={next}
            onChangeText={setNext}
            editable={!isBusy}
            containerStyle={{ borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}
            rightComponent={
              <Pressable onPress={() => setShowNew(!showNew)} hitSlop={10}>
                <Icon name={showNew ? EyeOff : Eye} size={20} color={muted} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('settings_pages.confirm_password')}</Text>
          <Input
            placeholder="Re-type new password"
            secureTextEntry={!showConfirm}
            value={confirm}
            onChangeText={setConfirm}
            editable={!isBusy}
            containerStyle={{ borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}
            rightComponent={
              <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={10}>
                <Icon name={showConfirm ? EyeOff : Eye} size={20} color={muted} />
              </Pressable>
            }
          />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button
          style={styles.saveBtn}
          onPress={handleSave}
          loading={isBusy}
          disabled={isBusy || !isFormValid}
        >
          {t('edit_profile.save_changes')}
        </Button>
      </View>
    </View>
  );
}