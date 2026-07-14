import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type SiteSettingsMap = Record<string, Record<string, unknown> | undefined>;

const SETTINGS_QUERY_KEY = ["site-settings"];

/** All settings in one request — used by both public pages and the admin page. */
export function useSiteSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => apiClient.get<SiteSettingsMap>("/api/v1/settings"),
    staleTime: 60_000,
  });
}

/** A single setting's value, or undefined while loading / if unset. */
export function useSiteSetting<T = Record<string, unknown>>(key: string): T | undefined {
  const { data } = useSiteSettings();
  return data?.[key] as T | undefined;
}

export function useUpdateSiteSetting(key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: unknown) =>
      apiClient.put<Record<string, unknown>>(`/api/v1/admin/settings/${key}`, { value }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY }),
  });
}
