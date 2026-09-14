import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { expandCorsOrigins } from "./cors-origins.js";

describe("expandCorsOrigins", () => {
  it("adds the opposite scheme and www variants", () => {
    const origins = expandCorsOrigins("https://german.example.com");
    assert.ok(origins.includes("https://german.example.com"));
    assert.ok(origins.includes("http://german.example.com"));
    assert.ok(origins.includes("https://www.german.example.com"));
    assert.ok(origins.includes("http://www.german.example.com"));
  });

  it("keeps comma-separated origins", () => {
    const origins = expandCorsOrigins(
      "https://app.example.com, http://localhost:3000",
    );
    assert.ok(origins.includes("https://app.example.com"));
    assert.ok(origins.includes("http://localhost:3000"));
    assert.ok(origins.includes("https://localhost:3000"));
  });
});
