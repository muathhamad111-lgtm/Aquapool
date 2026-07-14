import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { hasToken, login } from "@/lib/auth";
import { ApiError } from "@/lib/api-client";
import logoColor from "@/assets/logo/logo-color.svg";
import logoWhite from "@/assets/logo/logo-white.svg";
import { FormField } from "@/components/FormField";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin · Aqua Pool Group" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminAuth,
});

function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasToken()) navigate({ to: "/dashboard" });
  }, [navigate]);

  // Public self-registration is intentionally not offered here: admin/staff
  // accounts are created only by an existing admin from /dashboard/users.
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Unable to authenticate";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex relative bg-deep text-white p-12 flex-col justify-between overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 20%, rgba(92,189,185,0.22), transparent 60%), radial-gradient(50% 50% at 10% 100%, rgba(45,138,158,0.3), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <img src={logoWhite} alt="Aqua Pool Group" className="h-12 w-auto" />
        </div>
        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <span className="size-1.5 rounded-full bg-mint animate-pulse" />
            <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-mint">
              Control Panel
            </span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1]">
            لوحة تحكم
            <br />
            <span className="bg-gradient-to-r from-mint to-teal bg-clip-text text-transparent">
              Aqua Pool Group
            </span>
          </h1>
          <p className="text-white/65 max-w-md leading-relaxed">
            إدارة كاملة لمحتوى الموقع: الخدمات، المشاريع، المنتجات، الرسائل، والإعدادات العامة.
            الوصول مقصور على المسؤول المعتمد فقط.
          </p>
          <ul className="space-y-2 text-sm text-white/70">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-mint" /> اتصال آمن ومشفّر
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-mint" /> صلاحيات محدودة للأدمن
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-mint" /> سجل كامل للتعديلات
            </li>
          </ul>
        </div>
        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} Aqua Pool Group · Internal use only
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8">
            <img src={logoColor} alt="Aqua Pool Group" className="h-10 w-auto" />
          </Link>

          <div className="bg-white border border-border rounded-3xl p-8 md:p-10 shadow-xl shadow-deep/5">
            <div className="flex items-center gap-3 mb-2">
              <span className="size-9 rounded-xl bg-mint/20 text-teal grid place-items-center">
                <Lock className="size-4" />
              </span>
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-teal font-bold">
                  Admin Access
                </div>
                <div className="text-xl font-extrabold text-deep">تسجيل الدخول</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              أدخل بياناتك للدخول إلى لوحة إدارة المحتوى.
            </p>

            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                label="البريد الإلكتروني"
                type="email"
                required
                value={email}
                onChange={setEmail}
                placeholder="admin@aqua-pool-group.com"
              />
              <FormField
                label="كلمة المرور"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              {error && (
                <div className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 bg-deep text-white px-6 py-3.5 rounded-xl font-bold hover:bg-ocean transition-all disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    دخول
                    <ArrowRight className="size-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            <Link to="/" className="hover:text-deep transition-colors">
              ← العودة للموقع العام
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
