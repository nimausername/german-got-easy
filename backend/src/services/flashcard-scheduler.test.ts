import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildClozeSentence,
  buildSessionCard,
  gradeAnswer,
  selectPromptType,
  type PromptWord,
} from "./flashcard-prompts.js";
import { scheduleFlashcard } from "./flashcard-scheduler.js";

const noun: PromptWord = {
  id: "1",
  lemma: "Haus",
  article: "das",
  plural: "Häuser",
  translation: "house",
  partOfSpeech: "NOUN",
  exampleDe: "Wir wohnen in einem Haus.",
  exampleEn: "We live in a house.",
  usageNote: null,
};

describe("scheduleFlashcard", () => {
  it("requeues again answers with a short delay", () => {
    const result = scheduleFlashcard({
      rating: "again",
      easeFactor: 2.5,
      intervalDays: 5,
      repetitions: 3,
    });

    assert.equal(result.repetitions, 0);
    assert.equal(result.status, "LEARNING");
    assert.equal(result.requeueInSession, true);
    assert.ok(result.intervalDays > 0);
    assert.ok(result.intervalDays < 1);
  });

  it("marks stable cards as REVIEW then KNOWN", () => {
    const review = scheduleFlashcard({
      rating: "good",
      easeFactor: 2.5,
      intervalDays: 3,
      repetitions: 1,
    });
    assert.equal(review.status, "REVIEW");

    const known = scheduleFlashcard({
      rating: "easy",
      easeFactor: 2.6,
      intervalDays: 21,
      repetitions: 4,
    });
    assert.equal(known.status, "KNOWN");
  });
});

describe("flashcard prompts", () => {
  it("starts new words on recognize", () => {
    assert.equal(selectPromptType(noun, "new", 0), "recognize");
  });

  it("uses gender on early noun reviews", () => {
    assert.equal(selectPromptType(noun, "review", 1), "gender");
  });

  it("builds cloze blanks for the lemma", () => {
    assert.equal(buildClozeSentence(noun.exampleDe, noun.lemma), "Wir wohnen in einem ____.");
  });

  it("grades produce answers with or without article", () => {
    const card = buildSessionCard(noun, "review", "produce");
    assert.equal(gradeAnswer("das Haus", card.acceptedAnswers), true);
    assert.equal(gradeAnswer("Haus", card.acceptedAnswers), true);
    assert.equal(gradeAnswer("die Haus", card.acceptedAnswers), false);
  });

  it("grades gender answers", () => {
    const card = buildSessionCard(noun, "review", "gender");
    assert.equal(gradeAnswer("das", card.acceptedAnswers), true);
    assert.equal(gradeAnswer("der", card.acceptedAnswers), false);
  });
});
