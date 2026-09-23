const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
const tokenStorageKey = "jtc-master-control-token";

export function getSessionToken() {
  return window.localStorage.getItem(tokenStorageKey);
}

export function setSessionToken(token: string) {
  window.localStorage.setItem(tokenStorageKey, token);
}

export function clearSessionToken() {
  window.localStorage.removeItem(tokenStorageKey);
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  token?: string | null;
};

export async function apiRequest<TResponse>(
  path: string,
  { method = "GET", body, token = getSessionToken() }: ApiRequestOptions = {},
): Promise<TResponse> {
  const headers = new Headers();

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("content-type", "application/json");
  }

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(data?.error?.message ?? `API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export function apiGet<TResponse>(path: string): Promise<TResponse> {
  return apiRequest<TResponse>(path);
}

export function apiPost<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: "POST", body });
}

export function apiPut<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: "PUT", body });
}
