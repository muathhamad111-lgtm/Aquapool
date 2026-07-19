import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbAuditLog } from "@/lib/admin-api";

export type AuditLogQuery = {
  page: number;
  perPage: number;
  /** `"all"` means no entity filter. */
  entityType: string;
  search: string;
};

/**
 * Filtering, searching and paging all happen server-side: audit_logs is
 * append-only and unbounded, so the page can never load the whole table
 * and filter it in the browser.
 */
export function useAuditLogs({ page, perPage, entityType, search }: AuditLogQuery) {
  const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  if (entityType !== "all") params.set("entity_type", entityType);
  if (search.trim()) params.set("search", search.trim());

  return useQuery({
    queryKey: ["admin", "audit", { page, perPage, entityType, search: search.trim() }],
    queryFn: () => apiClient.getPage<DbAuditLog>(`/api/v1/admin/audit-logs?${params}`),
    // Keeps the current rows on screen while the next page loads, instead
    // of collapsing the list back to its skeleton on every page change.
    placeholderData: keepPreviousData,
  });
}

/**
 * Per-entity totals for the filter chips, served in `meta.entity_counts`.
 * These cover the whole table, not the current page or filter.
 */
export function entityCountsFrom(
  meta: Record<string, unknown> | undefined,
): Record<string, number> {
  const counts = (meta?.entity_counts ?? {}) as Record<string, number>;
  const all = Object.values(counts).reduce((sum, n) => sum + n, 0);
  return { ...counts, all };
}
