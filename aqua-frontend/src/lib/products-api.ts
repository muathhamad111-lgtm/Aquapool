import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbProduct, DbProductDetail, DbSpecificationGroup } from "@/lib/admin-api";

const ADMIN_QUERY_KEY = ["admin", "products"];
const PUBLIC_QUERY_KEY = ["public", "products"];

/** Published products, ordered by sort_order — used by the public products page. */
export function usePublicProducts() {
  return useQuery({
    queryKey: PUBLIC_QUERY_KEY,
    queryFn: () => apiClient.get<DbProduct[]>("/api/v1/products"),
    staleTime: 60_000,
  });
}

/**
 * One published product with its specification groups, for the detail page.
 * An unknown slug — or a product that exists but isn't published — is a 404
 * from the API and surfaces here as a failed query.
 */
export function usePublicProduct(slug: string) {
  return useQuery({
    queryKey: [...PUBLIC_QUERY_KEY, slug],
    queryFn: () => apiClient.get<DbProductDetail>(`/api/v1/products/${slug}`),
    staleTime: 60_000,
    // A 404 means the product isn't public; retrying can't change that, and
    // the default 3 retries would only delay the not-found state.
    retry: false,
  });
}

/** Every product, published and unpublished — used by the admin dashboard. */
export function useAdminProducts() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbProduct[]>("/api/v1/admin/products"),
  });
}

function invalidateProductQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  qc.invalidateQueries({ queryKey: PUBLIC_QUERY_KEY });
}

type ProductPayload = {
  title_ar: string;
  title_en: string;
  caption_ar?: string;
  caption_en?: string;
  category?: string;
  image_url?: string;
  price_label_ar?: string;
  price_label_en?: string;
  category_id?: string | null;
  sort_order?: number;
  is_published?: boolean;
  slug?: string;
  images?: string[];
  specifications?: DbSpecificationGroup[];
};

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProductPayload) =>
      apiClient.post<DbProduct>("/api/v1/admin/products", payload),
    onSuccess: () => invalidateProductQueries(qc),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ProductPayload & { id: string }) =>
      apiClient.patch<DbProduct>(`/api/v1/admin/products/${id}`, payload),
    onSuccess: () => invalidateProductQueries(qc),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/products/${id}`),
    onSuccess: () => invalidateProductQueries(qc),
  });
}
