import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { SelectablePill } from '@/components/ui/selectable-pill';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';
import { useAndroidBack } from '@/hooks/useAndroidBack';

const NEUROTYPES = [
  "ADHD", "Autism", "Dyslexia", "Dyspraxia", "Dyscalculia",
  "Tourette's", "OCD", "Bipolar", "Synesthesia", "Gifted", "Anxiety", "PTSD"
];

export default function EditNeuroScreen() {
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const [neurotypeLabels, setNeurotypeLabels] = useState<string[]>([]);
  
  useEffect(() => {
    if (profile) {
      setNeurotypeLabels(profile.neurotype_labels || []);
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = JSON.stringify(neurotypeLabels) !== JSON.stringify(profile?.neurotype_labels || []);

  const toggleNeuro = (n: string) => {
    if (neurotypeLabels.includes(n)) {
      setNeurotypeLabels(neurotypeLabels.filter(v => v !== n));
    } else {
      setNeurotypeLabels([...neurotypeLabels, n]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('neurotype_labels', JSON.stringify(neurotypeLabels));

      await updateMyProfile(formData);
      await fetchProfile();
      router.back();
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Neurodivergence</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Neurotype Labels</Text>
        <Text style={[styles.subtitle, { color: muted }]}>Select all that apply</Text>

        <View style={styles.pillContainer}>
          {NEUROTYPES.map(item => (
            <SelectablePill 
              key={item} 
              label={item} 
              selected={neurotypeLabels.includes(item)} 
              onPress={() => toggleNeuro(item)} 
            />
          ))}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button 
          onPress={handleSave} 
          style={[styles.saveBtn, !hasChanged && { opacity: 0.5 }]} 
          disabled={isSaving || !hasChanged}
        >
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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8, lineHeight: 32 },
  subtitle: { fontSize: 14, marginBottom: 24 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0 },
  saveBtn: { borderRadius: 24 },
});
