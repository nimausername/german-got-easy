import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { toClientExamItem } from "../lib/client-payload.js";
import { sendError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";

const placementSchema = z.object({
  answers: z
    .array(
      z.object({
        id: z.string().min(1).max(64),
        answer: z.string().max(200),
      }),
    )
    .max(50),
});

const PLACEMENT_ITEMS = [
  { id: "p1", prompt: "How do you say hello?", answer: "Hallo", level: "A1" },
  { id: "p2", prompt: "Complete: Ich ___ Student.", answer: "bin", level: "A1" },
  { id: "p3", prompt: 'What is "yesterday"?', answer: "gestern", level: "A2" },
  { id: "p4", prompt: "Perfect tense of gehen (ich):", answer: "bin gegangen", level: "A2" },
  { id: "p5", prompt: 'Conjunction for "although":', answer: "obwohl", level: "B1" },
];

const SAMPLE_EXAM_PAYLOAD = {
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
};

export const placementRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/placement", async (request) => {
    return {
      data: {
        items: PLACEMENT_ITEMS.map(({ id, prompt }) => ({ id, prompt })),
      },
      meta: { requestId: request.id },
    };
  });

  app.post("/v1/placement/submit", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const parsed = placementSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid placement payload.");
    }

    let score = 0;
    for (const item of PLACEMENT_ITEMS) {
      const given = parsed.data.answers
        .find((row) => row.id === item.id)
        ?.answer?.trim()
        .toLowerCase();
      if (given === item.answer.toLowerCase()) score += 1;
    }

    const suggestedLevel = score <= 2 ? "A1" : score <= 4 ? "A2" : "B1";
    await prisma.user.update({
      where: { id: user.id },
      data: { targetLevel: suggestedLevel },
    });

    return {
      data: { score, total: PLACEMENT_ITEMS.length, suggestedLevel },
      meta: { requestId: request.id },
    };
  });

  app.get("/v1/exam-packs/goethe-b1-sample", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const pack = await prisma.examPack.upsert({
      where: { slug: "goethe-b1-sample" },
      create: {
        slug: "goethe-b1-sample",
        title: "Goethe B1 sample practice",
        levelCode: "B1",
        timeLimitSec: 900,
        payload: SAMPLE_EXAM_PAYLOAD,
      },
      update: {},
    });

    const rawPayload = pack.payload as { items?: Record<string, unknown>[] };
    const items = Array.isArray(rawPayload.items)
      ? rawPayload.items.map((item) => toClientExamItem(item))
      : [];

    return {
      data: {
        pack: {
          id: pack.id,
          title: pack.title,
          timeLimitSec: pack.timeLimitSec,
          payload: { items },
        },
      },
      meta: { requestId: request.id },
    };
  });
};
