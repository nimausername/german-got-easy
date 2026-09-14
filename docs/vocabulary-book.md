# Vocabulary book

Reference companion to flashcards. Learners look up and browse words; flashcards train recall.

## Shipped (v1)

- Curated system wordbank only (same `Word` rows as flashcards).
- `GET /v1/words` — search (`q`), topic, CEFR, status (`unseen` / `new` / `learning` / `known`), cursor pagination, learner progress join, `totalInBank` + `matchedCount`.
- `GET /v1/words/:wordId` — full entry + progress stats.
- Frontend: `/vocabulary`, `/vocabulary/[wordId]` (learner-first study layout: gender cue, dual coding, context-first example, self-check hide meaning, progress + practice CTA).
- Nav + dashboard link; Practice CTA deep-links to `/flashcards?topic=…`.
- Flashcard feedback links back to the vocabulary entry.

## Shipped (images pilot)

- Optional free Wikimedia Commons images on concrete FOOD_DRINK / HOME / TRAVEL nouns.
- Fields: `imageUrl`, `imageCredit`, `imageLicense`, `imageSourceUrl`.
- Detail page shows photo + attribution caption; abstract words stay text-only.
- See [image-attribution.md](./image-attribution.md).

## Shipped (plural usage examples)

- Optional `examplePluralDe` / `examplePluralEn` on `Word` (nullable).
- Seeded selectively for irregular and high-frequency everyday plurals in `a1-batch-01` (not every noun).
- Detail page shows **Plural in context** under the forms strip when present; English follows the same self-check reveal as the main gloss.
- Skip rare, awkward, or mass-noun plurals rather than forcing a sentence.

### Still out of scope

Pronunciation audio/IPA, starred/personal notebook, open-web dictionary, offline export, images for PEOPLE / abstract lemmas, plural examples for the full bank.

## Key code

| Area | Location |
| --- | --- |
| Service | `backend/src/services/vocabulary-book.ts` |
| Routes | `backend/src/routes/vocabulary.ts` |
| List UI | `frontend/src/app/vocabulary/page.tsx` |
| Detail UI | `frontend/src/app/vocabulary/[wordId]/page.tsx` + `vocabulary-word-study.tsx` |
| Shared labels | `frontend/src/lib/vocabulary.ts` |
| Wordbank | `backend/content/wordbank/*.json` |

## Follow-ups

See [Future plans → Vocabulary & reference](./future-plans.md#1-vocabulary--reference).
