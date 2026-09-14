/**
 * Server-side origin used to proxy `/v1` to the Fastify API.
 * Prefer the Compose service URL so Coolify does not hairpin through the public domain.
 */
export const getUpstreamApiUrl = (): string => {
  const raw =
    process.env.API_INTERNAL_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  return raw.replace(/\/$/, "");
};
