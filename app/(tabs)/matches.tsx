import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Heart, RotateCcw, Sliders, Star, User, X } from 'lucide-react-native';

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const secondary = useColor('secondary');
  const muted = useColor('textMuted');
  const text = useColor('text');
  
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
        {/* Greeting & Badges */}
        <View style={{ marginBottom: 24 }}>
          <Text variant="title" style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Hello Alex</Text>
          
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ backgroundColor: secondary, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name={User} size={20} color="#FFF" />
              </View>
              <Text style={{ fontSize: 12, color: muted, flexShrink: 1 }}>Perfect Match Analysis</Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{ backgroundColor: '#059669', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name={Star} size={20} color="#FFF" />
              </View>
              <Text style={{ fontSize: 12, color: muted, flexShrink: 1 }}>Premium Membership</Text>
            </View>
          </View>
        </View>

        {/* Filters Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Find Your Perfect Match by Filters</Text>
          <Icon name={Sliders} size={20} />
        </View>

        {/* Card Stack Area */}
        <View style={{ 
          backgroundColor: '#F9ECEE', 
          borderRadius: 32, 
          padding: 16, 
          paddingTop: 32,
          alignItems: 'center',
          height: 480
        }}>
          
          {/* Top Badge */}
          <View style={{ backgroundColor: secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, zIndex: 10, position: 'absolute', top: -16 }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>YOUR PERFECT MATCH</Text>
          </View>
          
          <View style={{ position: 'absolute', right: 16, top: 16, backgroundColor: '#FFF', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
            <Icon name={RotateCcw} size={16} color={text} />
          </View>

          {/* Cards container to simulate stack */}
          <View style={{ width: '100%', height: 300, alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Background Card Left */}
            <View style={{ position: 'absolute', width: '80%', height: 280, backgroundColor: '#FFF', borderRadius: 24, left: 10, transform: [{ rotate: '-10deg' }], opacity: 0.8, overflow: 'hidden' }}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} style={{ width: '100%', height: '100%', opacity: 0.5 }} />
            </View>
            
            {/* Background Card Right */}
            <View style={{ position: 'absolute', width: '80%', height: 280, backgroundColor: '#FFF', borderRadius: 24, right: 10, transform: [{ rotate: '10deg' }], opacity: 0.8, overflow: 'hidden' }}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} style={{ width: '100%', height: '100%', opacity: 0.5 }} />
            </View>

            {/* Front Card */}
            <View style={{ position: 'absolute', width: '90%', height: 300, backgroundColor: '#FFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, zIndex: 5, overflow: 'hidden' }}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' }} style={{ width: '100%', height: '100%' }} />
              
              <View style={{ position: 'absolute', top: 16, right: 16, backgroundColor: '#FFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Icon name={Heart} size={20} color={secondary} />
              </View>
              
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.5)', height: 120 }}>
                 <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 24 }}>Sam, 28</Text>
                 <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 }}>Introvert • Loves video games, coffee, space, and random fact</Text>
                 
                 <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                   <View style={{ backgroundColor: '#FFD60A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Introvert</Text></View>
                   <View style={{ backgroundColor: '#FFD60A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Honest</Text></View>
                   <View style={{ backgroundColor: '#FFD60A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}><Text style={{ fontSize: 10, fontWeight: 'bold' }}>Handsome</Text></View>
                 </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, marginTop: 40, zIndex: 10 }}>
            {/* Reject */}
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#004D40', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
              <Icon name={X} size={32} color="#FFF" />
            </View>
            
            {/* Super Like */}
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }}>
              <Icon name={Star} size={24} color="#E65100" />
            </View>

            {/* Like */}
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: secondary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}>
              <Icon name={Heart} size={32} color="#FFF" />
            </View>
          </View>

          <Text style={{ color: '#4A5568', marginTop: 24, fontSize: 14 }}>Show More Profiles</Text>
        </View>

      </ScrollView>
    </View>
  );
}
