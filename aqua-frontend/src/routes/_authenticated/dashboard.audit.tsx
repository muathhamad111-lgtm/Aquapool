import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Loader2,
  Search,
  History,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Settings as SettingsIcon,
  User as UserIcon,
  ArrowUpDown,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { DbAuditLog } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  ssr: false,
  component: AuditPage,
});

const ENTITY_LABELS: Record<string, string> = {
  service: "خدمة",
  project: "مشروع",
  product: "منتج",
  message: "رسالة",
  setting: "إعدادات",
  user: "مستخدم",
};

const ACTION_META: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  create: { label: "إضافة", color: "bg-emerald-100 text-emerald-700", icon: Plus },
  update: { label: "تعديل", color: "bg-amber-100 text-amber-700", icon: Pencil },
  delete: { label: "حذف", color: "bg-red-100 text-red-700", icon: Trash2 },
  status_change: { label: "تغيير حالة", color: "bg-sky-100 text-sky-700", icon: ArrowUpDown },
  settings_update: {
    label: "تحديث إعدادات",
    color: "bg-indigo-100 text-indigo-700",
    icon: SettingsIcon,
  },
};

const ENTITY_FILTERS = [
  { k: "all", l: "الكل" },
  { k: "service", l: "الخدمات" },
  { k: "project", l: "المشاريع" },
  { k: "product", l: "المنتجات" },
  { k: "message", l: "الرسائل" },
  { k: "setting", l: "الإعدادات" },
  { k: "user", l: "المستخدمون" },
] as const;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("ar-EG-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "الآن";
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
  if (diff < 86400 * 7) return `قبل ${Math.floor(diff / 86400)} يوم`;
  return formatDate(iso);
}

function AuditPage() {
  const [entity, setEntity] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "audit"],
    queryFn: () => apiClient.get<DbAuditLog[]>("/api/v1/admin/audit-logs"),
  });

  const filtered = useMemo(() => {
    let rows = data ?? [];
    if (entity !== "all") rows = rows.filter((r) => r.entity_type === entity);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.user_email?.toLowerCase().includes(q) ||
          r.entity_label?.toLowerCase().includes(q) ||
          r.action.toLowerCase().includes(q) ||
          r.entity_type.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [data, entity, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: data?.length ?? 0 };
    for (const row of data ?? []) c[row.entity_type] = (c[row.entity_type] ?? 0) + 1;
    return c;
  }, [data]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-gradient-to-br from-deep to-ocean grid place-items-center text-white shrink-0">
            <History className="size-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-deep">سجل التدقيق</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              جميع التغييرات على محتوى الموقع: من قام بها، ومتى تمت
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 bg-deep text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-ocean disabled:opacity-60"
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-border p-4 md:p-5 space-y-4">
        <div className="relative">
          <Search className="size-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالبريد، نوع العنصر، أو اسم العنصر..."
            className="ps-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {ENTITY_FILTERS.map((f) => {
            const active = entity === f.k;
            return (
              <button
                key={f.k}
                onClick={() => setEntity(f.k)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? "bg-gradient-to-l from-deep to-ocean text-white border-transparent shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-border hover:border-teal/40"
                }`}
              >
                {f.l}
                <span
                  className={`ms-2 text-[10px] ${active ? "text-white/80" : "text-muted-foreground/70"}`}
                >
                  {counts[f.k] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log list */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-16 grid place-items-center">
            <Loader2 className="size-6 animate-spin text-teal" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground text-sm">لا توجد سجلات مطابقة</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((row) => {
              const meta = ACTION_META[row.action] ?? {
                label: row.action,
                color: "bg-muted text-muted-foreground",
                icon: Pencil,
              };
              const Icon = meta.icon;
              return (
                <li key={row.id} className="p-4 md:p-5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div
                      className={`size-10 rounded-xl grid place-items-center shrink-0 ${meta.color}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-deep">
                          {ENTITY_LABELS[row.entity_type] ?? row.entity_type}
                        </span>
                        {row.entity_label && (
                          <span className="text-sm font-semibold text-deep truncate">
                            {row.entity_label}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="size-3" />
                          {row.user_email ?? "غير معروف"}
                        </span>
                        <span>•</span>
                        <span title={formatDate(row.created_at)}>{relative(row.created_at)}</span>
                        <span className="text-muted-foreground/60">
                          ({formatDate(row.created_at)})
                        </span>
                      </div>
                      {row.details && Object.keys(row.details).length > 0 && (
                        <details className="mt-2 group">
                          <summary className="text-[11px] text-teal cursor-pointer hover:underline">
                            عرض التفاصيل
                          </summary>
                          <pre
                            className="mt-2 p-3 bg-muted/40 rounded-lg text-[11px] text-deep overflow-x-auto"
                            dir="ltr"
                          >
                            {JSON.stringify(row.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
