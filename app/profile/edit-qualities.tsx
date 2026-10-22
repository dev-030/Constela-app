import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { SelectablePill } from '@/components/ui/selectable-pill';
import { useColor } from '@/hooks/useColor';
import { useProfileStore } from '@/store/profileStore';
import { updateMyProfile } from '@/api/profile';
import { useAndroidBack } from '@/hooks/useAndroidBack';
import { useTranslation } from 'react-i18next';
import { useProfileLabels } from "@/hooks/use-profile-labels";

// Removed MAX constant for unlimited selections

const QUALITIES = [
  "Authenticity", "Loyalty", "Reliability", "Emotional Sensitivity",
  "Kindness", "Honesty", "Respect for Boundaries", "Hyperfocus",
  "Creativity", "Deep Thinking", "Tree-like Thinking", "Attention to Detail",
  "Strong Memory", "Intense Curiosity", "Rich Imagination", "Artistic Sense",
  "Originality", "Aesthetic Sense", "Deep Empathy", "Active Listening",
  "Sincere Communication", "Respect for Personal Space", "Authentic Commitment",
  "Positive Intensity", "Resilience", "Perseverance", "Sense of Justice",
  "Reliability in Routines",
];

export default function EditQualitiesScreen() {
  const { t, i18n } = useTranslation();
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

  const [qualities, setQualities] = useState<string[]>([]);
  
  useEffect(() => {
    if (profile) {
      setQualities(profile.qualities || []);
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);

  const hasChanged = JSON.stringify(qualities) !== JSON.stringify(profile?.qualities || []);

  const toggleQuality = (q: string) => {
    if (qualities.includes(q)) {
      setQualities(qualities.filter(v => v !== q));
    } else {
      setQualities([...qualities, q]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({ qualities });
      if (updated) {
        setProfile(updated);
      }
      fetchProfile().catch(console.error);
      router.back();
    } catch (error: any) {
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
      Alert.alert(t('edit_profile.error'), errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const { listLabel } = useProfileLabels();
  const getQualityLabel = (q: string) => listLabel('qualities', q);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('edit_profile.qualities')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.title}>{t('onboarding.step5_title')}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{t('onboarding.step5_subtitle')}</Text>

        <View style={[styles.counterBox, { borderColor: muted + '44' }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: qualities.length > 0 ? 12 : 0 }}>
            <Text style={[styles.counterLabel, { color: muted }]}>{t('onboarding.your_selection')}</Text>
            <Text style={[styles.counterValue, { color: primary }]}>{t('onboarding.selected_count', { count: qualities.length })}</Text>
          </View>

          {qualities.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {qualities.map((q) => (
                  <Pressable
                    key={q}
                    onPress={() => toggleQuality(q)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: primary + '15',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 4
                    }}
                  >
                    <Text style={{ color: primary, fontSize: 12, fontWeight: '600' }}>{getQualityLabel(q)}</Text>
                    <Icon name={X} size={14} color={primary} />
                  </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.pillContainer}>
          {QUALITIES.map(item => (
            <SelectablePill 
              key={item} 
              label={getQualityLabel(item)} 
              selected={qualities.includes(item)} 
              onPress={() => toggleQuality(item)} 
            />
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
        <Button 
          onPress={handleSave} 
          style={[styles.saveBtn, ...(!hasChanged ? [{ opacity: 0.5 }] : [])]} 
          disabled={isSaving || !hasChanged}
        >
          {isSaving ? <ActivityIndicator color="#FFF" /> : t('edit_profile.save_changes')}
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
  
  counterBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    minHeight: 56,
  },
  counterLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  counterValue: { fontSize: 12, fontWeight: "700" },
  
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0 },
  saveBtn: { borderRadius: 24 },
});
