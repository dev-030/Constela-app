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

import { INTEREST_CATEGORIES } from '@/constants/interests';

export default function EditInterestsScreen() {
  useAndroidBack();
  const insets = useSafeAreaInsets();
  const background = useColor('background');
  const text = useColor('text');
  const muted = useColor('textMuted');
  const border = useColor('border');
  const primary = useColor('primary');

  const { profile, fetchProfile, setProfile } = useProfileStore();

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
      const updated = await updateMyProfile({ interests });
      if (updated) {
        setProfile(updated);
      }
      fetchProfile().catch(console.error);
      router.back();
    } catch (error: any) {
      console.error('Failed to save interests:', error);
      let errMsg = "Failed to save profile";
      if (error?.response?.data && typeof error.response.data === "object") {
        const firstKey = Object.keys(error.response.data)[0];
        if (Array.isArray(error.response.data[firstKey])) {
          errMsg = `${firstKey}: ${error.response.data[firstKey][0]}`;
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
                  marginBottom: category.tags.length > 0 ? 8 : 0,
                }}
              >
                {category.title}
              </Text>
              {category.tags.length > 0 && (
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
              )}
            </Pressable>
          );
        })}
        
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button 
          onPress={handleSave} 
          style={[styles.saveBtn, ...(!hasChanged ? [{ opacity: 0.5 }] : [])]} 
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
