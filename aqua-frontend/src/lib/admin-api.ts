import { apiClient } from "@/lib/api-client";

export type DbService = {
  id: string;
  icon: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  category_id: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type DbProject = {
  id: string;
  title_ar: string;
  title_en: string;
  location_ar: string;
  location_en: string;
  category: string;
  category_id: string | null;
  image_url: string;
  year: string;
  is_featured: boolean;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type DbProduct = {
  id: string;
  title_ar: string;
  title_en: string;
  caption_ar: string;
  caption_en: string;
  category: string;
  category_id: string | null;
  image_url: string;
  price_label_ar: string;
  price_label_en: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryKind = "product" | "service" | "project";

export type DbProductCategory = {
  id: string;
  parent_id: string | null;
  name_ar: string;
  name_en: string;
  kind: CategoryKind;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type DbMessage = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  project_type: string;
  budget: string;
  timeline: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export type DbAuditLog = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

export async function uploadSiteImage(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const { url } = await apiClient.upload<{ url: string }>("/api/v1/admin/uploads", formData);
  return url;
}
