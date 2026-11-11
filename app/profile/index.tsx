import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
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
import { ensureExpoPermission } from '@/utils/permissions';
import { Avatar } from '@/components/ui/avatar';
import { uploadPhoto, deletePhoto, setMainPhoto } from '@/api/profile';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useProfileLabels } from '@/hooks/use-profile-labels';
import { useTranslation } from 'react-i18next';
import { showAlert } from "@/components/ui/app-alert";

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
  const { horizontalPadding } = useResponsiveLayout();

  return (
    <View style={[styles.sectionHeader, { paddingHorizontal: horizontalPadding + 2 }]}>
      <Text style={[styles.sectionTitle, { color: text }]}>{title}</Text>
      {onEdit && (
        <Pressable onPress={onEdit} hitSlop={10}>
          <Text style={[styles.editText, { color: primary }]}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
};

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { label, listLabel, rechargeTitle, interestCategory } = useProfileLabels();
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');
  const isDark = useColorScheme() === 'dark';

  const { isCompact, horizontalPadding, width } = useResponsiveLayout();
  const cardGap = isCompact ? 8 : 8;
  const cardWidth = Math.floor((width - horizontalPadding * 2 - cardGap * 2) / 3);
  const cardHeight = Math.round(cardWidth * 1.32);
  const avatarSize = isCompact ? 88 : 110;

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
    if (!(await ensureExpoPermission('gallery', ImagePicker.requestMediaLibraryPermissionsAsync))) return;

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
        showAlert('Upload Failed', 'There was an issue uploading your photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
        setUploadingSlot(null);
      }
    }
  };

  const handleReplacePhoto = async (photoId: string) => {
    if (!(await ensureExpoPermission('gallery', ImagePicker.requestMediaLibraryPermissionsAsync))) return;

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
        showAlert('Replace Failed', 'There was an issue updating your photo. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (sortedPhotos.length <= 1) {
      showAlert('Cannot Delete', 'You must have at least one photo on your profile.');
      return;
    }

    showAlert(
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
              showAlert('Error', 'Failed to delete photo. Please try again.');
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
      showAlert('Error', 'Failed to set main photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoPress = (photo: any) => {
    const isMain = photo.is_main;

    const options: any[] = [];
    if (!isMain) {
      options.push({ text: t('profile.set_as_main'), onPress: () => handleSetMain(photo.id) });
    }
    options.push({ text: t('profile.change_photo'), onPress: () => handleReplacePhoto(photo.id) });
    options.push({ text: t('profile.cancel'), style: 'cancel' });

    showAlert(t('profile.photo_options'), isMain ? t('profile.main_photo_desc') : t('profile.choose_action'), options);
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
        <Text style={[styles.headerTitle, { color: text }]}>{t('profile.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 110) }]} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.overview, isCompact && { paddingVertical: 14 }]}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarContainer}>
            <Avatar uri={mainPhoto?.image} size={avatarSize} style={[styles.avatar, isCompact && { borderRadius: avatarSize / 2 }]} />
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
          <Text style={[styles.name, { color: text }, isCompact && { fontSize: 19 }]}>{profile.user?.first_name || profile.username}, {profile.age}</Text>
          {userEmail ? (
            <Text style={[styles.emailSubtext, { color: muted }]}>{userEmail}</Text>
          ) : null}
          <View style={[styles.inlineStats, { marginTop: userEmail ? (isCompact ? 6 : 10) : (isCompact ? 10 : 16) }]}>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> {t('profile.friends_count')}</Text>
            <Text style={[styles.inlineStatDot, { color: muted }]}>•</Text>
            <Text style={[styles.inlineStatText, { color: text }]}><Text style={{fontWeight: 'bold'}}>0</Text> {t('profile.dating_count')}</Text>
          </View>
        </View>

        {/* Profile Completion Callout */}
        {profile.profile_completion_pct < 100 ? (
          <View style={[styles.completionCard, { 
            backgroundColor: isDark ? 'rgba(235, 78, 97, 0.10)' : 'rgba(235, 78, 97, 0.05)',
            borderColor: isDark ? 'rgba(235, 78, 97, 0.25)' : 'rgba(235, 78, 97, 0.16)',
            marginHorizontal: horizontalPadding,
            padding: isCompact ? 12 : 16,
            marginBottom: isCompact ? 16 : 24,
          }]}>
            <View style={styles.completionTopRow}>
              <View style={[styles.completionIconBadge, { backgroundColor: primary + '20' }]}>
                <Icon name={Sparkles} size={16} color={primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.completionHeadline, { color: text }]}>{t('profile.complete_title')}</Text>
                <Text style={[styles.completionSubtitle, { color: muted }]}>
                  {t('profile.complete_subtitle', { pct: profile.profile_completion_pct })}
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
                      {t('profile.add_more_photos')}
                    </Text>
                    <Text style={[styles.actionItemSub, { color: muted }]}>
                      {t('profile.add_photos_sub')}
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
                      {t('profile.set_intentions')}
                    </Text>
                    <Text style={[styles.actionItemSub, { color: muted }]}>
                      {t('profile.set_intentions_sub')}
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
              <Text style={[styles.completedTitle, { color: text }]}>{t('profile.profile_complete_title')}</Text>
              <Text style={[styles.completedSub, { color: muted }]}>{t('profile.profile_complete_sub')}</Text>
            </View>
          </View>
        )}

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.sectionTitle, { color: text }]}>{t('profile.photos')}</Text>
              <View style={[styles.countBadge, { backgroundColor: primary + '15' }]}>
                <Text style={[styles.countBadgeText, { color: primary }]}>
                  {sortedPhotos.length}/3
                </Text>
              </View>
            </View>
            {sortedPhotos.length < 3 && (
              <Pressable onPress={() => handleAddPhoto()} hitSlop={10}>
                <Text style={[styles.editText, { color: primary }]}>{t('profile.add')}</Text>
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
                      <Text style={[styles.addPhotoSlotText, { color: text }]}>{t('profile.add_photo')}</Text>
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
          <SectionHeader title={t('profile.verification')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            {profile.face_verification_status === "approved" ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#22C55E15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Icon name={Smile} size={16} color="#22C55E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: text }}>{t('profile.verified_account')}</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>{t('profile.verified_sub')}</Text>
                </View>
              </View>
            ) : profile.face_verification_status === "pending" ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EAB30815', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                  <Icon name={Smile} size={16} color="#EAB308" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, color: text }}>{t('profile.verification_pending')}</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>{t('profile.pending_sub')}</Text>
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
                  <Text style={{ fontSize: 16, color: primary, fontWeight: '600' }}>{t('profile.get_verified')}</Text>
                  <Text style={{ fontSize: 13, color: muted, marginTop: 2 }}>{t('profile.get_verified_sub')}</Text>
                </View>
              </Pressable>
            )}
          </View>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.basic_info')} onEdit={() => router.push('/profile/edit-basic')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoRow icon={User} label={t('profile.name')} value={profile.user?.first_name || '—'} />
            <InfoRow icon={User} label={t('profile.username')} value={profile.username || '—'} />
            <InfoRow icon={Mail} label={t('profile.email')} value={userEmail || '—'} />
            <InfoRow icon={Smile} label={t('profile.gender')} value={label(profile.gender)} />
            <InfoRow icon={Heart} label={t('profile.pref_gender')} value={label(profile.gender_preference)} />
            <InfoRow icon={Heart} label={t('profile.marital_status')} value={label(profile.marital_status)} />
            <InfoTagsRow icon={Search} label={t('profile.looking_for')} tags={profile.looking_for ? [label(profile.looking_for)] : []} layout="row" />
            <InfoTagsRow icon={Globe} label={t('profile.languages')} tags={profile.spoken_languages} layout="row" />
            <InfoRow icon={MapPin} label={t('profile.city')} value={profile.city || '—'} />
            <InfoRow icon={Activity} label={t('profile.height_weight')} value={[profile.height_cm ? `${profile.height_cm}cm` : null, profile.weight_kg ? `${profile.weight_kg}kg` : null].filter(Boolean).join(', ') || '—'} />
            <InfoRow icon={BookOpen} label={t('profile.education')} value={label(profile.education_level)} isLast />
          </View>
        </View>

        {/* My Qualities */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.my_qualities')} onEdit={() => router.push('/profile/edit-qualities')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Star} label={t('profile.my_qualities')} tags={(profile.qualities || []).map((q: string) => listLabel('qualities', q))} isLast />
          </View>
        </View>

        {/* My Interests */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.my_interests')} onEdit={() => router.push('/profile/edit-interests')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Compass} label={t('profile.my_interests')} tags={(profile.interests || []).map((i: string) => interestCategory(i))} isLast />
          </View>
        </View>

        {/* Neurodivergence */}
        {profile.neurotype_labels && profile.neurotype_labels.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title={t('profile.neurodivergence')} onEdit={() => router.push('/profile/edit-neuro')} />
            <View style={[styles.card, { backgroundColor: cardColor }]}>
              <InfoTagsRow icon={Brain} label={t('profile.neurodivergence')} tags={(profile.neurotype_labels || []).map((n: string) => listLabel('neurotypes', n))} isLast />
            </View>
          </View>
        )}

        {/* Emotional Landscape */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.emotional_landscape')} onEdit={() => router.push('/profile/edit-emotional')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoTagsRow icon={Battery} label={t('profile.recharge_methods')} tags={(profile.recharge_methods || []).map((m: string) => rechargeTitle(m))} />
            <InfoTagsRow icon={Zap} label={t('profile.exhaust_triggers')} tags={(profile.exhaust_triggers || []).map((e: string) => listLabel('exhausts', e))} />
            <InfoRow icon={Smile} label={t('profile.humor')} value={profile.second_degree_humor ? t('profile.humor_second') : t('profile.humor_normal')} />
            <InfoTagsRow icon={Heart} label={t('profile.soothes')} tags={(profile.soothe_methods || []).map((s: string) => listLabel('soothes', s))} isLast />
          </View>
        </View>

        {/* Lifestyle & Relationship */}
        <View style={styles.section}>
          <SectionHeader title={t('profile.lifestyle')} onEdit={() => router.push('/profile/edit-lifestyle')} />
          <View style={[styles.card, { backgroundColor: cardColor }]}>
            <InfoRow icon={Users} label={t('profile.has_children')} value={profile.has_children ? t('profile.yes') : t('profile.no')} />
            <InfoRow icon={Users} label={t('profile.wants_children')} value={profile.wants_children ? t('profile.yes') : t('profile.no')} />
            <InfoRow icon={Activity} label={t('profile.smoking')} value={profile.smoking ? t('profile.yes') : t('profile.no')} />
            <InfoRow icon={Wine} label={t('profile.alcohol')} value={profile.alcohol ? t('profile.yes') : t('profile.no')} />
            <InfoRow icon={Smile} label={t('profile.pets')} value={profile.pets ? t('profile.yes') : t('profile.no')} />
            <InfoRow icon={Activity} label={t('profile.sport')} value={label(profile.sport)} />
            <InfoRow icon={Utensils} label={t('profile.eating_habits')} value={label(profile.eating_habits)} isLast />
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
    paddingHorizontal: 12,
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
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 10,
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
    marginHorizontal: 12,
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
