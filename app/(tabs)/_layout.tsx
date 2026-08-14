import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import MaterialIcons from '@expo/vector-icons/Feather';
import { Tabs } from 'expo-router';
import { useProfileStore } from '@/store/profileStore';
import { initializePurchases } from '@/api/purchases';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const primary = useColor('primary');
  const inactiveColor = useColor('tabIconDefault');
  const background = useColor('background');
  const border = useColor('border');

  const { profile } = useProfileStore();

  useEffect(() => {
    if (profile?.id) {
      initializePurchases(String(profile.id));
    }
  }, [profile?.id]);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10);
  const tabBarHeight = 58 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: inactiveColor,
        sceneStyle: { backgroundColor: background },
        tabBarStyle: {
          backgroundColor: background,
          borderColor: border,
          borderWidth: 0.5,
          borderBottomWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: bottomInset,
          height: tabBarHeight,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name='home/index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name='matches/index'
        options={{
          title: 'Matches',
          tabBarIcon: ({ color }) => <MaterialIcons name="heart" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name='friends/index'
        options={{
          title: 'Friends',
          tabBarIcon: ({ color }) => <MaterialIcons name="users" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name='community/index'
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <MaterialIcons name="users" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name='messages/index'
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <MaterialIcons name="message-square" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
