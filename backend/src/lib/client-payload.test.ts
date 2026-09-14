import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  gradeMatchAnswer,
  toClientExamItem,
  toClientExercisePayload,
} from "./client-payload.js";

describe("toClientExercisePayload", () => {
  it("strips mcq answers while keeping options", () => {
    const safe = toClientExercisePayload("mcq", {
      options: ["a", "b"],
      answer: "a",
    });
    assert.deepEqual(safe, { options: ["a", "b"] });
  });

  it("strips cloze answers entirely", () => {
    const safe = toClientExercisePayload("cloze", {
      answer: "bin",
      accepted: ["bin"],
    });
    assert.deepEqual(safe, {});
  });

  it("shuffles reorder tokens and drops the answer", () => {
    const tokens = ["Ich", "komme", "aus", "Deutschland"];
    const safe = toClientExercisePayload("reorder", {
      tokens,
      answer: tokens,
    });
    assert.equal("answer" in safe, false);
    assert.ok(Array.isArray(safe.tokens));
    assert.deepEqual([...(safe.tokens as string[])].sort(), [...tokens].sort());
  });

  it("splits match pairs into lefts and shuffled rights", () => {
    const safe = toClientExercisePayload("match", {
      pairs: [
        { left: "Hallo", right: "Hello" },
        { left: "Guten Morgen", right: "Good morning" },
      ],
    });
    assert.deepEqual(safe.lefts, ["Hallo", "Guten Morgen"]);
    assert.ok(Array.isArray(safe.rights));
    assert.deepEqual([...(safe.rights as string[])].sort(), ["Good morning", "Hello"].sort());
    assert.equal("pairs" in safe, false);
  });
});

describe("gradeMatchAnswer", () => {
  const payload = {
    pairs: [
      { left: "eins", right: "1" },
      { left: "zwei", right: "2" },
    ],
  };

  it("accepts a full correct mapping", () => {
    assert.equal(gradeMatchAnswer(payload, { eins: "1", zwei: "2" }), true);
  });

  it("rejects partial or wrong mappings", () => {
    assert.equal(gradeMatchAnswer(payload, { eins: "1" }), false);
    assert.equal(gradeMatchAnswer(payload, { eins: "2", zwei: "1" }), false);
    assert.equal(gradeMatchAnswer(payload, true), false);
  });
});

describe("toClientExamItem", () => {
  it("removes top-level answers from exam items", () => {
    const safe = toClientExamItem({
      id: "e1",
      type: "mcq",
      prompt: "Pick one",
      options: ["a", "b"],
      answer: "a",
    });
    assert.equal("answer" in safe, false);
    assert.deepEqual(safe.options, ["a", "b"]);
  });
});
