import { apiClient } from "@/lib/api-client";
import type { AppRole } from "@/lib/auth";

export type AdminUser = {
  id: number;
  email: string;
  role: AppRole;
  created_at: string;
  last_login_at: string | null;
};

export function listUsers() {
  return apiClient.get<AdminUser[]>("/api/v1/admin/users");
}

export function createUser(data: { email: string; password: string; role: AppRole }) {
  return apiClient.post<AdminUser>("/api/v1/admin/users", data);
}

export function resetUserPassword(userId: number, password: string) {
  return apiClient.patch<void>(`/api/v1/admin/users/${userId}/password`, { password });
}

export function deleteUser(userId: number) {
  return apiClient.delete<void>(`/api/v1/admin/users/${userId}`);
}
