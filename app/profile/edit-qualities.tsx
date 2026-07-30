import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';

export default function EditQualitiesScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const cardColor = useColor('card');
  const border = useColor('border');

  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const [qualities, setQualities] = useState(profile?.qualities?.join(', ') || '');
  const [interests, setInterests] = useState(profile?.interests?.join(', ') || '');
  const [neurotypeLabels, setNeurotypeLabels] = useState(profile?.neurotype_labels?.join(', ') || '');
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      const qArray = qualities.split(',').map(s => s.trim()).filter(Boolean);
      qArray.forEach(q => formData.append('qualities', q));
      
      const iArray = interests.split(',').map(s => s.trim()).filter(Boolean);
      iArray.forEach(i => formData.append('interests', i));

      const nArray = neurotypeLabels.split(',').map(s => s.trim()).filter(Boolean);
      nArray.forEach(n => formData.append('neurotype_labels', n));
      
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

  const renderInputField = (label: string, stateValue: string, setStateFn: (val: string) => void, placeholder: string) => (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
        <TextInput 
          style={[styles.inputValue, { color: text }]} 
          value={stateValue} 
          onChangeText={setStateFn} 
          placeholder={placeholder}
          placeholderTextColor={muted} 
          multiline
        />
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
        <Text style={styles.headerTitle}>My Qualities</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={[styles.divider, { backgroundColor: border }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.sectionTitle}>QUALITIES & INTERESTS</Text>
        
        {renderInputField("Qualities (comma separated)", qualities, setQualities, "e.g. Authenticity, Loyalty, Kindness")}
        {renderInputField("Interests (comma separated)", interests, setInterests, "e.g. Coding, Photography, Botany")}
        
        <Text style={styles.sectionTitle}>NEURODIVERGENCE</Text>
        {renderInputField("Neurotype Labels (comma separated)", neurotypeLabels, setNeurotypeLabels, "e.g. Autism, ADHD, Dyslexia")}

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
  inputContainer: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, minHeight: 60 },
  inputValue: { fontSize: 16, padding: 0 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
  saveBtn: { borderRadius: 24 },
});
