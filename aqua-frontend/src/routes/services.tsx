import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Droplets,
  Filter,
  Lightbulb,
  ShieldCheck,
  Wrench,
  Sparkles,
  Sun,
  Gem,
  Waves,
  ArrowUpRight,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { PageHero } from "@/components/Section";
import { useServices, useCategories, pick } from "@/lib/content";
import { CategoryFilterCascader } from "@/components/CategoryFilterCascader";
import type { DbProductCategory } from "@/lib/admin-api";
import { useReveal } from "@/lib/motion";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Aqua Pool Group | خدماتنا" },
      {
        name: "description",
        content: "Pool design, finishing, filtration, lighting, waterproofing, and maintenance.",
      },
      { property: "og:title", content: "Aqua Pool Group Services" },
      { property: "og:description", content: "Complete pool services from design to maintenance." },
    ],
  }),
  component: ServicesPage,
});

const ICON_MAP: Record<string, LucideIcon> = {
  droplets: Droplets,
  filter: Filter,
  lightbulb: Lightbulb,
  shield: ShieldCheck,
  wrench: Wrench,
  sparkles: Sparkles,
  sun: Sun,
  gem: Gem,
  waves: Waves,
  leaf: Sparkles,
};

function ServicesPage() {
  const { t, lang } = useLang();
  const { data: services = [] } = useServices();
  const { data: categories = [] } = useCategories("service");
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const gridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const ctaRef = useReveal<HTMLDivElement>("scroll", { scale: 0.97 });

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

  const filtered = services.filter((s) => {
    if (filter) {
      const allowed = descendantsOf.get(filter);
      if (!s.category_id || !allowed?.has(s.category_id)) return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title_ar?.toLowerCase().includes(q) ||
      s.title_en?.toLowerCase().includes(q) ||
      s.description_ar?.toLowerCase().includes(q) ||
      s.description_en?.toLowerCase().includes(q)
    );
  });
  const hasFilters = !!filter || !!search;

  const items = filtered.map((s) => ({
    icon: ICON_MAP[s.icon] ?? Droplets,
    t: pick(s.title_ar, s.title_en, lang),
    d: pick(s.description_ar, s.description_en, lang),
    id: s.id,
  }));

  return (
    <>
      <PageHero eyebrow="What we do" title={t.services.title} subtitle={t.services.sub} />
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div className="mb-8 p-2 bg-white border border-border rounded-xl flex flex-wrap items-center gap-2 w-full max-w-full overflow-hidden">
            <div className="relative basis-full sm:basis-0 sm:flex-1 sm:min-w-[200px] min-w-0">
              <Search className="size-4 text-muted-foreground absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === "ar" ? "ابحث في الخدمات…" : "Search services…"}
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

          {items.length === 0 ? (
            <div className="bg-sand/40 border border-border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {lang === "ar" ? "لا توجد خدمات مطابقة." : "No matching services."}
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-12 gap-3 md:gap-4">
              {items.map((item, i) => {
                const Icon = item.icon;
                const spans = [
                  "col-span-12 md:col-span-6 lg:col-span-5",
                  "col-span-12 md:col-span-6 lg:col-span-4",
                  "col-span-12 md:col-span-6 lg:col-span-3",
                  "col-span-12 md:col-span-6 lg:col-span-3",
                  "col-span-12 md:col-span-6 lg:col-span-4",
                  "col-span-12 md:col-span-6 lg:col-span-5",
                ];
                const span = spans[i % spans.length];
                const isDark = i % 6 === 0 || i % 6 === 5;
                return (
                  <div
                    key={item.id}
                    className={`${span} bento-card p-8 lg:p-10 min-h-[260px] flex flex-col justify-between transition-transform duration-300 ease-out hover:-translate-y-1 ${
                      isDark ? "bg-deep text-white" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`size-12 sm:size-14 rounded-2xl grid place-items-center ${isDark ? "bg-white/10" : "bg-mint/20"}`}
                      >
                        <Icon
                          className={`size-6 sm:size-7 ${isDark ? "text-mint" : "text-teal"}`}
                        />
                      </div>
                      <span
                        className={`text-xs font-bold tabular-nums tracking-widest ${isDark ? "text-mint" : "text-teal"}`}
                      >
                        / {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">{item.t}</h3>
                      <div
                        className={`rt-content text-sm leading-relaxed ${isDark ? "text-white/65" : "text-foreground/65"}`}
                        dangerouslySetInnerHTML={{ __html: item.d }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            ref={ctaRef}
            className="mt-10 sm:mt-14 lg:mt-16 rounded-3xl border border-border bg-white p-8 sm:p-10 md:p-12 flex flex-wrap items-center justify-between gap-6"
          >
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-deep mb-2">
                {t.services.ctaTitle}
              </h3>
              <p className="text-foreground/65 max-w-lg">{t.services.ctaDesc}</p>
            </div>
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 bg-deep text-white ps-6 pe-2 py-2 rounded-full font-bold hover:bg-ocean transition-all"
            >
              {t.services.ctaBtn}
              <span className="size-9 sm:size-10 rounded-full bg-mint text-deep grid place-items-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
