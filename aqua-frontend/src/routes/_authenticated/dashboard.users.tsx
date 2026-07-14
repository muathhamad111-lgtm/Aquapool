import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  KeyRound,
  Mail,
  ShieldCheck,
  UserPlus,
  Calendar,
  Clock,
} from "lucide-react";
import {
  listUsers,
  createUser,
  deleteUser,
  resetUserPassword,
  type AdminUser,
} from "@/lib/users-api";
import { me, type AppRole } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/FormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export const Route = createFileRoute("/_authenticated/dashboard/users")({
  ssr: false,
  component: UsersPage,
});

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-EG-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function UsersPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const { data: myRole } = useQuery({
    queryKey: ["admin-users", "my-role"],
    queryFn: () => me().then((u) => u?.role ?? null),
  });
  const isAdmin = myRole === "admin";

  const [openCreate, setOpenCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("user");

  const [resetTarget, setResetTarget] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const createMut = useMutation({
    mutationFn: () => createUser({ email, password, role }),
    onSuccess: () => {
      toast.success("تم إنشاء المستخدم بنجاح");
      setEmail("");
      setPassword("");
      setRole("user");
      setOpenCreate(false);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "تعذّر إنشاء المستخدم"),
  });

  const resetMut = useMutation({
    mutationFn: () => resetUserPassword(resetTarget!.id, newPassword),
    onSuccess: () => {
      toast.success("تم تحديث كلمة المرور");
      setResetTarget(null);
      setNewPassword("");
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "تعذّر التحديث"),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteUser(deleteTarget!.id),
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: unknown) => toast.error(e instanceof ApiError ? e.message : "تعذّر الحذف"),
  });

  const users = data ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-deep to-ocean grid place-items-center text-white">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-deep">إدارة المستخدمين</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              مدير النظام لديه كل الصلاحيات، والمستخدم يعمل على إعدادات الموقع بدون حذف مستخدمين أو
              سجلات التدقيق
            </p>
          </div>
        </div>
        <Button
          onClick={() => setOpenCreate(true)}
          className="bg-gradient-to-l from-deep to-ocean hover:opacity-90 text-white gap-2"
        >
          <UserPlus className="size-4" />
          إضافة مستخدم
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="إجمالي المستخدمين"
          value={users.length}
          icon={<Mail className="size-4" />}
        />
        <StatCard
          label="حسابات الأدمن"
          value={users.filter((u) => u.role === "admin").length}
          icon={<ShieldCheck className="size-4" />}
        />
        <StatCard
          label="آخر تسجيل دخول"
          value={
            users.find((u) => u.last_login_at)?.last_login_at
              ? formatDate(users.find((u) => u.last_login_at)?.last_login_at ?? null)
              : "—"
          }
          icon={<Clock className="size-4" />}
          small
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-16 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-teal" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">لا يوجد مستخدمون بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start p-4 font-semibold">البريد الإلكتروني</th>
                  <th className="text-start p-4 font-semibold">الصلاحية</th>
                  <th className="text-start p-4 font-semibold hidden md:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" /> أُنشئ في
                    </span>
                  </th>
                  <th className="text-start p-4 font-semibold hidden lg:table-cell">آخر دخول</th>
                  <th className="p-4 w-1"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-to-br from-teal/20 to-ocean/20 grid place-items-center text-deep font-bold uppercase">
                          {u.email.charAt(0)}
                        </div>
                        <span className="font-medium text-deep truncate max-w-[220px]">
                          {u.email}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 bg-teal/10 text-teal px-2.5 py-1 rounded-full text-xs font-semibold">
                          <ShieldCheck className="size-3" />
                          مدير النظام
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-2.5 py-1 rounded-full text-xs font-semibold">
                          مستخدم
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">
                      {formatDate(u.last_login_at)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="تغيير كلمة المرور"
                          onClick={() => {
                            setResetTarget(u);
                            setNewPassword("");
                          }}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="حذف المستخدم"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteTarget(u)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-teal" />
              إضافة مستخدم جديد
            </DialogTitle>
            <DialogDescription>
              حدّد صلاحية الحساب: مدير النظام لديه كل الصلاحيات، والمستخدم يعمل على إعدادات الموقع
              فقط.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FormField
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="name@example.com"
              dir="ltr"
            />
            <FormField
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="8 أحرف على الأقل"
              dir="ltr"
            />
            <div className="space-y-2">
              <Label>الصلاحية</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">مستخدم (موظف)</SelectItem>
                  {isAdmin && <SelectItem value="admin">مدير النظام</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending || !email || !password}
              className="bg-deep hover:bg-ocean text-white"
            >
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "إنشاء الحساب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={(o) => !o && setResetTarget(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-teal" />
              تغيير كلمة المرور
            </DialogTitle>
            <DialogDescription>
              المستخدم: <span className="font-semibold">{resetTarget?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <FormField
            label="كلمة المرور الجديدة"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="8 أحرف على الأقل"
            dir="ltr"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              إلغاء
            </Button>
            <Button
              onClick={() => resetMut.mutate()}
              disabled={resetMut.isPending || !newPassword}
              className="bg-deep hover:bg-ocean text-white"
            >
              {resetMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "تحديث"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المستخدم نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف حساب <span className="font-semibold">{deleteTarget?.email}</span> ولن يتمكن
              من الوصول للوحة التحكم بعد ذلك. لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteMut.mutate();
              }}
              disabled={deleteMut.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "حذف نهائي"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  small,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3">
      <div className="size-10 rounded-xl bg-teal/10 text-teal grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className={`font-bold text-deep ${small ? "text-sm" : "text-xl"} truncate`}>
          {value}
        </div>
      </div>
    </div>
  );
}
