import { createReadStream, existsSync, statSync } from "node:fs";
import type { FastifyPluginAsync } from "fastify";
import { sendError } from "../lib/errors.js";
import { lessonAudioFilePath } from "../lib/lesson-audio.js";

/**
 * Serves local lesson TTS MP3s for development when files exist on disk.
 * Production should set AUDIO_PUBLIC_BASE_URL and serve audio from R2/CDN.
 */
export const mediaRoutes: FastifyPluginAsync = async (app) => {
  app.get("/v1/media/audio/:fileName", async (request, reply) => {
    const { fileName } = request.params as { fileName: string };
    const filePath = lessonAudioFilePath(fileName);
    if (!filePath) {
      return sendError(reply, 400, "VALIDATION_ERROR", "Invalid audio file name.");
    }

    if (!existsSync(filePath)) {
      return sendError(reply, 404, "NOT_FOUND", "Audio not found.");
    }

    const { size, mtimeMs } = statSync(filePath);
    const etag = `"${size.toString(16)}-${Math.trunc(mtimeMs).toString(16)}"`;
    if (request.headers["if-none-match"] === etag) {
      return reply.status(304).send();
    }

    void reply
      .header("content-type", "audio/mpeg")
      .header("content-length", size)
      .header("etag", etag)
      .header("cache-control", "public, max-age=3600, must-revalidate");

    return reply.send(createReadStream(filePath));
  });
};
