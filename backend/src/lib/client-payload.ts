/**
 * Builds client-safe exercise and exam payloads by removing answers and
 * shuffling order-sensitive prompt material.
 */

const SECRET_KEYS = new Set([
  "answer",
  "accepted",
  "answers",
  "correct",
  "expected",
  "solution",
]);

/**
 * Fisher–Yates shuffle that returns a new array.
 */
export const shuffleCopy = <T>(items: readonly T[]): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
};

type MatchPair = { left: string; right: string };

const isMatchPair = (value: unknown): value is MatchPair =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as MatchPair).left === "string" &&
      typeof (value as MatchPair).right === "string",
  );

/**
 * Returns a payload safe to send to learners (no answers / solutions).
 */
export const toClientExercisePayload = (
  type: string,
  payload: Record<string, unknown>,
): Record<string, unknown> => {
  if (type === "mcq") {
    return {
      options: Array.isArray(payload.options) ? payload.options : [],
    };
  }

  if (type === "cloze" || type === "short_write") {
    return {};
  }

  if (type === "reorder") {
    const tokens = Array.isArray(payload.tokens)
      ? payload.tokens.filter((item): item is string => typeof item === "string")
      : [];
    return { tokens: shuffleCopy(tokens) };
  }

  if (type === "match") {
    const pairs = Array.isArray(payload.pairs) ? payload.pairs.filter(isMatchPair) : [];
    return {
      lefts: pairs.map((pair) => pair.left),
      rights: shuffleCopy(pairs.map((pair) => pair.right)),
    };
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!SECRET_KEYS.has(key)) {
      safe[key] = value;
    }
  }
  return safe;
};

/**
 * Strips answer fields from exam-pack item payloads.
 */
export const toClientExamItem = (item: Record<string, unknown>): Record<string, unknown> => {
  const type = typeof item.type === "string" ? item.type : "";
  const payload =
    item.payload && typeof item.payload === "object"
      ? toClientExercisePayload(type, item.payload as Record<string, unknown>)
      : undefined;

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    if (SECRET_KEYS.has(key) || key === "payload") continue;
    safe[key] = value;
  }
  if (payload) {
    safe.payload = payload;
  } else if (type === "mcq" && Array.isArray(item.options)) {
    safe.options = item.options;
  } else if (type === "cloze" || type === "short_write") {
    // prompt-only items already have answers at the top level; strip them above
  }
  return safe;
};

/**
 * Grades a match exercise answer of shape Record&lt;left, right&gt;.
 */
export const gradeMatchAnswer = (
  payload: Record<string, unknown>,
  answer: unknown,
): boolean => {
  const pairs = Array.isArray(payload.pairs) ? payload.pairs.filter(isMatchPair) : [];
  if (pairs.length === 0) return false;
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return false;

  const given = answer as Record<string, unknown>;
  if (Object.keys(given).length !== pairs.length) return false;

  return pairs.every(
    (pair) => typeof given[pair.left] === "string" && given[pair.left] === pair.right,
  );
};
