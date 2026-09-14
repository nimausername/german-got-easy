# Curriculum (Learn path)

How **German Got Easy** teaches German in the Learn section: CEFR levels, theme units, teach → practice lessons, and four skills plus grammar and phrases.

## Product idea

Flashcards build word memory. Learn builds **usable language**.

Every lesson follows one loop:

1. **Teach** — short, plain explanations a beginner can read once  
2. **Practice** — graded drills on that same idea  
3. **Can-do** — one clear statement of what the learner can do now  

No quiz without teaching. No long textbook pages. One idea per lesson.

## Hierarchy

```
Level (CEFR: A1, A2, B1, …)
  └── Unit (life theme: greetings, food, travel, …)
        └── Lesson (one can-do + skill tags)
              ├── teachBlocks (ungraded)
              └── exercises (graded practice)
```

- **Units** = subjects / themes (what life situation is this for?).  
- **skillTags** = how you practice (grammar, phrases, reading, writing, listening, speaking, vocabulary).  
- Placement sets `User.targetLevel` for display; the path still walks units in order so beginners do not skip foundations.

## Skill tags (whitelist)

Use only these strings on lessons:

| Tag | Meaning |
| --- | --- |
| `grammar` | One rule or pattern (for example `sein`, articles) |
| `phrases` | Ready-to-say chunks |
| `vocabulary` | New words in a clear set |
| `reading` | Short text or dialogue comprehension |
| `writing` | Spelling / cloze / short production |
| `listening` | Hear German (browser TTS in v1) |
| `speaking` | Say a model line aloud (self-check in v1) |

A lesson usually has 1–3 tags. The first tag is the main focus.

## Lesson anatomy

| Field | Purpose |
| --- | --- |
| `title` | Short lesson name |
| `canDo` | Learner goal: “I can introduce myself.” |
| `summary` | One-line preview on the unit page |
| `skillTags` | From the whitelist above |
| `teachBlocks` | Ordered ungraded blocks (see [lesson-authoring.md](./lesson-authoring.md)) |
| `exercises` | Graded practice (pass ≥ 70%) |

### Teach block types

| Type | Use for |
| --- | --- |
| `explain` | One rule in 3–6 short sentences + examples |
| `phrases` | 4–8 high-frequency chunks with English |
| `pattern` | Fill-the-slots template |
| `dialogue` | 4–6 line model conversation |
| `listen_model` | Text the learner hears via TTS |
| `speak_model` | Line to say aloud, then reveal model |

### Practice exercise types

| Type | Graded? | Notes |
| --- | --- | --- |
| `mcq` | Yes | Multiple choice |
| `cloze` | Yes | Fill the blank |
| `short_write` | Yes | Short typed answer |
| `reorder` | Yes | Put tokens in order |
| `match` | Yes | Pair left ↔ right |
| `listen_mcq` | Yes | Hear TTS → choose |
| `speak_prompt` | No (required) | Learner marks “I said it”; excluded from score denominator |

## Writing style (“super simple”)

- Instructions in clear English.  
- German input stays tiny at A1 (words and short sentences).  
- One grammar point per lesson.  
- Prefer chunks people actually say (`Guten Tag`, `Ich heiße …`) over abstract metalanguage.  
- Examples before exceptions. Never dump a full paradigm table unless it is tiny (for example `sein`: ich bin, du bist, er/sie/es ist).

## A1 unit map (complete path)

A1 is covered in **16 units**. Units 1–8 are the starter path; units 9–16 finish CEFR A1 can-dos (shopping, case, work, free time, weather, health, appointments, modals, Perfekt lite, and a final checkpoint).

| # | Unit theme | Core can-dos |
| --- | --- | --- |
| 1 | Hallo & ich | Greet, introduce yourself, use `heißen` / `sein`, polite `Sie` |
| 2 | People & pronouns | Use ich/du/er/sie/wir; name family members |
| 3 | Numbers & time | Count, say days, tell simple time |
| 4 | Articles & things | Use der/die/das with everyday objects |
| 5 | Food & drink | Order politely; say likes with `gern` / `möchte` |
| 6 | Where I live | Say where you live / come from |
| 7 | Daily routine | Describe a simple day with present tense |
| 8 | Getting around | Ask for help; understand simple directions |
| 9 | Shopping & money | Ask prices, buy something, pay |
| 10 | Accusative & mine | Use Akkusativ (`den` / `einen`) and mein/meine |
| 11 | Work & school | Talk about job/studies with `haben` / `arbeiten` / `lernen` |
| 12 | Hobbies & free time | Say what you do in your free time |
| 13 | Weather & seasons | Describe weather and seasons |
| 14 | Health basics | Say how you feel; visit a doctor with simple phrases |
| 15 | Plans & modals | Make appointments; use `können` / `müssen` / `wollen` |
| 16 | Past lite & A1 check | Separable verbs, simple Perfekt, final can-do review |

Each unit has 3–5 lessons. Content files live under `backend/content/lessons/` as `a1-unit-*.json`.

**Coverage goal:** After unit 16, a motivated learner can handle typical A1 survival tasks (CEFR A1 “can-do” list): self, shopping, directions, routine, free time, simple past events, and polite requests.

## A2 / B1 and later skills

A2 and B1 Level rows may exist empty. Fill them with the same teach → practice shape after A1 is solid.

Later (not A1 v1):

- Recorded audio / IPA (see [future-plans.md](./future-plans.md) §1.1)  
- Speech recognition for speaking scores  
- Path gating by `targetLevel` if product needs it  

## Related docs

- [Lesson authoring](./lesson-authoring.md) — JSON shapes and examples  
- [Future plans](./future-plans.md) — backlog for A2/B1 and audio  
- [Vocabulary book](./vocabulary-book.md) — word bank vs course path  
