import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { 
  ChevronLeft, Edit2, MapPin, User, Smile, Heart, Globe, BookOpen, 
  Activity, Coffee, Users, Star, Compass, Brain, Battery, Zap, Search, 
  Utensils, Wine, Mail, Sparkles, Camera, ImagePlus, X, ChevronRight, CheckCircle2 
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useColor } from '@/hooks/useColor';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProfileStore } from '@/store/profileStore';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/components/ui/avatar';
import { uploadPhoto, deletePhoto, setMainPhoto } from '@/api/profile';

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
  const isDark = useColorScheme() === 'dark';

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = Math.floor((screenWidth - 32 - 16) / 3);
  const cardHeight = Math.round(cardWidth * 1.32);

  const { profile, fetchProfile, isLoading } = useProfileStore();
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const userEmail = profile?.user?.email || (profile as any)?.email || '';
  useAndroidBack();

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const sortedPhotos = useMemo(() => {
    return [...(profile?.photos || [])].sort((a, b) => (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0));
  }, [profile?.photos]);

  const mainPhoto = sortedPhotos.find(p => p.is_main) || sortedPhotos[0];

  const handleAddPhoto = async (slotIndex?: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your gallery to upload a profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.75,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const targetSlot = slotIndex ?? sortedPhotos.length;
      setUploadingSlot(targetSlot);
      setIsUploadingPhoto(true);
      try {
        await uploadPhoto(result.assets[0].uri);
        await fetchProfile();
      } catch (error) {
        console.error('Failed to upload photo:', error);
        Alert.alert('Upload Failed', 'There was an issue uploading your photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
        setUploadingSlot(null);
      }
    }
  };

  const handleReplacePhoto = async (photoId: string) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your gallery to change your photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.75,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setIsUploadingPhoto(true);
      try {
        await deletePhoto(photoId);
        await uploadPhoto(result.assets[0].uri);
        await fetchProfile();
      } catch (error) {
        console.error('Failed to replace photo:', error);
        Alert.alert('Replace Failed', 'There was an issue updating your photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (sortedPhotos.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one photo on your profile.');
      return;
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingPhoto(true);
            try {
              await deletePhoto(photoId);
              await fetchProfile();
            } catch (error) {
              console.error('Failed to delete photo:', error);
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  const handleSetMain = async (photoId: string) => {
    setIsUploadingPhoto(true);
    try {
      await setMainPhoto(photoId);
      await fetchProfile();
    } catch (error) {
      console.error('Failed to set main photo:', error);
      Alert.alert('Error', 'Failed to set main photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoPress = (photo: any) => {
    const isMain = photo.is_main;

    const options: any[] = [];
    if (!isMain) {
      options.push({ text: 'Set as Main', onPress: () => handleSetMain(photo.id) });
    }
    options.push({ text: 'Change Photo', onPress: () => handleReplacePhoto(photo.id) });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Photo Options', isMain ? 'This is your main profile photo.' : 'Choose an action for this photo:', options);
  };

  const handleAvatarPress = () => {
    if (mainPhoto) {
      handlePhotoPress(mainPhoto);
    } else {
      handleAddPhoto(0);
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
          <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
            <Avatar uri={mainPhoto?.image} size={110} style={styles.avatar} />
            {isUploadingPhoto && uploadingSlot === null ? (
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
          {userEmail ? (
            <Text style={[styles.emailSubtext, { color: muted }]}>{userEmail}</Text>
          ) : null}
          <View style={[styles.inlineStats, { marginTop: userEmail ? 10 : 16 }]}>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> Friends</Text>
            <Text style={[styles.inlineStatDot, { color: muted }]}>•</Text>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> Dating</Text>
          </View>
        </View>

        {/* Profile Completion Callout */}
        {profile.profile_completion_pct < 100 ? (
          <View style={[styles.completionCard, { 
            backgroundColor: isDark ? 'rgba(235, 78, 97, 0.10)' : 'rgba(235, 78, 97, 0.05)',
            borderColor: isDark ? 'rgba(235, 78, 97, 0.25)' : 'rgba(235, 78, 97, 0.16)' 
          }]}>
            <View style={styles.completionTopRow}>
              <View style={[styles.completionIconBadge, { backgroundColor: primary + '20' }]}>
                <Icon name={Sparkles} size={16} color={primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.completionHeadline, { color: text }]}>Complete Your Profile</Text>
                <Text style={[styles.completionSubtitle, { color: muted }]}>
                  {profile.profile_completion_pct}% completed • More photos get 3x matches
                </Text>
              </View>
              <View style={[styles.percentPill, { backgroundColor: primary }]}>
                <Text style={styles.percentPillText}>{profile.profile_completion_pct}%</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }]}>
              <View style={[styles.progressBarFill, { backgroundColor: primary, width: `${profile.profile_completion_pct}%` }]} />
            </View>

            {/* Action Items */}
            <View style={styles.actionItemsContainer}>
              {sortedPhotos.length < 3 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionItemCard,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                  onPress={() => handleAddPhoto()}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: primary + '18' }]}>
                    <Icon name={Camera} size={16} color={primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.actionItemTitle, { color: text }]}>
                      Upload {3 - sortedPhotos.length} more photo{3 - sortedPhotos.length > 1 ? 's' : ''}
                    </Text>
                    <Text style={[styles.actionItemSub, { color: muted }]}>
                      Profiles with 3 photos receive up to 3x more interest
                    </Text>
                  </View>
                  <View style={[styles.pointBadge, { backgroundColor: primary + '18' }]}>
                    <Text style={[styles.pointBadgeText, { color: primary }]}>
                      +{sortedPhotos.length === 1 ? '10%' : '5%'}
                    </Text>
                  </View>
                  <Icon name={ChevronRight} size={16} color={muted} style={{ marginLeft: 4 }} />
                </Pressable>
              )}

              {!profile.looking_for && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionItemCard,
                    { 
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                      marginTop: sortedPhotos.length < 3 ? 8 : 0,
                      opacity: pressed ? 0.8 : 1,
                    }
                  ]}
                  onPress={() => router.push('/profile/edit-basic')}
                >
                  <View style={[styles.actionIconBox, { backgroundColor: primary + '18' }]}>
                    <Icon name={Search} size={16} color={primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.actionItemTitle, { color: text }]}>
                      Set Dating Intentions
                    </Text>
                    <Text style={[styles.actionItemSub, { color: muted }]}>
                      Specify what connection you are looking for
                    </Text>
                  </View>
                  <View style={[styles.pointBadge, { backgroundColor: primary + '18' }]}>
                    <Text style={[styles.pointBadgeText, { color: primary }]}>+5%</Text>
                  </View>
                  <Icon name={ChevronRight} size={16} color={muted} style={{ marginLeft: 4 }} />
                </Pressable>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.completedBanner, { 
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.08)',
            borderColor: isDark ? 'rgba(34, 197, 94, 0.28)' : 'rgba(34, 197, 94, 0.2)' 
          }]}>
            <View style={[styles.completedIconBox, { backgroundColor: '#22C55E22' }]}>
              <Icon name={CheckCircle2} size={18} color="#22C55E" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.completedTitle, { color: text }]}>Profile 100% Complete! 🎉</Text>
              <Text style={[styles.completedSub, { color: muted }]}>Your profile has maximum discovery and matching reach.</Text>
            </View>
          </View>
        )}

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>Photos</Text>
              <View style={[styles.countBadge, { backgroundColor: primary + '15' }]}>
                <Text style={[styles.countBadgeText, { color: primary }]}>
                  {sortedPhotos.length}/3
                </Text>
              </View>
            </View>
            {sortedPhotos.length < 3 && (
              <Pressable onPress={() => handleAddPhoto()} hitSlop={10}>
                <Text style={[styles.editText, { color: primary }]}>+ Add</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.photosGridRow}>
            {[0, 1, 2].map((slotIndex) => {
              const photo = sortedPhotos[slotIndex];
              if (photo) {
                return (
                  <View
                    key={photo.id || slotIndex}
                    style={[styles.photoCard, { width: cardWidth, height: cardHeight, backgroundColor: cardColor, borderColor: border }]}
                  >
                    <Pressable
                      style={StyleSheet.absoluteFill}
                      onPress={() => handlePhotoPress(photo)}
                    >
                      <Image
                        source={{ uri: photo.image }}
                        style={styles.photoImage}
                        contentFit="cover"
                        transition={200}
                      />
                    </Pressable>
                    {photo.is_main && (
                      <View style={[styles.mainBadge, { backgroundColor: primary }]} pointerEvents="none">
                        <Text style={styles.mainBadgeText}>MAIN</Text>
                      </View>
                    )}
                    <Pressable
                      style={[styles.photoDeleteBtn, { zIndex: 10 }]}
                      onPress={() => handleDeletePhoto(photo.id)}
                      hitSlop={10}
                    >
                      <Icon name={X} size={12} color="#FFF" />
                    </Pressable>
                  </View>
                );
              }

              return (
                <Pressable
                  key={slotIndex}
                  style={[
                    styles.photoCard,
                    styles.photoCardEmpty,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      borderColor: primary + '45',
                      backgroundColor: isDark ? 'rgba(235, 78, 97, 0.05)' : 'rgba(235, 78, 97, 0.03)',
                    },
                  ]}
                  onPress={() => handleAddPhoto(slotIndex)}
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto && uploadingSlot === slotIndex ? (
                    <ActivityIndicator color={primary} size="small" />
                  ) : (
                    <View style={styles.emptySlotContent}>
                      <View style={[styles.addIconCircle, { backgroundColor: primary + '18' }]}>
                        <Icon name={ImagePlus} size={18} color={primary} />
                      </View>
                      <Text style={[styles.addPhotoSlotText, { color: text }]}>Add Photo</Text>
                      <View style={[styles.slotRewardBadge, { backgroundColor: primary + '15' }]}>
                        <Text style={[styles.slotRewardText, { color: primary }]}>+5%</Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

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
            <InfoRow icon={Mail} label="Email" value={userEmail || '—'} />
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
    marginBottom: 2,
  },
  emailSubtext: {
    fontSize: 14,
    fontWeight: '400',
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
  completionCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  completionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionHeadline: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  completionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  percentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  percentPillText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  actionItemsContainer: {
    marginTop: 2,
  },
  actionItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionItemTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionItemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  pointBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pointBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  completedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  completedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  photosGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  photoCard: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  photoCardEmpty: {
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  mainBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mainBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySlotContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  addIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  addPhotoSlotText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  slotRewardBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotRewardText: {
    fontSize: 10,
    fontWeight: '700',
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
