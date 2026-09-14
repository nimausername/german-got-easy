# Lesson authoring

How to add or edit Learn content under `backend/content/lessons/`. Read [curriculum.md](./curriculum.md) first for pedagogy and the A1 map.

## File layout

- One JSON file per unit: `a1-unit-01-hallo.json`, `a1-unit-02-people.json`, …  
- Each file is a **JSON array** with one unit object (or more if you intentionally group small units).  
- Seed loads every `a1-unit-*.json` in the lessons folder (sorted by filename).  
- Re-seed replaces exercises for each lesson; unit/lesson rows upsert by slug.

License: lesson content is CC BY 4.0 (see `LICENSE-CONTENT`).

## Unit object

```json
{
  "slug": "hallo",
  "title": "Hallo & ich",
  "description": "Greet people and introduce yourself.",
  "lessons": []
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | Yes | Stable kebab-case; unique within the CEFR level |
| `title` | Yes | Shown in the Learn hub |
| `description` | No | Short unit blurb |
| `lessons` | Yes | Ordered array |

## Lesson object

```json
{
  "slug": "hello",
  "title": "Hallo & Guten Tag",
  "canDo": "I can greet someone in German.",
  "summary": "Hello, good day, and goodbye.",
  "skillTags": ["phrases", "speaking", "listening"],
  "teachBlocks": [],
  "exercises": []
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | Yes | Unique within the unit |
| `title` | Yes | Lesson heading |
| `canDo` | Yes | “I can …” sentence |
| `summary` | No | One-line preview |
| `skillTags` | Yes | Whitelist from [curriculum.md](./curriculum.md) |
| `teachBlocks` | Yes | At least one block for new lessons |
| `exercises` | Yes | At least three practice items when possible |

## Teach blocks

Each block has `type` plus type-specific fields.

### `explain`

```json
{
  "type": "explain",
  "title": "Greetings change with the time of day",
  "body": "Use Hallo any time. Guten Morgen is for the morning. Guten Tag is the safe daytime greeting. Guten Abend is for the evening.",
  "examples": [
    { "de": "Guten Tag!", "en": "Good day!" },
    { "de": "Guten Morgen!", "en": "Good morning!" }
  ]
}
```

### `phrases`

```json
{
  "type": "phrases",
  "title": "Useful greetings",
  "items": [
    { "de": "Hallo", "en": "Hello" },
    { "de": "Guten Tag", "en": "Good day" },
    { "de": "Auf Wiedersehen", "en": "Goodbye" }
  ]
}
```

### `pattern`

```json
{
  "type": "pattern",
  "title": "Say your name",
  "template": "Ich heiße ____.",
  "meaning": "My name is ____.",
  "examples": ["Ich heiße Anna.", "Ich heiße Tom."]
}
```

### `dialogue`

```json
{
  "type": "dialogue",
  "title": "Meeting someone",
  "lines": [
    { "speaker": "A", "de": "Hallo! Wie heißt du?", "en": "Hello! What is your name?" },
    { "speaker": "B", "de": "Ich heiße Lea. Und du?", "en": "My name is Lea. And you?" }
  ]
}
```

### `listen_model`

```json
{
  "type": "listen_model",
  "title": "Listen",
  "text": "Guten Tag! Ich heiße Max.",
  "hint": "Play the audio, then repeat quietly."
}
```

### `speak_model`

```json
{
  "type": "speak_model",
  "title": "Say it",
  "prompt": "Greet someone politely.",
  "modelText": "Guten Tag!",
  "hint": "Speak out loud. Then reveal the model."
}
```

## Practice exercises

Shared shape:

```json
{
  "type": "mcq",
  "prompt": "How do you say \"Good day\"?",
  "payload": {}
}
```

### Payload by type

| Type | Payload |
| --- | --- |
| `mcq` | `{ "options": ["…"], "answer": "…" }` |
| `cloze` / `short_write` | `{ "answer": "…", "accepted": ["…"] }` |
| `reorder` | `{ "tokens": ["Ich","bin","Anna"], "answer": ["Ich","bin","Anna"] }` |
| `match` | `{ "pairs": [{ "left": "Hallo", "right": "Hello" }] }` |
| `listen_mcq` | `{ "speakText": "Guten Morgen", "options": ["…"], "answer": "…" }` |
| `speak_prompt` | `{ "modelText": "Ich heiße Anna.", "hint": "Say your name." }` |

Rules:

- Never put the correct answer only in the prompt.  
- Prefer `accepted` for spelling variants (`heiße` / `heisse`).  
- `speak_prompt` is required to complete the lesson but **does not** enter the score.  
- `listen_mcq` must include `speakText` for TTS; do not rely on the prompt alone for the spoken string.
- After changing any speakable German string (`phrases`, dialogue lines, `listen_model`, `speakText`, `modelText`, pattern examples), regenerate neural audio:

```bash
pip install -r backend/scripts/requirements-audio.txt
pnpm --dir backend audio:generate
```

This writes MP3s under `backend/content/audio/` and updates `backend/content/audio-manifest.json`.

Then upload to R2 (do **not** commit MP3s):

```bash
pnpm --dir backend audio:upload-r2
```

Commit the updated `audio-manifest.json` with the lesson JSON. MP3s are gitignored and served from `AUDIO_PUBLIC_BASE_URL`.

## Do / don’t

**Do**

- Keep teach blocks short.  
- Practice only what you taught in this lesson.  
- Mix skills when it helps (for example phrases + listen_mcq).  
- Use life-like German.

**Don’t**

- Introduce three grammar topics in one lesson.  
- Write long English essays in `explain`.  
- Invent new skill tags or exercise types without updating the API and docs.  
- Leave answers in client-visible fields outside `payload` secrets the server already strips (`answer`, `accepted`, …).
- Commit `backend/content/audio/*.mp3` — upload them with `audio:upload-r2` instead.

## After you edit JSON

1. Run `pnpm --dir backend prisma:seed` (or your usual seed command).  
2. If you changed speakable German text, run `pnpm --dir backend audio:generate`, then `pnpm --dir backend audio:upload-r2`, and commit the updated manifest.  
3. Open `/learn`, open the unit, run one full lesson teach → practice.  
4. Confirm Listen / Play audio uses neural MP3s from R2 (browser TTS is only the fallback).
