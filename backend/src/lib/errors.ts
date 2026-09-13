import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; reason: string }>;
  };
  meta: { requestId: string };
};

export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorBody["error"]["details"],
) => {
  const requestId = (reply.request.id as string) || randomUUID();
  const body: ApiErrorBody = {
    error: { code, message, details },
    meta: { requestId },
  };
  return reply.status(statusCode).send(body);
};

export const registerErrorHandler = (app: FastifyInstance) => {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request_error");
    const err = error as { statusCode?: number; message?: string };
    const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
    const code =
      statusCode === 400
        ? "BAD_REQUEST"
        : statusCode === 401
          ? "UNAUTHORIZED"
          : statusCode === 403
            ? "FORBIDDEN"
            : statusCode === 404
              ? "NOT_FOUND"
              : statusCode === 429
                ? "RATE_LIMITED"
                : "INTERNAL_ERROR";
    const message =
      statusCode >= 500 ? "An unexpected error occurred." : err.message || "Request failed.";
    return sendError(reply, statusCode, code, message);
  });
};
