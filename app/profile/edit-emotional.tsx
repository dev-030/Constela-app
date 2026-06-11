import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, BatteryMedium, BatteryWarning, Heart, Smile, Leaf } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterListItem } from '@/components/ui/filter-list-item';
import { useColor } from '@/hooks/useColor';

export default function EditEmotionalScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');

  const [recharge, setRecharge] = useState('Silence');
  const [exhausts, setExhausts] = useState('Absorbs other people\'s moods');
  const [needs, setNeeds] = useState('Predictability');
  const [humor, setHumor] = useState('Yes');
  const [soothes, setSoothes] = useState(['Predictability', 'Clear Communication', 'Hyperfocus on an interest']);

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const SectionHeader = ({ title, icon, color = '#555' }: { title: string; icon: any; color?: string }) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Emotional Landscape</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={[styles.divider, { backgroundColor: border }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.introText, { color: muted }]}>
          Understanding your emotional needs helps us find connections who truly 'get' your rhythm. Skip anything you're not ready to share.
        </Text>

        <SectionHeader title="HOW I RECHARGE" icon={BatteryMedium} />
        <FilterListItem 
          title="Silence" subtitle="Reducing noise, Lights, Movement" 
          selected={recharge === 'Silence'} onPress={() => setRecharge('Silence')} 
        />
        <FilterListItem 
          title="Cocoon Spaces" subtitle="Quiet room, Blanket corner, Soft light" 
          selected={recharge === 'Cocoon Spaces'} onPress={() => setRecharge('Cocoon Spaces')} 
        />
        <FilterListItem 
          title="Reduced Stimulation" subtitle="Noise-cancelling headphones, tinted glasses, Dim light" 
          selected={recharge === 'Reduced Stimulation'} onPress={() => setRecharge('Reduced Stimulation')} 
        />

        <View style={styles.spacing} />

        <SectionHeader title="WHAT EXHAUSTS ME" icon={BatteryWarning} color="#C62828" />
        {['Absorbs other people\'s moods', 'Feels everything deeply', 'Loud or unpredictable noises', 'Bright lights', 'Fast movements around me', 'Strong smells', 'Unpleasant textures'].map(item => (
          <FilterListItem 
            key={item} title={item} 
            selected={exhausts === item} onPress={() => setExhausts(item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title="MY EMOTIONAL NEEDS" icon={Heart} color="#795548" />
        {['Predictability', 'Consistency in behavior', 'Absence of judgement', 'Clear communication', 'Deep talk', 'Need to be alone sometimes'].map(item => (
          <FilterListItem 
            key={item} title={item} 
            selected={needs === item} onPress={() => setNeeds(item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title="SECOND-DEGREE HUMOR" icon={Smile} color="#2E7D32" />
        {['Yes', 'No'].map(item => (
          <FilterListItem 
            key={item} title={item} 
            selected={humor === item} onPress={() => setHumor(item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title="WHAT SOOTHES ME" icon={Leaf} color="#00695C" />
        <View style={styles.pillRow}>
          {['Silence or soft sounds', 'Dim light', 'Massage', 'Sensory objects', 'Chosen solitude', 'Comforting routines', 'Predictability', 'Clear Communication', 'Hyperfocus on an interest'].map(item => (
            <FilterPill 
              key={item} label={item} 
              selected={soothes.includes(item)} 
              onPress={() => toggleArrayItem(soothes, setSoothes, item)} 
              style={!soothes.includes(item) && { backgroundColor: '#FAF3E0', borderWidth: 1, borderColor: '#E0D4B4' }}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button 
          title="Save Changes" 
          onPress={() => router.back()} 
          style={styles.saveBtn} 
        />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  spacing: {
    height: 24,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveBtn: {
    borderRadius: 24,
  },
});
