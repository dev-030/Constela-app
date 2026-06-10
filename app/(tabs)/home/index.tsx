import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';
import { router } from 'expo-router';
import { Clock, Heart, MessageCircle, User, PlayCircle, Search, Coffee, Users, MessageSquare, BookOpen, Sliders, Bell } from 'lucide-react-native';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const secondary = useColor('secondary');
  const muted = useColor('textMuted');

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {/* Custom Header */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: insets.top + 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: useColor('border')
      }}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 60, height: 40 }}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Icon name={Bell} size={24} />
          <Pressable onPress={() => router.push('/drawer')}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: muted, overflow: 'hidden' }}>
              <Image
                source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: '#34C759',
              borderWidth: 2,
              borderColor: background
            }} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Donation Banner */}
        <View style={{
          backgroundColor: '#FFF0F5',
          borderRadius: BORDER_RADIUS,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: '#FFD1E3'
        }}>
          <Icon name={Heart} size={16} color={secondary} />
          <Text style={{ color: secondary, fontSize: 12, fontWeight: '500' }}>
            5% of our benefits are donated to charitable organizations
          </Text>
        </View>

        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="title" style={{ fontSize: 24, fontWeight: 'bold' }}>Hello Alex</Text>
          <Text style={{ color: muted }}>What would you like to do today?</Text>
        </View>

        {/* Meet Card */}
        <View style={{
          backgroundColor: '#FFF5F8',
          borderRadius: 24,
          padding: 24,
          marginBottom: 16,
          flexDirection: 'row',
          overflow: 'hidden'
        }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <View style={{ backgroundColor: secondary, borderRadius: 16, padding: 4 }}>
                <Icon name={Heart} size={20} color="#FFF" />
              </View>
              <Text style={{ fontSize: 28, fontWeight: 'bold' }}>Meet</Text>
            </View>
            <Text style={{ color: muted, marginBottom: 16, fontSize: 14 }}>Find a connection that fits you.</Text>

            <View style={{ gap: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={User} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Compatible profiles</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={Sliders} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Sensory filters</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={Clock} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Respect your pace</Text>
              </View>
            </View>

            <Button variant="secondary" style={{ height: 40, paddingHorizontal: 16, alignSelf: 'flex-start', borderRadius: 20 }}>
              Matches Now
            </Button>
          </View>

          {/* Card Preview Image (Mock) */}
          <View style={{ width: 140, height: 200, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} style={{ width: '100%', height: '100%' }} />
            <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#FFF', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
               <Icon name={Heart} size={16} color={secondary} />
            </View>
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.5)' }}>
               <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Sam, 28</Text>
               <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                 <View style={{ backgroundColor: '#FFD60A', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 }}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Introvert</Text></View>
                 <View style={{ backgroundColor: '#FFD60A', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 }}><Text style={{ fontSize: 8, fontWeight: 'bold' }}>Honest</Text></View>
               </View>
            </View>
          </View>
        </View>

        {/* Friends Card */}
        <View style={{
          backgroundColor: '#E8F5E9',
          borderRadius: 24,
          padding: 24,
          marginBottom: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#059669', borderRadius: 24, padding: 12 }}>
              <Icon name={User} size={24} color="#FFF" />
            </View>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>Friends</Text>
          <Text style={{ color: muted, marginBottom: 16 }}>Build genuine friendships and feel welcome.</Text>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, gap: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={Search} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Find friends</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={PlayCircle} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Shared activities</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={MessageCircle} size={16} color="#004D40" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#004D40' }}>Safe conversations</Text>
              </View>

              <Button style={{ backgroundColor: '#059669', height: 40, paddingHorizontal: 24, alignSelf: 'flex-start', borderRadius: 20, marginTop: 16 }}>
                Explore
              </Button>
            </View>

            <View style={{ width: 140, height: 140, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: '#E0F2F1', justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ color: '#00897B', fontWeight: 'bold', fontSize: 18 }}>Friends</Text>
                 <Icon name={Coffee} size={40} color="#00897B" style={{ marginTop: 16 }} />
              </View>
            </View>
          </View>
        </View>

        {/* Community Card */}
        <View style={{
          backgroundColor: '#F3E5F5',
          borderRadius: 24,
          padding: 24,
          marginBottom: 16
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ backgroundColor: '#1A237E', borderRadius: 24, padding: 12 }}>
              <Icon name={Users} size={24} color="#FFF" />
            </View>
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>Community</Text>
          <Text style={{ color: muted, marginBottom: 16 }}>Build genuine friendships and feel welcome.</Text>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, gap: 12, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={MessageSquare} size={16} color="#1A237E" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1A237E' }}>Forums & discussions</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={BookOpen} size={16} color="#1A237E" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1A237E' }}>Resources & advice</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name={Users} size={16} color="#1A237E" />
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#1A237E' }}>Events & groups</Text>
              </View>

              <Button style={{ backgroundColor: '#1A237E', height: 40, paddingHorizontal: 24, alignSelf: 'flex-start', borderRadius: 20, marginTop: 16 }}>
                Explore
              </Button>
            </View>

            <View style={{ width: 140, height: 140, backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden' }}>
              <View style={{ flex: 1, backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center' }}>
                 <Text style={{ color: '#3F51B5', fontWeight: 'bold', fontSize: 18 }}>Friends</Text>
                 <Icon name={Coffee} size={40} color="#3F51B5" style={{ marginTop: 16 }} />
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}
