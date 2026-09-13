import type { WordTopic } from "@prisma/client";

export const WORD_TOPICS = [
  "ESSENTIALS",
  "PEOPLE",
  "TIME",
  "FOOD_DRINK",
  "HOME",
  "SCHOOL_WORK",
  "TRAVEL",
  "SHOPPING",
  "DESCRIPTIONS",
] as const satisfies readonly WordTopic[];

export type WordTopicId = (typeof WORD_TOPICS)[number];

export type TopicMeta = {
  id: WordTopicId;
  title: string;
  description: string;
  sortOrder: number;
};

/**
 * Learner-facing topic catalog for A1 vocabulary.
 * Essentials first: glue words every beginner needs every day.
 */
export const TOPIC_CATALOG: TopicMeta[] = [
  {
    id: "ESSENTIALS",
    title: "Essentials",
    description: "Pronouns, please/thanks, and high-frequency glue words.",
    sortOrder: 1,
  },
  {
    id: "PEOPLE",
    title: "People",
    description: "Family, friends, names, and introductions.",
    sortOrder: 2,
  },
  {
    id: "TIME",
    title: "Time",
    description: "Days, moments, and when things happen.",
    sortOrder: 3,
  },
  {
    id: "FOOD_DRINK",
    title: "Food & drink",
    description: "Meals, drinks, eating and drinking.",
    sortOrder: 4,
  },
  {
    id: "HOME",
    title: "Home",
    description: "Rooms, furniture, and where you live.",
    sortOrder: 5,
  },
  {
    id: "SCHOOL_WORK",
    title: "School & work",
    description: "Learning, reading, writing, and jobs.",
    sortOrder: 6,
  },
  {
    id: "TRAVEL",
    title: "Travel & places",
    description: "Cities, transport, and getting around.",
    sortOrder: 7,
  },
  {
    id: "SHOPPING",
    title: "Shopping & money",
    description: "Prices, shops, and buying things.",
    sortOrder: 8,
  },
  {
    id: "DESCRIPTIONS",
    title: "Descriptions",
    description: "Size, age, and how things look.",
    sortOrder: 9,
  },
];

export const isWordTopic = (value: string): value is WordTopicId =>
  (WORD_TOPICS as readonly string[]).includes(value);
