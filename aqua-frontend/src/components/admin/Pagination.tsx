import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48, 96];

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);

  const pages = buildPageList(current, totalPages);

  return (
    <div className="bg-white border border-border rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span>عرض</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1.5 rounded-lg border border-border bg-white text-deep font-bold"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>لكل صفحة · {from}–{to} من {total}</span>
      </div>

      <div className="flex items-center gap-1">
        <NavBtn disabled={current <= 1} onClick={() => onPageChange(1)} label="الأولى"><ChevronsRight className="size-4 rtl:hidden" /><ChevronsLeft className="size-4 ltr:hidden" /></NavBtn>
        <NavBtn disabled={current <= 1} onClick={() => onPageChange(current - 1)} label="السابق"><ChevronRight className="size-4 rtl:hidden" /><ChevronLeft className="size-4 ltr:hidden" /></NavBtn>
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`min-w-9 h-9 px-2 rounded-lg text-sm font-bold transition ${
                p === current ? "bg-deep text-white shadow" : "border border-border text-deep hover:bg-muted"
              }`}
            >
              {p}
            </button>
          )
        )}
        <NavBtn disabled={current >= totalPages} onClick={() => onPageChange(current + 1)} label="التالي"><ChevronLeft className="size-4 rtl:hidden" /><ChevronRight className="size-4 ltr:hidden" /></NavBtn>
        <NavBtn disabled={current >= totalPages} onClick={() => onPageChange(totalPages)} label="الأخيرة"><ChevronsLeft className="size-4 rtl:hidden" /><ChevronsRight className="size-4 ltr:hidden" /></NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ children, onClick, disabled, label }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="size-9 grid place-items-center rounded-lg border border-border text-deep hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("…");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}
