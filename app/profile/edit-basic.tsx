import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Camera, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';

export default function EditBasicScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');

  const { profile, fetchProfile } = useProfileStore();

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  const [username, setUsername] = useState(profile?.username || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [height, setHeight] = useState(profile?.height_cm?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight_kg?.toString() || '');
  const [city, setCity] = useState(profile?.city || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [gender, setGender] = useState(profile?.gender || '');
  const [lookingFor, setLookingFor] = useState(profile?.looking_for || '');
  const [maritalStatus, setMaritalStatus] = useState(profile?.marital_status || '');
  const [educationLevel, setEducationLevel] = useState(profile?.education_level || '');
  const [spokenLanguages, setSpokenLanguages] = useState(profile?.spoken_languages?.join(', ') || '');
  
  const [localPhotos, setLocalPhotos] = useState<{uri?: string, id?: string, image?: string, is_main?: boolean}[]>([]);
  useEffect(() => {
    if (profile?.photos) {
      setLocalPhotos(profile.photos.map(p => ({ id: p.id, image: p.image, is_main: p.is_main })));
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    if (localPhotos.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalPhotos([...localPhotos, { uri: result.assets[0].uri }]);
    }
  };

  const removeImage = async (index: number, photoId?: string) => {
    if (photoId) {
      // In a real app we'd call an API to delete the photo here. 
      // For now we just remove it locally and when we hit save, the new ones will be appended.
      // E.g. await deleteMyPhoto(photoId);
    }
    const newPhotos = [...localPhotos];
    newPhotos.splice(index, 1);
    setLocalPhotos(newPhotos);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('username', username);
      if (age) formData.append('age', age);
      if (height) formData.append('height_cm', height);
      if (weight) formData.append('weight_kg', weight);
      formData.append('city', city);
      formData.append('country', country);
      formData.append('gender', gender);
      formData.append('looking_for', lookingFor);
      formData.append('marital_status', maritalStatus);
      formData.append('education_level', educationLevel);
      
      const languagesArray = spokenLanguages.split(',').map(l => l.trim()).filter(Boolean);
      languagesArray.forEach(l => formData.append('spoken_languages', l));

      localPhotos.forEach((photo, index) => {
        if (photo.uri && !photo.id) {
          const filename = photo.uri.split('/').pop() || `photo${index}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('photos', {
            uri: photo.uri,
            name: filename,
            type,
          } as any);
        }
      });

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

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Basic Information</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={[styles.divider, { backgroundColor: border }]} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photos */}
        <Text style={styles.sectionTitle}>PROFILE PHOTOS (UP TO 3)</Text>
        <View style={styles.photoGrid}>
          {localPhotos.map((photo, index) => (
            <View key={index} style={styles.avatarContainer}>
              <Avatar uri={photo.uri || photo.image} size={100} style={{ borderRadius: 12, height: 120, width: 100 }} />
              <Pressable 
                style={[styles.removeIconContainer, { backgroundColor: '#FF3B30' }]} 
                onPress={() => removeImage(index, photo.id)}
              >
                <Icon name={X} size={14} color="#FFF" />
              </Pressable>
            </View>
          ))}
          {localPhotos.length < 3 && (
            <Pressable style={[styles.addPhotoBox, { borderColor: border, backgroundColor: cardColor }]} onPress={pickImage}>
              <Icon name={Camera} size={20} color={muted} />
              <Text style={[styles.addPhotoText, { color: muted }]}>Add Photo</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Username *</Text>
          <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
            <TextInput style={[styles.inputValue, { color: text }]} value={username} onChangeText={setUsername} placeholderTextColor={muted} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Age *</Text>
            <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
              <TextInput style={[styles.inputValue, { color: text }]} value={age} onChangeText={setAge} keyboardType="numeric" placeholderTextColor={muted} />
            </View>
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
              <TextInput style={[styles.inputValue, { color: text }]} value={height} onChangeText={setHeight} keyboardType="numeric" placeholderTextColor={muted} />
            </View>
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
              <TextInput style={[styles.inputValue, { color: text }]} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholderTextColor={muted} />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>City *</Text>
            <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
              <TextInput style={[styles.inputValue, { color: text }]} value={city} onChangeText={setCity} placeholderTextColor={muted} />
            </View>
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Country *</Text>
            <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
              <TextInput style={[styles.inputValue, { color: text }]} value={country} onChangeText={setCountry} placeholderTextColor={muted} />
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>IDENTITY & STATUS</Text>

        <Text style={styles.inputLabel}>Gender *</Text>
        <View style={styles.pillRow}>
          {['Non-Binary', 'Man', 'Woman', 'Other'].map(item => (
            <FilterPill key={item} label={item} selected={gender === item} onPress={() => setGender(item)} style={gender !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }} />
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Looking for *</Text>
        <View style={styles.pillRow}>
          {['Friendship', 'Serious Relationship', 'We\'ll See', 'Going Out'].map(item => (
            <FilterPill key={item} label={item} selected={lookingFor === item} onPress={() => setLookingFor(item)} style={lookingFor !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }} />
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Marital Status *</Text>
        <View style={styles.pillRow}>
          {['single', 'married', 'divorced', 'widowed'].map(item => (
            <FilterPill key={item} label={item} selected={maritalStatus === item} onPress={() => setMaritalStatus(item)} style={maritalStatus !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>EDUCATION & LANGUAGES</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Education Level</Text>
          <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
            <TextInput style={[styles.inputValue, { color: text }]} value={educationLevel} onChangeText={setEducationLevel} placeholder="e.g. Bachelor's Degree" placeholderTextColor={muted} />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Spoken Languages (comma separated)</Text>
          <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
            <TextInput style={[styles.inputValue, { color: text }]} value={spokenLanguages} onChangeText={setSpokenLanguages} placeholder="e.g. English, ASL" placeholderTextColor={muted} />
          </View>
        </View>

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
  formGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputContainer: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  inputValue: { fontSize: 16, padding: 0 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1 },
  saveBtn: { borderRadius: 24 },
  photoGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  avatarContainer: { width: 100, height: 120, borderRadius: 12, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  removeIconContainer: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  addPhotoBox: { width: 100, height: 120, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addPhotoText: { fontSize: 12 },
});
