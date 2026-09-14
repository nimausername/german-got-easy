/**
 * Liveness probe for Coolify / Docker. Does not touch the API.
 */
export const GET = () =>
  Response.json({
    data: { status: "ok" },
    meta: {},
  });
