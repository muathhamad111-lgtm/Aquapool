import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  MapPin,
  Mail,
  Phone,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import type { DbBranch } from "@/lib/admin-api";
import {
  useAdminBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  branchAddress,
} from "@/lib/branches-api";
import { AdminField } from "@/components/admin/AdminField";
import { PageHeaderAction } from "@/components/admin/PageHeaderAction";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/dashboard/branches")({
  ssr: false,
  component: BranchesAdmin,
});

type Form = Omit<DbBranch, "id" | "created_at" | "updated_at">;

const empty: Form = {
  name_ar: "",
  name_en: "",
  country_ar: "",
  country_en: "",
  region_ar: "",
  region_en: "",
  district_ar: "",
  district_en: "",
  street_ar: "",
  street_en: "",
  email: "",
  phone: "",
  hours_ar: "",
  hours_en: "",
  sort_order: 0,
  is_published: true,
};

function BranchesAdmin() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DbBranch | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [pendingDelete, setPendingDelete] = useState<DbBranch | null>(null);

  const list = useAdminBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const mutationError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const branches = list.data ?? [];
  const saving = createBranch.isPending || updateBranch.isPending;

  function openNew() {
    setEditing(null);
    setForm({ ...empty, sort_order: branches.length + 1 });
    setOpen(true);
  }

  function openEdit(branch: DbBranch) {
    setEditing(branch);
    const { id: _i, created_at: _c, updated_at: _u, ...rest } = branch;
    void _i;
    void _c;
    void _u;
    setForm(rest);
    setOpen(true);
  }

  function save() {
    const onSuccess = (message: string) => () => {
      toast.success(message);
      setOpen(false);
    };

    if (editing) {
      updateBranch.mutate(
        { id: editing.id, ...form },
        { onSuccess: onSuccess("تم تحديث الفرع"), onError: mutationError },
      );
    } else {
      createBranch.mutate(form, {
        onSuccess: onSuccess("تمت إضافة الفرع"),
        onError: mutationError,
      });
    }
  }

  function remove(branch: DbBranch) {
    deleteBranch.mutate(branch.id, {
      onSuccess: () => {
        toast.success("تم حذف الفرع");
        setPendingDelete(null);
      },
      onError: mutationError,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeaderAction>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-deep text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-ocean"
        >
          <Plus className="size-4" /> إضافة فرع
        </button>
      </PageHeaderAction>

      <p className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl p-3">
        تظهر الفروع في صفحة «تواصل معنا» بترتيب حقل الترتيب. الفرع الأول هو الفرع الرئيسي — بياناته
        تظهر في تذييل الموقع وفي بطاقات التواصل.
      </p>

      {list.isLoading ? (
        <div className="bg-white border border-border rounded-2xl p-12 grid place-items-center">
          <Loader2 className="size-5 animate-spin text-teal" />
        </div>
      ) : branches.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
          لا توجد فروع بعد. أضف فرعاً ليظهر في صفحة التواصل.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className="bg-white border border-border rounded-2xl p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-deep truncate">{branch.name_ar}</h3>
                  <p className="text-xs text-muted-foreground truncate" dir="ltr">
                    {branch.name_en}
                  </p>
                </div>
                {index === 0 && branch.is_published && (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg bg-teal/15 text-teal">
                    رئيسي
                  </span>
                )}
              </div>

              <ul className="space-y-1.5 text-xs text-muted-foreground flex-1">
                <li className="flex items-start gap-2">
                  <MapPin className="size-3.5 shrink-0 mt-0.5" />
                  <span>{branchAddress(branch, "ar") || "—"}</span>
                </li>
                {/* dir goes on the value, never on the row — on the <li> it
                    flips the flex direction too, sending the icon to the
                    opposite side from the address and hours rows. */}
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  <span dir="ltr">{branch.phone || "—"}</span>
                </li>
                <li className="flex items-center gap-2 min-w-0">
                  <Mail className="size-3.5 shrink-0" />
                  <span className="truncate" dir="ltr">
                    {branch.email || "—"}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Clock className="size-3.5 shrink-0 mt-0.5" />
                  <span>{branch.hours_ar || "—"}</span>
                </li>
              </ul>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    branch.is_published ? "text-teal" : "text-muted-foreground"
                  }`}
                >
                  {branch.is_published ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                  {branch.is_published ? "منشور" : "مخفي"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(branch)}
                    aria-label="تعديل"
                    className="size-8 grid place-items-center rounded-lg text-deep hover:bg-muted"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(branch)}
                    aria-label="حذف"
                    className="size-8 grid place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle>
            <DialogDescription>
              الاسم مطلوب بالعربية والإنجليزية. باقي الحقول اختيارية — املأ ما ينطبق على الفرع.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <AdminField
                label="اسم الفرع (عربي)"
                value={form.name_ar}
                onChange={(v) => setForm({ ...form, name_ar: v })}
                required
              />
              <AdminField
                label="اسم الفرع (إنجليزي)"
                value={form.name_en}
                onChange={(v) => setForm({ ...form, name_en: v })}
                required
              />
              <AdminField
                label="الدولة (عربي)"
                value={form.country_ar}
                onChange={(v) => setForm({ ...form, country_ar: v })}
              />
              <AdminField
                label="الدولة (إنجليزي)"
                value={form.country_en}
                onChange={(v) => setForm({ ...form, country_en: v })}
              />
              <AdminField
                label="المنطقة (عربي)"
                value={form.region_ar}
                onChange={(v) => setForm({ ...form, region_ar: v })}
              />
              <AdminField
                label="المنطقة (إنجليزي)"
                value={form.region_en}
                onChange={(v) => setForm({ ...form, region_en: v })}
              />
              <AdminField
                label="الحي (عربي)"
                value={form.district_ar}
                onChange={(v) => setForm({ ...form, district_ar: v })}
              />
              <AdminField
                label="الحي (إنجليزي)"
                value={form.district_en}
                onChange={(v) => setForm({ ...form, district_en: v })}
              />
              <AdminField
                label="الشارع (عربي)"
                value={form.street_ar}
                onChange={(v) => setForm({ ...form, street_ar: v })}
              />
              <AdminField
                label="الشارع (إنجليزي)"
                value={form.street_en}
                onChange={(v) => setForm({ ...form, street_en: v })}
              />
              <AdminField
                label="البريد الإلكتروني"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <AdminField
                label="رقم التواصل"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <AdminField
                label="ساعات العمل (عربي)"
                value={form.hours_ar}
                onChange={(v) => setForm({ ...form, hours_ar: v })}
              />
              <AdminField
                label="ساعات العمل (إنجليزي)"
                value={form.hours_en}
                onChange={(v) => setForm({ ...form, hours_en: v })}
              />
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
                {form.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                {form.is_published ? "منشور" : "مخفي"}
              </button>
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
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-deep text-white font-bold inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="size-4 animate-spin" />} حفظ
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الفرع</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف «{pendingDelete?.name_ar}» نهائياً ولن يظهر في صفحة التواصل. لا يمكن التراجع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove(pendingDelete)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
