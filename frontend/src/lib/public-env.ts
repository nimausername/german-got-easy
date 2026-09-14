/**
 * Browser-visible API origin. Coolify writes this at container start via /env.js.
 */
export const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    const runtimeUrl = window.__GGE_API_URL__?.trim();
    if (runtimeUrl) {
      return runtimeUrl.replace(/\/$/, "");
    }
  }

  return (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(
    /\/$/,
    "",
  );
};
