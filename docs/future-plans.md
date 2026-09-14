# Future plans

Categorized backlog of features we intend to add. Use this as the checklist when picking the next function to build.

**How to use this doc**

1. Pick a category that matches the product gap.
2. Read **Goal**, **Why**, **Scope**, **Suggested approach**, and **Done when**.
3. Implement in a focused PR; keep API camelCase REST + JSON.
4. When shipped, move the item into [Shipped](#shipped) with the date and PR/commit note.

Status legend: `planned` · `next` · `blocked` · `shipped`

---

## 1. Vocabulary & reference

Features that deepen the vocabulary book without replacing flashcards.

### 1.1 Pronunciation audio + IPA

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Learners hear and see how a word is pronounced from the vocabulary detail page (and optionally from flashcard reveal). |
| Why | Spelling alone is not enough for German (Umlauts, final-obstruent, article+noun stress). Audio closes the loop between reading and speaking. |
| Scope | IPA string per word; playable audio (TTS or recorded). Show on `/vocabulary/[wordId]`; optional play control after flashcard flip. |
| Out of scope | Full speech recognition / speaking drills (separate category). |
| Suggested approach | Add nullable `ipa` and `audioUrl` (or `audioKey`) on `Word`. Prefer one TTS pipeline (for example Azure/Google/Amazon) generating files into object storage, or vendor stream URLs with caching. Seed IPA for high-frequency A1 first. Do not block list/search on audio availability. |
| Dependencies | Content licensing for recorded voices if not TTS; CDN/storage; schema migration. |
| Done when | ≥80% of A1 seeded words have IPA; detail page plays audio when present; missing audio does not error the page; API returns `ipa` / `audioUrl` as nullable camelCase fields. |

### 1.2 Selective images for concrete nouns

| Field | Detail |
| --- | --- |
| Status | `shipped` (pilot) |
| Goal | Show a clear picture for concrete nouns (food, places, objects) on the word detail page when it aids meaning. |
| Why | Dual coding helps beginners; images are noise for abstract words (`trotzdem`, `jedoch`). |
| Scope | Optional Commons image + attribution on `Word`; FOOD_DRINK / HOME / TRAVEL concrete nouns in A1 batch 01. |
| Remaining | Expand to more topics and the full ~4000 bank using [image-attribution.md](./image-attribution.md). |
| Out of scope | AI-generated galleries; PEOPLE portraits; images for abstract words. |

### 1.3 Starred / personal vocabulary list

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Learners bookmark words they care about (exam list, trip list) independent of SRS status. |
| Why | Progress status (new/learning/known) is not the same as “I want this later.” Bookmarks fill that gap without becoming a second dictionary. |
| Scope | `UserWordStar` (or boolean on progress) with list filter “Starred” on `/vocabulary`. Star/unstar on detail page. |
| Out of scope | Shared public lists; Anki export (see 1.5). |
| Suggested approach | New join table `(userId, wordId, createdAt)` unique; `GET /v1/words?starred=true`; `PUT/DELETE /v1/words/:wordId/star`. Keep RBAC: only the owner’s stars. |
| Dependencies | Vocabulary list API already supports filters. |
| Done when | User can star/unstar; filter shows only starred words; stars persist across sessions; another user never sees them. |

### 1.4 Single-word practice from vocabulary detail

| Field | Detail |
| --- | --- |
| Status | `next` |
| Goal | From a word entry, start a short flashcard session that focuses on **that word** (not only its topic). |
| Why | “Practice this topic” is useful but broad; lookup → immediate drill on one lemma is the natural reference→practice loop. |
| Scope | CTA **Practice this word** on detail page; session of 1–N prompt types for one `wordId` (recognize, produce, gender, cloze, plural as applicable). |
| Out of scope | Replacing topic/due modes. |
| Suggested approach | Extend flashcard session API: `mode=word&wordId=…` (or `POST /v1/flashcards/session` body). Reuse `buildSessionCard` / scheduler so answers still update `UserWordProgress`. |
| Dependencies | Existing flashcard prompt + scheduler services. |
| Done when | Detail CTA opens a working single-word session; wrong/right updates progress; user can return to the vocabulary entry. |

### 1.5 Export / printable word list

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Export filtered vocabulary (topic, starred, CEFR) as CSV or printable PDF for offline study. |
| Why | Some learners still use paper or third-party SRS. |
| Scope | Authenticated export of the curated bank subset the user can already see; include lemma, article, plural, translation, example DE. |
| Out of scope | Full Anki package with scheduling state (later if demanded). |
| Suggested approach | `GET /v1/words/export?format=csv&…` streaming CSV; PDF only if a clear layout exists. Rate-limit exports. |
| Done when | CSV download matches current filters; no access to other users’ progress fields beyond the exporter’s own status columns if included. |

### 1.6 Open dictionary beyond the curated bank

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Look up words outside the ~4000 curated set. |
| Why | Learners meet rare words in the wild; the book should not pretend to be infinite. |
| Scope | Explicit “outside bank” search via licensed dictionary API or offline lexicon; results clearly labeled as external; optional “Add to my study list” that creates a user-owned card only after review rules are defined. |
| Out of scope | Scraping proprietary dictionaries; silently mixing external lemmas into the core frequency-ranked bank. |
| Suggested approach | Keep curated `Word` table clean. External hits in a separate response shape (`source: "external"`). Do not assign `frequencyRank` in the core bank without editorial intake. |
| Dependencies | Dictionary license; rate limits; abuse controls. |
| Done when | External lookup works; curated bank rankings unchanged; product copy explains the difference. |

---

## 2. Content & wordbank scale

### 2.1 Grow curated bank toward ~4000 everyday words

| Field | Detail |
| --- | --- |
| Status | `next` |
| Goal | Reach the product promise of ~4000 high-utility words across A1–B1 with examples and topics. |
| Why | Flashcards + vocabulary book only teach what is seeded. |
| Scope | Batched JSON under `backend/content/wordbank/`; consistent schema with seed upsert; frequency ranks stable and unique enough for pagination. |
| Suggested approach | Frequency lists + CEFR lists; editorial pass for article/plural/examples; seed in batches (`a1-batch-02`, `a2-…`). Keep `@@unique([lemma, article])`. |
| Done when | Documented count in README matches seed reality within ~5%; each word has DE/EN example; topics balanced. |

### 2.2 Richer usage notes and multiple examples

| Field | Detail |
| --- | --- |
| Status | `planned` (partial) |
| Goal | Support 2–3 examples and structured usage notes (separable verbs, case government). |
| Why | One sentence is often not enough for verbs with fixed prepositions. |
| Scope | Migrate from single `exampleDe`/`exampleEn` to `examples[]` JSON or related table; backfill existing rows. |
| Partial ship | Nullable `examplePluralDe` / `examplePluralEn` for selective plural-in-context sentences (see [vocabulary-book.md](./vocabulary-book.md)). Full multi-example model remains planned. |
| Done when | Detail page shows multiple examples; flashcard cloze can pick one example deterministically. |

---

## 3. Flashcards & memory

### 3.1 Lesson ↔ flashcard tighter coupling

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | After a lesson, surface the exact lemmas that appeared as a ready-made review set. |
| Why | Spaced repetition should reinforce what the learner just practiced in exercises. |
| Scope | “Review lesson words” session from lesson complete screen; uses existing `Exercise.wordId` links. |
| Done when | Completing a lesson offers a session that only contains that lesson’s linked words. |

### 3.2 Typing-friendly produce mode improvements

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Better acceptance of minor typos / article variants without false “correct.” |
| Why | German production is hard; UX friction causes rage-quits. |
| Scope | Normalize answers (trim, ß/ss policy documented); optional “almost” feedback that still schedules as `hard`/`again` per product rule. |
| Done when | Documented normalization rules covered by unit tests; no silent accept of wrong gender. |

### 3.3 Offline-capable review queue (PWA)

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Download due cards and review without network; sync ratings later. |
| Why | Commute / travel learners. |
| Scope | Service worker cache of due session payload; outbox for answers; conflict policy = server scheduler wins on sync. |
| Done when | Due session works offline for previously fetched cards; sync does not duplicate progress rows. |

---

## 4. Lessons & CEFR path

### 4.1 Full A1–B1 lesson path content

| Field | Detail |
| --- | --- |
| Status | `next` |
| Goal | Complete unit/lesson graphs for A1, then A2/B1, with exercises wired to words where useful. |
| Why | Vocabulary alone is not a course; grammar and skills need a path. |
| Scope | JSON content under `backend/content/lessons/`; seed idempotent; skill tags consistent. |
| Done when | Learner can progress through published units without empty stubs; path/next never points at missing lessons. |

### 4.2 Grammar explainers beside exercises

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Short, focused grammar notes (Nominativ vs Akkusativ, separable verbs) linked from lessons. |
| Why | Drills without explanation feel random. |
| Scope | Content blocks, not a full grammar textbook; open from lesson UI. |
| Done when | At least A1 Unit 1 exercises that need case/gender link to an explainer. |

---

## 5. Progress, goals & exams

### 5.1 Clear goals toward “communicate with 4000 words”

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Dashboard shows % of bank known/learning and topic coverage, not only due counts. |
| Why | The 4000-word promise needs a visible finish line. |
| Scope | Aggregate endpoints or extend `/v1/me`; simple charts/progress bars on dashboard. |
| Done when | User sees bank coverage by topic and CEFR; numbers match vocabulary filters. |

### 5.2 Exam packs with result review

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Timed exam packs (`ExamPack`) with review of wrong items linking into vocabulary entries. |
| Why | Placement alone is not ongoing assessment. |
| Scope | Attempt → score → wrong lemmas → deep link to `/vocabulary/[id]`. |
| Done when | One published A1 pack is playable end-to-end with review links. |

---

## 6. Platform & quality

### 6.1 Vocabulary API contract tests

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Integration tests for `/v1/words` filters, cursor stability, and 404 detail. |
| Why | List/search regressions break the book silently. |
| Done when | CI runs tests covering `q`, topic, status, bad cursor → 400, unknown id → 404. |

### 6.2 Accessibility pass on vocabulary + flashcards

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | Keyboard and screen-reader paths for search, filters, and card grading. |
| Done when | Can complete a flashcard and open a vocab entry using keyboard only; labels present on icon buttons. |

### 6.3 Content license & attribution UI

| Field | Detail |
| --- | --- |
| Status | `planned` |
| Goal | In-app footer/docs link for CC BY word/lesson content and third-party audio/image credits. |
| Done when | Vocabulary and lesson surfaces link to `LICENSE-CONTENT` and media attributions where required. |

---

## Shipped

Record completed roadmap items here so the backlog stays honest.

| Date | Item | Notes |
| --- | --- | --- |
| 2026-09-14 | Vocabulary Book v1 | Searchable curated book, detail page, progress badges, nav/dashboard links, flashcard ↔ vocab links. See [vocabulary-book.md](./vocabulary-book.md). |
| 2026-09-14 | Vocabulary images pilot | Wikimedia Commons CC0/PD/CC BY(+SA) images for 18 concrete A1 nouns; detail attribution. See [image-attribution.md](./image-attribution.md). |
| 2026-09-14 | Plural usage examples | Nullable `examplePluralDe`/`examplePluralEn`; selective A1 seed; detail “Plural in context” block. See [vocabulary-book.md](./vocabulary-book.md). |

---

## Suggested build order

1. **2.1** Wordbank scale (content unlocks everything else).
2. **1.4** Single-word practice (tight reference → drill loop).
3. **1.1** Pronunciation (high learner value once entries exist).
4. **1.3** Starred list.
5. **5.1** Coverage goals on dashboard.
6. Expand **1.2** images to remaining concrete topics (see [image-attribution.md](./image-attribution.md)).
7. Remaining items by demand.

When priorities change, update this order in the same PR as the product decision—do not leave the doc contradicting what the team is actually building.
