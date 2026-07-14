import { apiClient, clearToken, hasToken, setToken } from "@/lib/api-client";

export type AppRole = "admin" | "user";

export type AuthUser = {
  id: number;
  email: string;
  role: AppRole;
  created_at: string;
  last_login_at: string | null;
};

export async function login(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await apiClient.post<{ token: string; user: AuthUser }>(
    "/api/v1/admin/auth/login",
    { email, password },
  );
  setToken(token);
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/api/v1/admin/auth/logout");
  } finally {
    clearToken();
  }
}

export async function me(): Promise<AuthUser | null> {
  if (!hasToken()) return null;
  try {
    return await apiClient.get<AuthUser>("/api/v1/admin/auth/me");
  } catch {
    return null;
  }
}

export { hasToken };
