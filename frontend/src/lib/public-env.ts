/**
 * Browser API origin. The web app always calls same-origin `/v1`, which Next.js
 * proxies to Fastify. Server-side callers use the upstream URL directly.
 */
export const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    return "";
  }

  return (
    process.env.API_INTERNAL_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000"
  ).replace(/\/$/, "");
};
