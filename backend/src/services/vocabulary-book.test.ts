import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildVocabularyWhere,
  decodeVocabCursor,
  encodeVocabCursor,
  isVocabStatusFilter,
  parseVocabularyListQuery,
} from "./vocabulary-book.js";

describe("vocabulary-book cursors", () => {
  it("round-trips frequency and id", () => {
    const encoded = encodeVocabCursor({ frequencyRank: 12, id: "word_abc" });
    assert.equal(decodeVocabCursor(encoded)?.frequencyRank, 12);
    assert.equal(decodeVocabCursor(encoded)?.id, "word_abc");
  });

  it("rejects malformed cursors", () => {
    assert.equal(decodeVocabCursor("not-valid"), null);
    assert.equal(decodeVocabCursor(encodeVocabCursor({ frequencyRank: 1, id: "" })!), null);
  });
});

describe("parseVocabularyListQuery", () => {
  it("accepts whitelisted filters", () => {
    const parsed = parseVocabularyListQuery({
      q: "haus",
      topic: "HOME",
      cefrBand: "A1",
      status: "learning",
      limit: "25",
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.q, "haus");
    assert.equal(parsed.data.topic, "HOME");
    assert.equal(parsed.data.cefrBand, "A1");
    assert.equal(parsed.data.status, "learning");
    assert.equal(parsed.data.limit, 25);
  });

  it("rejects unknown topic and status", () => {
    assert.equal(parseVocabularyListQuery({ topic: "SPACE" }).ok, false);
    assert.equal(parseVocabularyListQuery({ status: "mastered" }).ok, false);
    assert.equal(isVocabStatusFilter("unseen"), true);
  });
});

describe("buildVocabularyWhere", () => {
  it("builds search, topic, and unseen filters", () => {
    const where = buildVocabularyWhere({
      userId: "user_1",
      q: "house",
      topic: "HOME",
      status: "unseen",
    });

    assert.ok(where.AND);
    const clauses = where.AND as unknown[];
    assert.equal(clauses.length, 3);
  });

  it("applies composite cursor after frequency rank", () => {
    const where = buildVocabularyWhere({
      userId: "user_1",
      cursor: { frequencyRank: 10, id: "abc" },
    });
    assert.ok(where.AND);
  });
});
