import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbMessage } from "@/lib/admin-api";

const ADMIN_QUERY_KEY = ["admin", "messages"];
const SUMMARY_QUERY_KEY = ["admin", "messages", "summary"];

type MessageSubmission = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  project_type?: string;
  budget?: string;
  timeline?: string;
  subject?: string;
  message: string;
};

/** Public — no auth. Submits the contact form. */
export function useSubmitMessage() {
  return useMutation({
    mutationFn: (payload: MessageSubmission) =>
      apiClient.post<DbMessage>("/api/v1/messages", payload),
  });
}

/** Every message — used by the admin inbox. */
export function useAdminMessages() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbMessage[]>("/api/v1/admin/messages"),
  });
}

export type MessagesSummary = {
  total: number;
  by_status: Record<"new" | "in_progress" | "replied" | "archived", number>;
  recent: DbMessage[];
};

/** Backs the dashboard overview's messages count/recent widgets. */
export function useMessagesSummary() {
  return useQuery({
    queryKey: SUMMARY_QUERY_KEY,
    queryFn: () => apiClient.get<MessagesSummary>("/api/v1/admin/messages/summary"),
  });
}

function invalidateMessageQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  qc.invalidateQueries({ queryKey: SUMMARY_QUERY_KEY });
}

export function useUpdateMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch<DbMessage>(`/api/v1/admin/messages/${id}/status`, { status }),
    onSuccess: () => invalidateMessageQueries(qc),
  });
}

export function useBulkUpdateMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      apiClient.patch("/api/v1/admin/messages/status", { ids, status }),
    onSuccess: () => invalidateMessageQueries(qc),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/messages/${id}`),
    onSuccess: () => invalidateMessageQueries(qc),
  });
}

export function useBulkDeleteMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => apiClient.delete("/api/v1/admin/messages", { ids }),
    onSuccess: () => invalidateMessageQueries(qc),
  });
}
