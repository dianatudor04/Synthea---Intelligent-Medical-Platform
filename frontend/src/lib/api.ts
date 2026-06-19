// ─────────────────────────────────────────────────────────────────────
//  API client — handles auth tokens, JSON requests, and refresh flow
// ─────────────────────────────────────────────────────────────────────

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

const TOKEN_KEY = 'synthea_access_token';
const REFRESH_TOKEN_KEY = 'synthea_refresh_token';
const USER_KEY = 'synthea_user';

export type StoredUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'NURSE';
};

// ─── Token storage ───────────────────────────────────────────────────
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: (): StoredUser | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: (accessToken: string, refreshToken: string, user: StoredUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ─── Request error class ─────────────────────────────────────────────
export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// ─── Refresh token coordination (avoid stampede) ─────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        tokenStorage.clear();
        return null;
      }
      const data = (await res.json()) as { accessToken: string; refreshToken: string };
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core request function ───────────────────────────────────────────
type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  isFormData?: boolean;
  skipAuth?: boolean;
};

async function rawRequest<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const { method = 'GET', body, query, isFormData = false, skipAuth = false } = options;

  let url = `${API_BASE_URL}${path}`;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';

  if (!skipAuth) {
    const token = tokenStorage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 401: try refresh once
  if (res.status === 401 && !skipAuth && !retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return rawRequest<T>(path, options, true);
    }
    tokenStorage.clear();
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (data as { error?: string; message?: string })?.error ||
      (data as { message?: string })?.message ||
      `Request failed: ${res.status}`;
    throw new ApiRequestError(message, res.status, data);
  }

  return data as T;
}

// ─── Public API ──────────────────────────────────────────────────────
export const api = {
  get: <T>(path: string, query?: RequestOptions['query']) => rawRequest<T>(path, { method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: Partial<RequestOptions>) =>
    rawRequest<T>(path, { method: 'POST', body, ...opts }),
  put: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => rawRequest<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => rawRequest<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, formData: FormData) =>
    rawRequest<T>(path, { method: 'POST', body: formData, isFormData: true }),
};

export const apiBaseUrl = API_BASE_URL;
