import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ChevronLeft, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChangePasswordMutation } from '@/api/settings';

const MIN_PASSWORD_LENGTH = 8;

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();

  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const secondary = useColor('secondary');

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
    },
    scrollContent: {
      padding: 24,
      alignItems: 'center',
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#E0F2F1',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: text,
      marginBottom: 8,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      color: muted,
      textAlign: 'center',
      marginBottom: 32,
      paddingHorizontal: 16,
      lineHeight: 20,
    },
    card: {
      width: '100%',
      backgroundColor: cardColor,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    label: {
      fontSize: 12,
      fontWeight: '700',
      color: text,
      marginBottom: 8,
    },
    inputContainer: {
      marginBottom: 20,
    },
    saveBtn: {
      backgroundColor: secondary,
      borderRadius: 12,
      marginTop: 8,
    },
  }), [background, cardColor, text, muted, border, secondary]);

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
      Alert.alert('Check your input', validationError);
      return;
    }

    changePassword.mutate(
      { current_password: current, new_password: next },
      {
        onSuccess: () => {
          Alert.alert(
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
          Alert.alert('Couldn\u2019t change password', message);
        },
      }
    );
  };

  const isBusy = changePassword.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <Icon name={Lock} size={32} color="#00897B" />
        </View>

        <Text style={styles.title}>Protect Your Account</Text>
        <Text style={styles.description}>
          Keep your Constela account secure by updating your password regularly.
        </Text>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <Input
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              value={current}
              onChangeText={setCurrent}
              editable={!isBusy}
              rightComponent={
                <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={10}>
                  <Icon name={showCurrent ? EyeOff : Eye} size={20} color={muted} />
                </Pressable>
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <Input
              placeholder="Enter new password"
              secureTextEntry={!showNew}
              value={next}
              onChangeText={setNext}
              editable={!isBusy}
              rightComponent={
                <Pressable onPress={() => setShowNew(!showNew)} hitSlop={10}>
                  <Icon name={showNew ? EyeOff : Eye} size={20} color={muted} />
                </Pressable>
              }
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <Input
              placeholder="Re-type new password"
              secureTextEntry={!showConfirm}
              value={confirm}
              onChangeText={setConfirm}
              editable={!isBusy}
              rightComponent={
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={10}>
                  <Icon name={showConfirm ? EyeOff : Eye} size={20} color={muted} />
                </Pressable>
              }
            />
          </View>

          <Button
            style={styles.saveBtn}
            onPress={handleSave}
            loading={isBusy}
            disabled={isBusy}
          >
            Save New Password
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}