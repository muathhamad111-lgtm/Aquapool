import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/Section";
import { useProjects, useCategories, pick } from "@/lib/content";
import { CategoryFilterCascader } from "@/components/CategoryFilterCascader";
import type { DbProductCategory } from "@/lib/admin-api";
import { useReveal } from "@/lib/motion";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Aqua Pool Group | مشاريعنا" },
      {
        name: "description",
        content: "Featured pool projects: villas, resorts, hotels, and commercial facilities.",
      },
      { property: "og:title", content: "Aqua Pool Group — Project Portfolio" },
      { property: "og:description", content: "Browse our finest delivered projects." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { t, lang } = useLang();
  const { data: projects = [] } = useProjects();
  const { data: categories = [] } = useCategories("project");
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const gridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });

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
      for (const c of byParent.get(id) ?? []) descSet(c.id).forEach((x) => s.add(x));
      cache.set(id, s);
      return s;
    }
    categories.forEach((c) => descSet(c.id));
    return cache;
  }, [categories]);

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const catName = (c: DbProductCategory) => (lang === "ar" ? c.name_ar : c.name_en);

  const filtered = projects.filter((p) => {
    if (filter) {
      const allowed = descendantsOf.get(filter);
      if (!p.category_id || !allowed?.has(p.category_id)) return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.title_ar?.toLowerCase().includes(q) ||
      p.title_en?.toLowerCase().includes(q) ||
      p.location_ar?.toLowerCase().includes(q) ||
      p.location_en?.toLowerCase().includes(q)
    );
  });
  const hasFilters = !!filter || !!search;

  const spanPattern = [
    "col-span-12 md:col-span-7 md:row-span-2",
    "col-span-12 md:col-span-5",
    "col-span-12 md:col-span-5",
    "col-span-12 md:col-span-4",
    "col-span-12 md:col-span-4",
    "col-span-12 md:col-span-4",
  ];

  return (
    <>
      <PageHero
        eyebrow="Selected works"
        breadcrumb={t.nav.projects}
        title={t.projects.title}
        subtitle={t.projects.sub}
      />

      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div className="mb-8 p-2 bg-white border border-border rounded-xl flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
            <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
              <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  lang === "ar" ? "ابحث بالاسم أو الموقع…" : "Search by name or location…"
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
                allLabel={lang === "ar" ? "كل التصنيفات" : "All categories"}
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
              {lang === "ar" ? "لا توجد مشاريع مطابقة." : "No matching projects."}
            </div>
          ) : (
            <div
              ref={gridRef}
              className="grid grid-cols-12 gap-3 md:gap-4 auto-rows-[280px] md:auto-rows-[300px]"
            >
              {filtered.map((p, i) => {
                const leafCat = p.category_id ? catById.get(p.category_id) : null;
                const isFeature = i === 0;
                return (
                  <div
                    key={p.id}
                    className={`${spanPattern[i % spanPattern.length]} group bento-card relative`}
                  >
                    <img
                      src={p.image_url}
                      alt={pick(p.title_ar, p.title_en, lang)}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/20 to-transparent" />
                    <div className="absolute inset-0 p-6 lg:p-8 flex flex-col justify-end text-white">
                      {leafCat && (
                        <span className="text-[10px] uppercase tracking-[0.3em] text-mint font-bold mb-2">
                          {catName(leafCat)}
                        </span>
                      )}
                      <h3
                        className={`font-extrabold leading-tight mb-2 ${
                          isFeature
                            ? "text-2xl sm:text-3xl lg:text-4xl"
                            : "text-lg sm:text-xl lg:text-2xl"
                        }`}
                      >
                        {pick(p.title_ar, p.title_en, lang)}
                      </h3>
                      <p className="text-white/70 text-sm flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {pick(p.location_ar, p.location_en, lang)}
                      </p>
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
