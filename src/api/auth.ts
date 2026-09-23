import { apiRequest, clearSessionToken, setSessionToken } from "./client";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin" | "manager";
  storeId?: string;
  storeEmployeeId?: string;
};

export type AuthSession = {
  token: string;
  user: SessionUser;
};

export async function login(email: string, password: string) {
  const session = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: { email, password },
    token: null,
  });

  setSessionToken(session.token);
  return session;
}

export async function getCurrentUser() {
  return apiRequest<{ user: SessionUser }>("/auth/me");
}

export function logout() {
  clearSessionToken();
}
