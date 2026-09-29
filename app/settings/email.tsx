import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { AtSign, ChevronLeft, Info, Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProfileStore } from '@/store/profileStore';
import { apiClient } from '@/api/client';
import { useAndroidBack } from '@/hooks/useAndroidBack';

export default function ChangeEmailScreen() {
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const { profile, fetchProfile } = useProfileStore();

  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

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
    updateBtn: {
      flex: 1,
      backgroundColor: primary,
      borderRadius: 24,
    }
  }), [background, text, muted, border, primary]);

  const [newEmail, setNewEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);

  const handleRequestOTP = async () => {
    if (!isValidEmail) return;
    
    setIsLoading(true);
    try {
      await apiClient.post('/api/settings/request-email-change/', { new_email: newEmail });
      const submittedEmail = newEmail;
      setNewEmail("");
      router.push({ pathname: "/settings/verify-email", params: { newEmail: submittedEmail } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "An error occurred while requesting verification.";
      Alert.alert("Request Failed", errorMsg);
    } finally {
      setIsLoading(false);
    }
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
          <Text style={styles.headerTitle} numberOfLines={1}>Change Email</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Keep your account secure by ensuring your email address is up to date.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Current Email</Text>
          <Input
            value={profile?.user?.email || ""}
            disabled
            icon={AtSign}
            editable={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Email</Text>
          <Input
            placeholder="Enter your new email address"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={{ borderWidth: 1, borderColor: border, borderRadius: 12, overflow: 'hidden' }}
          />
        </View>

        <View style={styles.infoContainer}>
          <Icon name={Info} size={14} color={muted} />
          <Text style={styles.infoText}>We'll send a verification code to this address.</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Button 
          style={styles.updateBtn} 
          disabled={!isValidEmail || isLoading}
          loading={isLoading}
          onPress={handleRequestOTP}
        >
          Send Verification Code
        </Button>
      </View>
    </View>
  );
}
