import type { ApiToastDetail } from "../components/ApiToastHost";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";
const tokenStorageKey = "jtc-master-control-token";

function emitApiToast(detail: ApiToastDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ApiToastDetail>("jtc:api-toast", { detail }));
  }
}

function getSuccessMessage(path: string, method: string, data: unknown) {
  if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  if (path === "/auth/login") {
    return "Signed in successfully.";
  }

  if (method === "POST") {
    return "Created successfully.";
  }

  if (method === "PUT" || method === "PATCH") {
    return "Updated successfully.";
  }

  return "API request completed successfully.";
}

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
  method?: "GET" | "POST" | "PUT" | "PATCH";
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
    const message = data?.error?.message ?? `API request failed with status ${response.status}`;
    emitApiToast({ type: "error", message });
    throw new Error(message);
  }

  const data = (await response.json()) as TResponse;
  if (method !== "GET") {
    emitApiToast({ type: "success", message: getSuccessMessage(path, method, data) });
  }
  return data;
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

export function apiPatch<TResponse>(path: string, body: unknown): Promise<TResponse> {
  return apiRequest<TResponse>(path, { method: "PATCH", body });
}
