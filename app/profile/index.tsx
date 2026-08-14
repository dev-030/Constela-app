import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ChevronLeft, Edit2, MapPin, User, Smile, Heart, Globe, BookOpen, Activity, Coffee, Users, Star, Compass, Brain, Battery, Zap, Search, Utensils, Wine } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/ui/avatar';

const InfoRow = ({ icon: IconComp, label, value, isLast = false }: any) => {
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
        <IconComp size={16} color={primary} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingRight: 16, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: border }}>
        <Text style={{ fontSize: 16, color: text }}>{label}</Text>
        <Text style={{ fontSize: 16, color: muted, flex: 1, textAlign: 'right', marginLeft: 16 }}>{value}</Text>
      </View>
    </View>
  );
};

const InfoTagsRow = ({ icon: IconComp, label, tags, layout = 'column', isLast = false }: any) => {
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  if (layout === 'row') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
          <IconComp size={16} color={primary} />
        </View>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingRight: 16, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: border }}>
          <Text style={{ fontSize: 16, color: text, marginRight: 16 }}>{label}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
            {tags?.length ? tags.map((item: string, index: number) => (
              <View key={index} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: primary + '15' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: primary }}>{item}</Text>
              </View>
            )) : <Text style={{ fontSize: 16, color: muted }}>—</Text>}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', paddingLeft: 16 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 16 }}>
        <IconComp size={16} color={primary} />
      </View>
      <View style={{ flex: 1, paddingVertical: 16, paddingRight: 16, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: border }}>
        <Text style={{ fontSize: 16, color: text, marginBottom: 8 }}>{label}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {tags?.length ? tags.map((item: string, index: number) => (
            <View key={index} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: primary + '15' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: primary }}>{item}</Text>
            </View>
          )) : <Text style={{ fontSize: 16, color: muted }}>—</Text>}
        </View>
      </View>
    </View>
  );
};

