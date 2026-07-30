import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useColor } from '@/hooks/useColor';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import MaterialIcons from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import {
  Badge,
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from 'expo-router/unstable-native-tabs';
import { useProfileStore } from '@/store/profileStore';
import { initializePurchases } from '@/api/purchases';

export default function TabsLayout() {
  const red = useColor('red');
  const primary = useColor('primary');
  const inactiveColor = useColor('tabIconDefault');
  const activeColor = useColor('tabIconSelected');
  const background = useColor('background');
  const border = useColor('border');

  const { profile } = useProfileStore();

  // Initialize RevenueCat once we know the user's ID
  useEffect(() => {
    if (profile?.id) {
      initializePurchases(String(profile.id));
    }
  }, [profile?.id]);

  if (Platform.OS !== 'ios') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: background,
            borderTopColor: border,
          },
        }}
      >
        <Tabs.Screen
          name='home/index'
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name='matches/index'
          options={{
            title: 'Matches',
            tabBarIcon: ({ color }) => <MaterialIcons name="heart" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name='friends/index'
          options={{
            title: 'Friends',
            tabBarIcon: ({ color }) => <MaterialIcons name="users" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name='community/index'
          options={{
            title: 'Community',
            tabBarIcon: ({ color }) => <MaterialIcons name="users" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name='messages/index'
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <MaterialIcons name="message-square" size={24} color={color} />,
          }}
        />
      </Tabs>
    );
  }

  return (
    <NativeTabs
      minimizeBehavior='onScrollDown'
      labelStyle={{
        default: { color: inactiveColor },
        selected: { color: primary },
      }}
      iconColor={{
        default: inactiveColor,
        selected: primary,
      }}
      badgeBackgroundColor={red}
      labelVisibilityMode='labeled'
      disableTransparentOnScrollEdge={true}
    >
      <NativeTabs.Trigger name='home/index'>
        <Icon sf='house.fill' />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='matches/index'>
        <Icon sf='heart.fill' />
        <Label>Matches</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='friends/index'>
        <Icon sf='person.2.fill' />
        <Label>Friends</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='community/index'>
        <Icon sf='person.3.fill' />
        <Label>Community</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name='messages/index'>
        <Icon sf='message.fill' />
        <Label>Messages</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
