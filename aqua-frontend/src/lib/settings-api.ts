import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";
import { apiClient } from "@/lib/api-client";

export type SiteSettingsMap = Record<string, Record<string, unknown> | undefined>;

const SETTINGS_QUERY_KEY = ["site-settings"];

/**
 * All settings in one request — used by both public pages and the admin
 * page.
 *
 * Seeded from the root route's loader, which fetches this on the server.
 * Without that seed the first server-rendered paint has no settings at all,
 * so everything reading them — the footer's contact details, the homepage
 * hero, the about page — served its hardcoded fallback to crawlers and
 * flashed it to users until hydration replaced it.
 */
export function useSiteSettings() {
  const { settings } = useLoaderData({ from: "__root__" });

  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => apiClient.get<SiteSettingsMap>("/api/v1/settings"),
    staleTime: 60_000,
    initialData: settings ?? undefined,
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
