import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Camera, Edit3, ChevronDown } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { FilterPill } from '@/components/ui/filter-pill';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';

export default function EditBasicScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const cardColor = useColor('card');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const border = useColor('border');

  const [gender, setGender] = useState('Non-Binary');
  const [lookingFor, setLookingFor] = useState('Non-Binary');
  const [maritalStatus, setMaritalStatus] = useState('Single');

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
        <Text style={styles.sectionTitle}>PROFILE PHOTOS (AT LEAST 1 PHOTO)</Text>
        <View style={styles.photoGrid}>
          {/* Main Photo */}
          <View style={styles.photoBox}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=68' }}
              style={styles.photoImg}
            />
            <View style={[styles.editIconBadge, { backgroundColor: '#E65100' }]}>
              <Icon name={Edit3} size={14} color="#FFF" />
            </View>
          </View>

          {/* Add Photo Placeholders */}
          <Pressable style={[styles.addPhotoBox, { borderColor: border, backgroundColor: cardColor }]}>
            <Icon name={Camera} size={20} color={muted} />
            <Text style={[styles.addPhotoText, { color: muted }]}>Add Photo</Text>
          </Pressable>
          <Pressable style={[styles.addPhotoBox, { borderColor: border, backgroundColor: cardColor }]}>
            <Icon name={Camera} size={20} color={muted} />
            <Text style={[styles.addPhotoText, { color: muted }]}>Add Photo</Text>
          </Pressable>
        </View>

        {/* Personal Details */}
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Username *</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>Alex Chen</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Age *</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>28</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Height (cm)</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>175</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Weight (kg)</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>70</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>City *</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>Portland, OR</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Country *</Text>
          <View style={[styles.inputContainer, { borderColor: border }]}>
            <Text style={styles.inputValue}>USA</Text>
          </View>
        </View>

        {/* Identity & Status */}
        <Text style={styles.sectionTitle}>IDENTITY & STATUS</Text>

        <Text style={styles.inputLabel}>Gender *</Text>
        <View style={styles.pillRow}>
          {['Non-Binary', 'Male', 'Female', 'Other'].map(item => (
            <FilterPill
              key={item} label={item}
              selected={gender === item}
              onPress={() => setGender(item)}
              style={gender !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }}
            />
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Looking for *</Text>
        <View style={styles.pillRow}>
          {['Non-Binary', 'Man', 'Woman'].map(item => (
            <FilterPill
              key={item} label={item}
              selected={lookingFor === item}
              onPress={() => setLookingFor(item)}
              style={lookingFor !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }}
            />
          ))}
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Marital Status *</Text>
        <View style={styles.pillRow}>
          {['Single', 'Widowed', 'Divorced', 'Separated'].map(item => (
            <FilterPill
              key={item} label={item}
              selected={maritalStatus === item}
              onPress={() => setMaritalStatus(item)}
              style={maritalStatus !== item && { backgroundColor: 'transparent', borderWidth: 1, borderColor: border }}
            />
          ))}
        </View>

        {/* Education */}
        <Text style={styles.sectionTitle}>EDUCATION</Text>
        <Text style={styles.inputLabel}>Education Level</Text>
        <View style={[styles.inputContainer, styles.rowBetween, { borderColor: border }]}>
          <Text style={styles.inputValue}>Bachelors Degree</Text>
          <Icon name={ChevronDown} size={20} color={muted} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button
          onPress={() => router.back()}
          style={styles.saveBtn}
        >
            Save Changes
        </Button>
      </View>
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
  divider: {
    height: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 16,
    color: '#555',
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBox: {
    width: 100,
    height: 120,
    borderRadius: 12,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  editIconBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  addPhotoBox: {
    width: 100,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputValue: {
    fontSize: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  saveBtn: {
    borderRadius: 24,
  },
});
