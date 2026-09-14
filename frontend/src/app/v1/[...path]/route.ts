import { NextRequest } from "next/server";
import { getUpstreamApiUrl } from "@/lib/api-upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOP_BY_HOP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Forwards a browser `/v1/*` request to the Fastify API, preserving cookies.
 */
const proxyApiRequest = async (
  request: NextRequest,
  pathSegments: string[],
): Promise<Response> => {
  const pathname = `/v1/${pathSegments.join("/")}`;
  const upstreamUrl = `${getUpstreamApiUrl()}${pathname}${request.nextUrl.search}`;
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const method = request.method.toUpperCase();
  const hasBody = !METHODS_WITHOUT_BODY.has(method);

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (HOP_BY_HOP.has(lower) || lower === "set-cookie") {
        return;
      }
      responseHeaders.set(key, value);
    });

    const setCookies = upstreamResponse.headers.getSetCookie();
    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", cookie);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      {
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: "The API is unavailable. Try again in a moment.",
        },
        meta: {},
      },
      { status: 502 },
    );
  }
};

const handle = async (request: NextRequest, context: RouteContext) => {
  const { path } = await context.params;
  return proxyApiRequest(request, path ?? []);
};

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
