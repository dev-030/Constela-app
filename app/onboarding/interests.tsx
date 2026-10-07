import { OnboardingShell } from "@/components/ui/onboarding-shell";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useOnboarding } from "@/providers/onboarding-context";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";

import { INTEREST_CATEGORIES } from "@/constants/interests";

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

export default function OnboardingInterestsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data, update } = useOnboarding();
  const text = useColor("text");
  const muted = useColor("textMuted");
  const card = useColor("card");
  const border = useColor("border");
  const primary = useColor("primary");

  const isFrench = i18n.language?.startsWith("fr");
  const getCategoryTitle = (title: string) => (isFrench ? INTEREST_CATEGORIES_FR[title]?.title || title : title);
  const getTagLabel = (categoryTitle: string, tag: string) =>
    isFrench ? INTEREST_CATEGORIES_FR[categoryTitle]?.tags[tag] || tag : tag;

  const toggleInterest = (category: string) => {
    const current = data.interests;
    if (current.includes(category)) {
      update("interests", current.filter((v) => v !== category));
    } else {
      update("interests", [...current, category]);
    }
  };

  const isFormValid = data.interests.length > 0;

  return (
    <OnboardingShell
      title={t("onboarding.step6_title", "Interests")}
      subtitle={t("onboarding.step6_subtitle", "Select topics you enjoy exploring.")}
      onBack={() => router.back()}
      onContinue={() => router.push("/onboarding/emotional")}
      continueDisabled={!isFormValid}
      onSkip={() => router.push("/onboarding/emotional")}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {INTEREST_CATEGORIES.map((cat) => {
          const selected = data.interests.includes(cat.title);
          return (
            <Pressable
              key={cat.title}
              onPress={() => toggleInterest(cat.title)}
              style={{
                borderWidth: 1.5,
                borderColor: selected ? primary : border,
                borderRadius: 14,
                padding: 16,
                backgroundColor: selected ? primary + "0D" : card,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: selected ? primary : text,
                  marginBottom: cat.tags.length > 0 ? 8 : 0,
                }}
              >
                {getCategoryTitle(cat.title)}
              </Text>
              {cat.tags.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {cat.tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: selected ? primary + "22" : muted + "22",
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
                        {getTagLabel(cat.title, tag)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}
