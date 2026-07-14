import { useMemo } from "react";
import type { DbProductCategory } from "@/lib/admin-api";

type Props = {
  categories: DbProductCategory[];
  value: string | null;
  onChange: (categoryId: string | null) => void;
  required?: boolean;
};

/**
 * Cascading category selector.
 * - Renders one <select> per level.
 * - Hides the next level if the selected category has no children.
 * - Returns the deepest selected id (leaf or branch).
 * - When `required`, the user must pick a value at every level that has options.
 */
export function CategoryCascader({ categories, value, onChange, required }: Props) {
  // Build path of ancestors for the current value
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

  // Path from root to current value (inclusive)
  const path: string[] = [];
  let cursor = value;
  while (cursor) {
    path.unshift(cursor);
    cursor = byId.get(cursor)?.parent_id ?? null;
  }

  // Build levels: each level is { options, selected }
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
      // Cleared — use the parent (one level up) as the new value, or null if root
      const parentId = levelIdx === 0 ? null : levels[levelIdx - 1].selected;
      onChange(parentId);
      return;
    }
    onChange(newId);
  }

  const rootOptions = childrenOf.get(null) ?? [];
  if (rootOptions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground bg-muted/50 border border-dashed border-border rounded-xl px-3 py-3">
        لا توجد تصنيفات بعد — يمكنك إضافتها من صفحة <span className="font-bold text-deep">تصنيفات المنتجات</span> ثم العودة.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {levels.map((lvl, idx) => (
        <div key={idx}>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {idx === 0 ? "التصنيف الرئيسي" : `تصنيف فرعي · مستوى ${idx + 1}`}
          </div>
          <select
            value={lvl.selected}
            required={required}
            onChange={(e) => handleChange(idx, e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-white text-sm focus:border-teal focus:ring-2 focus:ring-teal/20 outline-none"
          >
            <option value="">— اختر —</option>
            {lvl.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name_ar}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

/** Resolve a category id into a "Root › Sub › Leaf" path string. */
export function categoryPath(
  categories: DbProductCategory[],
  id: string | null,
  lang: "ar" | "en" = "ar",
): string {
  if (!id) return "";
  const byId = new Map(categories.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur: string | null = id;
  while (cur) {
    const node = byId.get(cur);
    if (!node) break;
    parts.unshift(lang === "ar" ? node.name_ar : node.name_en);
    cur = node.parent_id;
  }
  return parts.join(" › ");
}
