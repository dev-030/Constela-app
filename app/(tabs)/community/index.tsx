import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { View } from 'react-native';

export default function CommunityScreen() {
  const background = useColor('background');
  return (
    <View style={{ flex: 1, backgroundColor: background, justifyContent: 'center', alignItems: 'center' }}>
      <Text variant="title">Community</Text>
      <Text style={{ color: useColor('textMuted') }}>Coming soon</Text>
    </View>
  );
}
