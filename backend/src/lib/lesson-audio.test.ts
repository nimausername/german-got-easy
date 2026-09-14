import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
  audioUrlForText,
  enrichTeachBlocksWithAudio,
  lessonAudioHash,
  resetLessonAudioManifestCache,
} from "./lesson-audio.js";

const originalCwd = process.cwd();

afterEach(() => {
  process.chdir(originalCwd);
  resetLessonAudioManifestCache();
});

describe("lessonAudioHash", () => {
  it("matches the Edge TTS content-address scheme", () => {
    assert.equal(lessonAudioHash("Guten Tag!").length, 32);
    assert.equal(lessonAudioHash("Guten Tag!"), lessonAudioHash("Guten Tag!"));
    assert.notEqual(lessonAudioHash("Guten Tag!"), lessonAudioHash("Guten Morgen"));
  });
});

describe("audioUrlForText", () => {
  it("trusts manifest entries without probing disk", () => {
    const root = mkdtempSync(join(tmpdir(), "lesson-audio-"));
    mkdirSync(join(root, "content", "audio"), { recursive: true });

    const digest = lessonAudioHash("Hallo");
    writeFileSync(
      join(root, "content", "audio-manifest.json"),
      JSON.stringify({ voice: "de-DE-KatjaNeural", entries: { Hallo: digest } }),
    );

    process.chdir(root);
    resetLessonAudioManifestCache();
    const previous = process.env.AUDIO_PUBLIC_BASE_URL;
    delete process.env.AUDIO_PUBLIC_BASE_URL;

    try {
      assert.equal(audioUrlForText("Hallo"), `/v1/media/audio/${digest}.mp3`);
      assert.equal(audioUrlForText("Missing"), undefined);
    } finally {
      if (previous === undefined) {
        delete process.env.AUDIO_PUBLIC_BASE_URL;
      } else {
        process.env.AUDIO_PUBLIC_BASE_URL = previous;
      }
    }
  });

  it("falls back to a disk probe when the text is absent from the manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "lesson-audio-disk-"));
    const audioDir = join(root, "content", "audio");
    mkdirSync(audioDir, { recursive: true });

    const digest = lessonAudioHash("Guten Tag");
    writeFileSync(join(audioDir, `${digest}.mp3`), Buffer.from([0xff, 0xfb, 0x90, 0x00]));
    writeFileSync(
      join(root, "content", "audio-manifest.json"),
      JSON.stringify({ voice: "de-DE-KatjaNeural", entries: {} }),
    );

    process.chdir(root);
    resetLessonAudioManifestCache();
    const previous = process.env.AUDIO_PUBLIC_BASE_URL;
    delete process.env.AUDIO_PUBLIC_BASE_URL;

    try {
      assert.equal(audioUrlForText("Guten Tag"), `/v1/media/audio/${digest}.mp3`);
      assert.equal(audioUrlForText("Missing"), undefined);
    } finally {
      if (previous === undefined) {
        delete process.env.AUDIO_PUBLIC_BASE_URL;
      } else {
        process.env.AUDIO_PUBLIC_BASE_URL = previous;
      }
    }
  });

  it("uses AUDIO_PUBLIC_BASE_URL when configured", () => {
    const root = mkdtempSync(join(tmpdir(), "lesson-audio-cdn-"));
    mkdirSync(join(root, "content", "audio"), { recursive: true });
    const digest = lessonAudioHash("Hallo");
    writeFileSync(
      join(root, "content", "audio-manifest.json"),
      JSON.stringify({ entries: { Hallo: digest } }),
    );

    process.chdir(root);
    resetLessonAudioManifestCache();
    const previous = process.env.AUDIO_PUBLIC_BASE_URL;
    process.env.AUDIO_PUBLIC_BASE_URL = "https://germanaudio.example.com/";

    try {
      assert.equal(
        audioUrlForText("Hallo"),
        `https://germanaudio.example.com/${digest}.mp3`,
      );
    } finally {
      if (previous === undefined) {
        delete process.env.AUDIO_PUBLIC_BASE_URL;
      } else {
        process.env.AUDIO_PUBLIC_BASE_URL = previous;
      }
    }
  });
});

describe("enrichTeachBlocksWithAudio", () => {
  it("attaches audioUrl on phrases when the file exists", () => {
    const root = mkdtempSync(join(tmpdir(), "lesson-audio-enrich-"));
    const audioDir = join(root, "content", "audio");
    mkdirSync(audioDir, { recursive: true });
    const digest = lessonAudioHash("Tschüss");
    writeFileSync(join(audioDir, `${digest}.mp3`), Buffer.from([0xff, 0xfb, 0x90, 0x00]));
    writeFileSync(
      join(root, "content", "audio-manifest.json"),
      JSON.stringify({ entries: { Tschüss: digest } }),
    );

    process.chdir(root);
    resetLessonAudioManifestCache();
    const previous = process.env.AUDIO_PUBLIC_BASE_URL;
    delete process.env.AUDIO_PUBLIC_BASE_URL;

    try {
      const enriched = enrichTeachBlocksWithAudio([
        {
          type: "phrases",
          title: "Greetings",
          items: [{ de: "Tschüss", en: "Bye" }],
        },
      ]);

      assert.equal(enriched[0]?.type, "phrases");
      if (enriched[0]?.type === "phrases") {
        assert.equal(enriched[0].items[0]?.audioUrl, `/v1/media/audio/${digest}.mp3`);
      }
    } finally {
      if (previous === undefined) {
        delete process.env.AUDIO_PUBLIC_BASE_URL;
      } else {
        process.env.AUDIO_PUBLIC_BASE_URL = previous;
      }
    }
  });
});
