import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbService } from "@/lib/admin-api";

const ADMIN_QUERY_KEY = ["admin", "services"];
const PUBLIC_QUERY_KEY = ["public", "services"];

/** Published services, ordered by sort_order — used by the public services page. */
export function usePublicServices() {
  return useQuery({
    queryKey: PUBLIC_QUERY_KEY,
    queryFn: () => apiClient.get<DbService[]>("/api/v1/services"),
    staleTime: 60_000,
  });
}

/** Every service, published and unpublished — used by the admin dashboard. */
export function useAdminServices() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbService[]>("/api/v1/admin/services"),
  });
}

function invalidateServiceQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  qc.invalidateQueries({ queryKey: PUBLIC_QUERY_KEY });
}

type ServicePayload = {
  icon: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  category_id?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServicePayload) =>
      apiClient.post<DbService>("/api/v1/admin/services", payload),
    onSuccess: () => invalidateServiceQueries(qc),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ServicePayload & { id: string }) =>
      apiClient.patch<DbService>(`/api/v1/admin/services/${id}`, payload),
    onSuccess: () => invalidateServiceQueries(qc),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/services/${id}`),
    onSuccess: () => invalidateServiceQueries(qc),
  });
}
