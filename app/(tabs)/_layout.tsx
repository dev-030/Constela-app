import React, { useEffect } from 'react';
import { AppState, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs, useSegments } from 'expo-router';
import { useThreadsQuery } from '@/api/messages';
import { useProfileStore } from '@/store/profileStore';
import { initializePurchases, syncSubscription } from '@/api/purchases';
import Purchases from 'react-native-purchases';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const primary = useColor('primary');
  const inactiveColor = useColor('tabIconDefault');
  const background = useColor('background');
  const border = useColor('border');
  const isDark = useColorScheme() === 'dark';

  const { profile, fetchProfile } = useProfileStore();
  const queryClient = useQueryClient();

  // Unread messages drive the badge on the Messages tab. Both thread lists are
  // prefetched on app start and kept fresh by the socket, so this is cheap.
  const segments = useSegments();
  const datingThreads = useThreadsQuery('dating');
  const friendsThreads = useThreadsQuery('friends');
  const unreadMessages = React.useMemo(
    () =>
      [...(datingThreads.data ?? []), ...(friendsThreads.data ?? [])].reduce(
        (total, thread) => total + (thread.unread_count ?? 0),
        0,
      ),
    [datingThreads.data, friendsThreads.data],
  );
  // Hidden while the user is actually on the Messages tab.
  const isOnMessagesScreen = (segments as string[])[1] === 'messages';

  useEffect(() => {
    if (!profile?.id) return;
    let disposed = false;
    let attached = false;
    const syncStoreChange = async () => {
      if (disposed) return;
      try {
        await syncSubscription();
        await queryClient.invalidateQueries();
      } catch {
        console.warn('[Purchases] Store change verification is temporarily unavailable.');
      }
    };
    const listener = () => { void syncStoreChange(); };
    void initializePurchases(String(profile.id)).then(() => {
      if (disposed) return;
      Purchases.addCustomerInfoUpdateListener(listener);
      attached = true;
    }).catch(() => {});
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') void fetchProfile();
    });
    return () => {
      disposed = true;
      appState.remove();
      if (attached) Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [profile?.id, fetchProfile, queryClient]);

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 18 : 12);
  const tabBarHeight = 66 + bottomInset;

  const tabLabel = (label: string, color: string, focused: boolean) => (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      numberOfLines={1}
      style={{
        color,
        fontSize: 10.5,
        fontWeight: focused ? '700' : '500',
        textAlign: 'center',
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );

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
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingTop: 8,
          paddingBottom: bottomInset,
          height: tabBarHeight,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.06,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name='home/index'
        options={{
          title: t('tabs.home', 'Home'),
          tabBarLabel: ({ color, focused }) => tabLabel(t('tabs.home', 'Home'), color, focused),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={focused ? primary : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='matches/index'
        options={{
          title: t('tabs.matches', 'Matches'),
          tabBarLabel: ({ color, focused }) => tabLabel(t('tabs.matches', 'Matches'), color, focused),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={24}
              color={focused ? primary : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='friends/index'
        options={{
          title: t('tabs.friends', 'Friends'),
          tabBarLabel: ({ color, focused }) => tabLabel(t('tabs.friends', 'Friends'), color, focused),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={24}
              color={focused ? primary : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='community/index'
        options={{
          title: t('tabs.community', 'Community'),
          tabBarLabel: ({ color, focused }) => tabLabel(t('tabs.community', 'Community'), color, focused),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'planet' : 'planet-outline'}
              size={24}
              color={focused ? primary : inactiveColor}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='messages/index'
        options={{
          title: t('tabs.messages', 'Messages'),
          tabBarLabel: ({ color, focused }) => tabLabel(t('tabs.messages', 'Messages'), color, focused),
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
              size={24}
              color={focused ? primary : inactiveColor}
            />
          ),
          // Unread badge, only while the user is somewhere else in the app.
          tabBarBadge: !isOnMessagesScreen && unreadMessages > 0
            ? unreadMessages > 9 ? '9+' : unreadMessages
            : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 9,
            fontWeight: '700',
          },
        }}
      />
    </Tabs>
  );
}
