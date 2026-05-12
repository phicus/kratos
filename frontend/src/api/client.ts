export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly detail: unknown;
  constructor(status: number, detail: unknown, code: string | null = null) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail));
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

/** Lanzado cuando el backend no responde en el timeout o falla la red. */
export class NetworkError extends Error {
  constructor(message = 'No se pudo contactar con el servidor') {
    super(message);
  }
}

type FetchOptions = Omit<RequestInit, 'body'> & {
  json?: unknown;
  form?: FormData;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 8000;

async function request(path: string, opts: FetchOptions = {}): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const init: RequestInit = {
    credentials: 'include',
    headers: { Accept: 'application/json', ...(opts.headers ?? {}) },
    method: opts.method ?? 'GET',
    signal: controller.signal,
    ...opts,
  };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
  } else if (opts.form !== undefined) {
    init.body = opts.form;
  }

  let resp: Response;
  try {
    resp = await fetch(path, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NetworkError(`Sin respuesta del backend tras ${timeoutMs}ms`);
    }
    throw new NetworkError(err instanceof Error ? err.message : String(err));
  } finally {
    window.clearTimeout(timer);
  }

  if (!resp.ok) {
    let detail: unknown = await resp.text();
    let code: string | null = null;
    try {
      const parsed = JSON.parse(detail as string);
      detail = parsed.detail ?? parsed;
      if (parsed && typeof parsed === 'object' && 'code' in parsed) {
        code = (parsed as { code: string }).code;
      }
      if (detail && typeof detail === 'object' && 'code' in detail) {
        code = (detail as { code: string }).code;
      }
    } catch {
      /* not JSON */
    }
    throw new ApiError(resp.status, detail, code);
  }
  return resp;
}

export const api = {
  get: async <T>(path: string): Promise<T> => (await request(path)).json(),
  post: async <T>(path: string, body?: unknown): Promise<T | null> => {
    const resp = await request(path, { method: 'POST', json: body });
    if (resp.status === 204) return null;
    return resp.json();
  },
  patch: async <T>(path: string, body?: unknown): Promise<T> => {
    const resp = await request(path, { method: 'PATCH', json: body });
    return resp.json();
  },
  postForm: async <T>(path: string, form: FormData): Promise<T> => {
    const resp = await request(path, { method: 'POST', form });
    return resp.json();
  },
  rawGet: (path: string) => request(path),
};
