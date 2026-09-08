import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  BatteryMedium,
  BatteryWarning,
  Heart,
  Smile,
  Leaf,
  ArrowLeft,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { FilterPill } from "@/components/ui/filter-pill";
import { FilterListItem } from "@/components/ui/filter-list-item";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { updateMyProfile } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";

function SectionHeader({
  title,
  icon,
  color = "#555",
}: {
  title: string;
  icon: any;
  color?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
    </View>
  );
}

export default function OnboardingEmotionalScreen() {
  const insets = useSafeAreaInsets();
  const background = useColor("background");
  const text = useColor("text");
  const muted = useColor("textMuted");
  const primary = useColor("primary");
  const primaryForeground = useColor("primaryForeground");
  const border = useColor("border");

  const { data, update } = useOnboarding();
  const { rechargeMethods, exhaustTriggers, emotionalNeeds, humor, soothesMethods } = data;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchProfile } = useProfileStore();

  const handleNext = async (isSkipping: boolean) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("onboarding_part1_completed", "true");

      if (data.username && data.username.trim()) formData.append("username", data.username);
      if (data.age) formData.append("age", data.age);
      if (data.height) formData.append("height_cm", data.height);
      if (data.weight) formData.append("weight_kg", data.weight);

      const genderMap: any = {
        Woman: "woman",
        Man: "man",
        "Non-binary": "non_binary",
        Other: "other",
      };
      if (data.gender)
        formData.append("gender", genderMap[data.gender] || data.gender);

      if (data.maritalStatus)
        formData.append("marital_status", data.maritalStatus);
      if (data.education) formData.append("education_level", data.education);
      if (data.spokenLanguages && data.spokenLanguages.length > 0)
        formData.append("spoken_languages", JSON.stringify(data.spokenLanguages));
      if (data.city && data.city.trim()) formData.append("city", data.city);
      if (data.country && data.country.trim()) formData.append("country", data.country);

      const lookingForMap: Record<string, string> = {
        "Serious Relationship": "serious",
        Friendship: "friendship",
        "We'll See": "undecided",
        "Going Out": "casual",
      };
      if (data.lookingFor && data.lookingFor.length > 0) {
        const mappedLookingFor = data.lookingFor.map(
          (v) => lookingForMap[v] || v
        );
        formData.append("looking_for", mappedLookingFor.join(","));
      }

      if (data.hasChildren)
        formData.append(
          "has_children",
          data.hasChildren === "Yes" ? "true" : "false",
        );
      if (data.wantChildren)
        formData.append(
          "wants_children",
          data.wantChildren === "Yes" ? "true" : "false",
        );
      if (data.smoking)
        formData.append("smoking", data.smoking === "Yes" ? "true" : "false");
      if (data.alcohol)
        formData.append("alcohol", data.alcohol === "Yes" ? "true" : "false");
      if (data.pets)
        formData.append("pets", data.pets === "Yes" ? "true" : "false");
      if (data.sport) formData.append("sport", data.sport);
      if (data.eatingHabits && data.eatingHabits.length > 0)
        formData.append("eating_habits", data.eatingHabits[0]);

      if (!isSkipping) {
        if (rechargeMethods.length > 0)
          formData.append("recharge_methods", JSON.stringify(rechargeMethods));
        if (exhaustTriggers.length > 0)
          formData.append("exhaust_triggers", JSON.stringify(exhaustTriggers));
        if (emotionalNeeds.length > 0)
          formData.append("emotional_needs", JSON.stringify(emotionalNeeds));
        if (soothesMethods.length > 0)
          formData.append("soothe_methods", JSON.stringify(soothesMethods));
        if (humor)
          formData.append(
            "second_degree_humor",
            humor === "Yes" ? "true" : "false",
          );
      }

      if (data.photos[0]) {
        formData.append("photo1", {
          uri: data.photos[0],
          name: "photo1.jpg",
          type: "image/jpeg",
        } as any);
      }
      if (data.photos[1]) {
        formData.append("photo2", {
          uri: data.photos[1],
          name: "photo2.jpg",
          type: "image/jpeg",
        } as any);
      }
      if (data.photos[2]) {
        formData.append("photo3", {
          uri: data.photos[2],
          name: "photo3.jpg",
          type: "image/jpeg",
        } as any);
      }

      await updateMyProfile(formData);
      await fetchProfile();
      router.push("/onboarding/verification-prompt");
    } catch (err) {
      console.log("Failed to save onboarding data:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRecharge = (v: string) => {
    const next = rechargeMethods.includes(v)
      ? rechargeMethods.filter((x) => x !== v)
      : [...rechargeMethods, v];
    update("rechargeMethods", next);
  };
  const toggleExhausts = (v: string) => {
    const next = exhaustTriggers.includes(v)
      ? exhaustTriggers.filter((x) => x !== v)
      : [...exhaustTriggers, v];
    update("exhaustTriggers", next);
  };
  const toggleNeeds = (v: string) => {
    const next = emotionalNeeds.includes(v)
      ? emotionalNeeds.filter((x) => x !== v)
      : [...emotionalNeeds, v];
    update("emotionalNeeds", next);
  };
  const setHumor = (v: string) => update("humor", v as any);
  const setSoothes = (v: string[]) => update("soothesMethods", v);

  const toggleArrayItem = (
    arr: string[],
    setArr: (val: string[]) => void,
    item: string
  ) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", position: "relative" },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={{ position: "absolute", left: 20, top: insets.top + 16 }}
        >
          <Icon name={ArrowLeft} size={24} color={text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: text }]}>
            Emotional Landscape
          </Text>
        </View>
      </View>


      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.introText, { color: muted }]}>
          Understanding your emotional needs helps us find connections who truly
          "get" your rhythm. Skip anything you're not ready to share.
        </Text>

        <SectionHeader title="HOW I RECHARGE" icon={BatteryMedium} />
        <FilterListItem
          title="Silence"
          subtitle="Reducing noise, Lights, Movement"
          selected={rechargeMethods.includes("Silence")}
          onPress={() => toggleRecharge("Silence")}
        />
        <FilterListItem
          title="Cocoon Spaces"
          subtitle="Quiet room, Blanket corner, Soft light"
          selected={rechargeMethods.includes("Cocoon Spaces")}
          onPress={() => toggleRecharge("Cocoon Spaces")}
        />
        <FilterListItem
          title="Reduced Stimulation"
          subtitle="Noise-cancelling headphones, tinted glasses, Dim light"
          selected={rechargeMethods.includes("Reduced Stimulation")}
          onPress={() => toggleRecharge("Reduced Stimulation")}
        />

        <View style={styles.spacing} />

        <SectionHeader
          title="WHAT EXHAUSTS ME"
          icon={BatteryWarning}
          color="#C62828"
        />
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
            selected={exhaustTriggers.includes(item)}
            onPress={() => toggleExhausts(item)}
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader
          title="MY EMOTIONAL NEEDS"
          icon={Heart}
          color="#795548"
        />
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
            selected={emotionalNeeds.includes(item)}
            onPress={() => toggleNeeds(item)}
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title="SECOND-DEGREE HUMOR" icon={Smile} color="#2E7D32" />
        {["Yes", "No"].map((item) => (
          <FilterListItem
            key={item}
            title={item}
            selected={humor === item}
            onPress={() => setHumor(item)}
          />
        ))}

        <View style={styles.spacing} />

        <SectionHeader title="WHAT SOOTHES ME" icon={Leaf} color="#00695C" />
        <View style={styles.pillRow}>
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
              selected={soothesMethods.includes(item)}
              onPress={() => toggleArrayItem(soothesMethods, setSoothes, item)}
            />
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      {(() => {
        const isFormValid =
          rechargeMethods.length > 0 &&
          exhaustTriggers.length > 0 &&
          emotionalNeeds.length > 0 &&
          soothesMethods.length > 0;

        return (
          <View
            style={[
              styles.footer,
              {
                paddingBottom: insets.bottom || 24,
                backgroundColor: background,
              },
            ]}
          >
            <View style={styles.footerRow}>
              <Pressable
                onPress={() => !isSubmitting && handleNext(true)}
                disabled={isSubmitting}
              >
                <Text style={[styles.skipText, { color: text, opacity: isSubmitting ? 0.5 : 1 }]}>Skip</Text>
              </Pressable>
              <Button
                onPress={() => handleNext(false)}
                style={styles.finishBtn}
                textStyle={{ color: primaryForeground }}
                disabled={!isFormValid || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={primaryForeground} />
                ) : (
                  "Continue"
                )}
              </Button>
            </View>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  spacing: {
    height: 24,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipText: {
    fontSize: 16,
    fontWeight: "600",
  },
  finishBtn: {
    borderRadius: 24,
    paddingHorizontal: 32,
  },
});
