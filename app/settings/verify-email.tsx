import { useMemo, useState } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { useColor } from '@/hooks/useColor';
import { InputOTP } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { apiClient } from '@/api/client';
import { useProfileStore } from '@/store/profileStore';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from 'react-i18next';

export default function VerifyEmailChangeScreen() {
  useAndroidBack();
  const { t } = useTranslation();
  const { newEmail } = useLocalSearchParams<{ newEmail: string }>();
  const insets = useSafeAreaInsets();
  const { fetchProfile } = useProfileStore();

  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
      padding: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 32,
    },
    backButton: {
      marginRight: 16,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: text,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: muted,
      lineHeight: 24,
      marginBottom: 40,
    },
    emailText: {
      color: primary,
      fontWeight: '600',
    },
    otpContainer: {
      marginBottom: 32,
    },
    resendContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
    },
    resendText: {
      color: muted,
      fontSize: 14,
    },
    resendLink: {
      color: primary,
      fontWeight: '600',
      fontSize: 14,
    }
  }), [background, text, muted, primary]);

  const handleVerify = async () => {
    if (otp.length < 4) return;
    setIsVerifying(true);
    
    try {
      await apiClient.post('/api/settings/verify-email-change/', { otp, new_email: newEmail });
      await fetchProfile(); // Refresh profile so the new email shows up
      Alert.alert(t('settings_pages.success', "Success"), t('settings_pages.email_updated_success', "Your email has been updated successfully."), [
        { text: t('settings_pages.ok', "OK"), onPress: () => router.back() }
      ]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('settings_pages.invalid_code', "Invalid verification code.");
      Alert.alert(t('settings_pages.verification_failed', "Verification Failed"), errorMsg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await apiClient.post('/api/settings/request-email-change/', { new_email: newEmail });
      Alert.alert(
        t('settings_pages.code_sent', "Code Sent"),
        t('settings_pages.code_sent_to', { email: newEmail, defaultValue: `A new verification code has been sent to ${newEmail}` })
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || t('settings_pages.failed_resend_code', "Failed to resend code.");
      Alert.alert(t('settings_pages.resend_failed', "Resend Failed"), errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Icon name={ChevronLeft} size={28} color={text} />
        </Pressable>
      </View>

      <Text style={styles.title}>{t('settings_pages.verify_email_title', 'Verify Email')}</Text>
      <Text style={styles.subtitle}>
        {t('settings_pages.verify_email_sent_to', 'We sent a verification code to')}{'\n'}
        <Text style={styles.emailText}>{newEmail}</Text>
      </Text>

      <View style={styles.otpContainer}>
        <InputOTP
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
        />
      </View>

      <Button
        onPress={handleVerify}
        loading={isVerifying}
        disabled={otp.length < 4 || isVerifying}
      >
        {t('settings_pages.verify_and_update', 'Verify and Update')}
      </Button>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>{t('settings_pages.didnt_receive_code', "Didn't receive the code? ")}</Text>
        <Pressable onPress={handleResend} disabled={isResending}>
          <Text style={[styles.resendLink, isResending && { opacity: 0.5 }]}>
            {isResending ? t('settings_pages.resending', 'Resending...') : t('settings_pages.resend', 'Resend')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
