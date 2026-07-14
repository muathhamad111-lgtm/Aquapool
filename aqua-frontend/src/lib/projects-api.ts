import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { DbProject } from "@/lib/admin-api";

const ADMIN_QUERY_KEY = ["admin", "projects"];
const PUBLIC_QUERY_KEY = ["public", "projects"];

/** Published projects, ordered by sort_order — used by the public projects page. */
export function usePublicProjects() {
  return useQuery({
    queryKey: PUBLIC_QUERY_KEY,
    queryFn: () => apiClient.get<DbProject[]>("/api/v1/projects"),
    staleTime: 60_000,
  });
}

/** Every project, published and unpublished — used by the admin dashboard. */
export function useAdminProjects() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: () => apiClient.get<DbProject[]>("/api/v1/admin/projects"),
  });
}

function invalidateProjectQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ADMIN_QUERY_KEY });
  qc.invalidateQueries({ queryKey: PUBLIC_QUERY_KEY });
}

type ProjectPayload = {
  title_ar: string;
  title_en: string;
  location_ar?: string;
  location_en?: string;
  category?: string;
  image_url?: string;
  year?: string;
  is_featured?: boolean;
  category_id?: string | null;
  sort_order?: number;
  is_published?: boolean;
};

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) =>
      apiClient.post<DbProject>("/api/v1/admin/projects", payload),
    onSuccess: () => invalidateProjectQueries(qc),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: ProjectPayload & { id: string }) =>
      apiClient.patch<DbProject>(`/api/v1/admin/projects/${id}`, payload),
    onSuccess: () => invalidateProjectQueries(qc),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/v1/admin/projects/${id}`),
    onSuccess: () => invalidateProjectQueries(qc),
  });
}
