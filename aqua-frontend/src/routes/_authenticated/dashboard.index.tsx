import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wrench,
  ImageIcon,
  Package,
  Mail,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Plus,
  Inbox,
} from "lucide-react";
import { useMessagesSummary } from "@/lib/messages-api";
import { useAdminServices } from "@/lib/services-api";
import { useAdminProducts } from "@/lib/products-api";
import { useAdminProjects } from "@/lib/projects-api";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  ssr: false,
  component: DashboardOverview,
});

function StatCard({
  title,
  value,
  icon: Icon,
  href,
  hint,
  tone = "teal",
}: {
  title: string;
  value: number | string;
  icon: typeof Wrench;
  href: string;
  hint?: string;
  tone?: "teal" | "ocean" | "mint" | "amber";
}) {
  const tones: Record<string, string> = {
    teal: "from-teal/15 to-mint/10 text-teal",
    ocean: "from-ocean/15 to-teal/10 text-ocean",
    mint: "from-mint/25 to-teal/10 text-teal",
    amber: "from-amber-200/40 to-amber-100/20 text-amber-700",
  };
  return (
    <Link
      to={href}
      className="group relative overflow-hidden bg-white border border-border rounded-2xl p-5 hover:border-teal/50 hover:shadow-lg hover:shadow-teal/5 transition-all flex flex-col justify-between min-h-[150px]"
    >
      <div
        className={`absolute -top-10 -start-10 size-32 rounded-full bg-gradient-to-br ${tones[tone]} opacity-60 blur-2xl group-hover:opacity-90 transition-opacity`}
      />
      <div className="relative flex items-center justify-between">
        <span
          className={`size-11 rounded-xl bg-gradient-to-br ${tones[tone]} grid place-items-center`}
        >
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-teal group-hover:-rotate-45 transition-all" />
      </div>
      <div className="relative">
        <div className="text-3xl font-extrabold text-deep tabular-nums">{value}</div>
        <div className="text-sm text-muted-foreground mt-1">{title}</div>
        {hint && (
          <div className="text-[11px] text-teal font-bold mt-2 inline-flex items-center gap-1">
            <TrendingUp className="size-3" />
            {hint}
          </div>
        )}
      </div>
    </Link>
  );
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  new: { label: "جديدة", cls: "bg-teal/10 text-teal" },
  in_progress: { label: "قيد المعالجة", cls: "bg-amber-100 text-amber-700" },
  replied: { label: "تم الرد", cls: "bg-emerald-100 text-emerald-700" },
  archived: { label: "مؤرشفة", cls: "bg-muted text-muted-foreground" },
};

function DashboardOverview() {
  const services = useAdminServices();
  const projects = useAdminProjects();
  const products = useAdminProducts();
  const messagesSummary = useMessagesSummary();

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-deep via-ocean to-teal text-white p-6 md:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(60% 80% at 90% 20%, rgba(92,189,185,0.55), transparent 60%), radial-gradient(40% 60% at 10% 100%, rgba(255,255,255,0.15), transparent 60%)",
          }}
        />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-mint font-bold bg-white/10 rounded-full px-3 py-1 mb-3">
              <Sparkles className="size-3" /> أهلاً بعودتك
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
              تحكّم كامل بمحتوى موقع Aqua Pool Group
            </h2>
            <p className="text-white/75 text-sm mt-2 leading-relaxed">
              أدِر الخدمات، المشاريع، المنتجات، والرسائل الواردة من مكان واحد — بدعم كامل للعربية
              والإنجليزية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/dashboard/projects"
              className="inline-flex items-center gap-2 bg-mint text-deep ps-4 pe-2 py-2 rounded-full font-bold text-sm hover:bg-white transition-colors"
            >
              مشروع جديد
              <span className="size-7 rounded-full bg-deep text-mint grid place-items-center">
                <Plus className="size-4" />
              </span>
            </Link>
            <Link
              to="/dashboard/messages"
              className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-white/20 transition-colors backdrop-blur"
            >
              <Inbox className="size-4" />
              صندوق الرسائل
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="الخدمات"
          value={services.data?.length ?? "—"}
          icon={Wrench}
          href="/dashboard/services"
          tone="ocean"
        />
        <StatCard
          title="المشاريع"
          value={projects.data?.length ?? "—"}
          icon={ImageIcon}
          href="/dashboard/projects"
          tone="teal"
        />
        <StatCard
          title="المنتجات"
          value={products.data?.length ?? "—"}
          icon={Package}
          href="/dashboard/products"
          tone="mint"
        />
        <StatCard
          title="الرسائل الواردة"
          value={messagesSummary.data?.total ?? "—"}
          icon={Mail}
          href="/dashboard/messages"
          tone="amber"
          hint={
            messagesSummary.data?.by_status.new
              ? `${messagesSummary.data.by_status.new} جديدة`
              : undefined
          }
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent messages */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <h3 className="font-bold text-deep">آخر الرسائل</h3>
              <p className="text-xs text-muted-foreground mt-0.5">عرض آخر 5 طلبات وصلتك</p>
            </div>
            <Link
              to="/dashboard/messages"
              className="text-xs font-bold text-teal hover:text-deep inline-flex items-center gap-1"
            >
              عرض الكل
              <ArrowUpRight className="size-3.5 rotate-180 rtl:rotate-0" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {messagesSummary.isLoading && (
              <div className="p-6 text-center text-sm text-muted-foreground">جاري التحميل…</div>
            )}
            {messagesSummary.data && messagesSummary.data.recent.length === 0 && (
              <div className="p-8 text-center">
                <Inbox className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد رسائل بعد.</p>
              </div>
            )}
            {messagesSummary.data?.recent.map((m) => {
              const st = STATUS_LABEL[m.status] ?? STATUS_LABEL.new;
              return (
                <Link
                  key={m.id}
                  to="/dashboard/messages"
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
                >
                  <div className="size-9 rounded-full bg-gradient-to-br from-ocean to-teal text-white grid place-items-center font-bold text-xs shrink-0">
                    {(m.name?.[0] ?? "?").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-deep text-sm truncate">{m.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.cls}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {m.subject || m.email}
                    </div>
                  </div>
                  <time
                    className="text-[11px] text-muted-foreground shrink-0 tabular-nums"
                    dir="ltr"
                  >
                    {new Date(m.created_at).toLocaleDateString("ar-EG-u-nu-latn", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </time>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-border rounded-2xl p-5">
          <h3 className="font-bold text-deep mb-1">إجراءات سريعة</h3>
          <p className="text-xs text-muted-foreground mb-4">ابدأ بإضافة محتوى جديد للموقع</p>
          <div className="space-y-2">
            {[
              { to: "/dashboard/services", label: "إضافة خدمة جديدة", icon: Wrench },
              { to: "/dashboard/projects", label: "إضافة مشروع جديد", icon: ImageIcon },
              { to: "/dashboard/products", label: "إضافة منتج جديد", icon: Package },
              { to: "/dashboard/settings", label: "تحديث بيانات التواصل", icon: Sparkles },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group flex items-center gap-3 p-3 rounded-xl border border-border hover:border-teal/50 hover:bg-mint/5 transition-all"
              >
                <span className="size-9 rounded-lg bg-mint/15 text-teal grid place-items-center group-hover:bg-teal group-hover:text-white transition-colors">
                  <a.icon className="size-4" />
                </span>
                <span className="flex-1 text-sm font-semibold text-deep">{a.label}</span>
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-teal group-hover:-rotate-45 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
