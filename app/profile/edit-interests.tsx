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
import { useTranslation } from 'react-i18next';
import { INTEREST_CATEGORIES } from '@/constants/interests';

const INTEREST_CATEGORIES_FR: Record<string, { title: string; tags: Record<string, string> }> = {
  "Logical and structured systems": {
    title: "Systèmes logiques et structurés",
    tags: {
      "mathematics": "mathématiques",
      "computer science / programming": "informatique / programmation",
      "maps, plans, geography": "cartes, plans, géographie",
      "schedules, calendars, subway lines": "horaires, calendriers, lignes de métro",
    },
  },
  "Visual or sensory universes": {
    title: "Univers visuels ou sensoriels",
    tags: {
      "colors": "couleurs",
      "textures": "textures",
      "lights, reflections, shadows": "lumières, reflets, ombres",
      "spinning objects": "objets en rotation",
    },
  },
  "Animals and nature": {
    title: "Animaux et nature",
    tags: {
      "specific animals (horses, cats, dinosaurs...)": "animaux spécifiques (chevaux, chats, dinosaures...)",
      "plants, trees, botany": "plantes, arbres, botanique",
      "natural phenomena": "phénomènes naturels",
    },
  },
  "Imaginary universes / Science fiction": {
    title: "Univers imaginaires / Science-fiction",
    tags: {},
  },
  "Video games": {
    title: "Jeux vidéo",
    tags: {},
  },
  "Manga": {
    title: "Manga",
    tags: {},
  },
  "Collecting, sorting, organizing": {
    title: "Collectionner, trier, organiser",
    tags: {
      "collections (objects, cards, figurines...)": "collections (objets, cartes, figurines...)",
      "categorization": "catégorisation",
      "organization systems": "systèmes d'organisation",
    },
  },
  "Language, words, communication": {
    title: "Langue, mots, communication",
    tags: {
      "linguistics": "linguistique",
      "language learning": "apprentissage des langues",
      "creative writing": "écriture créative",
      "poetry, wordplay": "poésie, jeux de mots",
    },
  },
  "Body, movement, sensations": {
    title: "Corps, mouvement, sensations",
    tags: {
      "dance": "danse",
      "martial arts": "arts martiaux",
      "walking, hiking": "marche, randonnée",
      "swimming": "natation",
    },
  },
  "Mechanical or technical objects": {
    title: "Objets mécaniques ou techniques",
    tags: {
      "trains": "trains",
      "machines": "machines",
      "watches, gears": "montres, engrenages",
      "electronics": "électronique",
    },
  },
  "Mental health, psychology, human functioning": {
    title: "Santé mentale, psychologie, fonctionnement humain",
    tags: {
      "neurodiversity": "neurodiversité",
      "psychology": "psychologie",
      "personal development": "développement personnel",
    },
  },
};

export default function EditInterestsScreen() {
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
      let errMsg = t('edit_profile.failed_save');
      if (error?.response?.data && typeof error.response.data === "object") {
        const firstKey = Object.keys(error.response.data)[0];
        if (Array.isArray(error.response.data[firstKey])) {
          errMsg = `${firstKey}: ${error.response.data[firstKey][0]}`;
        } else if (typeof error.response.data[firstKey] === "string") {
          errMsg = error.response.data[firstKey];
        }
      }
      Alert.alert(t('edit_profile.error'), errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const isFrench = i18n.language?.startsWith("fr");
  const getCategoryTitle = (title: string) => (isFrench ? INTEREST_CATEGORIES_FR[title]?.title || title : title);
  const getTagLabel = (categoryTitle: string, tag: string) =>
    isFrench ? INTEREST_CATEGORIES_FR[categoryTitle]?.tags[tag] || tag : tag;

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingBottom: 16 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Icon name={ChevronLeft} size={24} color={text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('edit_profile.interests')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.title}>{t('onboarding.step6_title')}</Text>
        <Text style={[styles.subtitle, { color: muted }]}>{t('onboarding.step6_subtitle')}</Text>

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
                {getCategoryTitle(category.title)}
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
                        {getTagLabel(category.title, tag)}
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
  
  categoryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 12,
  },

  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0 },
  saveBtn: { borderRadius: 24 },
});
