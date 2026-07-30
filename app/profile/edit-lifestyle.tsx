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

export default function EditLifestyleScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const border = useColor('border');

  const { profile, fetchProfile } = useProfileStore();

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('has_children', hasChildren === 'Yes' ? 'true' : 'false');
      formData.append('wants_children', wantsChildren === 'Yes' ? 'true' : 'false');
      formData.append('smoking', smoking === 'Yes' ? 'true' : 'false');
      formData.append('alcohol', alcohol === 'Yes' ? 'true' : 'false');
      formData.append('pets', pets === 'Yes' ? 'true' : 'false');
      formData.append('sport', sport);
      formData.append('eating_habits', eatingHabits);
      
      await updateMyProfile(formData);
      await fetchProfile();
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPillGroup = (label: string, options: string[], stateValue: string, setStateFn: (val: string) => void) => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map(item => (
          <FilterPill 
            key={item} 
            label={item} 
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
        <Text style={styles.headerTitle}>Lifestyle & Relationship</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={[styles.divider, { backgroundColor: border }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>CHILDREN</Text>
        {renderPillGroup("Do you have children?", ["Yes", "No"], hasChildren, setHasChildren)}
        {renderPillGroup("Do you want children?", ["Yes", "No"], wantsChildren, setWantsChildren)}

        <Text style={styles.sectionTitle}>LIFESTYLE HABITS</Text>
        {renderPillGroup("Do you smoke?", ["Yes", "No"], smoking, setSmoking)}
        {renderPillGroup("Do you drink alcohol?", ["Yes", "No"], alcohol, setAlcohol)}
        {renderPillGroup("Do you have pets?", ["Yes", "No"], pets, setPets)}
        
        {renderPillGroup("Sport", ["Intense", "Moderate", "No Sport"], sport, setSport)}
        {renderPillGroup("Eating Habits", ["Balanced", "Fast Food", "Vegetarian", "Vegan", "Other"], eatingHabits, setEatingHabits)}

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background, borderTopColor: border }]}>
        <Button onPress={handleSave} style={styles.saveBtn} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFF" /> : "Save Changes"}
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
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
  saveBtn: { borderRadius: 24 },
});
