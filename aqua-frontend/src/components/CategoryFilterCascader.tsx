import { useMemo } from "react";
import type { DbProductCategory } from "@/lib/admin-api";

type Props = {
  categories: DbProductCategory[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  lang?: "ar" | "en";
  allLabel?: string;
  levelLabels?: { root: string; sub: (level: number) => string };
  compact?: boolean;
};

/**
 * Cascading category FILTER selector. Each level has an "all" option.
 * Selecting a category reveals the next sub-level if it has children.
 * Returns the deepest selected id, or null for "all".
 */
export function CategoryFilterCascader({
  categories,
  value,
  onChange,
  lang = "ar",
  allLabel,
  levelLabels,
  compact = false,
}: Props) {
  const byId = useMemo(() => {
    const m = new Map<string, DbProductCategory>();
    categories.forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  const childrenOf = useMemo(() => {
    const m = new Map<string | null, DbProductCategory[]>();
    categories.forEach((c) => {
      const k = c.parent_id;
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(c);
    });
    for (const arr of m.values()) arr.sort((a, b) => a.sort_order - b.sort_order);
    return m;
  }, [categories]);

  // Ancestor path of current value
  const path: string[] = [];
  let cur = value;
  while (cur) {
    path.unshift(cur);
    cur = byId.get(cur)?.parent_id ?? null;
  }

  const levels: { options: DbProductCategory[]; selected: string }[] = [];
  let parent: string | null = null;
  let depth = 0;
  while (true) {
    const options = childrenOf.get(parent) ?? [];
    if (options.length === 0) break;
    const selected = path[depth] ?? "";
    levels.push({ options, selected });
    if (!selected) break;
    parent = selected;
    depth++;
  }

  function handleChange(levelIdx: number, newId: string) {
    if (!newId) {
      const parentId = levelIdx === 0 ? null : levels[levelIdx - 1].selected;
      onChange(parentId || null);
      return;
    }
    onChange(newId);
  }

  if ((childrenOf.get(null) ?? []).length === 0) return null;

  const _all = allLabel ?? (lang === "ar" ? "الكل" : "All");
  const lbl = levelLabels ?? {
    root: lang === "ar" ? "التصنيف الرئيسي" : "Main category",
    sub: (n) => (lang === "ar" ? `تصنيف فرعي · مستوى ${n}` : `Sub-category · level ${n}`),
  };

  if (compact) {
    return (
      <div className="basis-full sm:basis-auto sm:contents flex flex-wrap gap-2 min-w-0">
        {levels.map((lvl, idx) => (
          <select
            key={idx}
            value={lvl.selected}
            onChange={(e) => handleChange(idx, e.target.value)}
            className="h-9 flex-1 min-w-0 sm:flex-none sm:min-w-[140px] sm:max-w-[200px] px-2.5 rounded-lg border border-border bg-white text-xs focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none truncate"
            aria-label={idx === 0 ? lbl.root : lbl.sub(idx + 1)}
          >
            <option value="">{idx === 0 ? _all : `— ${lbl.sub(idx + 1)} —`}</option>
            {lvl.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {lang === "ar" ? opt.name_ar : opt.name_en}
              </option>
            ))}
          </select>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {levels.map((lvl, idx) => (
        <div key={idx} className="min-w-[180px]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {idx === 0 ? lbl.root : lbl.sub(idx + 1)}
          </div>
          <select
            value={lvl.selected}
            onChange={(e) => handleChange(idx, e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none"
          >
            <option value="">{_all}</option>
            {lvl.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {lang === "ar" ? opt.name_ar : opt.name_en}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
