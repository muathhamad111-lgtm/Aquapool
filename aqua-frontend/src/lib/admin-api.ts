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

/** One row of a specification table: a label and its value, both bilingual. */
export type DbSpecificationField = {
  label_ar: string | null;
  label_en: string | null;
  value_ar: string | null;
  value_en: string | null;
};

/** A heading with the rows grouped under it, e.g. "Key attributes". */
export type DbSpecificationGroup = {
  title_ar: string | null;
  title_en: string | null;
  fields: DbSpecificationField[];
};

export type DbProduct = {
  id: string;
  /** Public URL key — products are linked by slug, never by id. */
  slug: string;
  title_ar: string;
  title_en: string;
  caption_ar: string;
  caption_en: string;
  category: string;
  category_id: string | null;
  /** The cover image. Always equal to images[0]; the API keeps them in sync. */
  image_url: string;
  images: string[];
  price_label_ar: string;
  price_label_en: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Only `GET /products/{slug}` returns specifications — the list endpoint
 * omits them so a catalogue page doesn't download every product's spec
 * tables.
 */
export type DbProductDetail = DbProduct & {
  specifications: DbSpecificationGroup[];
};

export type CategoryKind = "product" | "service" | "project";

/**
 * A physical location. Only the name is guaranteed — every address part,
 * the contact details and the hours are optional, so anything rendering a
 * branch has to tolerate nulls.
 */
export type DbBranch = {
  id: string;
  name_ar: string;
  name_en: string;
  country_ar: string | null;
  country_en: string | null;
  region_ar: string | null;
  region_en: string | null;
  district_ar: string | null;
  district_en: string | null;
  street_ar: string | null;
  street_en: string | null;
  email: string | null;
  phone: string | null;
  hours_ar: string | null;
  hours_en: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

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
