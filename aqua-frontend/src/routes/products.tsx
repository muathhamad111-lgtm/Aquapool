import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/Section";
import { useProducts, useProductCategories, pick } from "@/lib/content";
import { CategoryFilterCascader } from "@/components/CategoryFilterCascader";
import type { DbProductCategory } from "@/lib/admin-api";
import { useReveal } from "@/lib/motion";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — Aqua Pool Group | المنتجات" },
      {
        name: "description",
        content: "Premium pool products: mosaics, lighting, filtration, and cleaning.",
      },
      { property: "og:title", content: "Aqua Pool Group — Product Catalog" },
      {
        property: "og:description",
        content: "Browse our premium imported pool products and accessories.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { t, lang } = useLang();
  const { data: products = [] } = useProducts();
  const { data: categories = [] } = useProductCategories();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const gridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.06 });

  // Build descendant lookup for hierarchical filtering
  const descendantsOf = useMemo(() => {
    const byParent = new Map<string | null, DbProductCategory[]>();
    categories.forEach((c) => {
      if (!byParent.has(c.parent_id)) byParent.set(c.parent_id, []);
      byParent.get(c.parent_id)!.push(c);
    });
    const cache = new Map<string, Set<string>>();
    function descSet(id: string): Set<string> {
      if (cache.has(id)) return cache.get(id)!;
      const s = new Set<string>([id]);
      for (const c of byParent.get(id) ?? []) {
        descSet(c.id).forEach((x) => s.add(x));
      }
      cache.set(id, s);
      return s;
    }
    categories.forEach((c) => descSet(c.id));
    return cache;
  }, [categories]);

  const catName = (c: DbProductCategory) => (lang === "ar" ? c.name_ar : c.name_en);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const labelFor = (id: string | null) => (id ? catById.get(id) : null);

  const filtered = products.filter((p) => {
    if (filter) {
      const allowed = descendantsOf.get(filter);
      if (!p.category_id || !allowed?.has(p.category_id)) return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title_ar?.toLowerCase().includes(q) ||
      p.title_en?.toLowerCase().includes(q) ||
      p.caption_ar?.toLowerCase().includes(q) ||
      p.caption_en?.toLowerCase().includes(q)
    );
  });
  const hasFilters = !!filter || !!search;

  return (
    <>
      <PageHero eyebrow="Catalog" title={t.products.title} subtitle={t.products.sub} />
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div className="mb-8 p-2 bg-white border border-border rounded-xl flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
            <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
              <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  lang === "ar" ? "ابحث بالاسم أو الوصف…" : "Search by name or description…"
                }
                className="w-full h-9 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 rounded-lg border border-border bg-white text-xs focus:border-deep focus:ring-2 focus:ring-deep/20 outline-none"
              />
            </div>
            {categories.length > 0 && (
              <CategoryFilterCascader
                categories={categories}
                value={filter}
                onChange={setFilter}
                lang={lang}
                allLabel={t.products.categories.all}
                compact
              />
            )}
            <span className="text-[11px] text-muted-foreground px-2 whitespace-nowrap ms-auto sm:ms-0">
              {filtered.length} {lang === "ar" ? "نتيجة" : "results"}
            </span>
            {hasFilters && (
              <button
                onClick={() => {
                  setFilter(null);
                  setSearch("");
                }}
                className="h-9 inline-flex items-center gap-1 px-2.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted whitespace-nowrap"
              >
                <X className="size-3.5" /> {lang === "ar" ? "مسح" : "Clear"}
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-sand/40 border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {lang === "ar"
                ? "لا توجد منتجات في هذا التصنيف."
                : "No products in this category yet."}
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {filtered.map((p) => {
                const leafCat = labelFor(p.category_id);
                return (
                  <div
                    key={p.id}
                    className="group bento-card flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-sand relative">
                      <img
                        src={p.image_url}
                        alt={pick(p.title_ar, p.title_en, lang)}
                        loading="lazy"
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      {leafCat && (
                        <span className="absolute top-3 ltr:left-3 rtl:right-3 text-[10px] uppercase tracking-widest bg-white/95 text-deep font-bold px-2.5 py-1 rounded-full">
                          {catName(leafCat)}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h4 className="font-bold mb-1 leading-snug text-sm sm:text-base">
                        {pick(p.title_ar, p.title_en, lang)}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-4">
                        {pick(p.caption_ar, p.caption_en, lang)}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-xs font-bold text-deep">
                          {pick(p.price_label_ar, p.price_label_en, lang)}
                        </span>
                        <Link
                          to="/contact"
                          className="size-8 rounded-full bg-mint/30 text-deep grid place-items-center hover:bg-deep hover:text-mint transition-colors"
                          aria-label={t.products.inquire}
                        >
                          <ArrowUpRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
