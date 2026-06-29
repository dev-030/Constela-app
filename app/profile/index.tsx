import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, User, MapPin, Heart, Activity, CheckCircle, Lightbulb, Edit2, CigaretteOff, WineOff, Dog, Dumbbell, Utensils } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { FilterPill } from '@/components/ui/filter-pill';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { useEffect } from 'react';

const SectionHeader = ({ title, icon, onEdit }: { title: string; icon: any; onEdit?: () => void }) => {
  const primary = useColor('primary');
  const text = useColor('text');

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Icon name={icon} size={20} color={primary} />
        <Text style={[styles.sectionTitle, { color: primary }]}>{title}</Text>
      </View>
      {onEdit && (
        <Pressable onPress={onEdit} style={styles.editBtn} hitSlop={10}>
          <Icon name={Edit2} size={14} color={primary} />
          <Text style={[styles.editText, { color: primary }]}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
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

  useEffect(() => {
    if (!profile) fetchProfile();
  }, []);

  if (isLoading || !profile) {
    return (
      <View style={[styles.container, { backgroundColor: background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: text }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backBtn} /> {/* Placeholder for alignment */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Overview */}
        <View style={styles.overview}>
          <Image
            source={{ uri: profile.photos && profile.photos.length > 0 ? profile.photos[0].image : 'https://i.pravatar.cc/150?img=68' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{profile.username}, {profile.age}</Text>
          <View style={[styles.pill, { backgroundColor: primary + '20' }]}>
            <Text style={[styles.pillText, { color: primary }]}>{profile.looking_for || 'Friendship'}</Text>
          </View>
          <Text style={[styles.location, { color: muted }]}>{profile.city}, {profile.country}</Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor: border }]}>
              <Text style={[styles.statValue, { color: primary }]}>24</Text>
              <Text style={[styles.statLabel, { color: muted }]}>Friends</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: cardColor, borderColor: border }]}>
              <Text style={[styles.statValue, { color: primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: muted }]}>Dating</Text>
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        <View style={[styles.completionCard, { backgroundColor: cardColor, borderColor: border }]}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={[styles.completionPercent, { color: primary }]}>{profile.profile_completion_pct}%</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: border }]}>
            <View style={[styles.progressBarFill, { backgroundColor: primary, width: `${profile.profile_completion_pct}%` }]} />
          </View>
          <Text style={[styles.completionDesc, { color: primary }]}>Complete your profile to get more relevant matches.</Text>
        </View>

        {/* Basic Info */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="Basic Info" icon={User} onEdit={() => router.push('/profile/edit-basic')} />
          <Text style={[styles.bio, { color: muted }]}>
            Passionate about building inclusive digital spaces and finding the perfect quiet corner in a library. I value direct communication and sensory-friendly environments.
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Gender</Text><Text style={styles.infoValue}>{profile.gender}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Marital Status</Text><Text style={styles.infoValue}>{profile.marital_status}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Languages</Text><Text style={styles.infoValue}>{profile.spoken_languages?.join(', ')}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>City</Text><Text style={styles.infoValue}>{profile.city}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Height/Weight</Text><Text style={styles.infoValue}>{profile.height_cm}cm, {profile.weight_kg}kg</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Looking for</Text><Text style={styles.infoValue}>{profile.looking_for}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Neurodivergence</Text><Text style={styles.infoValue}>{profile.neurotype_labels?.join(', ')}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Education</Text><Text style={styles.infoValue}>{profile.education_level}</Text></View>
            <View style={styles.infoItem}><Text style={[styles.infoLabel, { color: muted }]}>Has Children</Text><Text style={styles.infoValue}>{profile.has_children ? 'Yes' : 'No'}</Text></View>
          </View>
        </View>

        {/* Emotional Landscape */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="Emotional Landscape" icon={MapPin} onEdit={() => router.push('/profile/edit-emotional')} />

          <Text style={styles.subHeading}>RECHARGE</Text>
          <View style={styles.tagsRow}>
            {profile.recharge_methods?.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: primary + '33' }]}><Text style={[styles.tagText, { color: primary }]}>{item}</Text></View>
            ))}
          </View>

          <Text style={styles.subHeading}>EXHAUSTS</Text>
          <View style={styles.tagsRow}>
            {profile.exhaust_triggers?.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: '#FFCDD2' }]}><Text style={[styles.tagText, { color: '#C62828' }]}>{item}</Text></View>
            ))}
          </View>

          <Text style={styles.subHeading}>NEEDS</Text>
          <View style={styles.tagsRow}>
            {profile.emotional_needs?.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: primary + '33' }]}><Text style={[styles.tagText, { color: primary }]}>{item}</Text></View>
            ))}
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subHeading}>HUMOR</Text>
              <Text style={styles.infoValue}>{profile.second_degree_humor ? 'Second-Degree' : 'Normal'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subHeading}>SOOTHES</Text>
              <Text style={styles.infoValue}>{profile.soothe_methods?.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Relationship & Children */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="Relationship & Children" icon={Heart} onEdit={() => {}} />
          <View style={styles.rowBetween}>
            <Text style={[styles.infoLabel, { color: muted }]}>Looking for</Text>
            <Text style={[styles.infoValue, { color: '#D84315' }]}>{profile.looking_for}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.rowBetween}>
            <Text style={[styles.infoLabel, { color: muted }]}>Wants Children</Text>
            <Text style={styles.infoValue}>{profile.wants_children ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {/* Lifestyle Habits */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="Lifestyle Habits" icon={Activity} onEdit={() => {}} />
          <View style={styles.habitGrid}>
            <View style={styles.habitItem}><Icon name={CigaretteOff} size={16} color={muted} /><Text style={styles.habitText}>Smoking: {profile.smoking ? 'Yes' : 'No'}</Text></View>
            <View style={styles.habitItem}><Icon name={WineOff} size={16} color={muted} /><Text style={styles.habitText}>Alcohol: {profile.alcohol ? 'Yes' : 'No'}</Text></View>
            <View style={styles.habitItem}><Icon name={Dog} size={16} color={muted} /><Text style={styles.habitText}>Pets: {profile.pets ? 'Yes' : 'No'}</Text></View>
            <View style={styles.habitItem}><Icon name={Dumbbell} size={16} color={muted} /><Text style={styles.habitText}>Sport: {profile.sport}</Text></View>
            <View style={[styles.habitItem, { width: '100%' }]}><Icon name={Utensils} size={16} color={muted} /><Text style={styles.habitText}>Eating Habits: {profile.eating_habits}</Text></View>
          </View>
        </View>

        {/* My Qualities */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="My Qualities" icon={CheckCircle} onEdit={() => {}} />
          <View style={styles.tagsRow}>
            {profile.qualities?.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: '#FFE0B2' }]}><Text style={[styles.tagText, { color: '#E65100' }]}>{item}</Text></View>
            ))}
          </View>
        </View>

        {/* Sparks Curiosity */}
        <View style={[styles.card, { backgroundColor: background, borderColor: border }]}>
          <SectionHeader title="Sparks Curiosity" icon={Lightbulb} onEdit={() => {}} />

          <Text style={styles.subHeading}>INTERESTS</Text>
          <View style={styles.tagsRow}>
            {profile.interests?.map((item, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: primary + '33' }]}><Text style={[styles.tagText, { color: primary }]}>{item}</Text></View>
            ))}
          </View>
        </View>

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  overview: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  pillText: {
    fontWeight: '600',
    fontSize: 12,
  },
  location: {
    fontSize: 12,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  completionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  completionPercent: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  completionDesc: {
    fontSize: 12,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  subHeading: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
    color: '#666',
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
  twoColRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  habitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
    columnGap: 8,
  },
  habitItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitText: {
    fontSize: 14,
  },
});
