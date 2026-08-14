import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch, TouchableWithoutFeedback, Platform, Animated, Dimensions, ActivityIndicator } from "react-native";
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
  Lock,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { RangeSlider } from "@/components/ui/range-slider";
import { FilterPill } from "@/components/ui/filter-pill";
import { FilterCard } from "@/components/ui/filter-card";
import { FilterListItem } from "@/components/ui/filter-list-item";
import { useColor } from "@/hooks/useColor";
import { useQueryClient } from "@tanstack/react-query";
import { useFilterStore } from "@/store/filterStore";
import { useProfileStore } from "@/store/profileStore";
import { useAndroidBack } from "@/hooks/useAndroidBack";

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  useAndroidBack();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");

  const [activeTab, setActiveTab] = useState("Basic");
  const globalFilters = useFilterStore(state => state.filters);
  const profile = useProfileStore((s) => s.profile);
  const hasAdvancedAccess = profile?.subscription_tier !== 'freemium' || profile?.has_advanced_filters;

  // Basic States
  const [ageRange, setAgeRange] = useState({ 
    low: globalFilters.age_min || 18, 
    high: globalFilters.age_max || 65 
  });
  const [height, setHeight] = useState(globalFilters.height_min || 140);

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
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
  }, []);

  const handleClose = () => {
    if (isApplying) return;
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleApply = async () => {
    setIsApplying(true);
    
    // Map gender values to match backend choices
    let mappedGender: string | undefined = selectedGender || undefined;
    if (selectedGender === "Non-binary") mappedGender = "non_binary";
    if (selectedGender === "Other") mappedGender = "other";
    
    const newFilters = {
      age_min: ageRange.low !== 18 ? ageRange.low : undefined,
      age_max: ageRange.high !== 65 ? ageRange.high : undefined,
      height_min: height !== 140 ? height : undefined,
      gender: mappedGender,
      marital_status: selectedMaritalStatus || undefined,
      looking_for: selectedLookingFor || undefined,
      spoken_languages: selectedLanguages.length ? selectedLanguages.join(',') : undefined,
      education_level: selectedEducation || undefined,
      smoking: smoking ? true : undefined,
      alcohol: alcohol ? true : undefined,
      sport: selectedSport || undefined,
      interests: selectedInterests.length ? selectedInterests.join(',') : undefined,
      recharge_methods: recharge || undefined,
      exhaust_triggers: exhausts || undefined,
      emotional_needs: needs || undefined,
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

  const [selectedGender, setSelectedGender] = useState(globalFilters.gender || "");
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState(globalFilters.marital_status || "");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    globalFilters.spoken_languages ? globalFilters.spoken_languages.split(',') : []
  );
  const [selectedLookingFor, setSelectedLookingFor] = useState(globalFilters.looking_for || "");

  // Advanced States
  const [selectedEducation, setSelectedEducation] = useState(globalFilters.education_level || "");
  const [smoking, setSmoking] = useState(globalFilters.smoking || false);
  const [alcohol, setAlcohol] = useState(globalFilters.alcohol || false);
  const [selectedSport, setSelectedSport] = useState(globalFilters.sport || "");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    globalFilters.interests ? globalFilters.interests.split(',') : []
  );

  const [recharge, setRecharge] = useState(globalFilters.recharge_methods || "");
  const [exhausts, setExhausts] = useState(globalFilters.exhaust_triggers || "");
  const [needs, setNeeds] = useState(globalFilters.emotional_needs || "");
  const [humor, setHumor] = useState(globalFilters.second_degree_humor ? "Yes" : "");
  const [soothes, setSoothes] = useState<string[]>(
    globalFilters.soothe_methods ? globalFilters.soothe_methods.split(',') : []
  );

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
        {renderSectionHeader("Age Range", `${ageRange.low} - ${ageRange.high}`)}
        <RangeSlider
          min={18}
          max={100}
          low={ageRange.low}
          high={ageRange.high}
          onValueChanged={(l, h) => setAgeRange({ low: l, high: h || 100 })}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Gender")}
        <View style={styles.wrapContainer}>
          {["Woman", "Man", "Non-binary", "Other"].map((g) => (
            <FilterPill
              key={g}
              label={g}
              selected={selectedGender === g}
              onPress={() => setSelectedGender(g)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Height", `${height}cm+`)}
        <RangeSlider
          min={140}
          max={220}
          low={height}
          single
          onValueChanged={(l) => setHeight(l)}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Marital Status")}
        <View style={styles.wrapContainer}>
          {["Single", "Married", "Divorced", "Widowed"].map((status) => (
            <FilterPill
              key={status}
              label={status}
              selected={selectedMaritalStatus === status}
              onPress={() => setSelectedMaritalStatus(status)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Spoken Languages")}
        <View style={styles.wrapContainer}>
          {["English", "Spanish"].map((lang) => (
            <FilterPill
              key={lang}
              label={lang}
              selected={selectedLanguages.includes(lang)}
              onPress={() =>
                toggleArrayItem(selectedLanguages, setSelectedLanguages, lang)
              }
            />
          ))}
          <FilterPill label="+ Add Language" />
        </View>
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Looking for")}
        <View style={styles.gridContainer}>
          <FilterCard
            title="Serious"
            subtitle="Long-term bonds"
            icon={<Heart size={20} />}
            selected={selectedLookingFor === "Serious"}
            onPress={() => setSelectedLookingFor("Serious")}
          />
          <FilterCard
            title="Friendship"
            subtitle="Platonic first"
            icon={<Users size={20} />}
            selected={selectedLookingFor === "Friendship"}
            onPress={() => setSelectedLookingFor("Friendship")}
          />
        </View>
        <View style={[styles.gridContainer, { marginTop: 12 }]}>
          <FilterCard
            title="We'll see"
            subtitle="Open to options"
            icon={<HelpCircle size={20} />}
            selected={selectedLookingFor === "We'll see"}
            onPress={() => setSelectedLookingFor("We'll see")}
          />
          <FilterCard
            title="Going out"
            subtitle="Casual fun"
            icon={<PartyPopper size={20} />}
            selected={selectedLookingFor === "Going out"}
            onPress={() => setSelectedLookingFor("Going out")}
          />
        </View>
      </View>
    </>
  );

  const renderAdvancedTab = () => (
    <View style={styles.advancedContainer}>
      <View style={[styles.advancedContent, !hasAdvancedAccess && { opacity: 0.4 }]}>
        {renderBasicTab()}

        <View style={styles.section}>
          {renderSectionHeader("Education")}
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
            <Text style={styles.sectionTitle}>Smoking</Text>
            <Switch
              value={smoking}
              onValueChange={setSmoking}
              trackColor={{ false: muted + '40', true: primary }}
              thumbColor={'#ffffff'}
            />
          </View>
          <View style={[styles.rowBetween, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Alcohol</Text>
            <Switch
              value={alcohol}
              onValueChange={setAlcohol}
              trackColor={{ false: muted + '40', true: primary }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>

        <View style={styles.section}>
          {renderSectionHeader("Sport")}
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
          {renderSectionHeader("Interests")}
          <View style={styles.wrapContainer}>
            {["Gaming", "Art", "Coding", "Reading"].map((interest) => {
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
            selected={recharge === "Silence"}
            onPress={() => setRecharge("Silence")}
          />
          <FilterListItem
            title="Cocoon Spaces"
            subtitle="Quiet room, blanket cocoon, soft light"
            selected={recharge === "Cocoon Spaces"}
            onPress={() => setRecharge("Cocoon Spaces")}
          />
          <FilterListItem
            title="Reduced Stimulation"
            subtitle="Noise-cancelling headphones, blindglasses, dim light"
            selected={recharge === "Reduced Stimulation"}
            onPress={() => setRecharge("Reduced Stimulation")}
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
              selected={exhausts === item}
              onPress={() => setExhausts(item)}
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
              selected={needs === item}
              onPress={() => setNeeds(item)}
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
            <Text style={styles.title}>Filters</Text>
            <View style={styles.headerRight}>
              <Pressable 
                onPress={() => {
                  useFilterStore.getState().clearFilters();
                  setAgeRange({ low: 18, high: 65 });
                  setHeight(140);
                  setSelectedGender("");
                  setSelectedMaritalStatus("");
                  setSelectedLanguages([]);
                  setSelectedLookingFor("");
                  setSelectedEducation("");
                  setSmoking(false);
                  setAlcohol(false);
                  setSelectedSport("");
                  setSelectedInterests([]);
                  setRecharge("");
                  setExhausts("");
                  setNeeds("");
                  setHumor("");
                  setSoothes([]);
                }} 
                hitSlop={10} 
                style={styles.resetBtn}
              >
                <Text style={[styles.resetText, { color: primary }]}>Reset</Text>
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
            tabs={["Basic", "Advanced"]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            scrollEnabled={!(activeTab === "Advanced" && !hasAdvancedAccess)}
          >
            <View style={styles.filterContent}>
              {activeTab === "Basic" ? renderBasicTab() : renderAdvancedTab()}
            </View>
          </ScrollView>

          {activeTab === "Advanced" && !hasAdvancedAccess && (
            <View style={styles.lockedOverlay}>
              <Lock size={48} color={primary} />
              <Text style={styles.lockedTitle}>Advanced Filters Locked</Text>
              <Text style={styles.lockedText}>
                Upgrade to Premium or get the Advanced Filters add-on to access these filters.
              </Text>
              <Pressable
                style={[styles.applyButton, { width: '80%', marginTop: 24, backgroundColor: primary, padding: 16, borderRadius: 24, alignItems: 'center' }]}
                onPress={() => {
                  handleClose();
                  setTimeout(() => {
                    router.push('/settings/subscription');
                  }, 300);
                }}
              >
                <Text style={styles.applyButtonText}>Unlock Now</Text>
              </Pressable>
            </View>
          )}
        </View>

        {!(activeTab === "Advanced" && !hasAdvancedAccess) && (
          <View style={[styles.footer, { paddingBottom: insets.bottom || 24, backgroundColor: background }]}>
            <Button onPress={handleApply} style={styles.applyBtn} disabled={isApplying}>
              {isApplying ? <ActivityIndicator color="#FFF" /> : "Apply Filters"}
            </Button>
          </View>
        )}
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
    width: Dimensions.get('window').width,
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
