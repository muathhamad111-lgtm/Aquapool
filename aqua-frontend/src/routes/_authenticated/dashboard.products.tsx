import { AdminField } from "@/components/admin/AdminField";
import { PageHeaderAction } from "@/components/admin/PageHeaderAction";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { type DbProduct, type DbProductCategory, type DbSpecificationGroup } from "@/lib/admin-api";
import {
  useAdminProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAdminProductFetcher,
} from "@/lib/products-api";
import { useAdminProductCategories } from "@/lib/product-categories-api";
import { DEFAULT_PLACEHOLDER_IMAGE } from "@/components/admin/ImageUpload";
import { GalleryUpload } from "@/components/admin/GalleryUpload";
import { SpecificationsEditor } from "@/components/admin/SpecificationsEditor";
import { Pagination } from "@/components/admin/Pagination";
import { CategoryCascader, categoryPath } from "@/components/admin/CategoryCascader";
import { CategoryFilterCascader } from "@/components/CategoryFilterCascader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { adminControl } from "@/components/admin/field-styles";

export const Route = createFileRoute("/_authenticated/dashboard/products")({
  ssr: false,
  component: ProductsAdmin,
});

// `slug` stays out: the API generates it from title_en and never
// regenerates it on update, so a published URL can't change by accident.
// `image_url` stays in the type but is no longer edited directly — it's
// derived from images[0] on save.
type Form = Omit<DbProduct, "id" | "created_at" | "updated_at" | "slug"> & {
  specifications: DbSpecificationGroup[];
};
const empty: Form = {
  title_ar: "",
  title_en: "",
  caption_ar: "",
  caption_en: "",
  category: "general",
  category_id: null,
  image_url: "",
  images: [],
  specifications: [],
  price_label_ar: "",
  price_label_en: "",
  sort_order: 0,
  is_published: true,
};

