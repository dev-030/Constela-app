import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, BatteryMedium, BatteryWarning, Heart, Smile, Leaf } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterListItem } from '@/components/ui/filter-list-item';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from 'react-i18next';
import { useProfileLabels } from '@/hooks/use-profile-labels';

export default function EditEmotionalScreen() {
  const { t, i18n } = useTranslation();
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');

  const { profile, fetchProfile, setProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const [recharge, setRecharge] = useState<string[]>(profile?.recharge_methods || []);
  const [exhausts, setExhausts] = useState<string[]>(profile?.exhaust_triggers || []);
  const [needs, setNeeds] = useState<string[]>(profile?.emotional_needs || []);
  const [humor, setHumor] = useState(profile?.second_degree_humor ? 'Yes' : 'No');
  const [soothes, setSoothes] = useState<string[]>(profile?.soothe_methods || []);
  
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = 
    JSON.stringify(recharge) !== JSON.stringify(profile?.recharge_methods || []) ||
    JSON.stringify(exhausts) !== JSON.stringify(profile?.exhaust_triggers || []) ||
    JSON.stringify(needs) !== JSON.stringify(profile?.emotional_needs || []) ||
    humor !== (profile?.second_degree_humor ? 'Yes' : 'No') ||
    JSON.stringify(soothes) !== JSON.stringify(profile?.soothe_methods || []);

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        recharge_methods: recharge,
        exhaust_triggers: exhausts,
        emotional_needs: needs,
        second_degree_humor: humor === 'Yes',
        soothe_methods: soothes,
      });
      if (updated) {
        setProfile(updated);
      }
      fetchProfile().catch(console.error);
      router.back();
    } catch (error: any) {
      console.error(error);
      let errMsg = t('edit_profile.failed_save');
      if (error?.response?.data && typeof error.response.data === "object") {
        const firstKey = Object.keys(error.response.data)[0];
        if (Array.isArray(error.response.data[firstKey])) {
          errMsg = error.response.data[firstKey][0];
        } else if (typeof error.response.data[firstKey] === "string") {
          errMsg = error.response.data[firstKey];
        }
      }
      Alert.alert(t('edit_profile.error'), errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const { listLabel, rechargeTitle, rechargeSubtitle } = useProfileLabels();

  const SectionHeader = ({ title, icon }: { title: string; icon: any }) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={16} color={muted} />
      <Text style={[styles.sectionTitle, { color: muted }]}>{title}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('edit_profile.emotional')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={[styles.introText, { color: muted }]}>
          {t('onboarding.step7_subtitle')}
        </Text>

        <SectionHeader title={t('profile_detail.how_i_recharge')} icon={BatteryMedium} />
        <FilterListItem 
          title={rechargeTitle('Silence')} subtitle={rechargeSubtitle('Silence', "Reducing noise, Lights, Movement")} 
          selected={recharge.includes('Silence')} onPress={() => toggleArrayItem(recharge, setRecharge, 'Silence')} 
        />
        <FilterListItem 
          title={rechargeTitle('Cocoon Spaces')} subtitle={rechargeSubtitle('Cocoon Spaces', "Quiet room, Blanket corner, Soft light")} 
          selected={recharge.includes('Cocoon Spaces')} onPress={() => toggleArrayItem(recharge, setRecharge, 'Cocoon Spaces')} 
        />
        <FilterListItem 
          title={rechargeTitle('Reduced Stimulation')} subtitle={rechargeSubtitle('Reduced Stimulation', "Noise-cancelling headphones, tinted glasses, Dim light")} 
          selected={recharge.includes('Reduced Stimulation')} onPress={() => toggleArrayItem(recharge, setRecharge, 'Reduced Stimulation')} 
        />

        <View style={styles.spacing} />

        <SectionHeader title={t('profile_detail.what_exhausts_me')} icon={BatteryWarning} />
        {['Absorbs other people\'s moods', 'Feels everything deeply', 'Loud or unpredictable noises', 'Bright lights', 'Fast movements around me', 'Strong smells', 'Unpleasant textures'].map(item => (
          <FilterListItem 
            key={item} title={listLabel('exhausts', item)} 
            selected={exhausts.includes(item)} onPress={() => toggleArrayItem(exhausts, setExhausts, item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title={t('onboarding.emotional_needs_label')} icon={Heart} />
        {['Predictability', 'Consistency in behavior', 'Absence of judgement', 'Clear communication', 'Deep talk', 'Need to be alone sometimes'].map(item => (
          <FilterListItem 
            key={item} title={listLabel('needs', item)} 
            selected={needs.includes(item)} onPress={() => toggleArrayItem(needs, setNeeds, item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title={t('onboarding.humor_style_label')} icon={Smile} />
        {['Yes', 'No'].map(item => (
          <FilterListItem 
            key={item} title={item === 'Yes' ? t('common.yes') : t('common.no')} 
            selected={humor === item} onPress={() => setHumor(item)} 
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title={t('onboarding.what_soothes_label')} icon={Leaf} />
        <View style={styles.pillRow}>
          {['Silence or soft sounds', 'Dim light', 'Massage', 'Sensory objects', 'Chosen solitude', 'Comforting routines', 'Predictability', 'Clear Communication', 'Hyperfocus on an interest'].map(item => (
            <FilterPill 
              key={item} 
              label={listLabel('soothes', item)} 
              selected={soothes.includes(item)} 
              onPress={() => toggleArrayItem(soothes, setSoothes, item)} 
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button 
          onPress={handleSave} 
          style={[styles.saveBtn, ...(!hasChanged ? [{ opacity: 0.5 }] : [])]} 
          disabled={isSaving || !hasChanged}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : t('edit_profile.save_changes')}
        </Button>
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
    borderTopWidth: 0,
  },
  saveBtn: {
    borderRadius: 24,
  },
});
