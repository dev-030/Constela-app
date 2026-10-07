import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, TouchableWithoutFeedback, Platform, Animated, useWindowDimensions, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  X,
  Heart,
  Users,
  HelpCircle,
  PartyPopper,
  Check,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { RangeSlider } from "@/components/ui/range-slider";
import { FilterPill } from "@/components/ui/filter-pill";
import { FilterCard } from "@/components/ui/filter-card";
import { FilterListItem } from "@/components/ui/filter-list-item";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useColor } from "@/hooks/useColor";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useProfileStore } from "@/store/profileStore";
import { updateMyProfile } from "@/api/profile";
import { useFilterStore } from "@/store/filterStore";
import { useAndroidBack } from "@/hooks/useAndroidBack";
import { LANGUAGES } from "@/constants/languages";
import { INTERESTS_POOL } from "@/constants/matches";
import { Search } from "lucide-react-native";
import { TextInput } from "react-native";

export default function FiltersScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const { width, height } = useWindowDimensions();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const globalFilters = useFilterStore(state => state.filters);
  const { profile, fetchProfile } = useProfileStore();

  // Basic States
  const [ageRange, setAgeRange] = useState({ 
    low: globalFilters.age_min || 18, 
    high: globalFilters.age_max || 65 
  });
  const [heightRange, setHeightRange] = useState({
    low: globalFilters.height_min || 140,
    high: globalFilters.height_max || 220
  });

  const slideAnim = useRef(new Animated.Value(height)).current;
  const [isApplying, setIsApplying] = useState(false);
  const queryClient = useQueryClient();
  const setGlobalFilters = useFilterStore(state => state.setFilters);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [height, slideAnim]);

  const handleClose = () => {
    if (isApplying) return;
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleApply = async () => {
    setIsApplying(true);
    
    let mappedGender: string | undefined = undefined;
    if (selectedGender === "Woman") mappedGender = "woman";
    if (selectedGender === "Man") mappedGender = "man";
    if (selectedGender === "Non-binary") mappedGender = "non_binary";
    if (selectedGender === "Other") mappedGender = "other";
    if (selectedGender === "Everyone") mappedGender = "everyone";

    if (mappedGender && profile && profile.gender_preference !== mappedGender) {
      try {
        const formData = new FormData();
        formData.append("gender_preference", mappedGender);
        await updateMyProfile(formData);
        await fetchProfile();
      } catch (err) {
        console.error("Failed to update gender preference", err);
      }
    }
    
    const newFilters = {
      age_min: ageRange.low !== 18 ? ageRange.low : undefined,
      age_max: ageRange.high !== 65 ? ageRange.high : undefined,
      height_min: heightRange.low !== 140 ? heightRange.low : undefined,
      height_max: heightRange.high !== 220 ? heightRange.high : undefined,
      gender: mappedGender,
      marital_status: selectedMaritalStatus.length ? selectedMaritalStatus.join(',') : undefined,
      looking_for: selectedLookingFor.length ? selectedLookingFor.join(',') : undefined,
      spoken_languages: selectedLanguages.length ? selectedLanguages.join(',') : undefined,
      education_level: selectedEducation || undefined,
      smoking: smoking ? true : undefined,
      alcohol: alcohol ? true : undefined,
      sport: selectedSport || undefined,
      interests: selectedInterests.length ? selectedInterests.join(',') : undefined,
      recharge_methods: recharge.length ? recharge.join(',') : undefined,
      exhaust_triggers: exhausts.length ? exhausts.join(',') : undefined,
      emotional_needs: needs.length ? needs.join(',') : undefined,
      second_degree_humor: humor === 'Yes' ? true : undefined,
      soothe_methods: soothes.length ? soothes.join(',') : undefined,
    };
    
    setGlobalFilters(newFilters);
    
    try {
      await queryClient.invalidateQueries({ queryKey: ['perfectMatchInfinite'] });
    } catch (e) {
      console.error(e);
    } finally {
      setIsApplying(false);
      handleClose();
    }
  };

  const reverseGenderMap: Record<string, string> = {
    woman: "Woman",
    man: "Man",
    non_binary: "Non-binary",
    other: "Other",
    everyone: "Everyone"
  };

  const initGender = () => {
    if (globalFilters.gender) {
      return reverseGenderMap[globalFilters.gender.toLowerCase()] || globalFilters.gender;
    }
    if (profile?.gender_preference) {
      return reverseGenderMap[profile.gender_preference.toLowerCase()] || profile.gender_preference;
    }
    return "";
  };

  const [selectedGender, setSelectedGender] = useState(initGender());
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState<string[]>(
    globalFilters.marital_status ? globalFilters.marital_status.split(',') : []
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    globalFilters.spoken_languages ? globalFilters.spoken_languages.split(',') : []
  );
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(
    globalFilters.looking_for ? globalFilters.looking_for.split(',') : []
  );

  // Advanced States
  const [selectedEducation, setSelectedEducation] = useState(globalFilters.education_level || "");
  const [smoking, setSmoking] = useState(globalFilters.smoking || false);
  const [alcohol, setAlcohol] = useState(globalFilters.alcohol || false);
  const [selectedSport, setSelectedSport] = useState(globalFilters.sport || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    globalFilters.interests ? globalFilters.interests.split(',') : []
  );

  const [recharge, setRecharge] = useState<string[]>(
    globalFilters.recharge_methods ? globalFilters.recharge_methods.split(',') : []
  );
  const [exhausts, setExhausts] = useState<string[]>(
    globalFilters.exhaust_triggers ? globalFilters.exhaust_triggers.split(',') : []
  );
  const [needs, setNeeds] = useState<string[]>(
    globalFilters.emotional_needs ? globalFilters.emotional_needs.split(',') : []
  );
  const [humor, setHumor] = useState(globalFilters.second_degree_humor ? "Yes" : "");
  const [soothes, setSoothes] = useState<string[]>(
    globalFilters.soothe_methods ? globalFilters.soothe_methods.split(',') : []
  );

  const [languagesSheetOpen, setLanguagesSheetOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState("");

  const renderSectionHeader = (title: string, valueStr?: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {valueStr && (
        <Text style={[styles.sectionValue, { color: primary }]}>
          {valueStr}
        </Text>
      )}
    </View>
  );

  const toggleArrayItem = (
    arr: string[],
    setArr: (val: string[]) => void,
    item: string,
  ) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const renderBasicTab = () => (
    <>
      <View style={styles.section}>
        {renderSectionHeader(t('filters.age_range'), `${ageRange.low} - ${ageRange.high}`)}
        <RangeSlider
          min={18}
          max={100}
          low={ageRange.low}
          high={ageRange.high}
          onValueChanged={(l, h) => setAgeRange({ low: l, high: h || 100 })}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader(t('filters.looking_for'))}
        <View style={styles.wrapContainer}>
          {["Woman", "Man", "Non-binary", "Other", "Everyone"].map((g) => (
            <FilterPill
              key={g}
              label={g}
              selected={selectedGender === g}
              onPress={() => setSelectedGender(selectedGender === g ? "" : g)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        {renderSectionHeader(t('filters.height'), `${heightRange.low} - ${heightRange.high}cm`)}
        <RangeSlider
          min={140}
          max={220}
          low={heightRange.low}
          high={heightRange.high}
          onValueChanged={(l, h) => setHeightRange({ low: l, high: h || 220 })}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader(t('filters.marital_status'))}
        <View style={styles.wrapContainer}>
          {["Single", "Married", "Divorced", "Widowed"].map((status) => (
            <FilterPill
              key={status}
              label={status}
              selected={selectedMaritalStatus.includes(status)}
              onPress={() =>
                toggleArrayItem(selectedMaritalStatus, setSelectedMaritalStatus, status)
              }
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        {renderSectionHeader(t('filters.spoken_languages'))}
        <View style={styles.wrapContainer}>
          {selectedLanguages.slice(0, 4).map((lang) => (
            <FilterPill
              key={lang}
              label={lang}
              selected
              onPress={() =>
                toggleArrayItem(selectedLanguages, setSelectedLanguages, lang)
              }
            />
          ))}
          {selectedLanguages.length > 4 && (
            <FilterPill
              label={`+${selectedLanguages.length - 4} more`}
              onPress={() => setLanguagesSheetOpen(true)}
            />
          )}
          <FilterPill
            label="+ Add Language"
            onPress={() => setLanguagesSheetOpen(true)}
          />
        </View>
      </View>

      <BottomSheet
        isVisible={languagesSheetOpen}
        onClose={() => setLanguagesSheetOpen(false)}
        title={t('filters.spoken_languages')}
        snapPoints={[0.6]}
        headerComponent={
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <View
              style={{
                marginBottom: 16,
                backgroundColor: background,
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: useColor("border"),
              }}
            >
              <Icon name={Search} size={20} color={muted} style={{ marginRight: 8 }} />
              <TextInput
                value={languageSearch}
                onChangeText={setLanguageSearch}
                placeholder={t('filters.search_languages')}
                placeholderTextColor={muted}
                style={{ color: text, fontSize: 16, flex: 1, padding: 0 }}
              />
            </View>
          </View>
        }
      >
        <View style={{ paddingBottom: 24, paddingHorizontal: 16 }}>
          {LANGUAGES.filter((l) =>
            l.toLowerCase().includes(languageSearch.toLowerCase())
          ).map((lang, i, arr) => {
            const isSelected = selectedLanguages.includes(lang);
            return (
              <Pressable
                key={lang}
                onPress={() =>
                  toggleArrayItem(selectedLanguages, setSelectedLanguages, lang)
                }
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: i === arr.length - 1 ? 0 : 1,
                  borderBottomColor: useColor("border"),
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: text,
                    fontSize: 16,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {lang}
                </Text>
                {isSelected && <Icon name={Check} size={20} color={primary} />}
              </Pressable>
            );
          })}
        </View>
      </BottomSheet>

      <View style={styles.section}>
        {renderSectionHeader("Relationship Intent")}
        <View style={styles.gridContainer}>
          <FilterCard
            title="Serious"
            subtitle="Long-term bonds"
            icon={<Heart size={20} />}
            selected={selectedLookingFor.includes("Serious")}
            onPress={() => toggleArrayItem(selectedLookingFor, setSelectedLookingFor, "Serious")}
          />
          <FilterCard
            title="Friendship"
            subtitle="Platonic first"
            icon={<Users size={20} />}
            selected={selectedLookingFor.includes("Friendship")}
            onPress={() => toggleArrayItem(selectedLookingFor, setSelectedLookingFor, "Friendship")}
          />
        </View>
        <View style={[styles.gridContainer, { marginTop: 12 }]}>
          <FilterCard
            title="We'll see"
            subtitle="Open to options"
            icon={<HelpCircle size={20} />}
            selected={selectedLookingFor.includes("We'll see")}
            onPress={() => toggleArrayItem(selectedLookingFor, setSelectedLookingFor, "We'll see")}
          />
          <FilterCard
            title="Going out"
            subtitle="Casual fun"
            icon={<PartyPopper size={20} />}
            selected={selectedLookingFor.includes("Going out")}
            onPress={() => toggleArrayItem(selectedLookingFor, setSelectedLookingFor, "Going out")}
          />
        </View>
      </View>
    </>
  );

  const renderAdvancedTab = () => (
    <View>
      <View>
        {renderBasicTab()}

        <View style={styles.section}>
          {renderSectionHeader(t('filters.education'))}
          <View style={styles.wrapContainer}>
            {["Bachelors", "Masters", "PhD", "Before Bachelor"].map((edu) => (
              <FilterPill
                key={edu}
                label={edu}
                selected={selectedEducation === edu}
                onPress={() => setSelectedEducation(edu)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{t('filters.smoking')}</Text>
            <Switch
              value={smoking}
              onValueChange={setSmoking}
              trackColor={{ false: muted + '40', true: primary }}
              thumbColor={'#ffffff'}
            />
          </View>
          <View style={[styles.rowBetween, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>{t('filters.alcohol')}</Text>
            <Switch
              value={alcohol}
              onValueChange={setAlcohol}
              trackColor={{ false: muted + '40', true: primary }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>

        <View style={styles.section}>
          {renderSectionHeader(t('filters.sport'))}
          <View style={styles.wrapContainer}>
            {["Intense", "Moderate", "Sedentary"].map((sport) => (
              <FilterPill
                key={sport}
                label={sport}
                selected={selectedSport === sport}
                onPress={() => setSelectedSport(sport)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          {renderSectionHeader(t('filters.interests'))}
          <View style={styles.wrapContainer}>
            {INTERESTS_POOL.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <FilterPill
                  key={interest}
                  label={interest}
                  selected={isSelected}
                  icon={isSelected ? <Check size={14} color="#FFF" /> : undefined}
                  onPress={() =>
                    toggleArrayItem(
                      selectedInterests,
                      setSelectedInterests,
                      interest,
                    )
                  }
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>
            Emotional Profile
          </Text>

          <Text style={styles.subsectionTitle}>🔋 HOW I RECHARGE</Text>
          <FilterListItem
            title="Silence"
            subtitle="Reducing noise, lights, movement"
            selected={recharge.includes("Silence")}
            onPress={() => toggleArrayItem(recharge, setRecharge, "Silence")}
          />
          <FilterListItem
            title="Cocoon Spaces"
            subtitle="Quiet room, blanket cocoon, soft light"
            selected={recharge.includes("Cocoon Spaces")}
            onPress={() => toggleArrayItem(recharge, setRecharge, "Cocoon Spaces")}
          />
          <FilterListItem
            title="Reduced Stimulation"
            subtitle="Noise-cancelling headphones, blindglasses, dim light"
            selected={recharge.includes("Reduced Stimulation")}
            onPress={() => toggleArrayItem(recharge, setRecharge, "Reduced Stimulation")}
          />

          <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>
            🪫 WHAT EXHAUSTS ME
          </Text>
          {[
            "Absorbs other people's moods",
            "Feels everything deeply",
            "Loud or unpredictable noises",
            "Bright lights",
            "Fast movements around me",
            "Strong smells",
            "Unpleasant textures",
          ].map((item) => (
            <FilterListItem
              key={item}
              title={item}
              selected={exhausts.includes(item)}
              onPress={() => toggleArrayItem(exhausts, setExhausts, item)}
            />
          ))}

          <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>
            🤎 MY EMOTIONAL NEEDS
          </Text>
          {[
            "Predictability",
            "Consistency in behavior",
            "Absence of judgement",
            "Clear communication",
            "Deep talk",
            "Need to be alone sometimes",
          ].map((item) => (
            <FilterListItem
              key={item}
              title={item}
              selected={needs.includes(item)}
              onPress={() => toggleArrayItem(needs, setNeeds, item)}
            />
          ))}

          <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>
            🤐 SECOND-DEGREE HUMOR
          </Text>
          {["Yes", "No"].map((item) => (
            <FilterListItem
              key={item}
              title={item}
              selected={humor === item}
              onPress={() => setHumor(item)}
            />
          ))}

          <Text style={[styles.subsectionTitle, { marginTop: 24 }]}>
            🪴 WHAT SOOTHES ME
          </Text>
          <View style={styles.wrapContainer}>
            {[
              "Silence or soft sounds",
              "Dim light",
              "Massage",
              "Sensory objects",
              "Chosen solitude",
              "Comforting routines",
              "Predictability",
              "Clear Communication",
              "Hyperfocus on an interest",
            ].map((item) => (
              <FilterPill
                key={item}
                label={item}
                selected={soothes.includes(item)}
                onPress={() => toggleArrayItem(soothes, setSoothes, item)}
              />
            ))}
          </View>
        </View>
      </View>
      
    </View>
  );

  return (
    <BlurView intensity={40} tint="dark" style={styles.backdrop}>
      <Pressable style={styles.backdropTouchable} onPress={handleClose} />

      <Animated.View style={[styles.container, { backgroundColor: background, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.headerBlock}>
          <View style={styles.pillContainer}>
            <View style={[styles.pill, { backgroundColor: muted + '50' }]} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t('filters.title')}</Text>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => {
                  useFilterStore.getState().clearFilters();
                  setAgeRange({ low: 18, high: 65 });
                  setHeightRange({ low: 140, high: 220 });
                  setSelectedGender("");
                  setSelectedMaritalStatus([]);
                  setSelectedLanguages([]);
                  setSelectedLookingFor([]);
                  setSelectedEducation("");
                  setSmoking(false);
                  setAlcohol(false);
                  setSelectedSport("");
                  setSelectedInterests([]);
                  setRecharge([]);
                  setExhausts([]);
                  setNeeds([]);
                  setHumor("");
                  setSoothes([]);
                }}
                hitSlop={10} 
                style={styles.resetBtn}
              >
                <Text style={[styles.resetText, { color: primary }]}>{t('filters.reset')}</Text>
              </Pressable>
              <Pressable
                onPress={handleClose}
                hitSlop={10}
                style={styles.closeBtn}
              >
                <Icon name={X} size={26} color={text} />
              </Pressable>
            </View>
          </View>

          <SegmentedTabs
            tabs={[t('filters.tab_basic'), t('filters.tab_advanced')]}
            activeTab={activeTabIndex === 0 ? t('filters.tab_basic') : t('filters.tab_advanced')}
            onTabChange={(tab) => setActiveTabIndex(tab === t('filters.tab_basic') ? 0 : 1)}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled
          >
            <View style={[styles.filterContent, { width }]}>
              {activeTabIndex === 0 ? renderBasicTab() : renderAdvancedTab()}
            </View>
          </ScrollView>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
          <Button onPress={handleApply} style={styles.applyBtn} disabled={isApplying}>
            {isApplying ? <ActivityIndicator color="#FFF" /> : t('filters.apply')}
          </Button>
        </View>
      </Animated.View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    height: '25%',
  },
  container: {
    width: '100%',
    height: '75%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  headerBlock: {
  },
  pillContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  pill: {
    width: 50,
    height: 5,
    borderRadius: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtn: {
    width: 40,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  resetText: {
    fontSize: 12,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    overflow: 'hidden',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  wrapContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridContainer: {
    flexDirection: "row",
    gap: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  applyBtn: {
    borderRadius: 24,
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 32,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
