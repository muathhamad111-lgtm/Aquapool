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
  GripVertical,
  Eye,
  EyeOff,
  FolderTree,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { type DbService, type DbProductCategory } from "@/lib/admin-api";
import { useAdminProductCategories } from "@/lib/product-categories-api";
import {
  useAdminServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from "@/lib/services-api";
import { Pagination } from "@/components/admin/Pagination";
import { CategoryCascader, categoryPath } from "@/components/admin/CategoryCascader";
import { CategoryFilterCascader } from "@/components/CategoryFilterCascader";
import { RichTextArea } from "@/components/admin/RichTextArea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard/services")({
  ssr: false,
  component: ServicesAdmin,
});

const ICONS = ["droplets", "sparkles", "wrench", "shield", "sun", "leaf", "waves", "gem"];

type Form = Omit<DbService, "id" | "created_at" | "updated_at">;

const empty: Form = {
  icon: "droplets",
  title_ar: "",
  title_en: "",
  description_ar: "",
  description_en: "",
  category_id: null,
  sort_order: 0,
  is_published: true,
};

function ServicesAdmin() {
  const [editing, setEditing] = useState<DbService | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);

  const list = useAdminServices();

  const categoriesQ = useAdminProductCategories();
  const categories = useMemo(
    () => (categoriesQ.data ?? []).filter((c) => c.kind === "service"),
    [categoriesQ.data],
  );
  const hasCategories = categories.length > 0;

  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const mutationError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const save = {
    isPending: createService.isPending || updateService.isPending,
    mutate: () => {
      if (editing) {
        updateService.mutate(
          { id: editing.id, ...form },
          {
            onSuccess: () => {
              toast.success("تم تحديث الخدمة");
              setOpen(false);
            },
            onError: mutationError,
          },
        );
      } else {
        createService.mutate(form, {
          onSuccess: () => {
            toast.success("تمت إضافة الخدمة");
            setOpen(false);
          },
          onError: mutationError,
        });
      }
    },
  };

  const remove = {
    mutate: (id: string) => {
      deleteService.mutate(id, {
        onSuccess: () => toast.success("تم حذف الخدمة"),
        onError: mutationError,
      });
    },
  };

  function openNew() {
    setEditing(null);
    setForm({ ...empty, sort_order: (list.data?.length ?? 0) + 1 });
    setOpen(true);
  }
  function openEdit(s: DbService) {
    setEditing(s);
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = s;
    void _id;
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

  // Memoised so the `?? []` fallback keeps a stable reference while loading;
  // otherwise the filter useMemo below recomputes on every render.
  const allItems = useMemo(() => list.data ?? [], [list.data]);
  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const allowed = filterCat ? descendantsOf.get(filterCat) : null;
    return allItems.filter((s) => {
      if (allowed && (!s.category_id || !allowed.has(s.category_id))) return false;
      if (!q) return true;
      return (
        s.title_ar?.toLowerCase().includes(q) ||
        s.title_en?.toLowerCase().includes(q) ||
        s.description_ar?.toLowerCase().includes(q) ||
        s.description_en?.toLowerCase().includes(q)
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
          <Plus className="size-4" /> إضافة خدمة
        </button>
      </PageHeaderAction>

      <div className="bg-white border border-border rounded-xl p-2 flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
        <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
          <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الخدمات…"
            className={cn(adminControl, "w-full rtl:pr-9 rtl:pl-8 ltr:pl-9 ltr:pr-8")}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 -translate-y-1/2 ltr:right-1.5 rtl:left-1.5 size-6 grid place-items-center rounded hover:bg-muted text-muted-foreground"
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
        <span className="text-[11px] text-muted-foreground px-2 whitespace-nowrap ms-auto sm:ms-0">
          {items.length} / {allItems.length}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setFilterCat(null);
            }}
            className="h-9 inline-flex items-center gap-1 px-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted whitespace-nowrap"
          >
            <X className="size-3.5" /> مسح
          </button>
        )}
      </div>

      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        {list.isLoading ? (
          <div className="p-12 grid place-items-center">
            <Loader2 className="size-5 animate-spin text-teal" />
          </div>
        ) : !list.data?.length ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            لا توجد خدمات بعد. أضف أول خدمة لعرضها على الموقع.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {paginated.map((s) => (
              <li key={s.id} className="p-4 flex items-center gap-4 hover:bg-muted/40">
                <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal bg-mint/15 px-2 py-0.5 rounded">
                      {s.icon}
                    </span>
                    {s.category_id && (
                      <span className="text-[10px] font-bold text-deep bg-sand/60 px-2 py-0.5 rounded truncate max-w-[240px]">
                        {categoryPath(categories, s.category_id)}
                      </span>
                    )}
                    {!s.is_published && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <EyeOff className="size-3" /> مخفي
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-deep mt-1 truncate">{s.title_ar}</div>
                  <div className="text-xs text-muted-foreground truncate" dir="ltr">
                    {s.title_en}
                  </div>
                </div>
                <button
                  onClick={() => openEdit(s)}
                  className="size-9 rounded-lg border border-border hover:bg-muted grid place-items-center"
                  title="تعديل"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("حذف هذه الخدمة نهائياً؟")) remove.mutate(s.id);
                  }}
                  className="size-9 rounded-lg border border-border hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center"
                  title="حذف"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</DialogTitle>
            <DialogDescription>
              أدخل بيانات الخدمة بالعربية والإنجليزية، ثم احفظ التغييرات.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <AdminField
                label="العنوان (عربي)"
                value={form.title_ar}
                onChange={(v) => setForm({ ...form, title_ar: v })}
                required
              />
              <AdminField
                label="العنوان (إنجليزي)"
                value={form.title_en}
                onChange={(v) => setForm({ ...form, title_en: v })}
                dir="ltr"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <RichTextArea
                label="الوصف (عربي)"
                value={form.description_ar}
                onChange={(v) => setForm({ ...form, description_ar: v })}
                dir="rtl"
              />
              <RichTextArea
                label="الوصف (إنجليزي)"
                value={form.description_en}
                onChange={(v) => setForm({ ...form, description_en: v })}
                dir="ltr"
              />
            </div>
            <div>
              <Label>التصنيف</Label>
              {!hasCategories ? (
                <Link
                  to="/dashboard/categories"
                  className="mt-1.5 flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground hover:border-teal hover:text-teal"
                >
                  <FolderTree className="size-4" />
                  لا توجد تصنيفات للخدمات بعد — أضف تصنيفًا من صفحة التصنيفات (تبويب الخدمات).
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
            <div className="grid grid-cols-3 gap-4">
              <AdminField
                label="الأيقونة"
                select
                options={ICONS.map((i) => ({ value: i, label: i }))}
                value={form.icon}
                onChange={(v) => setForm({ ...form, icon: v })}
              />
              <AdminField
                type="number"
                label="الترتيب"
                value={String(form.sort_order)}
                onChange={(v) => setForm({ ...form, sort_order: Number(v) || 0 })}
              />
              <div>
                <Label>الحالة</Label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_published: !form.is_published })}
                  className={`w-full mt-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 ${
                    form.is_published
                      ? "border-teal/40 bg-mint/15 text-teal"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {form.is_published ? (
                    <>
                      <Eye className="size-4" /> منشور
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-4" /> مخفي
                    </>
                  )}
                </button>
              </div>
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
                {save.isPending && <Loader2 className="size-4 animate-spin" />}
                حفظ
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        dir={dir}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1.5 px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none resize-none"
      />
    </div>
  );
}
