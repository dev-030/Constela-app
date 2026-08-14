import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
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
import { updateMyProfile, checkUsernameAvailability, uploadProfilePhoto, deleteProfilePhoto } from '@/api/profile';
import { useCheckUsernameQuery } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useAndroidBack } from '@/hooks/useAndroidBack';

const reverseGenderMap: Record<string, string> = {
  woman: "Woman",
  man: "Man",
  non_binary: "Non-Binary",
  other: "Other"
};

const genderMap: Record<string, string> = {
  "Woman": "woman",
  "Man": "man",
  "Non-Binary": "non_binary",
  "Other": "other"
};

const reverseLookingForMap: Record<string, string> = {
  friendship: "Friendship",
  serious: "Serious Relationship",
  undecided: "We'll See",
  casual: "Going Out"
};

const lookingForMap: Record<string, string> = {
  "Friendship": "friendship",
  "Serious Relationship": "serious",
  "We'll See": "undecided",
  "Going Out": "casual"
};

export default function EditBasicScreen() {
  const insets = useSafeAreaInsets();
  useAndroidBack();
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

  const [firstName, setFirstName] = useState('');
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [spokenLanguages, setSpokenLanguages] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.user?.first_name || '');
      setUsername(profile.username || '');
      setDebouncedUsername(profile.username || '');
      setAge(profile.age?.toString() || '');
      setHeight(profile.height_cm?.toString() || '');
      setWeight(profile.weight_kg?.toString() || '');
      setCity(profile.city || '');
      setCountry(profile.country || '');
      setMaritalStatus(profile.marital_status || '');
      setEducationLevel(profile.education_level || '');
      setSpokenLanguages(profile.spoken_languages?.join(', ') || '');

      setGender(reverseGenderMap[profile.gender || ''] || profile.gender || '');
      setLookingFor(reverseLookingForMap[profile.looking_for || ''] || profile.looking_for || '');
    }
  }, [profile]);
  
  const [localPhotos, setLocalPhotos] = useState<{uri?: string, id?: string, image?: string, is_main?: boolean}[]>([]);
  const [deletedPhotos, setDeletedPhotos] = useState<string[]>([]);
  useEffect(() => {
    if (profile?.photos) {
      setLocalPhotos(profile.photos.map(p => ({ id: p.id, image: p.image, is_main: p.is_main })));
      setDeletedPhotos([]);
    }
  }, [profile]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const { data: usernameCheck, isFetching: isCheckingUsername } = useCheckUsernameQuery(debouncedUsername);

  const isOwnUsername = profile ? username.toLowerCase() === profile.username?.toLowerCase() : false;
  const isChecking = isCheckingUsername || (username !== debouncedUsername && username.length >= 3);
  
  let usernameError = "";
  let usernameSuccess = "";
  if (!username.trim()) {
    usernameError = "Username is required";
  } else if (username.length < 3) {
    usernameError = "Username must be at least 3 characters";
  } else if (isChecking && !isOwnUsername) {
    usernameSuccess = "Checking availability...";
  } else if (usernameCheck && !usernameCheck.available && !isOwnUsername) {
    usernameError = "Username is already taken";
  } else if (usernameCheck && usernameCheck.available && !isOwnUsername && username.length >= 3) {
    usernameSuccess = "Available";
  }

  const hasChanged = 
    JSON.stringify(localPhotos.map(p => p.id || p.uri)) !== JSON.stringify(profile?.photos?.map(p => p.id) || []) ||
    deletedPhotos.length > 0 ||
    firstName !== (profile?.user?.first_name || '') ||
    username !== (profile?.username || '') ||
    age !== (profile?.age?.toString() || '') ||
    height !== (profile?.height_cm?.toString() || '') ||
    weight !== (profile?.weight_kg?.toString() || '') ||
    city !== (profile?.city || '') ||
    country !== (profile?.country || '') ||
    gender !== (reverseGenderMap[profile?.gender || ''] || profile?.gender || '') ||
    lookingFor !== (reverseLookingForMap[profile?.looking_for || ''] || profile?.looking_for || '') ||
    maritalStatus !== (profile?.marital_status || '') ||
    educationLevel !== (profile?.education_level || '') ||
    spokenLanguages !== (profile?.spoken_languages?.join(', ') || '');

  const canSave = !usernameError && hasChanged;

  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async (indexToReplace?: number) => {
    if (indexToReplace === undefined && localPhotos.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload up to 3 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
      maxWidth: 1080,
      maxHeight: 1350,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (indexToReplace !== undefined) {
        const existingPhoto = localPhotos[indexToReplace];
        if (existingPhoto?.id) {
          setDeletedPhotos(prev => [...prev, existingPhoto.id!]);
        }
        const newPhotos = [...localPhotos];
        newPhotos[indexToReplace] = { uri: result.assets[0].uri };
        setLocalPhotos(newPhotos);
      } else {
        setLocalPhotos([...localPhotos, { uri: result.assets[0].uri }]);
      }
    }
  };

  const removeImage = async (index: number, photoId?: string) => {
    if (photoId) {
      setDeletedPhotos(prev => [...prev, photoId]);
    }
    const newPhotos = [...localPhotos];
    newPhotos.splice(index, 1);
    setLocalPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (localPhotos.length === 0) {
      Alert.alert('Cannot Save', 'You must have at least one profile photo.');
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('username', username);
      if (age) formData.append('age', age);
      if (height) formData.append('height_cm', height);
      if (weight) formData.append('weight_kg', weight);
      formData.append('city', city);
      formData.append('country', country);
      if (gender) formData.append('gender', genderMap[gender] || gender);
      if (lookingFor) formData.append('looking_for', lookingForMap[lookingFor] || lookingFor);
      formData.append('marital_status', maritalStatus);
      formData.append('education_level', educationLevel);
      
      const languagesArray = spokenLanguages.split(',').map(l => l.trim()).filter(Boolean);
      formData.append('spoken_languages', JSON.stringify(languagesArray));

      if (deletedPhotos.length > 0) {
        const { accessToken } = useAuthStore.getState();
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = API_URL.includes('localhost') && Platform.OS === 'android' 
          ? API_URL.replace('localhost', '10.0.2.2')
          : API_URL;
          
        await Promise.all(deletedPhotos.map(photoId => 
          fetch(`${baseUrl}/api/photos/${photoId}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }).catch(e => console.warn("Failed to delete photo", e))
        ));
      }

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
            let errMsg = "Failed to save profile";
      if (error?.response?.data && typeof error.response.data === "object") {
        const firstKey = Object.keys(error.response.data)[0];
        if (Array.isArray(error.response.data[firstKey])) {
          errMsg = error.response.data[firstKey][0];
        } else if (typeof error.response.data[firstKey] === "string") {
          errMsg = error.response.data[firstKey];
        }
      }
      Alert.alert("Error", errMsg);
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Photos */}
        <Text style={styles.sectionTitle}>PROFILE PHOTOS (UP TO 3)</Text>
        <View style={styles.photoGrid}>
          {[0, 1, 2].map((slot) => {
            const photo = localPhotos[slot];
            if (photo) {
              return (
                <View key={slot} style={styles.avatarContainer}>
                  <Pressable onPress={() => pickImage(slot)}>
                    <Avatar 
                      uri={photo.uri || photo.image} 
                      size={110} 
                      style={{ borderRadius: 12, height: 140, width: 110, backgroundColor: 'transparent' }} 
                      imageStyle={{ borderRadius: 12, height: 140, width: 110 }}
                    />
                  </Pressable>
                  <Pressable  
                    style={[styles.removeIconContainer, { backgroundColor: '#FF3B30' }]} 
                    onPress={() => removeImage(slot, photo.id)}
                  >
                    <Icon name={X} size={14} color="#FFF" />
                  </Pressable>
                </View>
              );
            }
            return (
              <Pressable key={slot} style={[styles.addPhotoBox, { borderColor: border, backgroundColor: cardColor }]} onPress={() => pickImage()}>
                <Icon name={Camera} size={20} color={muted} />
                <Text style={[styles.addPhotoText, { color: muted }]}>{slot === 0 ? 'Main Photo' : 'Add Photo'}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={[styles.inputContainer, { borderColor: border, backgroundColor: cardColor }]}>
            <TextInput style={[styles.inputValue, { color: text }]} value={firstName} onChangeText={setFirstName} placeholderTextColor={muted} />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Username *</Text>
          <View style={[styles.inputContainer, { borderColor: usernameError ? '#FF3B30' : usernameSuccess && !isOwnUsername && !isChecking ? '#22C55E' : border, backgroundColor: cardColor, flexDirection: 'row', alignItems: 'center' }]}>
            <TextInput 
              style={[styles.inputValue, { color: text, flex: 1 }]} 
              value={username} 
              onChangeText={(text) => setUsername(text.replace(/[^a-zA-Z0-9_]/g, ''))} 
              placeholderTextColor={muted} 
              autoCapitalize="none"
              autoCorrect={false}
            />
            {usernameSuccess ? (
              <Text style={{ color: isChecking ? muted : '#22C55E', fontSize: 12, fontWeight: '600' }}>
                {usernameSuccess}
              </Text>
            ) : null}
            {usernameError && username.length >= 3 && !isChecking ? (
              <Text style={{ color: '#FF3B30', fontSize: 12, fontWeight: '600' }}>
                Taken
              </Text>
            ) : null}
          </View>
          {usernameError && username.length < 3 ? (
            <Text style={{ color: '#FF3B30', fontSize: 12, marginTop: 4 }}>{usernameError}</Text>
          ) : null}
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

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button onPress={handleSave} style={[styles.saveBtn, !canSave && { opacity: 0.5 }]} disabled={isSaving || !canSave}>
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
  footer: { paddingHorizontal: 20, paddingTop: 16 },
  saveBtn: { borderRadius: 24 },
  photoGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  avatarContainer: { width: 110, height: 140, borderRadius: 12, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  removeIconContainer: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  addPhotoBox: { width: 110, height: 140, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 8 },
  addPhotoText: { fontSize: 12 },
});
