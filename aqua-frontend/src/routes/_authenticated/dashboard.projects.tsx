import { AdminField } from "@/components/admin/AdminField";
import { PageHeaderAction } from "@/components/admin/PageHeaderAction";
import { cn } from "@/lib/utils";
import { adminControl } from "@/components/admin/field-styles";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Search,
  X,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { type DbProject, type DbProductCategory } from "@/lib/admin-api";
import {
  useAdminProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "@/lib/projects-api";
import { useAdminProductCategories } from "@/lib/product-categories-api";
import { ImageUpload, DEFAULT_PLACEHOLDER_IMAGE } from "@/components/admin/ImageUpload";
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

export const Route = createFileRoute("/_authenticated/dashboard/projects")({
  ssr: false,
  component: ProjectsAdmin,
});

type Form = Omit<DbProject, "id" | "created_at" | "updated_at">;
const empty: Form = {
  title_ar: "",
  title_en: "",
  location_ar: "",
  location_en: "",
  category: "residential",
  category_id: null,
  image_url: "",
  year: String(new Date().getFullYear()),
  is_featured: false,
  sort_order: 0,
  is_published: true,
};

function ProjectsAdmin() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbProject | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "hidden" | "featured">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const list = useAdminProjects();

  const categoriesQ = useAdminProductCategories();
  const categories = useMemo(
    () => (categoriesQ.data ?? []).filter((c) => c.kind === "project"),
    [categoriesQ.data],
  );
  const hasCategories = categories.length > 0;

  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const mutationError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const save = {
    isPending: createProject.isPending || updateProject.isPending,
    mutate: () => {
      const payload = { ...form, image_url: form.image_url?.trim() || DEFAULT_PLACEHOLDER_IMAGE };
      if (editing) {
        updateProject.mutate(
          { id: editing.id, ...payload },
          {
            onSuccess: () => {
              toast.success("تم تحديث المشروع");
              setOpen(false);
            },
            onError: mutationError,
          },
        );
      } else {
        createProject.mutate(payload, {
          onSuccess: () => {
            toast.success("تمت إضافة المشروع");
            setOpen(false);
          },
          onError: mutationError,
        });
      }
    },
  };

  const remove = {
    mutate: (id: string) => {
      deleteProject.mutate(id, {
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
  function openEdit(p: DbProject) {
    setEditing(p);
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = p;
    void _i;
    void _c;
    void _u;
    setForm(rest);
    setOpen(true);
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

  const filtered = useMemo(() => {
    const items = list.data ?? [];
    const q = search.trim().toLowerCase();
    const allowed = filterCat ? descendantsOf.get(filterCat) : null;
    return items.filter((p) => {
      if (allowed && (!p.category_id || !allowed.has(p.category_id))) return false;
      if (statusFilter === "published" && !p.is_published) return false;
      if (statusFilter === "hidden" && p.is_published) return false;
      if (statusFilter === "featured" && !p.is_featured) return false;
      if (q) {
        const hay =
          `${p.title_ar} ${p.title_en} ${p.location_ar} ${p.location_en} ${p.year}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [list.data, search, filterCat, statusFilter, descendantsOf]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filtered, currentPage, pageSize],
  );
  useEffect(() => {
    setPage(1);
  }, [search, filterCat, statusFilter, pageSize]);

  const hasActiveFilter = search.trim() !== "" || !!filterCat || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeaderAction>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-deep text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-ocean"
        >
          <Plus className="size-4" /> إضافة مشروع
        </button>
      </PageHeaderAction>

      <div className="bg-white border border-border rounded-xl p-2 flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
        <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
          <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الموقع، أو السنة…"
            className={cn(adminControl, "w-full rtl:pr-9 rtl:pl-8 ltr:pl-9 ltr:pr-8")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 -translate-y-1/2 ltr:right-1.5 rtl:left-1.5 size-6 grid place-items-center rounded hover:bg-muted text-muted-foreground"
              aria-label="مسح البحث"
            >
              <X className="size-3.5" />
            </button>
          )}
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
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-[11px] font-bold h-9">
          {(
            [
              ["all", "الكل"],
              ["published", "منشور"],
              ["hidden", "مخفي"],
              ["featured", "مميّز"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatusFilter(k)}
              className={`px-2.5 rounded-md transition ${statusFilter === k ? "bg-deep text-white" : "text-muted-foreground hover:text-deep"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-muted-foreground px-2 whitespace-nowrap ms-auto sm:ms-0">
          {filtered.length} / {list.data?.length ?? 0}
        </span>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterCat(null);
              setStatusFilter("all");
            }}
            className="h-9 inline-flex items-center gap-1 px-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted whitespace-nowrap"
          >
            <X className="size-3.5" /> مسح
          </button>
        )}
      </div>

      {list.isLoading ? (
        <div className="bg-white border border-border rounded-2xl p-12 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-teal" />
        </div>
      ) : !list.data?.length ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          لا توجد مشاريع بعد.
        </div>
      ) : !filtered.length ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          لا توجد نتائج مطابقة للبحث أو الفلاتر الحالية.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginated.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-border rounded-2xl overflow-hidden group"
            >
              <div className="aspect-[4/3] bg-muted relative">
                {p.image_url ? (
                  <img src={p.image_url} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full grid place-items-center text-muted-foreground text-xs">
                    لا توجد صورة
                  </div>
                )}
                <div className="absolute top-2 ltr:left-2 rtl:right-2 flex gap-1.5">
                  {p.is_featured && (
                    <span className="text-[10px] font-bold bg-deep text-white px-2 py-1 rounded inline-flex items-center gap-1">
                      <Star className="size-3" /> مميّز
                    </span>
                  )}
                  {!p.is_published && (
                    <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded">
                      مخفي
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal truncate">
                  {categoryPath(categories, p.category_id) || p.category} · {p.year}
                </div>
                <div className="font-bold text-deep">{p.title_ar}</div>
                <div className="text-xs text-muted-foreground">{p.location_ar}</div>
                <div className="flex items-center gap-2 pt-3">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    <Pencil className="size-3.5" /> تعديل
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("حذف هذا المشروع؟")) remove.mutate(p.id);
                    }}
                    className="size-9 rounded-lg border border-border hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!!filtered.length && (
        <Pagination
          page={currentPage}
          pageSize={pageSize}
          total={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل المشروع" : "إضافة مشروع جديد"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات المشروع بالعربية والإنجليزية، ثم احفظ التغييرات.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm({ ...form, image_url: url })}
              folder="projects"
              recommended="1600 × 1200 بكسل (نسبة 4:3)"
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
                label="الموقع (عربي)"
                value={form.location_ar}
                onChange={(v) => setForm({ ...form, location_ar: v })}
              />
              <AdminField
                label="الموقع (إنجليزي)"
                value={form.location_en}
                onChange={(v) => setForm({ ...form, location_en: v })}
                dir="ltr"
              />
            </div>
            <div>
              <L>التصنيف</L>
              <p className="mt-1 text-[11px] text-muted-foreground">
                التصنيفات تُدار من صفحة التصنيفات (تبويب المشاريع).
              </p>
              {!hasCategories ? (
                <Link
                  to="/dashboard/categories"
                  className="mt-1.5 flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:border-teal hover:text-teal"
                >
                  <FolderTree className="size-4" />
                  لا توجد تصنيفات للمشاريع بعد. الرجاء إضافة تصنيف مشاريع أولًا من صفحة التصنيفات.
                </Link>
              ) : (
                <div className="mt-1.5">
                  <CategoryCascader
                    categories={categories}
                    value={form.category_id}
                    onChange={(id) => setForm({ ...form, category_id: id })}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <AdminField
                label="السنة"
                value={form.year}
                onChange={(v) => setForm({ ...form, year: v })}
              />
              <AdminField
                label="الترتيب"
                type="number"
                value={String(form.sort_order)}
                onChange={(v) => setForm({ ...form, sort_order: Number(v) || 0 })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Toggle
                on={form.is_featured}
                onChange={(v) => setForm({ ...form, is_featured: v })}
                label="مشروع مميّز"
              />
              <Toggle
                on={form.is_published}
                onChange={(v) => setForm({ ...form, is_published: v })}
                label="منشور"
              />
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
function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`flex-1 px-3 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 ${
        on ? "border-teal/40 bg-mint/15 text-teal" : "border-border bg-muted text-muted-foreground"
      }`}
    >
      {on ? <Eye className="size-4" /> : <EyeOff className="size-4" />} {label}
    </button>
  );
}
