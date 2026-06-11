import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
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
import { useColor } from "@/hooks/useColor";

export default function FiltersScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");

  const [activeTab, setActiveTab] = useState("Basic");

  // Basic States
  const [ageRange, setAgeRange] = useState({ low: 24, high: 35 });
  const [distance, setDistance] = useState(5);
  const [height, setHeight] = useState(165);

  const [selectedGender, setSelectedGender] = useState("Woman");
  const [selectedMaritalStatus, setSelectedMaritalStatus] = useState("Single");
  const [selectedLanguages, setSelectedLanguages] = useState([
    "English",
    "Spanish",
  ]);
  const [selectedLookingFor, setSelectedLookingFor] = useState("Friendship");

  // Advanced States
  const [selectedEducation, setSelectedEducation] = useState("Masters");
  const [smoking, setSmoking] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [selectedSport, setSelectedSport] = useState("Moderate");
  const [selectedInterests, setSelectedInterests] = useState(["Gaming", "Art"]);

  const [recharge, setRecharge] = useState("Silence");
  const [exhausts, setExhausts] = useState("Absorbs other people's moods");
  const [needs, setNeeds] = useState("Predictability");
  const [humor, setHumor] = useState("Yes");
  const [soothes, setSoothes] = useState([
    "Predictability",
    "Clear Communication",
    "Hyperfocus on an interest",
  ]);

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
          max={60}
          low={ageRange.low}
          high={ageRange.high}
          onValueChanged={(l, h) => setAgeRange({ low: l, high: h || 60 })}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Distance", `${distance} Kilometer`)}
        <RangeSlider
          min={1}
          max={100}
          low={distance}
          single
          onValueChanged={(l) => setDistance(l)}
        />
      </View>

      <View style={styles.section}>
        {renderSectionHeader("Gender")}
        <View style={styles.wrapContainer}>
          {["Woman", "Man", "Non-binary", "Agender"].map((g) => (
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
    <>
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
            trackColor={{ true: primary }}
          />
        </View>
        <View style={[styles.rowBetween, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Alcohol</Text>
          <Switch
            value={alcohol}
            onValueChange={setAlcohol}
            trackColor={{ true: primary }}
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
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 0 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <Icon name={X} size={24} color={text} />
        </Pressable>
        <Text style={styles.title}>Filters</Text>
        <Pressable onPress={() => {}} hitSlop={10} style={styles.resetBtn}>
          <Text style={[styles.resetText, { color: primary }]}>Reset</Text>
        </Pressable>
      </View>

      <SegmentedTabs
        tabs={["Basic", "Advanced"]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {activeTab === "Basic" ? renderBasicTab() : renderAdvancedTab()}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom || 24, backgroundColor: background },
        ]}
      >
        <Button onPress={() => router.back()} style={styles.applyBtn}>
          Apply Filters
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  closeBtn: {
    width: 40,
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
  scrollView: {
    flex: 1,
    marginTop: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
});
