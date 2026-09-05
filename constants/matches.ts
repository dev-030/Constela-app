import { PURPLE_IMAGES } from "@/constants/purple-images";
import { ImageSourcePropType } from "react-native";

export type MatchUser = {
  name: string;
  age: number;
  bio: string;
  interests: string[];
  image: ImageSourcePropType;
};

const NAMES = [
  "Jordan",
  "Mia",
  "Liam",
  "Casey",
  "Alex",
  "Sam",
  "Riley",
  "Avery",
  "Quinn",
  "Noor",
  "Sage",
  "Kai",
];

const BIOS = [
  "Lover of quiet cafés and rainy-day books. Looking for calm, kind energy.",
  "ADHD brain, art soul. Let's swap playlists and go on slow walks.",
  "I recharge alone but love deep 3am conversations. Coffee's my love language.",
  "Autistic & proud. I value parallel play, honesty, and soft lighting.",
  "Dyslexic designer who notices the little things. Seeking genuine connection.",
  "Stargazer, journal-keeper, plant parent. Tell me about your favorite silence.",
  "Curious about everything. I love museum dates and trying new foods.",
  "Quiet spaces, loud laughs with the right people. Patient hearts welcome.",
];

export const INTERESTS_POOL = [
  "Gaming",
  "Art",
  "Space",
  "Coffee",
  "Hiking",
  "Reading",
  "Music",
  "Photography",
  "Cooking",
  "Yoga",
  "Films",
  "Board Games",
];

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[(seed + i * 7) % arr.length]);
  }
  return Array.from(new Set(out));
}

function buildUsers(): MatchUser[] {
  return PURPLE_IMAGES.map((img, i) => ({
    name: NAMES[i % NAMES.length],
    age: 22 + ((i * 3) % 12),
    bio: BIOS[i % BIOS.length],
    interests: pickN(INTERESTS_POOL, 3, i),
    image: img,
  }));
}

export const MATCH_USERS: MatchUser[] = buildUsers();

export function getMatchUsers(): MatchUser[] {
  return MATCH_USERS;
}
