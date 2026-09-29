export interface InterestCategory {
  title: string;
  tags: string[];
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    title: "Logical and structured systems",
    tags: [
      "mathematics",
      "computer science / programming",
      "maps, plans, geography",
      "schedules, calendars, subway lines",
    ],
  },
  {
    title: "Visual or sensory universes",
    tags: [
      "colors",
      "textures",
      "lights, reflections, shadows",
      "spinning objects",
    ],
  },
  {
    title: "Animals and nature",
    tags: [
      "specific animals (horses, cats, dinosaurs...)",
      "plants, trees, botany",
      "natural phenomena",
    ],
  },
  {
    title: "Imaginary universes / Science fiction",
    tags: [],
  },
  {
    title: "Video games",
    tags: [],
  },
  {
    title: "Manga",
    tags: [],
  },
  {
    title: "Collecting, sorting, organizing",
    tags: [
      "collections (objects, cards, figurines...)",
      "categorization",
      "organization systems",
    ],
  },
  {
    title: "Language, words, communication",
    tags: [
      "linguistics",
      "language learning",
      "creative writing",
      "poetry, wordplay",
    ],
  },
  {
    title: "Body, movement, sensations",
    tags: [
      "dance",
      "martial arts",
      "walking, hiking",
      "swimming",
    ],
  },
  {
    title: "Mechanical or technical objects",
    tags: [
      "trains",
      "machines",
      "watches, gears",
      "electronics",
    ],
  },
  {
    title: "Mental health, psychology, human functioning",
    tags: [
      "neurodiversity",
      "psychology",
      "personal development",
    ],
  },
];

export const ALL_INTEREST_TITLES = INTEREST_CATEGORIES.map((c) => c.title);
