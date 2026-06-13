import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { InputOTP } from '@/components/ui/input-otp';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

export default function OtpScreen() {
  const secondary = useColor('secondary');
  const muted = useColor('textMuted');
  const background = useColor('background');
  const primaryForeground = useColor('primaryForeground');

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, backgroundColor: background }}>
      <View style={{ flex: 1, padding: 24, paddingTop: 60 }}>
        {/* Header - Back Button & Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <Pressable onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Icon name={ArrowLeft} size={24} />
          </Pressable>
          <Text variant="title" style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>
            OTP Verification
          </Text>
        </View>

        {/* Instructions */}
        <View style={{ alignItems: 'center', marginBottom: 40, paddingHorizontal: 20 }}>
          <Text style={{ color: muted, textAlign: 'center', fontSize: 14 }}>
            Enter the 4-digit code you received via email
          </Text>
          <Text style={{ color: secondary, textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 4 }}>
            example@gmail.com
          </Text>
        </View>

        {/* Pink Envelope Icon */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: secondary,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Icon name={Mail} size={40} color={primaryForeground} />
          </View>
        </View>

        {/* OTP Input */}
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <InputOTP
            length={4}
            slotStyle={{ width: 64, height: 64, borderRadius: 12 }}
          />
        </View>

        {/* Buttons */}
        <View style={{ gap: 24, marginTop: 'auto', marginBottom: 40 }}>
          <Button
            // disabled
            // style={{ backgroundColor: muted + '33' }}
            textStyle={{ color: primaryForeground }}
            onPress={() => router.replace('/onboarding')}
          >
            Continue
          </Button>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: muted }}>
              Resend new code (22)
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
