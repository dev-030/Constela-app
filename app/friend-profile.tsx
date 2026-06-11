import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MoreHorizontal, X, Star, Heart, Gamepad2, Palette, Rocket, Coffee, Lightbulb, VolumeX } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FilterPill } from '@/components/ui/filter-pill';
import { useColor } from '@/hooks/useColor';

export default function FriendProfileScreen() {
  const insets = useSafeAreaInsets();
  const background = '#FBF8F1'; // Using the cream background from mockup
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerName}>Sam, 28</Text>
        <Pressable onPress={() => router.push('/manage-profile')} hitSlop={10}>
          <Icon name={MoreHorizontal} size={24} color={text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image 
          source={{ uri: 'https://i.pravatar.cc/400?img=11' }} 
          style={styles.heroImage}
        />

        {/* Neurotype */}
        <SectionHeader title="NEUROTYPE" />
        <View style={styles.pillRow}>
          <View style={[styles.pill, { backgroundColor: '#B2EBF2' }]}>
            <Text style={[styles.pillText, { color: '#006064' }]}>Autistic</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: '#B2DFDB' }]}>
            <Text style={[styles.pillText, { color: '#004D40' }]}>i'm neurodivergent</Text>
          </View>
        </View>

        {/* Bio */}
        <SectionHeader title="BIO" />
        <Text style={[styles.bio, { color: '#333' }]}>
          "I value parallel play and deep conversations. Introvert, coffee lover, and space enthusiast."
        </Text>

        {/* Interests */}
        <SectionHeader title="INTERESTS" />
        <View style={styles.pillRow}>
          <View style={[styles.interestPill, { backgroundColor: '#F5E6D3' }]}>
            <Icon name={Gamepad2} size={14} color="#8D6E63" />
            <Text style={[styles.interestText, { color: '#3E2723' }]}>Gaming</Text>
          </View>
          <View style={[styles.interestPill, { backgroundColor: '#F5E6D3' }]}>
            <Icon name={Palette} size={14} color="#8D6E63" />
            <Text style={[styles.interestText, { color: '#3E2723' }]}>Art</Text>
          </View>
          <View style={[styles.interestPill, { backgroundColor: '#F5E6D3' }]}>
            <Icon name={Rocket} size={14} color="#8D6E63" />
            <Text style={[styles.interestText, { color: '#3E2723' }]}>Space</Text>
          </View>
          <View style={[styles.interestPill, { backgroundColor: '#F5E6D3' }]}>
            <Icon name={Coffee} size={14} color="#8D6E63" />
            <Text style={[styles.interestText, { color: '#3E2723' }]}>Coffee</Text>
          </View>
        </View>

        {/* Sensory Profile */}
        <SectionHeader title="SENSORY PROFILE" />
        <View style={styles.sensoryRow}>
          <View style={styles.sensoryLeft}>
            <Icon name={Lightbulb} size={20} color="#455A64" />
            <Text style={styles.sensoryText}>Soft Lighting Only</Text>
          </View>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>
        <View style={styles.sensoryRow}>
          <View style={styles.sensoryLeft}>
            <Icon name={VolumeX} size={20} color="#455A64" />
            <Text style={styles.sensoryText}>Quiet Spaces Preferred</Text>
          </View>
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Buttons */}
      <View style={[styles.fabContainer, { paddingBottom: insets.bottom || 24 }]}>
        <Pressable 
          style={[styles.fab, styles.fabSmall, { backgroundColor: '#004D40' }]}
          onPress={() => router.back()}
        >
          <Icon name={X} size={24} color="#FFF" />
        </Pressable>
        <Pressable 
          style={[styles.fab, styles.fabSmall, { backgroundColor: '#FFF' }]}
        >
          <Icon name={Star} size={24} color="#FF6D00" />
        </Pressable>
        <Pressable 
          style={[styles.fab, styles.fabLarge, { backgroundColor: '#D81B60' }]}
        >
          <Icon name={Heart} size={32} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8D6E63',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 24,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  bio: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  interestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EFEBE1',
  },
  interestText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sensoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  sensoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sensoryText: {
    fontSize: 16,
    color: '#333',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#004D40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingTop: 20,
    // Gradient overlay could go here, but transparent background for now
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  fabSmall: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  fabLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
