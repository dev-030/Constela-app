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

const INTEREST_CATEGORIES = [
  { title: "Logical & Structured", tags: ["Coding", "Math", "Patterns"] },
  { title: "Visual/Sensory", tags: ["Photography", "Design", "Colors"] },
  { title: "Animals & Nature", tags: ["Biology", "Pets", "Botany"] },
  { title: "Imaginary Universes", tags: ["Sci-Fi", "D&D", "Lore"] },
  { title: "Collecting", tags: ["History", "Antiques", "Cataloging"] },
  { title: "Language", tags: ["Linguistics", "Writing", "Etymology"] },
  { title: "Body & Movement", tags: ["Yoga", "Dance", "Proprioception"] },
  { title: "Mechanical", tags: ["Engines", "Electronics", "Systems"] },
  { title: "Psychology", tags: ["Behavior", "Neurodiversity", "Sociology"] },
];

export default function EditInterestsScreen() {
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

  const [interests, setInterests] = useState<string[]>([]);
  
  useEffect(() => {
    if (profile) {
      setInterests(profile.interests || []);
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = JSON.stringify(interests) !== JSON.stringify(profile?.interests || []);

  const toggleInterest = (category: string) => {
    if (interests.includes(category)) {
      setInterests(interests.filter(v => v !== category));
    } else {
      setInterests([...interests, category]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('interests', JSON.stringify(interests));

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
        <Text style={styles.headerTitle}>My Interests</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.title}>What Sparks Your Curiosity?</Text>
        <Text style={[styles.subtitle, { color: muted }]}>Select all that apply</Text>

        {INTEREST_CATEGORIES.map(category => {
          const selected = interests.includes(category.title);
          return (
            <Pressable
              key={category.title}
              onPress={() => toggleInterest(category.title)}
              style={{
                borderWidth: 1.5,
                borderColor: selected ? primary + "30" : border,
                borderRadius: 14,
                padding: 16,
                backgroundColor: selected ? primary + "15" : background,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: text,
                  marginBottom: 8,
                }}
              >
                {category.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {category.tags.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      backgroundColor: selected ? primary + "15" : muted + "22",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "500",
                        color: selected ? primary : muted,
                      }}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          );
        })}
        
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
  
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },

  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0 },
  saveBtn: { borderRadius: 24 },
});