const SectionHeader = ({ title, onEdit }: { title: string; onEdit?: () => void }) => {
  const text = useColor('text');
  const primary = useColor('primary');

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: text }]}>{title}</Text>
      {onEdit && (
        <Pressable onPress={onEdit} hitSlop={10}>
          <Text style={[styles.editText, { color: primary }]}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
};

const LOOKING_FOR_MAP: Record<string, string> = {
  'serious': 'Serious Relationship',
  'friendship': 'Friendship',
  'undecided': "We'll See",
  'casual': 'Going Out',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');

  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  useAndroidBack();

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );


  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your gallery to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      maxWidth: 1080,
      maxHeight: 1080,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const formData = new FormData();
      
      const filename = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
      const match = /\.([a-zA-Z]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo1', {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      setIsUploadingPhoto(true);
      try {
        const { accessToken } = useAuthStore.getState();
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
        const baseUrl = API_URL.includes('localhost') && Platform.OS === 'android' 
          ? API_URL.replace('localhost', '10.0.2.2')
          : API_URL;

        const currentPhotos = useProfileStore.getState().profile?.photos || [];
        const mainPhoto = currentPhotos.find(p => p.is_main) || currentPhotos[0];
        
        if (mainPhoto?.id) {
          try {
            await fetch(`${baseUrl}/api/photos/${mainPhoto.id}/`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            });
          } catch (e) {
            console.warn("Failed to delete previous main photo", e);
          }
        }

        const uploadUrl = `${baseUrl}/api/profile/me/`;
          
        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
           throw new Error('Upload failed');
        }
        await fetchProfile();
      } catch (error) {
        console.error('Failed to upload photo:', error);
        Alert.alert('Upload Failed', 'There was an issue uploading your photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)/home')} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: text }]}>Profile</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 40) }]} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.overview}>
          <Pressable onPress={pickImage} style={styles.avatarContainer}>
            <Avatar uri={profile.photos?.[0]?.image} size={110} style={styles.avatar} />
            {isUploadingPhoto ? (
              <View style={[styles.avatarOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <ActivityIndicator color="#FFF" />
              </View>
            ) : (
              <View style={[styles.avatarEditBtn, { backgroundColor: primary, borderColor: background }]}>
                <Icon name={Edit2} size={14} color="#FFF" />
              </View>
            )}
          </Pressable>
          <Text style={[styles.name, { color: text }]}>{profile.user?.first_name || profile.username}, {profile.age}</Text>
          <View style={[styles.inlineStats, { marginTop: 16 }]}>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> Friends</Text>
            <Text style={[styles.inlineStatDot, { color: muted }]}>•</Text>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> Dating</Text>
          </View>
        </View>

        {/* Profile Completion (Slim) */}
        {profile.profile_completion_pct < 100 && (
          <View style={styles.completionSection}>
            <View style={styles.completionHeader}>
              <Text style={[styles.completionTitle, { color: muted }]}>Profile Completion</Text>
              <Text style={[styles.completionPercent, { color: primary }]}>{profile.profile_completion_pct}%</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: primary, width: `${profile.profile_completion_pct}%` }]} />
            </View>
          </View>
        )}

        {/* Face Verification Section */}
        <View style={styles.section}>
          <SectionHeader title="Verification" />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            {profile.face_verification_status === "approved" ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#22C55E15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Icon name={Smile} size={16} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: text }}>Verified Account</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>Your identity is verified.</Text>
                </View>
              </View>
            ) : profile.face_verification_status === "pending" ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAB30815', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Icon name={Smile} size={16} color="#EAB308" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: text }}>Verification Pending</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>Admin review in progress.</Text>
                </View>
              </View>
            ) : (
              <Pressable 
                onPress={() => router.push('/onboarding/face-verification')}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
              >
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Icon name={Smile} size={16} color={primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: primary, fontWeight: '600' }}>Get Face Verified</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>Earn the blue tick & boost matches!</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <SectionHeader title="Basic Info" onEdit={() => router.push('/profile/edit-basic')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoRow icon={User} label="Name" value={profile.user?.first_name || '—'} />
            <InfoRow icon={User} label="Username" value={profile.username || '—'} />
            <InfoRow icon={Smile} label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1).replace('_', '-') : '—'} />
            <InfoRow icon={Heart} label="Marital Status" value={profile.marital_status ? profile.marital_status.charAt(0).toUpperCase() + profile.marital_status.slice(1) : '—'} />
            <InfoTagsRow icon={Search} label="Looking For" tags={profile.looking_for ? [LOOKING_FOR_MAP[profile.looking_for] || (profile.looking_for.charAt(0).toUpperCase() + profile.looking_for.slice(1))] : []} layout="row" />
            <InfoTagsRow icon={Globe} label="Languages" tags={profile.spoken_languages} layout="row" />
            <InfoRow icon={MapPin} label="City" value={profile.city || '—'} />
            <InfoRow icon={Activity} label="Height/Weight" value={[profile.height_cm ? `${profile.height_cm}cm` : null, profile.weight_kg ? `${profile.weight_kg}kg` : null].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={BookOpen} label="Education" value={profile.education_level || '—'} isLast />
          </View>
        </View>

        {/* My Qualities */}
        <View style={styles.section}>
          <SectionHeader title="My Qualities" onEdit={() => router.push('/profile/edit-qualities')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Star} label="My Qualities" tags={profile.qualities} isLast />
          </View>
        </View>

        {/* My Interests */}
        <View style={styles.section}>
          <SectionHeader title="My Interests" onEdit={() => router.push('/profile/edit-interests')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Compass} label="My Interests" tags={profile.interests} isLast />
          </View>
        </View>

        {/* Neurodivergence */}
        {profile.neurotype_labels && profile.neurotype_labels.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Neurodivergence" onEdit={() => router.push('/profile/edit-neuro')} />
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <InfoTagsRow icon={Brain} label="Neurodivergence" tags={profile.neurotype_labels} isLast />
            </View>
          </View>
        )}

        {/* Emotional Landscape */}
        <View style={styles.section}>
          <SectionHeader title="Emotional Landscape" onEdit={() => router.push('/profile/edit-emotional')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Battery} label="Recharge Methods" tags={profile.recharge_methods} />
            <InfoTagsRow icon={Zap} label="Exhaust Triggers" tags={profile.exhaust_triggers} />
            <InfoRow icon={Smile} label="Humor" value={profile.second_degree_humor ? 'Second-Degree' : 'Normal'} />
            <InfoTagsRow icon={Heart} label="Soothes" tags={profile.soothe_methods} isLast />
          </View>
        </View>

        {/* Lifestyle & Relationship */}
        <View style={styles.section}>
          <SectionHeader title="Lifestyle" onEdit={() => router.push('/profile/edit-lifestyle')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoRow icon={Users} label="Has Children" value={profile.has_children ? 'Yes' : 'No'} />
            <InfoRow icon={Users} label="Wants Children" value={profile.wants_children ? 'Yes' : 'No'} />
            <InfoRow icon={Activity} label="Smoking" value={profile.smoking ? 'Yes' : 'No'} />
            <InfoRow icon={Wine} label="Alcohol" value={profile.alcohol ? 'Yes' : 'No'} />
            <InfoRow icon={Smile} label="Pets" value={profile.pets ? 'Yes' : 'No'} />
            <InfoRow icon={Activity} label="Sport" value={profile.sport || '—'} />
            <InfoRow icon={Utensils} label="Eating Habits" value={profile.eating_habits || '—'} isLast />
          </View>
        </View>

        {/* Extra Space */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  overview: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    borderRadius: 55,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 16,
  },
  inlineStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineStatText: {
    fontSize: 14,
  },
  inlineStatDot: {
    fontSize: 16,
  },
  completionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  verticalRow: {
    padding: 16,
  },
  borderBottom: {
    borderBottomWidth: 0.5,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
  },
  intentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  intentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
