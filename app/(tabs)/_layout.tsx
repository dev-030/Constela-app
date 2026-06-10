import { Platform } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import MaterialIcons from '@expo/vector-icons/Feather';
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const red = useColor('red');
  const primary = useColor('primary');
  const foreground = useColor('foreground');
  const secondary = useColor('secondary');

  return (
    <NativeTabs
      minimizeBehavior='onScrollDown'
      labelStyle={{
        default: { color: primary },
        selected: { color: secondary },
      }}
      iconColor={{
        default: primary,
        selected: secondary,
      }}
      badgeBackgroundColor={red}
      labelVisibilityMode='labeled'
      disableTransparentOnScrollEdge={true}
    >
      <NativeTabs.Trigger name='index'>
        {Platform.select({
          ios: <Icon sf='house.fill' />,
          android: (
            <Icon src={<VectorIcon family={MaterialIcons} name='home' />} />
          ),
        })}
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='matches'>
        {Platform.select({
          ios: <Icon sf='heart.fill' />,
          android: (
            <Icon src={<VectorIcon family={MaterialIcons} name='favorite' />} />
          ),
        })}
        <Label>Matches</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='friends'>
        {Platform.select({
          ios: <Icon sf='person.2.fill' />,
          android: (
            <Icon src={<VectorIcon family={MaterialIcons} name='users' />} />
          ),
        })}
        <Label>Friends</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='community'>
        {Platform.select({
          ios: <Icon sf='person.3.fill' />,
          android: (
            <Icon src={<VectorIcon family={MaterialIcons} name='users' />} />
          ),
        })}
        <Label>Community</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='messages'>
        {Platform.select({
          ios: <Icon sf='message.fill' />,
          android: (
            <Icon src={<VectorIcon family={MaterialIcons} name='message' />} />
          ),
        })}
        <Label>Messages</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
