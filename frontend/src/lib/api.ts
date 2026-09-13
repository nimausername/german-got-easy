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

const TOKEN_KEY = "gge_access_token";

export const setAccessToken = (token: string | null) => {
  if (typeof window === "undefined") return;
  if (!token) {
    sessionStorage.removeItem(TOKEN_KEY);
    return;
  }
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const getAccessToken = () => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
};

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

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
