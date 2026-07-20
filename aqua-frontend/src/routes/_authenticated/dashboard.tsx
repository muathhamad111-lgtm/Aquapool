import { createFileRoute, Outlet, useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ChevronLeft, ExternalLink, LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { logout as apiLogout, me, type AppRole } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  component: DashboardLayout,
});

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "نظرة عامة", subtitle: "ملخّص محتوى الموقع وآخر الرسائل الواردة" },
  "/dashboard/services": {
    title: "إدارة الخدمات",
    subtitle: "أضف وعدّل الخدمات الظاهرة في الموقع",
  },
  "/dashboard/projects": {
    title: "إدارة المشاريع",
    subtitle: "معرض المشاريع المنفذة وصور الأعمال",
  },
  "/dashboard/products": {
    title: "إدارة المنتجات",
    subtitle: "كتالوج الإكسسوارات والمعدات المتوفرة",
  },
  "/dashboard/categories": {
    title: "التصنيفات",
    subtitle: "تصنيفات شجرية للمنتجات والخدمات والمشاريع",
  },
  "/dashboard/branches": {
    title: "الفروع",
    subtitle: "مواقع الشركة الظاهرة في صفحة تواصل معنا",
  },
  "/dashboard/messages": { title: "الرسائل الواردة", subtitle: "طلبات وعروض الأسعار من الزوار" },
  "/dashboard/users": {
    title: "إدارة المستخدمين",
    subtitle: "إضافة وإدارة حسابات الوصول للوحة التحكم",
  },
  "/dashboard/audit": {
    title: "سجل التدقيق",
    subtitle: "تتبّع جميع التغييرات التي تمت من لوحة التحكم",
  },
  "/dashboard/settings": {
    title: "إعدادات الموقع",
    subtitle: "معلومات التواصل، الهوية، ومحتوى الواجهة",
  },
};

function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [status, setStatus] = useState<"checking" | "ok" | "forbidden">("checking");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<AppRole | null>(null);

  // Force RTL + Arabic on the dashboard, regardless of public site language
  useEffect(() => {
    const html = document.documentElement;
    const prevDir = html.dir;
    const prevLang = html.lang;
    html.dir = "rtl";
    html.lang = "ar";
    return () => {
      html.dir = prevDir;
      html.lang = prevLang;
    };
  }, []);

  useEffect(() => {
    me().then((user) => {
      if (user) {
        setRole(user.role);
        setEmail(user.email);
        setStatus("ok");
      } else {
        setStatus("forbidden");
      }
    });
  }, []);

  async function handleSignOut() {
    await apiLogout();
    navigate({ to: "/admin", replace: true });
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen grid place-items-center bg-background" dir="rtl">
        <Loader2 className="size-6 animate-spin text-teal" />
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-4" dir="rtl">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-deep mb-2">صلاحية مرفوضة</h1>
          <p className="text-muted-foreground text-sm mb-6">
            تعذّر التحقق من صلاحية الوصول لهذا الحساب.
          </p>
          <button
            onClick={() => navigate({ to: "/admin" })}
            className="inline-flex items-center gap-2 bg-deep text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-ocean"
          >
            العودة لصفحة الدخول
          </button>
        </div>
      </div>
    );
  }

  const head = TITLES[pathname] ?? { title: "لوحة التحكم", subtitle: "" };

  return (
    <SidebarProvider>
      <div
        className="min-h-screen flex w-full bg-[#f5f7fa] font-tajawal"
        dir="rtl"
        style={{ fontFamily: "'Tajawal', system-ui, sans-serif" }}
      >
        <AdminSidebar onSignOut={handleSignOut} email={email} />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-16 flex items-center bg-white/90 backdrop-blur border-b border-border px-4 md:px-6 gap-3 sticky top-0 z-30">
            <SidebarTrigger className="shrink-0" />
            <div className="flex-1 min-w-0 flex items-center gap-2 text-sm">
              <Link to="/dashboard" className="text-muted-foreground hover:text-deep">
                لوحة التحكم
              </Link>
              {pathname !== "/dashboard" && (
                <>
                  <ChevronLeft className="size-4 text-muted-foreground rotate-180" />
                  <span className="font-semibold text-deep truncate">{head.title}</span>
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-deep border border-border rounded-full px-3 py-1.5 hover:border-teal/50 transition-colors"
              >
                <ExternalLink className="size-3.5" />
                عرض الموقع
              </Link>
              <div className="flex items-center gap-2 ps-3 border-s border-border">
                <div className="size-9 rounded-full bg-gradient-to-br from-ocean to-teal text-white grid place-items-center font-bold text-xs">
                  {(email[0] ?? "A").toUpperCase()}
                </div>
                <div className="text-xs leading-tight">
                  <div className="font-bold text-deep">
                    {role === "admin" ? "مدير النظام" : "مستخدم"}
                  </div>
                  <div className="text-muted-foreground truncate max-w-[180px]">{email}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  title="تسجيل الخروج"
                  className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Page header */}
          <div className="border-b border-border bg-white">
            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-[28px] font-extrabold text-deep leading-tight">
                  {head.title}
                </h1>
                {head.subtitle && (
                  <p className="text-sm text-muted-foreground mt-1">{head.subtitle}</p>
                )}
              </div>
              <div
                id="page-header-action-slot"
                key={pathname}
                className="shrink-0 flex items-center gap-2"
              />
            </div>
          </div>

          <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>

          <footer className="border-t border-border bg-white py-4 px-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Aqua Pool Group · لوحة التحكم الإدارية
          </footer>
        </div>
      </div>
      <Toaster richColors position="top-center" dir="rtl" />
    </SidebarProvider>
  );
}
