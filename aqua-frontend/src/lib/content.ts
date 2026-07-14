import type { CategoryKind } from "@/lib/admin-api";
import { usePublicProductCategories } from "@/lib/product-categories-api";
import { usePublicServices } from "@/lib/services-api";
import { usePublicProducts } from "@/lib/products-api";
import { usePublicProjects } from "@/lib/projects-api";

export function useServices() {
  return usePublicServices();
}

export function useProjects() {
  return usePublicProjects();
}

export function useProducts() {
  return usePublicProducts();
}

export function useProductCategories() {
  return useCategories("product");
}

export function useCategories(kind: CategoryKind) {
  return usePublicProductCategories(kind);
}

// Localized field pickers
export const pick = (
  ar: string | null | undefined,
  en: string | null | undefined,
  lang: "ar" | "en",
) => (lang === "ar" ? ar : en) || ar || en || "";