function ProductsAdmin() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const list = useAdminProducts();

  const categoriesQ = useAdminProductCategories();

  const categories = useMemo(
    () => (categoriesQ.data ?? []).filter((c) => c.kind === "product"),
    [categoriesQ.data],
  );
  const hasCategories = categories.length > 0;

  // Categories that have children — selecting them as a product's leaf is not allowed when `required`.
  const parentIds = useMemo(() => {
    const s = new Set<string>();
    categories.forEach((c) => {
      if (c.parent_id) s.add(c.parent_id);
    });
    return s;
  }, [categories]);

  const [loadingSpecs, setLoadingSpecs] = useState(false);
  const fetchAdminProduct = useAdminProductFetcher();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const mutationError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const save = {
    isPending: createProduct.isPending || updateProduct.isPending,
    mutate: () => {
      const payload = {
        ...form,
        // The API derives image_url from images[0]. A product with no
        // images at all would leave the catalogue card with a broken
        // <img>, so the placeholder takes the cover slot exactly as it did
        // when this form managed a single image.
        images: form.images.length > 0 ? form.images : [DEFAULT_PLACEHOLDER_IMAGE],
      };
      if (editing) {
        updateProduct.mutate(
          { id: editing.id, ...payload },
          {
            onSuccess: () => {
              toast.success("تم تحديث المنتج");
              setOpen(false);
            },
            onError: mutationError,
          },
        );
      } else {
        createProduct.mutate(payload, {
          onSuccess: () => {
            toast.success("تمت إضافة المنتج");
            setOpen(false);
          },
          onError: mutationError,
        });
      }
    },
  };

  const remove = {
    mutate: (id: string) => {
      deleteProduct.mutate(id, {
        onSuccess: () => toast.success("تم الحذف"),
        onError: mutationError,
      });
    },
  };

  function openNew() {
    setEditing(null);
    setForm({ ...empty, sort_order: (list.data?.length ?? 0) + 1 });
    setOpen(true);
  }
  async function openEdit(p: DbProduct) {
    setEditing(p);
    const { id: _i, created_at: _c, updated_at: _u, slug: _s, ...rest } = p;
    void _i;
    void _c;
    void _u;
    void _s;
    // Open immediately with what the list already has, so the dialog never
    // blocks on a request; specifications are the only field the list
    // omits, and they fill in a moment later.
    setForm({ ...rest, specifications: [] });
    setOpen(true);

    setLoadingSpecs(true);
    try {
      const full = await fetchAdminProduct(p.id);
      setForm((current) => ({ ...current, specifications: full.specifications ?? [] }));
    } catch (e) {
      mutationError(e);
    } finally {
      setLoadingSpecs(false);
    }
  }

  const descendantsOf = useMemo(() => {
    const byParent = new Map<string | null, DbProductCategory[]>();
    categories.forEach((c) => {
      if (!byParent.has(c.parent_id)) byParent.set(c.parent_id, []);
      byParent.get(c.parent_id)!.push(c);
    });
    const cache = new Map<string, Set<string>>();
    function descSet(id: string): Set<string> {
      if (cache.has(id)) return cache.get(id)!;
      const s = new Set<string>([id]);
      for (const c of byParent.get(id) ?? []) descSet(c.id).forEach((x) => s.add(x));
      cache.set(id, s);
      return s;
    }
    categories.forEach((c) => descSet(c.id));
    return cache;
  }, [categories]);

  // Memoised so the `?? []` fallback keeps a stable reference while loading;
  // otherwise the filter useMemo below recomputes on every render.
  const allItems = useMemo(() => list.data ?? [], [list.data]);
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allowed = filterCat ? descendantsOf.get(filterCat) : null;
    return allItems.filter((p) => {
      if (allowed && (!p.category_id || !allowed.has(p.category_id))) return false;
      if (!q) return true;
      return (
        p.title_ar?.toLowerCase().includes(q) ||
        p.title_en?.toLowerCase().includes(q) ||
        p.caption_ar?.toLowerCase().includes(q) ||
        p.caption_en?.toLowerCase().includes(q)
      );
    });
  }, [allItems, search, filterCat, descendantsOf]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [pageSize, search, filterCat]);
  const hasFilters = !!search || !!filterCat;

  return (
    <div className="space-y-6">
      <PageHeaderAction>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-deep text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-ocean"
        >
          <Plus className="size-4" /> إضافة منتج
        </button>
      </PageHeaderAction>

      <div className="bg-white border border-border rounded-xl p-2 flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
        <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
          <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الوصف…"
            className={cn(adminControl, "w-full rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3")}
          />
        </div>
        {categories.length > 0 && (
          <CategoryFilterCascader
            categories={categories}
            value={filterCat}
            onChange={setFilterCat}
            lang="ar"
            compact
          />
        )}
        <span className="text-[11px] text-muted-foreground px-2 whitespace-nowrap ms-auto sm:ms-0">
          {items.length} / {allItems.length}
        </span>
        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setFilterCat(null);
            }}
            className="h-9 inline-flex items-center gap-1 px-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted whitespace-nowrap"
            aria-label="مسح الفلاتر"
          >
            <X className="size-3.5" /> مسح
          </button>
        )}
      </div>

      {list.isLoading ? (
        <div className="bg-white border border-border rounded-2xl p-12 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-teal" />
        </div>
      ) : !items.length ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          {allItems.length === 0 ? "لا توجد منتجات بعد." : "لا توجد نتائج مطابقة."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((p) => (
            <div key={p.id} className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="aspect-square bg-muted relative">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full grid place-items-center text-muted-foreground text-xs">
                    لا توجد صورة
                  </div>
                )}
                {!p.is_published && (
                  <span className="absolute top-2 ltr:left-2 rtl:right-2 text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded">
                    مخفي
                  </span>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal truncate">
                  {categoryPath(categories, p.category_id) || p.category || "بدون تصنيف"}
                </div>
                <div className="font-bold text-deep text-sm truncate">{p.title_ar}</div>
                {p.price_label_ar && (
                  <div className="text-xs text-muted-foreground">{p.price_label_ar}</div>
                )}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted"
                  >
                    <Pencil className="size-3" /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("حذف هذا المنتج؟")) remove.mutate(p.id);
                    }}
                    className="size-8 rounded-lg border border-border hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!!items.length && (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={items.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات المنتج بالعربية والإنجليزية، ثم احفظ التغييرات.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <GalleryUpload
              value={form.images}
              onChange={(images) => setForm({ ...form, images })}
              folder="products"
              recommended="1000 × 1000 بكسل (مربّعة 1:1)"
            />
            <div className="grid grid-cols-2 gap-4">
              <AdminField
                label="الاسم (عربي)"
                value={form.title_ar}
                onChange={(v) => setForm({ ...form, title_ar: v })}
                required
              />
              <AdminField
                label="الاسم (إنجليزي)"
                value={form.title_en}
                onChange={(v) => setForm({ ...form, title_en: v })}
                dir="ltr"
                required
              />
              <AdminField
                label="وصف مختصر (عربي)"
                value={form.caption_ar}
                onChange={(v) => setForm({ ...form, caption_ar: v })}
              />
              <AdminField
                label="وصف مختصر (إنجليزي)"
                value={form.caption_en}
                onChange={(v) => setForm({ ...form, caption_en: v })}
                dir="ltr"
              />
              <AdminField
                label="السعر/الوصف السعري (عربي)"
                value={form.price_label_ar}
                onChange={(v) => setForm({ ...form, price_label_ar: v })}
              />
              <AdminField
                label="السعر/الوصف السعري (إنجليزي)"
                value={form.price_label_en}
                onChange={(v) => setForm({ ...form, price_label_en: v })}
                dir="ltr"
              />
            </div>
            <div>
              <L>التصنيف</L>
              {!hasCategories ? (
                <Link
                  to="/dashboard/categories"
                  className="mt-1.5 flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:border-teal hover:text-teal"
                >
                  <FolderTree className="size-4" />
                  لم يتم إضافة أي تصنيفات بعد — أضف تصنيفًا واحدًا على الأقل من صفحة تصنيفات
                  المنتجات.
                </Link>
              ) : (
                <div className="mt-1.5">
                  <CategoryCascader
                    categories={categories}
                    value={form.category_id}
                    onChange={(id) => setForm({ ...form, category_id: id })}
                    required
                  />
                  {form.category_id && parentIds.has(form.category_id) && (
                    <p className="mt-2 text-[11px] text-amber-600">
                      هذا التصنيف يحتوي على تصنيفات فرعية — يُفضّل اختيار أعمق مستوى ممكن.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminField
                label="الترتيب"
                type="number"
                value={String(form.sort_order)}
                onChange={(v) => setForm({ ...form, sort_order: Number(v) || 0 })}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, is_published: !form.is_published })}
                className={`px-3 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 ${
                  form.is_published
                    ? "border-teal/40 bg-mint/15 text-teal"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {form.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}{" "}
                {form.is_published ? "منشور" : "مخفي"}
              </button>
            </div>

            <div className="border-t border-border pt-4">
              {loadingSpecs ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                  <Loader2 className="size-4 animate-spin" /> جاري تحميل المواصفات…
                </div>
              ) : (
                <SpecificationsEditor
                  value={form.specifications}
                  onChange={(specifications) => setForm({ ...form, specifications })}
                />
              )}
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border font-semibold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={save.isPending}
                className="px-5 py-2.5 rounded-xl bg-deep text-white font-bold inline-flex items-center gap-2 disabled:opacity-60"
              >
                {save.isPending && <Loader2 className="size-4 animate-spin" />} حفظ
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function L({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}
