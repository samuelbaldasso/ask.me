const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const REQUEST_TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;

/** Token JWT da aplicação, setado após login/restauração de sessão. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
  query?: URLSearchParams | Record<string, string>;
  body?: unknown;
}

/** Cliente HTTP fino sobre fetch: baseURL, timeout e Authorization automáticos. */
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (options.query) {
    const params =
      options.query instanceof URLSearchParams
        ? options.query
        : new URLSearchParams(options.query);
    params.forEach((value, key) => url.searchParams.set(key, value));
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') ?? '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : undefined;

    if (!response.ok) {
      throw new ApiError(
        (data as { message?: string })?.message ?? response.statusText,
        response.status,
        data,
      );
    }

    return data as T;
  } finally {
    clearTimeout(timeout);
  }
}
