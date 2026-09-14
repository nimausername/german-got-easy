export type TeachBlock =
  | {
      type: "explain";
      title: string;
      body: string;
      examples?: Array<{ de: string; en: string; audioUrl?: string }>;
    }
  | {
      type: "phrases";
      title: string;
      items: Array<{ de: string; en: string; audioUrl?: string }>;
    }
  | {
      type: "pattern";
      title: string;
      template: string;
      meaning: string;
      examples?: string[];
      exampleAudioUrls?: Array<string | null>;
    }
  | {
      type: "dialogue";
      title: string;
      lines: Array<{ speaker: string; de: string; en: string; audioUrl?: string }>;
    }
  | {
      type: "listen_model";
      title: string;
      text: string;
      hint?: string;
      audioUrl?: string;
    }
  | {
      type: "speak_model";
      title: string;
      prompt: string;
      modelText: string;
      hint?: string;
      audioUrl?: string;
    };

export type LessonExercise = {
  id: string;
  type: string;
  prompt: string;
  payload: Record<string, unknown>;
};

export type ClientLesson = {
  id: string;
  title: string;
  slug: string;
  canDo: string;
  summary: string | null;
  skillTags: string[];
  teachBlocks: TeachBlock[];
  unitId: string;
  unitTitle: string;
  levelCode: string;
  exercises: LessonExercise[];
};

export const SKILL_LABELS: Record<string, string> = {
  grammar: "Grammar",
  phrases: "Phrases",
  vocabulary: "Vocabulary",
  reading: "Reading",
  writing: "Writing",
  listening: "Listening",
  speaking: "Speaking",
};

/**
 * Human label for a skill tag.
 */
export const skillLabel = (tag: string): string => SKILL_LABELS[tag] ?? tag;
