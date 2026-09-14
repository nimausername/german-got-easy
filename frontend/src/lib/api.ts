const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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
      const response = await fetch(`${API_URL}/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
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

  const doFetch = () =>
    fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });

  let response = await doFetch();

  if (response.status === 401 && !isAuthPath(path)) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      response = await doFetch();
    }
  }

  const body = (await response.json()) as T | ApiError;
  if (!response.ok) {
    const errorBody = body as ApiError;
    const message =
      "error" in errorBody ? errorBody.error.message : "Request failed";
    const code = "error" in errorBody ? errorBody.error.code : "REQUEST_FAILED";
    throw new ApiRequestError(response.status, code, message);
  }
  return body as T;
};
