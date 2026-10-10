import type { ApiEnvelope, AuthTokens, PaginationMeta } from "./types";

const BASE_URL = "/api";
const TOKEN_KEY = "aster.tokens";

export class ApiError extends Error {
  status: number;
  errors?: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export function readTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

export function writeTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return readTokens()?.accessToken ?? null;
}

let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const current = readTokens();
  if (!current?.refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (!res.ok) {
          clearTokens();
          return null;
        }
        const body = (await res.json()) as ApiEnvelope<{ tokens: AuthTokens }>;
        const tokens = body.data?.tokens ?? null;
        if (tokens) writeTokens(tokens);
        return tokens;
      } catch {
        clearTokens();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  params?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${url}?${qs}` : url;
}

async function parse<T>(res: Response): Promise<ApiEnvelope<T> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

export async function requestEnvelope<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiEnvelope<T>> {
  const { body, auth = true, params, headers, ...rest } = options;

  const execute = async (): Promise<Response> => {
    const finalHeaders = new Headers(headers);
    if (body !== undefined) finalHeaders.set("Content-Type", "application/json");
    if (auth) {
      const token = getAccessToken();
      if (token) finalHeaders.set("Authorization", `Bearer ${token}`);
    }
    return fetch(buildUrl(path, params), {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let res = await execute();

  if (res.status === 401 && auth) {
    const refreshed = await refreshTokens();
    if (refreshed) res = await execute();
  }

  const envelope = await parse<T>(res);

  if (!res.ok || (envelope && envelope.success === false)) {
    const message = envelope?.message ?? `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, envelope?.errors);
  }

  return envelope ?? ({ success: true, data: undefined as T } as ApiEnvelope<T>);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await requestEnvelope<T>(path, options);
  return envelope.data;
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: "POST", body });
}

export function apiPatch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: "PATCH", body });
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: "DELETE" });
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

export async function apiList<T>(
  path: string,
  params?: RequestOptions["params"],
): Promise<Paginated<T>> {
  const envelope = await requestEnvelope<T[]>(path, { method: "GET", params });
  const items = Array.isArray(envelope.data) ? envelope.data : [];
  return { items, meta: envelope.meta ?? { ...EMPTY_META, total: items.length, limit: items.length } };
}
