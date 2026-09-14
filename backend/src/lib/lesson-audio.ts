import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { TeachBlock } from "./lesson-content.js";

const VOICE = "de-DE-KatjaNeural";
const AUDIO_URL_PREFIX = "/v1/media/audio";

type AudioManifestFile = {
  readonly voice?: string;
  readonly rate?: string;
  readonly entries?: Record<string, string>;
};

let cachedEntries: Map<string, string> | null = null;

/**
 * Content-addressed hash shared with generate-lesson-audio.py.
 */
export const lessonAudioHash = (text: string): string => {
  const trimmed = text.trim();
  return createHash("sha256").update(`${VOICE}\n${trimmed}`, "utf8").digest("hex").slice(0, 32);
};

/**
 * Absolute path to the on-disk MP3 directory (Docker and local cwd = backend/).
 */
export const lessonAudioDir = (): string => resolve(process.cwd(), "content/audio");

/**
 * Absolute path to a hashed lesson audio file, or null when the name is invalid.
 */
export const lessonAudioFilePath = (fileName: string): string | null => {
  if (!/^[a-f0-9]{32}\.mp3$/.test(fileName)) {
    return null;
  }
  return resolve(lessonAudioDir(), fileName);
};

const loadManifestEntries = (): Map<string, string> => {
  if (cachedEntries) {
    return cachedEntries;
  }

  const manifestPath = resolve(process.cwd(), "content/audio-manifest.json");
  if (!existsSync(manifestPath)) {
    cachedEntries = new Map();
    return cachedEntries;
  }

  try {
    const raw = JSON.parse(readFileSync(manifestPath, "utf8")) as AudioManifestFile;
    const entries = raw.entries ?? {};
    cachedEntries = new Map(
      Object.entries(entries).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === "string" && typeof entry[1] === "string",
      ),
    );
  } catch {
    cachedEntries = new Map();
  }

  return cachedEntries;
};

/**
 * Clears the in-memory manifest cache (tests).
 */
export const resetLessonAudioManifestCache = (): void => {
  cachedEntries = null;
};

/**
 * Public CDN/R2 origin for MP3s when configured; otherwise the API media route.
 */
const mediaUrlForDigest = (digest: string): string => {
  const base = process.env.AUDIO_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
  if (base) {
    return `${base}/${digest}.mp3`;
  }
  return `${AUDIO_URL_PREFIX}/${digest}.mp3`;
};

/**
 * Returns a media URL for speakable German text when audio exists.
 * Manifest entries are trusted (baked with the files); disk is probed only for
 * texts missing from the manifest.
 */
export const audioUrlForText = (text: string | null | undefined): string | undefined => {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;

  const entries = loadManifestEntries();
  const fromManifest = entries.get(trimmed);
  if (fromManifest) {
    if (!/^[a-f0-9]{32}$/.test(fromManifest)) {
      return undefined;
    }
    return mediaUrlForDigest(fromManifest);
  }

  const digest = lessonAudioHash(trimmed);
  const filePath = lessonAudioFilePath(`${digest}.mp3`);
  if (!filePath || !existsSync(filePath)) {
    return undefined;
  }
  return mediaUrlForDigest(digest);
};

type ExamplePair = { de: string; en: string; audioUrl?: string };
type PhraseItem = { de: string; en: string; audioUrl?: string };
type DialogueLine = { speaker: string; de: string; en: string; audioUrl?: string };

/**
 * Client teach block with optional neural audio URLs attached.
 */
export type ClientTeachBlock =
  | {
      type: "explain";
      title: string;
      body: string;
      examples?: ExamplePair[];
    }
  | {
      type: "phrases";
      title: string;
      items: PhraseItem[];
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
      lines: DialogueLine[];
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

/**
 * Attaches optional audioUrl fields to parsed teach blocks.
 */
export const enrichTeachBlocksWithAudio = (blocks: TeachBlock[]): ClientTeachBlock[] =>
  blocks.map((block): ClientTeachBlock => {
    if (block.type === "explain") {
      return {
        ...block,
        examples: block.examples?.map((example) => {
          const audioUrl = audioUrlForText(example.de);
          return audioUrl ? { ...example, audioUrl } : { ...example };
        }),
      };
    }

    if (block.type === "phrases") {
      return {
        ...block,
        items: block.items.map((item) => {
          const audioUrl = audioUrlForText(item.de);
          return audioUrl ? { ...item, audioUrl } : { ...item };
        }),
      };
    }

    if (block.type === "pattern") {
      const exampleAudioUrls = block.examples?.map(
        (example) => audioUrlForText(example) ?? null,
      );
      const hasAny = exampleAudioUrls?.some(Boolean);
      return hasAny ? { ...block, exampleAudioUrls } : { ...block };
    }

    if (block.type === "dialogue") {
      return {
        ...block,
        lines: block.lines.map((line) => {
          const audioUrl = audioUrlForText(line.de);
          return audioUrl ? { ...line, audioUrl } : { ...line };
        }),
      };
    }

    if (block.type === "listen_model") {
      const audioUrl = audioUrlForText(block.text);
      return audioUrl ? { ...block, audioUrl } : { ...block };
    }

    const audioUrl = audioUrlForText(block.modelText);
    return audioUrl ? { ...block, audioUrl } : { ...block };
  });
