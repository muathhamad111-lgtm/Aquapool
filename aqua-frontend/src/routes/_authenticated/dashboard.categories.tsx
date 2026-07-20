import { AdminField } from "@/components/admin/AdminField";
import { PageHeaderAction } from "@/components/admin/PageHeaderAction";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Package,
  Wrench,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { type DbProductCategory, type CategoryKind } from "@/lib/admin-api";
import {
  useAdminProductCategories,
  useCreateProductCategory,
  useUpdateProductCategory,
  useDeleteProductCategory,
} from "@/lib/product-categories-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Search = { parent?: string; kind?: CategoryKind };

const KIND_TABS: { value: CategoryKind; label: string; icon: typeof Package }[] = [
  { value: "product", label: "تصنيفات المنتجات", icon: Package },
  { value: "service", label: "تصنيفات الخدمات", icon: Wrench },
  { value: "project", label: "تصنيفات المشاريع", icon: Building2 },
];

const KIND_LABEL: Record<CategoryKind, string> = {
  product: "منتج",
  service: "خدمة",
  project: "مشروع",
};

export const Route = createFileRoute("/_authenticated/dashboard/categories")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): Search => ({
    parent: typeof s.parent === "string" && s.parent ? s.parent : undefined,
    kind:
      s.kind === "service" || s.kind === "project" || s.kind === "product"
        ? (s.kind as CategoryKind)
        : undefined,
  }),
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const navigate = useNavigate();
  const { parent: parentParam, kind: kindParam } = Route.useSearch();
  const parentId = parentParam ?? null;
  const activeKind: CategoryKind = kindParam ?? "product";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbProductCategory | null>(null);
  const [formParent, setFormParent] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [formKind, setFormKind] = useState<CategoryKind>("product");

  const list = useAdminProductCategories();
  const createCategory = useCreateProductCategory();
  const updateCategory = useUpdateProductCategory();
  const deleteCategory = useDeleteProductCategory();

  const items = list.data ?? [];

  // Items belonging to the active kind tab (used for tree + breadcrumb)
  const kindItems = useMemo(
    () => items.filter((c) => (c.kind ?? "product") === activeKind),
    [items, activeKind],
  );

  const childrenMap = useMemo(() => {
    const m = new Map<string | null, DbProductCategory[]>();
    kindItems.forEach((c) => {
      const k = c.parent_id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    });
    for (const arr of m.values()) arr.sort((a, b) => a.sort_order - b.sort_order);
    return m;
  }, [kindItems]);

  const currentParent = parentId ? (kindItems.find((c) => c.id === parentId) ?? null) : null;
  // If parent param refers to another kind, reset to root of active kind
  const effectiveParentId = currentParent ? parentId : null;
  const currentList = childrenMap.get(effectiveParentId) ?? [];

  const breadcrumb = useMemo(() => {
    const chain: DbProductCategory[] = [];
    let cur = currentParent;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parent_id ? (kindItems.find((c) => c.id === cur!.parent_id) ?? null) : null;
    }
    return chain;
  }, [currentParent, kindItems]);

  const kindCounts = useMemo(() => {
    const counts: Record<CategoryKind, number> = { product: 0, service: 0, project: 0 };
    items.forEach((c) => {
      const k = (c.kind ?? "product") as CategoryKind;
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const saveError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const save = {
    isPending: createCategory.isPending || updateCategory.isPending,
    mutate: () => {
      const title = name.trim();
      if (!title) {
        toast.error("الرجاء إدخال عنوان التصنيف");
        return;
      }
      if (editing) {
        updateCategory.mutate(
          { id: editing.id, name_ar: title, name_en: title },
          {
            onSuccess: () => {
              toast.success("تم تحديث التصنيف");
              setOpen(false);
            },
            onError: saveError,
          },
        );
      } else {
        createCategory.mutate(
          { name_ar: title, name_en: title, parent_id: formParent, kind: formKind },
          {
            onSuccess: (created) => {
              toast.success("تمت إضافة التصنيف");
              setOpen(false);
              // The server decides the real kind (inherited from the
              // parent for sub-categories) — jump to that tab if it
              // differs from the one we were on.
              if (!formParent && created.kind !== activeKind) {
                navigate({ to: "/dashboard/categories", search: { kind: created.kind } });
              }
            },
            onError: saveError,
          },
        );
      }
    },
  };

  const remove = {
    mutate: (id: string) => {
      deleteCategory.mutate(id, {
        onSuccess: () => toast.success("تم الحذف"),
        onError: saveError,
      });
    },
  };

  function openNew(parent: string | null) {
    setEditing(null);
    setFormParent(parent);
    setName("");
    setFormKind(activeKind);
    setOpen(true);
  }
  function openEdit(c: DbProductCategory) {
    setEditing(c);
    setFormParent(c.parent_id);
    setName(c.name_ar || c.name_en);
    setFormKind((c.kind ?? "product") as CategoryKind);
    setOpen(true);
  }
  function handleDelete(c: DbProductCategory) {
    const kids = childrenMap.get(c.id) ?? [];
    const msg = kids.length
      ? `سيتم حذف "${c.name_ar}" وجميع التصنيفات الفرعية (${kids.length}). هل تريد المتابعة؟`
      : `حذف "${c.name_ar}"؟`;
    if (confirm(msg)) remove.mutate(c.id);
  }

  return (
    <div className="space-y-5">
      <PageHeaderAction>
        <button
          onClick={() => openNew(effectiveParentId)}
          className="inline-flex items-center gap-2 bg-deep text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-ocean"
        >
          <Plus className="size-4" /> {effectiveParentId ? "إضافة تصنيف فرعي" : "إضافة تصنيف رئيسي"}
        </button>
      </PageHeaderAction>

      {/* Kind tabs */}
      <div className="bg-white border border-border rounded-2xl p-1.5 flex flex-wrap gap-1">
        {KIND_TABS.map((t) => {
          const Icon = t.icon;
          const active = t.value === activeKind;
          return (
            <Link
              key={t.value}
              to="/dashboard/categories"
              search={{ kind: t.value }}
              className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                active
                  ? "bg-deep text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-deep"
              }`}
            >
              <Icon className="size-4" />
              <span>{t.label}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {kindCounts[t.value]}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <Link
          to="/dashboard/categories"
          search={{ kind: activeKind }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
            !effectiveParentId ? "bg-deep text-white" : "border border-border hover:bg-muted"
          }`}
        >
          <FolderTree className="size-3.5" /> التصنيفات الرئيسية
        </Link>
        {breadcrumb.map((c, i) => (
          <span key={c.id} className="inline-flex items-center gap-2">
            <ChevronLeft className="size-3.5 text-muted-foreground rtl:hidden" />
            <ChevronRight className="size-3.5 text-muted-foreground hidden rtl:inline" />
            <Link
              to="/dashboard/categories"
              search={{ parent: c.id, kind: activeKind }}
              className={`px-3 py-1.5 rounded-lg font-bold ${
                i === breadcrumb.length - 1
                  ? "bg-deep text-white"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {c.name_ar}
            </Link>
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-deep">
            {currentParent
              ? `التصنيفات الفرعية لـ "${currentParent.name_ar}"`
              : KIND_TABS.find((t) => t.value === activeKind)!.label}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">عدد التصنيفات: {currentList.length}</p>
        </div>
      </div>

      {list.isLoading ? (
        <div className="bg-white border border-border rounded-2xl p-12 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-teal" />
        </div>
      ) : !currentList.length ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          {currentParent
            ? "لا توجد تصنيفات فرعية بعد. أضف أول تصنيف فرعي."
            : "لا توجد تصنيفات بعد. أضف أول تصنيف رئيسي لهذا النوع."}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-start px-4 py-3 font-bold">#</th>
                <th className="text-start px-4 py-3 font-bold">عنوان التصنيف</th>
                <th className="text-start px-4 py-3 font-bold">التصنيفات الفرعية</th>
                <th className="text-end px-4 py-3 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentList.map((c, i) => {
                const kidsCount = (childrenMap.get(c.id) ?? []).length;
                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-bold text-deep">{c.name_ar}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          navigate({
                            to: "/dashboard/categories",
                            search: { parent: c.id, kind: activeKind },
                          })
                        }
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          kidsCount > 0
                            ? "bg-mint/15 border-teal/30 text-teal hover:bg-mint/25"
                            : "border-border text-muted-foreground hover:border-teal hover:text-teal"
                        }`}
                        title="عرض التصنيفات الفرعية"
                      >
                        <FolderTree className="size-3.5" />
                        {kidsCount}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => openNew(c.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border hover:border-teal hover:text-teal"
                        >
                          <Plus className="size-3" /> تصنيف فرعي
                        </button>
                        <button
                          onClick={() => openEdit(c)}
                          className="size-8 rounded-lg border border-border hover:bg-muted grid place-items-center"
                          aria-label="تعديل"
                          title="تعديل"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="size-8 rounded-lg border border-border hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center"
                          aria-label="حذف"
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing
                ? "تعديل التصنيف"
                : formParent
                  ? "إضافة تصنيف فرعي"
                  : "إضافة تصنيف رئيسي جديد"}
            </DialogTitle>
            <DialogDescription>
              أدخل اسم التصنيف بالعربية والإنجليزية، ثم احفظ التغييرات.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <AdminField
              label="عنوان التصنيف"
              value={name}
              onChange={setName}
              required
              autoFocus
              placeholder="اكتب عنوان التصنيف"
            />

            {/* Kind selector — only when creating a root category */}
            {!editing && !formParent && (
              <div>
                <AdminField
                  label="نوع التصنيف"
                  select
                  options={[
                    { value: "product", label: "منتج" },
                    { value: "service", label: "خدمة" },
                    { value: "project", label: "مشروع" },
                  ]}
                  value={formKind}
                  onChange={(v) => setFormKind(v as CategoryKind)}
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  يحدد لأي قسم من الموقع يخدم هذا التصنيف. التصنيفات الفرعية ترث نوع التصنيف الأب
                  تلقائيًا.
                </p>
              </div>
            )}

            {/* Show inherited kind when adding a sub-category */}
            {!editing && formParent && (
              <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl px-3 py-2">
                النوع: <strong className="text-deep">{KIND_LABEL[activeKind]}</strong> — موروث من
                التصنيف الأب.
              </div>
            )}

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
