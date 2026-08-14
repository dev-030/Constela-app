import { CreditCard, Heart, LogOut, Moon, Settings, User } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { router } from 'expo-router';
import { Avatar } from '@/components/ui/avatar';
import { Pressable, View, Switch, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useProfileStore } from '@/store/profileStore';
import { useLogout } from '@/api/auth';
import { useAndroidBack } from '@/hooks/useAndroidBack';

const { width, height } = Dimensions.get('window');

export default function DrawerScreen() {
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor('background');
  const secondary = useColor('secondary');
  const muted = useColor('textMuted');
  const text = useColor('text');
  const border = useColor('border');
  const destructive = useColor('red');
  
  const [needBreak, setNeedBreak] = useState(false);
  const { profile, fetchProfile } = useProfileStore();
  const logout = useLogout();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Dim Overlay - Tap to close */}
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onPress={() => router.back()}
      />
      
      {/* Drawer Content */}
      <View style={{ 
        width: Math.min(width * 0.8, 320), 
        backgroundColor: background, 
        height: '100%',
        paddingTop: insets.top + 20,
        paddingBottom: insets.bottom + 20,
        paddingHorizontal: 24,
      }}>
        {/* Profile Info */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ 
            width: 90, 
            height: 90, 
            borderRadius: 45, 
            borderWidth: 3, 
            borderColor: '#5AC8FA', // Teal ring
            padding: 2,
            marginBottom: 16,
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Avatar uri={profile?.photos?.[0]?.image} size={80} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{profile?.username || 'Loading...'}</Text>
          <Text style={{ color: '#004D40', fontSize: 12, fontWeight: '600', marginTop: 4 }}>{profile?.neurotype_labels?.join(' & ') || ''}</Text>
        </View>

        {/* Need a break toggle */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name={Moon} size={20} color="#00897B" />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#002B36' }}>Need a break?</Text>
          </View>
          <Switch 
            value={needBreak} 
            onValueChange={setNeedBreak}
            trackColor={{ false: muted + '55', true: secondary }}
          />
        </View>

        <View style={{ height: 1, backgroundColor: border, marginBottom: 24 }} />

        {/* Menu Items */}
        <View style={{ gap: 8 }}>
          {/* Profile (Active) */}
          <Pressable 
            onPress={() => {
              router.push('/profile');
            }}
            style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            gap: 16, 
            backgroundColor: secondary, 
            padding: 16, 
            borderRadius: 24 
          }}>
            <Icon name={User} size={20} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '500' }}>Profile</Text>
          </Pressable>

          {/* Likes */}
          <Pressable 
            onPress={() => router.push('/settings/likes')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 16, 
              padding: 16 
            }}
          >
            <Icon name={Heart} size={20} color={text} />
            <Text style={{ color: text, fontSize: 16 }}>Likes</Text>
          </Pressable>

          {/* Subscription */}
          <Pressable 
            onPress={() => router.push('/settings/subscription')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 16, 
              padding: 16 
            }}
          >
            <Icon name={CreditCard} size={20} color={text} />
            <Text style={{ color: text, fontSize: 16 }}>Subscription</Text>
          </Pressable>

          {/* Settings */}
          <Pressable 
            onPress={() => router.push('/settings')}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 16, 
              padding: 16 
            }}
          >
            <Icon name={Settings} size={20} color={text} />
            <Text style={{ color: text, fontSize: 16 }}>Settings</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* Logout */}
        <Pressable 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}
          onPress={async () => {
            await logout();
            router.replace('/(auth)/login');
          }}
        >
          <Icon name={LogOut} size={20} color={destructive} />
          <Text style={{ color: destructive, fontSize: 16, fontWeight: 'bold' }}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}
