const API_URL = import.meta.env.VITE_API_URL as string;
const TOKEN_KEY = "aqua_admin_token";

export class ApiError extends Error {
  errors?: Record<string, string[]>;
  status: number;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return getToken() !== null;
}

/** A `{ data, meta }` list response from a paginated admin endpoint. */
export type Paginated<T> = {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  } & Record<string, unknown>;
};

/**
 * @param unwrap Return `body.data` — the norm, since every endpoint wraps
 *   its payload. Paginated endpoints pass `false`: their paging state lives
 *   in a sibling `meta` key that unwrapping would silently discard.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}, unwrap = true): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  // Skip for FormData — the browser must set its own multipart boundary.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.message ?? "Request failed", response.status, body.errors);
  }

  return (unwrap ? (body.data ?? body) : body) as T;
}

export const apiClient = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  /** GET a paginated endpoint, keeping the `meta` envelope intact. */
  getPage: <T>(path: string) => apiFetch<Paginated<T>>(path, { method: "GET" }, false),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: "DELETE", body: data ? JSON.stringify(data) : undefined }),
  upload: <T>(path: string, formData: FormData) =>
    apiFetch<T>(path, { method: "POST", body: formData }),
};
