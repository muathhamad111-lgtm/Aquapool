import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export type MessagesQuery = {
  page: number;
  perPage: number;
  /** `"all"` means no status filter. */
  status: string;
  search: string;
};

/**
 * The admin inbox, one page at a time. Filtering, searching and paging all
 * happen server-side: messages accumulate with every contact-form
 * submission, so the page can never load the whole inbox and filter it in
 * the browser.
 */
export function useAdminMessages({ page, perPage, status, search }: MessagesQuery) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (status !== "all") params.set("status", status);
  if (search.trim()) params.set("search", search.trim());

  return useQuery({
    queryKey: [...ADMIN_QUERY_KEY, { page, perPage, status, search: search.trim() }],
    queryFn: () => apiClient.getPage<DbMessage>(`/api/v1/admin/messages?${params}`),
    // Keeps the current rows on screen while the next page loads, instead
    // of collapsing the list back to its skeleton on every page change.
    placeholderData: keepPreviousData,
  });
}

/**
 * Inbox-wide totals per status, served in `meta.status_counts`. Every
 * status is always present (zero included), so the filter chips can index
 * it directly.
 */
export function statusCountsFrom(
  meta: Record<string, unknown> | undefined,
): Record<string, number> {
  const counts = (meta?.status_counts ?? {}) as Record<string, number>;
  const all = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return { ...counts, all };
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
