import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from 'react-i18next';

export default function EditLifestyleScreen() {
  const { t } = useTranslation();
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const border = useColor('border');

  const { profile, fetchProfile, setProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const [hasChildren, setHasChildren] = useState(profile?.has_children ? 'Yes' : 'No');
  const [wantsChildren, setWantsChildren] = useState(profile?.wants_children ? 'Yes' : 'No');
  const [smoking, setSmoking] = useState(profile?.smoking ? 'Yes' : 'No');
  const [alcohol, setAlcohol] = useState(profile?.alcohol ? 'Yes' : 'No');
  const [pets, setPets] = useState(profile?.pets ? 'Yes' : 'No');
  const [sport, setSport] = useState(profile?.sport || '');
  const [eatingHabits, setEatingHabits] = useState(profile?.eating_habits || '');
  
  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = 
    hasChildren !== (profile?.has_children ? 'Yes' : 'No') ||
    wantsChildren !== (profile?.wants_children ? 'Yes' : 'No') ||
    smoking !== (profile?.smoking ? 'Yes' : 'No') ||
    alcohol !== (profile?.alcohol ? 'Yes' : 'No') ||
    pets !== (profile?.pets ? 'Yes' : 'No') ||
    sport !== (profile?.sport || '') ||
    eatingHabits !== (profile?.eating_habits || '');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({
        has_children: hasChildren === 'Yes',
        wants_children: wantsChildren === 'Yes',
        smoking: smoking === 'Yes',
        alcohol: alcohol === 'Yes',
        pets: pets === 'Yes',
        sport,
        eating_habits: eatingHabits,
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

  const getOptionLabel = (val: string) => {
    switch (val) {
      case "Yes": return t('common.yes');
      case "No": return t('common.no');
      case "Intense": return t('onboarding.sport_intense');
      case "Moderate": return t('onboarding.sport_moderate');
      case "No Sport": return t('onboarding.sport_none');
      case "Balanced": return t('onboarding.diet_balanced');
      case "Fast Food": return t('onboarding.diet_fast_food');
      case "Vegetarian": return t('onboarding.diet_veg');
      case "Vegan": return t('onboarding.diet_vegan');
      case "Other": return t('onboarding.diet_other');
      default: return val;
    }
  };

  const renderPillGroup = (label: string, options: string[], stateValue: string, setStateFn: (val: string) => void) => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map(item => (
          <FilterPill 
            key={item} 
            label={getOptionLabel(item)} 
            selected={stateValue === item} 
            onPress={() => setStateFn(item)} 
            style={stateValue !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }} 
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('edit_profile.lifestyle_rel')}</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>{t('edit_profile.children')}</Text>
        {renderPillGroup(t('edit_profile.have_children'), ["Yes", "No"], hasChildren, setHasChildren)}
        {renderPillGroup(t('edit_profile.want_children'), ["Yes", "No"], wantsChildren, setWantsChildren)}

        <Text style={styles.sectionTitle}>{t('edit_profile.lifestyle_habits')}</Text>
        {renderPillGroup(t('edit_profile.smoke'), ["Yes", "No"], smoking, setSmoking)}
        {renderPillGroup(t('edit_profile.drink_alcohol'), ["Yes", "No"], alcohol, setAlcohol)}
        {renderPillGroup(t('edit_profile.have_pets'), ["Yes", "No"], pets, setPets)}
        
        {renderPillGroup(t('edit_profile.sport'), ["Intense", "Moderate", "No Sport"], sport, setSport)}
        {renderPillGroup(t('edit_profile.eating_habits'), ["Balanced", "Fast Food", "Vegetarian", "Vegan", "Other"], eatingHabits, setEatingHabits)}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button onPress={handleSave} style={[styles.saveBtn, ...(!hasChanged ? [{ opacity: 0.5 }] : [])]} disabled={isSaving || !hasChanged}>
          {isSaving ? <ActivityIndicator color="#FFF" /> : t('edit_profile.save_changes')}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5, marginTop: 24, marginBottom: 16, color: '#555' },
  formGroup: { marginBottom: 24 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 12 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0 },
  saveBtn: { borderRadius: 24 },
});
