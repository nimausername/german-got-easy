import type { FastifyPluginAsync } from "fastify";
import { sendError } from "../lib/errors.js";
import {
  getVocabularyWord,
  listVocabularyWords,
  parseVocabularyListQuery,
} from "../services/vocabulary-book.js";

export const vocabularyRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/words", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const parsed = parseVocabularyListQuery(request.query as Record<string, unknown>);
    if (!parsed.ok) {
      return sendError(reply, 400, "VALIDATION_ERROR", parsed.message);
    }

    try {
      const result = await listVocabularyWords({
        userId: user.id,
        query: parsed.data,
      });

      return {
        data: {
          words: result.words,
          nextCursor: result.nextCursor,
          totalInBank: result.totalInBank,
          matchedCount: result.matchedCount,
        },
        meta: {
          requestId: request.id,
          limit: result.limit,
        },
      };
    } catch (error) {
      const statusCode =
        error && typeof error === "object" && "statusCode" in error
          ? Number((error as { statusCode: number }).statusCode)
          : 500;
      if (statusCode === 400) {
        return sendError(
          reply,
          400,
          "VALIDATION_ERROR",
          error instanceof Error ? error.message : "Invalid query.",
        );
      }
      throw error;
    }
  });

  app.get("/v1/words/:wordId", async (request, reply) => {
    const user = request.currentUser;
    if (!user) return sendError(reply, 401, "UNAUTHORIZED", "Authentication required.");

    const { wordId } = request.params as { wordId: string };
    const word = await getVocabularyWord({ userId: user.id, wordId });
    if (!word) return sendError(reply, 404, "NOT_FOUND", "Word not found.");

    return {
      data: { word },
      meta: { requestId: request.id },
    };
  });
};
