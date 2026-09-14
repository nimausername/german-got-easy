import { getApiUrl } from "@/lib/public-env";

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
  meta?: { requestId?: string };
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

let refreshInFlight: Promise<boolean> | null = null;

const isAuthPath = (path: string) => path.startsWith("/v1/auth/");

/**
 * Attempts a silent cookie refresh. Deduplicates concurrent callers.
 */
const tryRefreshSession = async (): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${getApiUrl()}/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        return response.ok;
      } catch {
        return false;
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

/**
 * Authenticated API helper. Relies on httpOnly cookies only (no JS token store).
 */
export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const doFetch = async () => {
    try {
      return await fetch(`${getApiUrl()}${path}`, {
        ...init,
        credentials: "include",
        headers,
      });
    } catch {
      throw new ApiRequestError(
        0,
        "NETWORK",
        "Could not reach the API. Check your connection and try again.",
      );
    }
  };

  let response = await doFetch();

  if (response.status === 401 && !isAuthPath(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await doFetch();
    }
  }

  let body: T | ApiError;
  try {
    body = (await response.json()) as T | ApiError;
  } catch {
    throw new ApiRequestError(response.status, "REQUEST_FAILED", "Request failed");
  }
  if (!response.ok) {
    const errorBody = body as ApiError;
    const message =
      "error" in errorBody ? errorBody.error.message : "Request failed";
    const code = "error" in errorBody ? errorBody.error.code : "REQUEST_FAILED";
    throw new ApiRequestError(response.status, code, message);
  }
  return body as T;
};
