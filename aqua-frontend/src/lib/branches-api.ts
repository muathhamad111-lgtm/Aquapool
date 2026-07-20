import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbBranch } from "@/lib/admin-api";
import { pick } from "@/lib/content";

const PUBLIC_QUERY_KEY = ["public", "branches"];
const ADMIN_QUERY_KEY = ["admin", "branches"];

/**
 * Published branches in display order. The first is the primary one — the
 * footer and the contact page's info cards show it, since they have room
 * for a single location.
 */
export function usePublicBranches() {
  return useQuery({
    queryKey: PUBLIC_QUERY_KEY,
    queryFn: () => apiClient.get<DbBranch[]>("/api/v1/branches"),
    staleTime: 60_000,
  });
}

/** Every branch, published or not — the admin list. */
export function useAdminBranches() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbBranch[]>("/api/v1/admin/branches"),
  });
}

type BranchPayload = Omit<DbBranch, "id" | "created_at" | "updated_at">;

function invalidateBranchQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  // The public list feeds the contact page and the footer, so a change
  // has to reach both, not just the dashboard the admin is looking at.
  qc.invalidateQueries({ queryKey: PUBLIC_QUERY_KEY });
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchPayload) =>
      apiClient.post<DbBranch>("/api/v1/admin/branches", payload),
    onSuccess: () => invalidateBranchQueries(qc),
  });
}

export function useUpdateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: BranchPayload & { id: string }) =>
      apiClient.patch<DbBranch>(`/api/v1/admin/branches/${id}`, payload),
    onSuccess: () => invalidateBranchQueries(qc),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/branches/${id}`),
    onSuccess: () => invalidateBranchQueries(qc),
  });
}

/**
 * The address as one line, narrowest part first — street, district, region,
 * country — which is how an address reads in both Arabic and English.
 * Missing parts are dropped rather than leaving stray separators, since
 * every part but the name is optional.
 */
export function branchAddress(branch: DbBranch, lang: "ar" | "en"): string {
  return [
    pick(branch.street_ar, branch.street_en, lang),
    pick(branch.district_ar, branch.district_en, lang),
    pick(branch.region_ar, branch.region_en, lang),
    pick(branch.country_ar, branch.country_en, lang),
  ]
    .filter(Boolean)
    .join(lang === "ar" ? "، " : ", ");
}

/**
 * A Google Maps search for the branch's address. A search URL rather than
 * stored coordinates: it needs no extra field per branch, no API key, and
 * it degrades to a sensible result list when the address is partial.
 *
 * Always built from the Arabic address when available — local map data for
 * Saudi addresses matches the Arabic spelling far more reliably than a
 * transliteration.
 */
export function branchMapsUrl(branch: DbBranch): string | null {
  const query = [pick(branch.name_ar, branch.name_en, "ar"), branchAddress(branch, "ar")]
    .filter(Boolean)
    .join("، ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
