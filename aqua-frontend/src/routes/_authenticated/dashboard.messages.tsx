import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Inbox,
  Reply,
  Clock,
  CheckCircle2,
  Archive,
  Sparkles,
  Search,
  ChevronLeft,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { type DbMessage } from "@/lib/admin-api";
import {
  useAdminMessages,
  statusCountsFrom,
  useUpdateMessageStatus,
  useBulkUpdateMessageStatus,
  useDeleteMessage,
  useBulkDeleteMessages,
} from "@/lib/messages-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Pagination } from "@/components/admin/Pagination";
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

export const Route = createFileRoute("/_authenticated/dashboard/messages")({
  ssr: false,
  component: MessagesAdmin,
});

const STATUSES = ["new", "in_progress", "replied", "archived"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_META: Record<
  Status,
  { label: string; icon: typeof Sparkles; pill: string; dot: string }
> = {
  new: {
    label: "جديدة",
    icon: Sparkles,
    pill: "bg-teal/15 text-teal border-teal/30",
    dot: "bg-teal",
  },
  in_progress: {
    label: "قيد المعالجة",
    icon: Clock,
    pill: "bg-amber-100 text-amber-700 border-amber-300/60",
    dot: "bg-amber-500",
  },
  replied: {
    label: "تم الرد",
    icon: CheckCircle2,
    pill: "bg-emerald-100 text-emerald-700 border-emerald-300/60",
    dot: "bg-emerald-500",
  },
  archived: {
    label: "مؤرشفة",
    icon: Archive,
    pill: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/60",
  },
};

function MessagesAdmin() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  const debouncedSearch = useDebouncedValue(search);

  // Any change to what's being queried invalidates the current page number
  // — page 5 of an unfiltered inbox is rarely page 5 of a filtered one, and
  // is often past the end of it. Selections are per-page, so they go too.
  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filter, debouncedSearch, pageSize]);

  const list = useAdminMessages({
    page,
    perPage: pageSize,
    status: filter,
    search: debouncedSearch,
  });

  const rows = useMemo(() => list.data?.data ?? [], [list.data]);
  const total = list.data?.meta.total ?? 0;
  const counts = useMemo(() => statusCountsFrom(list.data?.meta), [list.data]);

  const selected = useMemo(() => rows.find((m) => m.id === selectedId) ?? null, [rows, selectedId]);

  const updateMessageStatus = useUpdateMessageStatus();
  const bulkUpdateMessageStatus = useBulkUpdateMessageStatus();
  const deleteMessage = useDeleteMessage();
  const bulkDeleteMessages = useBulkDeleteMessages();
  const mutationError = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "خطأ");

  const updateStatus = {
    isPending: updateMessageStatus.isPending,
    variables: updateMessageStatus.variables,
    mutate: (vars: { id: string; status: Status }) => {
      updateMessageStatus.mutate(vars, {
        onSuccess: () => toast.success(`تم التحديث: ${STATUS_META[vars.status].label}`),
        onError: mutationError,
      });
    },
  };

  const remove = {
    isPending: deleteMessage.isPending,
    mutate: (id: string) => {
      deleteMessage.mutate(id, {
        onSuccess: () => {
          toast.success("تم حذف الرسالة");
          setSelectedId(null);
          setPendingDelete(null);
        },
        onError: mutationError,
      });
    },
  };

  const bulkUpdate = {
    isPending: bulkUpdateMessageStatus.isPending,
    mutate: (vars: { ids: string[]; status: Status }) => {
      bulkUpdateMessageStatus.mutate(vars, {
        onSuccess: () => {
          toast.success(`تم تحديث ${vars.ids.length} رسالة → ${STATUS_META[vars.status].label}`);
          clearSelection();
        },
        onError: mutationError,
      });
    },
  };

  const bulkDelete = {
    isPending: bulkDeleteMessages.isPending,
    mutate: (ids: string[]) => {
      bulkDeleteMessages.mutate(ids, {
        onSuccess: () => {
          toast.success(`تم حذف ${ids.length} رسالة`);
          if (selectedId && ids.includes(selectedId)) setSelectedId(null);
          clearSelection();
          setBulkDeleteOpen(false);
        },
        onError: mutationError,
      });
    },
  };

  // "Select all" means all rows on the current page — the only rows the
  // client actually holds now that the inbox is served a page at a time.
  const allPageSelected = rows.length > 0 && rows.every((m) => selectedIds.has(m.id));
  const somePageSelected = rows.some((m) => selectedIds.has(m.id));
  const toggleAllOnPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) rows.forEach((m) => next.delete(m.id));
      else rows.forEach((m) => next.add(m.id));
      return next;
    });
  };
  const bulkBusy = bulkUpdate.isPending || bulkDelete.isPending;

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white border border-border rounded-2xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label="الكل"
            count={counts.all}
          />
          {STATUSES.map((s) => {
            const meta = STATUS_META[s];
            return (
              <FilterChip
                key={s}
                active={filter === s}
                onClick={() => setFilter(s)}
                label={meta.label}
                count={counts[s] ?? 0}
                dot={meta.dot}
              />
            );
          })}
        </div>
        <div className="relative md:w-72">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الموضوع…"
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:bg-white"
          />
        </div>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-4">
        {/* List */}
        <div className="min-w-0 space-y-3">
          <div className="bg-white border border-border rounded-2xl overflow-hidden flex flex-col max-h-[72vh]">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleAllOnPage}
                disabled={rows.length === 0}
                className="flex items-center gap-2 text-deep text-sm font-bold disabled:opacity-50"
                title={allPageSelected ? "إلغاء تحديد هذه الصفحة" : "تحديد هذه الصفحة"}
              >
                {allPageSelected ? (
                  <CheckSquare className="size-4 text-teal" />
                ) : (
                  <Square
                    className={`size-4 ${somePageSelected ? "text-teal" : "text-muted-foreground"}`}
                  />
                )}
                {filter === "all" ? "كل الرسائل" : STATUS_META[filter as Status].label}
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {selectedIds.size > 0 ? `${selectedIds.size} محددة` : `${total} رسالة`}
              </span>
            </div>
            {selectedIds.size > 0 && (
              <div className="px-3 py-2 border-b border-border bg-mint/10 flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-deep me-1">إجراء جماعي:</span>
                {STATUSES.map((s) => {
                  const meta = STATUS_META[s];
                  return (
                    <button
                      key={s}
                      disabled={bulkBusy}
                      onClick={() => bulkUpdate.mutate({ ids: Array.from(selectedIds), status: s })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.pill} hover:opacity-80 disabled:opacity-50 transition`}
                      title={`نقل إلى: ${meta.label}`}
                    >
                      <meta.icon className="size-3" />
                      {meta.label}
                    </button>
                  );
                })}
                <button
                  disabled={bulkBusy}
                  onClick={() => setBulkDeleteOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white disabled:opacity-50 transition"
                >
                  <Trash2 className="size-3" />
                  حذف
                </button>
                <button
                  onClick={clearSelection}
                  className="ms-auto text-[11px] text-muted-foreground hover:text-deep"
                >
                  إلغاء التحديد
                </button>
              </div>
            )}
            <div className="overflow-y-auto flex-1">
              {list.isLoading ? (
                <div className="p-12 grid place-items-center">
                  <Loader2 className="size-5 animate-spin text-teal" />
                </div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  <Inbox className="size-10 mx-auto mb-3 opacity-30" />
                  {search ? "لا توجد نتائج مطابقة للبحث." : "لا توجد رسائل في هذه الحالة."}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {rows.map((m) => {
                    const meta = STATUS_META[(m.status as Status) ?? "new"] ?? STATUS_META.new;
                    const active = selectedId === m.id;
                    const checked = selectedIds.has(m.id);
                    return (
                      <li key={m.id} className="relative">
                        <div
                          className={`flex items-stretch transition-colors ${
                            active ? "bg-mint/10" : checked ? "bg-teal/5" : "hover:bg-muted/40"
                          }`}
                        >
                          {active && (
                            <span className="absolute inset-y-2 start-0 w-1 rounded-full bg-teal" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOne(m.id);
                            }}
                            className="ps-4 pe-1 flex items-center justify-center"
                            title={checked ? "إلغاء التحديد" : "تحديد"}
                          >
                            {checked ? (
                              <CheckSquare className="size-4 text-teal" />
                            ) : (
                              <Square className="size-4 text-muted-foreground/60" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedId(m.id)}
                            className="flex-1 text-start p-4 ps-2 block min-w-0"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-deep text-sm truncate flex items-center gap-2">
                                <span className={`size-1.5 rounded-full ${meta.dot}`} />
                                {m.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${meta.pill}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {m.subject || m.project_type || m.email}
                            </div>
                            <div
                              className="text-[11px] text-muted-foreground/80 mt-1 tabular-nums"
                              dir="ltr"
                            >
                              {new Date(m.created_at).toLocaleString("ar-EG-u-nu-latn", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          {total > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>

        {/* Detail */}
        <div className="bg-white border border-border rounded-2xl p-5 md:p-6 min-h-[400px]">
          {!selected ? (
            <div className="h-full grid place-items-center text-center text-muted-foreground text-sm">
              <div>
                <Inbox className="size-10 mx-auto mb-3 opacity-30" />
                اختر رسالة من القائمة لعرض تفاصيلها.
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-teal">
                    رسالة #{selected.id.slice(0, 8)}
                  </div>
                  <h2 className="text-2xl font-extrabold text-deep mt-1 truncate">
                    {selected.name}
                  </h2>
                  <div className="text-xs text-muted-foreground mt-1 tabular-nums" dir="ltr">
                    {new Date(selected.created_at).toLocaleString("ar-EG-u-nu-latn", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent("رد: " + (selected.subject || ""))}`}
                    className="inline-flex items-center gap-1.5 bg-deep text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-ocean transition-colors"
                  >
                    <Reply className="size-3.5" />
                    رد عبر البريد
                  </a>
                  <button
                    onClick={() => setPendingDelete(selected.id)}
                    className="size-9 rounded-lg border border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive grid place-items-center transition-colors"
                    title="حذف الرسالة"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <Info icon={Mail} label="البريد" value={selected.email} ltr />
                {selected.phone && <Info icon={Phone} label="الجوال" value={selected.phone} ltr />}
                {selected.city && <Info icon={MapPin} label="المدينة" value={selected.city} />}
              </div>

              {(selected.project_type || selected.budget || selected.timeline) && (
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  {selected.project_type && (
                    <Pill label="نوع المشروع" value={selected.project_type} />
                  )}
                  {selected.budget && <Pill label="الميزانية" value={selected.budget} />}
                  {selected.timeline && <Pill label="الجدول الزمني" value={selected.timeline} />}
                </div>
              )}

              {selected.subject && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    الموضوع
                  </div>
                  <div className="font-bold text-deep mt-1">{selected.subject}</div>
                </div>
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  نص الرسالة
                </div>
                <p className="mt-1 text-deep/90 leading-loose whitespace-pre-wrap bg-muted/40 border border-border rounded-xl p-4 text-sm">
                  {selected.message}
                </p>
              </div>

              {/* Status switcher */}
              <div className="pt-4 border-t border-border">
                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  تغيير الحالة
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STATUSES.map((s) => {
                    const meta = STATUS_META[s];
                    const isCurrent = selected.status === s;
                    const isPending =
                      updateStatus.isPending &&
                      updateStatus.variables?.id === selected.id &&
                      updateStatus.variables?.status === s;
                    return (
                      <button
                        key={s}
                        disabled={isCurrent || updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: selected.id, status: s })}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:cursor-not-allowed ${
                          isCurrent
                            ? `${meta.pill} ring-2 ring-offset-1 ring-current/30`
                            : "bg-white border-border text-muted-foreground hover:border-teal/40 hover:text-deep"
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <meta.icon className="size-3.5" />
                        )}
                        {meta.label}
                        {isCurrent && <ChevronLeft className="size-3 rotate-180 opacity-60" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرسالة نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف الرسالة من قاعدة البيانات بشكل دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => pendingDelete && remove.mutate(pendingDelete)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : "نعم، احذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(o) => !o && setBulkDeleteOpen(false)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {selectedIds.size} رسالة نهائياً؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيتم حذف جميع الرسائل المحددة من قاعدة البيانات بشكل
              دائم.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkDelete.mutate(Array.from(selectedIds))}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {bulkDelete.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "نعم، احذف الكل"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ${
        active
          ? "bg-deep text-white border-deep"
          : "bg-white border-border text-muted-foreground hover:text-deep hover:border-teal/40"
      }`}
    >
      {dot && <span className={`size-1.5 rounded-full ${dot}`} />}
      {label}
      <span
        className={`tabular-nums text-[10px] px-1.5 rounded-full ${
          active ? "bg-white/20" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="size-8 rounded-lg bg-mint/15 text-teal grid place-items-center shrink-0">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="text-deep font-semibold truncate" dir={ltr ? "ltr" : undefined}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 border border-border">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-deep font-bold text-xs mt-0.5">{value}</div>
    </div>
  );
}
