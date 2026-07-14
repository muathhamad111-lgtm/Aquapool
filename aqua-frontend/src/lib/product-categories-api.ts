import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CategoryKind, DbProductCategory } from "@/lib/admin-api";

const ADMIN_QUERY_KEY = ["admin", "product-categories"];
const publicQueryKey = (kind: CategoryKind) => ["public", "product-categories", kind];

/** Published categories of one kind — used by the public services/projects/products pages. */
export function usePublicProductCategories(kind: CategoryKind) {
  return useQuery({
    queryKey: publicQueryKey(kind),
    queryFn: () => apiClient.get<DbProductCategory[]>(`/api/v1/product-categories?kind=${kind}`),
    staleTime: 60_000,
  });
}

/** Every category, every kind, published and unpublished — used by the admin dashboards. */
export function useAdminProductCategories() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbProductCategory[]>("/api/v1/admin/product-categories"),
  });
}

function invalidateProductCategoryQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  qc.invalidateQueries({ queryKey: ["public", "product-categories"] });
}

export function useCreateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name_ar: string;
      name_en: string;
      parent_id?: string | null;
      kind?: CategoryKind;
    }) => apiClient.post<DbProductCategory>("/api/v1/admin/product-categories", payload),
    onSuccess: () => invalidateProductCategoryQueries(qc),
  });
}

export function useUpdateProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; name_ar: string; name_en: string }) =>
      apiClient.patch<DbProductCategory>(`/api/v1/admin/product-categories/${id}`, payload),
    onSuccess: () => invalidateProductCategoryQueries(qc),
  });
}

export function useDeleteProductCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/product-categories/${id}`),
    onSuccess: () => invalidateProductCategoryQueries(qc),
  });
}
