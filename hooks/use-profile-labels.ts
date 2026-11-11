import { useMemo } from "react";
import { useTranslation } from "react-i18next";

/**
 * Canonical (English) values that are stored on a profile, mapped to their
 * translation keys. The API always stores the English canonical string, so
 * every screen that *displays* a stored value has to translate it.
 */
const VALUE_KEYS: Record<string, string> = {
  // Gender / gender preference
  woman: "onboarding.genders.woman",
  man: "onboarding.genders.man",
  "non-binary": "onboarding.genders.non_binary",
  non_binary: "onboarding.genders.non_binary",
  other: "onboarding.genders.other",
  everyone: "onboarding.genders.everyone",

  // Education
  "high school": "onboarding.education_levels.high_school",
  "bachelor's": "onboarding.education_levels.bachelor_s",
  bachelors: "onboarding.education_levels.bachelors",
  "master's": "onboarding.education_levels.master_s",
  masters: "onboarding.education_levels.masters",
  phd: "onboarding.education_levels.phd",
  "before bachelor": "onboarding.education_levels.before_bachelor",

  // Marital status
  single: "onboarding.marital.single",
  married: "onboarding.marital.married",
  divorced: "onboarding.marital.divorced",
  widowed: "onboarding.marital.widowed",

  // Looking for
  serious: "onboarding.looking_for.serious",
  friendship: "onboarding.looking_for.friendship",
  undecided: "onboarding.looking_for.well_see",
  "we'll see": "onboarding.looking_for.well_see",
  casual: "onboarding.looking_for.going_out",
  "going out": "onboarding.looking_for.going_out",

  // Sport
  intense: "onboarding.habits.sport_intense",
  moderate: "onboarding.habits.sport_moderate",
  "no sport": "onboarding.habits.sport_no_sport",
  sedentary: "onboarding.habits.sport_sedentary",

  // Eating habits
  balanced: "onboarding.habits.eating_balanced",
  "fast food": "onboarding.habits.eating_fast_food",
  vegetarian: "onboarding.habits.eating_vegetarian",
  vegan: "onboarding.habits.eating_vegan",

  // Yes / no
  yes: "common.yes",
  no: "common.no",
};

/** Multi-select lists that live under `profile_values.*` in the locale files. */
export type ProfileValueList =
  | "recharge"
  | "exhausts"
  | "needs"
  | "soothes"
  | "qualities"
  | "neurotypes";

/**
 * Normalises a value for lookups: the API sometimes lowercases values and
 * writes "&" instead of "and" (e.g. "Animals & nature").
 */
export const normalizeValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();

/** Turns a canonical value into a locale key segment. */
export const slugifyValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

type Bundle = Record<string, unknown> | undefined;

/**
 * Builds a `canonical English value -> translated value` index by walking the
 * English bundle (which stores the canonical strings) against the bundle of the
 * currently active language.
 */
function buildValueIndex(source: any, target: any) {
  const index = new Map<string, string>();

  const walk = (src: any, tgt: any) => {
    if (!src || typeof src !== "object") return;
    for (const [key, value] of Object.entries(src)) {
      if (value && typeof value === "object") {
        walk(value, tgt?.[key]);
        continue;
      }
      const translated = tgt?.[key];
      if (typeof translated === "string" && typeof value === "string") {
        // Case-insensitive: the API lowercases some values (e.g. "Video games").
        index.set(normalizeValue(value), translated);
      }
    }
  };

  walk(source, target);
  return index;
}

/**
 * Translates the canonical values that are stored on a profile.
 * Re-renders automatically when the app language changes.
 */
export function useProfileLabels() {
  const { t, i18n } = useTranslation();

  const valueIndex = useMemo(() => {
    const english = i18n.getResourceBundle("en", "translation") as Bundle;
    const current = i18n.getResourceBundle(i18n.language, "translation") as Bundle;
    return buildValueIndex(english?.profile_values, current?.profile_values);
  }, [i18n.language, i18n]);

  /**
   * Translate any canonical value that can appear on a profile - qualities,
   * interest categories, interest topics, neurotypes, emotional values...
   * Falls back to the raw value when there is no translation for it.
   */
  const valueLabel = (value?: string | null, fallback = "—") => {
    if (!value) return fallback;
    return valueIndex.get(normalizeValue(value)) ?? value;
  };

  /** Translate a single-value field (gender, education, sport, ...). */
  const label = (value?: string | null, fallback = "—") => {
    if (!value) return fallback;
    const key = VALUE_KEYS[value.trim().toLowerCase()];
    return key ? t(key, value) : value;
  };

  /** Translate a value that belongs to one of the multi-select lists. */
  const listLabel = (
    list: ProfileValueList,
    value?: string | null,
    fallback = "—",
  ) => {
    if (!value) return fallback;
    return t(`profile_values.${list}.${slugifyValue(value)}`, value);
  };

  /** Recharge methods carry a title *and* a subtitle. */
  const rechargeTitle = (value: string) =>
    t(`profile_values.recharge.${slugifyValue(value)}.title`, value);

  const rechargeSubtitle = (value: string, fallback: string) =>
    t(`profile_values.recharge.${slugifyValue(value)}.subtitle`, fallback);

  /** Interest categories hold their own list of sub-topics. */
  const interestCategory = (value: string) =>
    t(`profile_values.interests.${slugifyValue(value)}.title`, value);

  const interestTag = (category: string, tag: string) =>
    t(
      `profile_values.interests.${slugifyValue(category)}.tags.${slugifyValue(tag)}`,
      tag,
    );

  /** "Loves a, b and c" - the sentence the backend builds for a profile bio. */
  const lovesSentence = (items: string[]) => {
    const parts = items.map((item) => valueLabel(item)).filter(Boolean);
    if (!parts.length) return "";
    const loves = t("connections.loves", "Loves");
    if (parts.length === 1) return `${loves} ${parts[0]}`;
    const and = t("connections.and", "and");
    return `${loves} ${parts.slice(0, -1).join(", ")} ${and} ${parts[parts.length - 1]}`;
  };

  /**
   * Translates a bio the backend already assembled. The backend always builds
   * it in English ("Loves a, b, and c" or the "Open-minded…" fallback), so
   * match the English wording, not the translated one.
   */
  const translateBio = (bio?: string | null) => {
    if (!bio) return "";
    const trimmed = bio.trim();
    if (/^open-minded and ready to connect\.?$/i.test(trimmed)) {
      return t("connections.open_minded", "Open-minded and ready to connect");
    }
    const match = trimmed.match(/^loves\s+(.+)$/i);
    if (!match) return bio;
    const items = match[1]
      .split(/\s*,\s*(?:and\s+)?|\s+and\s+/i)
      .map((item) => item.trim())
      .filter(Boolean);
    return lovesSentence(items);
  };

  return {
    label,
    listLabel,
    valueLabel,
    rechargeTitle,
    rechargeSubtitle,
    interestCategory,
    interestTag,
    lovesSentence,
    translateBio,
  };
}
