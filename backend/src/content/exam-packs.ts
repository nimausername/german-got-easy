/**
 * Sample exam pack content seeded into the database.
 */
export const SAMPLE_EXAM_PACK = {
  slug: "goethe-b1-sample",
  title: "Goethe B1 sample practice",
  levelCode: "B1",
  timeLimitSec: 900,
  payload: {
    items: [
      {
        id: "e1",
        type: "mcq",
        prompt: "Welche Formalität passt in einer E-Mail an Ihren Chef?",
        options: ["Hallo Alter", "Sehr geehrte Damen und Herren", "Tschüss", "Yo"],
        answer: "Sehr geehrte Damen und Herren",
      },
      {
        id: "e2",
        type: "cloze",
        prompt: "Wenn ich Zeit ___, gehe ich spazieren.",
        answer: "habe",
      },
    ],
  },
} as const;
