import { apiFetch } from "@/lib/api";
import type { ClientLesson } from "@/lib/learn";
import type { VocabularyWordDetail, VocabularyWordListItem } from "@/lib/vocabulary";
import type { MeData } from "@/hooks/use-me";

export type LevelsData = {
  readonly levels: Array<{
    readonly id: string;
    readonly code: string;
    readonly title: string;
    readonly unitCount: number;
    readonly lessonCount: number;
    readonly unitsCompleted: number;
    readonly status: string;
  }>;
};

export type LevelUnitsData = {
  readonly level: { readonly code: string; readonly title: string };
  readonly units: Array<{
    readonly id: string;
    readonly slug: string;
    readonly title: string;
    readonly description: string | null;
    readonly lessonCount: number;
    readonly lessonsCompleted: number;
    readonly status: string;
  }>;
};

export type PathNextData = {
  readonly lesson: {
    readonly id: string;
    readonly title?: string;
    readonly unitTitle?: string;
    readonly levelCode?: string;
  } | null;
  readonly message?: string;
};

export type UnitDetail = {
  readonly id: string;
  readonly title: string;
  readonly description: string | null;
  readonly status: string;
  readonly levelCode: string;
  readonly levelTitle: string;
  readonly lessons: Array<{
    readonly id: string;
    readonly title: string;
    readonly canDo: string;
    readonly summary: string | null;
    readonly skillTags: string[];
    readonly status: string;
    readonly score: number | null;
  }>;
};

export type WordsPage = {
  readonly words: VocabularyWordListItem[];
  readonly nextCursor: string | null;
  readonly totalInBank: number | null;
  readonly matchedCount: number | null;
};

export type FlashcardTopicsData = {
  readonly topics: Array<{
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly wordCount: number;
    readonly dueCount: number;
    readonly learningCount: number;
    readonly knownCount: number;
    readonly newCount: number;
  }>;
  readonly dueTotal: number;
};

export type PlacementItem = {
  readonly id: string;
  readonly prompt: string;
};

export const fetchMe = async (): Promise<MeData> => {
  const response = await apiFetch<{ data: MeData }>("/v1/me");
  return response.data;
};

export const fetchLevels = async (): Promise<LevelsData> => {
  const response = await apiFetch<{ data: LevelsData }>("/v1/levels");
  return response.data;
};

export const fetchLevelUnits = async (code: string): Promise<LevelUnitsData> => {
  const response = await apiFetch<{ data: LevelUnitsData }>(`/v1/levels/${code}/units`);
  return response.data;
};

export const fetchPathNext = async (): Promise<PathNextData> => {
  const response = await apiFetch<{ data: PathNextData }>("/v1/path/next");
  return response.data;
};

export const fetchUnit = async (unitId: string): Promise<UnitDetail> => {
  const response = await apiFetch<{ data: { unit: UnitDetail } }>(`/v1/units/${unitId}`);
  return response.data.unit;
};

export const fetchLesson = async (lessonId: string): Promise<ClientLesson> => {
  const response = await apiFetch<{ data: { lesson: ClientLesson } }>(
    `/v1/lessons/${lessonId}`,
  );
  return response.data.lesson;
};

export const fetchWordsPage = async (params: {
  readonly q: string;
  readonly topic: string;
  readonly cefrBand: string;
  readonly status: string;
  readonly cursor?: string | null;
}): Promise<WordsPage> => {
  const search = new URLSearchParams();
  search.set("limit", "40");
  if (params.q) search.set("q", params.q);
  if (params.topic) search.set("topic", params.topic);
  if (params.cefrBand) search.set("cefrBand", params.cefrBand);
  if (params.status) search.set("status", params.status);
  if (params.cursor) {
    search.set("cursor", params.cursor);
    search.set("includeCounts", "false");
  }
  const response = await apiFetch<{ data: WordsPage }>(`/v1/words?${search.toString()}`);
  return response.data;
};

export const fetchWord = async (wordId: string): Promise<VocabularyWordDetail> => {
  const response = await apiFetch<{ data: { word: VocabularyWordDetail } }>(
    `/v1/words/${wordId}`,
  );
  return response.data.word;
};

export const fetchFlashcardTopics = async (): Promise<FlashcardTopicsData> => {
  const response = await apiFetch<{ data: FlashcardTopicsData }>("/v1/flashcards/topics");
  return response.data;
};

export const fetchPlacementItems = async (): Promise<PlacementItem[]> => {
  const response = await apiFetch<{ data: { items: PlacementItem[] } }>("/v1/placement");
  return response.data.items;
};
