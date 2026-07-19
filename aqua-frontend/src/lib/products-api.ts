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

// The public detail page deliberately has no hook here: it fetches through
// the route's own loader instead, which is what makes the product's title
// and image available to `head` for SSR metadata and link previews. A
// client-only hook cannot do that.

/** Every product, published and unpublished — used by the admin dashboard. */
export function useAdminProducts() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbProduct[]>("/api/v1/admin/products"),
  });
}

/**
 * Fetches one product *with* its specifications, for the admin edit form —
 * the admin list omits them so it isn't inflated with every product's spec
 * tables just so one of them can be edited.
 *
 * Imperative rather than a `useQuery`, because it's driven by opening a
 * dialog, not by rendering: a conditional query would need its result
 * synced back into form state through an effect.
 */
export function useAdminProductFetcher() {
  const qc = useQueryClient();

  return (id: string) =>
    qc.fetchQuery({
      queryKey: [...ADMIN_QUERY_KEY, id],
      queryFn: () => apiClient.get<DbProductDetail>(`/api/v1/admin/products/${id}`),
      staleTime: 0,
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
