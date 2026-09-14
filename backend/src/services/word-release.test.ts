import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { utcDayKey } from "./word-release.js";

describe("utcDayKey", () => {
  it("formats UTC calendar day as YYYY-MM-DD", () => {
    assert.equal(utcDayKey(new Date("2026-09-14T23:30:00.000Z")), "2026-09-14");
    assert.equal(utcDayKey(new Date("2026-09-15T00:00:00.000Z")), "2026-09-15");
  });
});
