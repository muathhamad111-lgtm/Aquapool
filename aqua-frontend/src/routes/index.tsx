import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Droplets,
  Filter,
  Lightbulb,
  ShieldCheck,
  Wrench,
  Sparkles,
  Sun,
  Gem,
  Waves,
  Award,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { SectionHeader } from "@/components/Section";
import { useServices, useProjects, useProducts, pick } from "@/lib/content";
import { useSiteSetting } from "@/lib/settings-api";
import { useReveal, useCountUp } from "@/lib/motion";
import heroPool from "@/assets/hero-pool.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aqua Pool Group | تشطيب المسابح الفاخرة وإكسسواراتها" },
      {
        name: "description",
        content:
          "نحول خيالك إلى واحة مائية فاخرة — تصميم وتشطيب وصيانة المسابح بأحدث التقنيات وأجود المواد.",
      },
      { property: "og:title", content: "Aqua Pool Group — Luxury Pool Finishing" },
      {
        property: "og:description",
        content:
          "Pool design, finishing, accessories and maintenance for villas, hotels, and resorts.",
      },
    ],
  }),
  component: Home,
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

type HeroSetting = {
  tag_ar?: string;
  tag_en?: string;
  title_ar?: string;
  title_en?: string;
  subtitle_ar?: string;
  subtitle_en?: string;
  cta_label_ar?: string;
  cta_label_en?: string;
  image_url?: string;
};

function Home() {
  const { t, dir, lang } = useLang();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const { data: dbServices = [] } = useServices();
  const { data: dbProjects = [] } = useProjects();
  const { data: dbProducts = [] } = useProducts();
  const hero = useSiteSetting<HeroSetting>("hero");

  const heroTag = pick(hero?.tag_ar, hero?.tag_en, lang) || t.home.tag;
  const heroImg = hero?.image_url || heroPool;
  const heroTitle = pick(hero?.title_ar, hero?.title_en, lang);
  const heroSubtitle = pick(hero?.subtitle_ar, hero?.subtitle_en, lang) || t.home.desc;
  const heroCta = pick(hero?.cta_label_ar, hero?.cta_label_en, lang) || t.home.cta1;

  const services = dbServices.slice(0, 6).map((s) => ({
    icon: ICON_MAP[s.icon] ?? Droplets,
    t: pick(s.title_ar, s.title_en, lang),
    d: pick(s.description_ar, s.description_en, lang),
  }));

  const projects = dbProjects.slice(0, 4).map((p) => ({
    img: p.image_url,
    t: pick(p.title_ar, p.title_en, lang),
    c: pick(p.location_ar, p.location_en, lang),
    catLabel: t.projects.filter[p.category as keyof typeof t.projects.filter] ?? p.category,
  }));

  const products = dbProducts.slice(0, 8).map((p) => ({
    img: p.image_url,
    t: pick(p.title_ar, p.title_en, lang),
    c: pick(p.caption_ar, p.caption_en, lang),
    catLabel: t.products.categories[p.category as keyof typeof t.products.categories] ?? p.category,
  }));

  // Live counts from DB, with "+" prefix for marketing flair
  const fmt = (n: number) => (n > 0 ? `+${n}` : "0");

  const stats = [
    { v: fmt(dbProjects.length), l: lang === "ar" ? "مشروع منجز" : "Projects Completed" },
    { v: fmt(dbProducts.length), l: lang === "ar" ? "منتج متوفر" : "Products Offered" },
    { v: fmt(dbServices.length), l: lang === "ar" ? "خدمة مقدمة" : "Services Provided" },
  ];
  // Fixed-length (always 3) — safe as unconditional hook calls, not inside the render .map below.
  const statCountRefs = [
    useCountUp(dbProjects.length, fmt),
    useCountUp(dbProducts.length, fmt),
    useCountUp(dbServices.length, fmt),
  ];

  const heroRef = useReveal<HTMLDivElement>("mount", { stagger: 0.12, y: 20 });
  const statsStripRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.1 });
  const servicesHeaderRef = useReveal<HTMLDivElement>("scroll");
  const servicesGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const projectsHeaderRowRef = useReveal<HTMLDivElement>("scroll");
  const projectsGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const productsHeaderRef = useReveal<HTMLDivElement>("scroll");
  const productsGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.06 });
  const ctaRef = useReveal<HTMLDivElement>("scroll", { scale: 0.97 });

  return (
    <>
      {/* ============ BENTO HERO ============ */}
      <section className="py-4 sm:py-6 md:py-7 lg:py-8">
        <div className="container-x">
          <div ref={heroRef} className="grid grid-cols-12 gap-3 md:gap-4">
            {/* Headline panel */}
            <div className="col-span-12 lg:col-span-8 lg:row-span-2 bento-card bg-deep text-white relative p-6 sm:p-8 md:p-12 lg:p-14 min-h-[360px] sm:min-h-[420px] lg:min-h-[560px] flex flex-col justify-between overflow-hidden">
              <div
                aria-hidden
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    "radial-gradient(60% 80% at 80% 20%, rgba(92,189,185,0.22), transparent 60%), radial-gradient(50% 60% at 10% 100%, rgba(45,138,158,0.3), transparent 60%)",
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
                <span className="size-1.5 rounded-full bg-mint animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-mint">
                  {heroTag}
                </span>
              </div>
              <div className="relative space-y-5 sm:space-y-7 mt-8 sm:mt-10">
                <h1 className="text-[clamp(1.875rem,7vw,4.5rem)] xl:text-7xl font-extrabold leading-[1.1] lg:leading-[1.05]">
                  {heroTitle ? (
                    <span className="inline-block bg-gradient-to-r from-white via-mint to-teal bg-clip-text text-transparent">
                      {heroTitle}
                    </span>
                  ) : (
                    <>
                      {t.home.titleA}{" "}
                      <span className="inline-block bg-gradient-to-r from-mint to-teal bg-clip-text text-transparent">
                        {t.home.titleB}
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-xl leading-relaxed">
                  {heroSubtitle}
                </p>
                <div className="flex flex-wrap gap-3 pt-1 sm:pt-2">
                  <Link
                    to="/projects"
                    className="group bg-mint text-deep ps-5 sm:ps-6 pe-2 py-2 rounded-full font-bold inline-flex items-center gap-2 sm:gap-3 hover:bg-white transition-all text-sm sm:text-base"
                  >
                    {heroCta}
                    <span className="size-8 sm:size-9 rounded-full bg-deep text-mint grid place-items-center group-hover:rotate-45 transition-transform shrink-0">
                      <ArrowUpRight className="size-3.5 sm:size-4" />
                    </span>
                  </Link>
                  <Link
                    to="/contact"
                    className="border border-white/20 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold hover:bg-white/10 transition-all text-sm sm:text-base"
                  >
                    {t.nav.quote}
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero image */}
            <div className="col-span-12 sm:col-span-7 lg:col-span-4 bento-card relative min-h-[220px] sm:min-h-[260px] lg:min-h-[272px] group">
              <img
                src={heroImg}
                alt="Luxury pool"
                className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/10 to-transparent" />
              <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-end text-white">
                <p className="text-[10px] uppercase tracking-[0.25em] text-mint font-bold mb-2">
                  Featured
                </p>
                <h3 className="font-bold text-base sm:text-lg leading-tight">
                  {projects[0]?.t ?? ""}
                </h3>
              </div>
            </div>

            {/* Stat badge */}
            <div className="col-span-6 sm:col-span-5 lg:col-span-2 bento-card bg-mint/15 p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
              <Award className="size-5 sm:size-6 text-teal" />
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-deep">{stats[0].v}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                  {t.home.statBadge}
                </div>
              </div>
            </div>

            {/* Rating badge */}
            <div className="col-span-6 lg:col-span-2 bento-card bg-deep text-white p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-mint text-mint" />
                ))}
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold">4.9</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/60 mt-1">
                  Client rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="py-8 sm:py-10 lg:py-12 border-y border-border bg-white">
        <div
          ref={statsStripRef}
          className="container-x grid grid-cols-1 sm:grid-cols-3 gap-y-6 sm:gap-y-0"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className={`sm:px-6 sm:first:ps-0 sm:last:pe-0 ${i > 0 ? "sm:border-s sm:border-border" : ""}`}
            >
              <div
                ref={statCountRefs[i]}
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-deep"
              >
                {s.v}
              </div>
              <div className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground mt-2">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SERVICES BENTO ============ */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div ref={servicesHeaderRef}>
            <SectionHeader
              eyebrow="01 — Services"
              title={t.home.servicesTitle}
              subtitle={t.home.servicesSub}
            />
          </div>
          <div ref={servicesGridRef} className="grid grid-cols-12 gap-3 md:gap-4">
            {services.map((item, i) => {
              const Icon = item.icon;
              const spans = [
                "col-span-12 md:col-span-6 lg:col-span-5",
                "col-span-12 md:col-span-6 lg:col-span-4",
                "col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3",
                "col-span-12 sm:col-span-6 md:col-span-6 lg:col-span-3",
                "col-span-12 md:col-span-6 lg:col-span-4",
                "col-span-12 md:col-span-6 lg:col-span-5",
              ];
              const isDark = i === 0 || i === 5;
              return (
                <div
                  key={i}
                  className={`${spans[i]} bento-card p-6 sm:p-7 lg:p-8 min-h-[200px] sm:min-h-[220px] flex flex-col justify-between transition-transform duration-300 ease-out hover:-translate-y-1 ${
                    isDark ? "bg-deep text-white" : "bg-white"
                  }`}
                >
                  <div
                    className={`size-11 sm:size-12 rounded-2xl grid place-items-center ${
                      isDark ? "bg-white/10" : "bg-mint/20"
                    }`}
                  >
                    <Icon className={`size-5 sm:size-6 ${isDark ? "text-mint" : "text-teal"}`} />
                  </div>
                  <div className="mt-5 sm:mt-6">
                    <div
                      className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${isDark ? "text-mint" : "text-teal"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">{item.t}</h3>
                    <div
                      className={`rt-content text-sm leading-relaxed ${isDark ? "text-white/65" : "text-foreground/65"}`}
                      dangerouslySetInnerHTML={{ __html: item.d }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 sm:mt-10">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-deep font-bold hover:text-teal transition-colors group"
            >
              {t.home.seeAllServices}
              <Arrow className="size-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PROJECTS BENTO ============ */}
      <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-b from-sand to-background">
        <div className="container-x">
          <div
            ref={projectsHeaderRowRef}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:gap-6 mb-8 sm:mb-12"
          >
            <div className="min-w-0">
              <SectionHeader
                eyebrow="02 — Portfolio"
                title={t.home.projectsTitle}
                subtitle={t.home.projectsSub}
              />
            </div>
            <Link
              to="/projects"
              className="shrink-0 hidden sm:inline-flex items-center gap-2 text-deep font-bold hover:text-teal transition-colors group mb-10 md:mb-12"
            >
              {t.home.seeAllProjects}
              <Arrow className="size-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="bento-card p-10 text-center text-muted-foreground">
              {lang === "ar" ? "لا توجد مشاريع منشورة بعد." : "No published projects yet."}
            </div>
          ) : (
            <div
              ref={projectsGridRef}
              className="grid grid-cols-12 gap-3 md:gap-4 md:grid-rows-2 md:h-[620px]"
            >
              {/* Large feature */}
              <Link
                to="/projects"
                className="col-span-12 md:col-span-7 md:row-span-2 group bento-card relative min-h-[280px] sm:min-h-[320px]"
              >
                <img
                  src={projects[0].img}
                  alt={projects[0].t}
                  className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep/95 via-deep/30 to-transparent" />
                <div className="absolute inset-0 p-6 sm:p-8 lg:p-10 flex flex-col justify-end text-white">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-mint font-bold mb-2 sm:mb-3">
                    {projects[0].catLabel}
                  </span>
                  <h3 className="font-extrabold text-xl sm:text-2xl lg:text-4xl leading-tight mb-2">
                    {projects[0].t}
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm">{projects[0].c}</p>
                </div>
              </Link>

              {/* Side cards */}
              {projects.slice(1, 4).map((p, i) => (
                <Link
                  to="/projects"
                  key={i}
                  className={`group bento-card relative min-h-[170px] md:min-h-0 ${
                    i === 0 ? "col-span-12 sm:col-span-6 md:col-span-5" : "col-span-6 md:col-span-5"
                  }`}
                >
                  <img
                    src={p.img}
                    alt={p.t}
                    className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep/90 via-deep/20 to-transparent" />
                  <div className="absolute inset-0 p-4 sm:p-5 lg:p-6 flex flex-col justify-end text-white">
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-mint font-bold mb-1.5">
                      {p.catLabel}
                    </span>
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg leading-tight">
                      {p.t}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 text-deep font-bold group"
            >
              {t.home.seeAllProjects}
              <Arrow className="size-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTS ============ */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div ref={productsHeaderRef}>
            <SectionHeader
              eyebrow="03 — Catalog"
              title={t.home.productsTitle}
              subtitle={t.home.productsSub}
            />
          </div>
          <div
            ref={productsGridRef}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5"
          >
            {products.map((p, i) => (
              <Link
                to="/products"
                key={i}
                className="group bento-card transition-transform duration-300 ease-out hover:-translate-y-1"
              >
                <div className="aspect-[4/5] overflow-hidden bg-sand">
                  <img
                    src={p.img}
                    alt={p.t}
                    loading="lazy"
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <span className="text-[10px] uppercase tracking-widest text-teal font-bold">
                    {p.catLabel}
                  </span>
                  <h4 className="font-bold mt-1.5 mb-1 leading-snug text-sm sm:text-base">{p.t}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.c}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 sm:mt-10">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-deep font-bold hover:text-teal transition-colors group"
            >
              {t.home.seeAllProducts}
              <Arrow className="size-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div
            ref={ctaRef}
            className="relative rounded-2xl sm:rounded-3xl bg-deep text-white p-8 sm:p-10 md:p-16 lg:p-20 overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(60% 60% at 90% 30%, rgba(92,189,185,0.25), transparent 60%), radial-gradient(40% 50% at 10% 90%, rgba(45,138,158,0.3), transparent 60%)",
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
            <div className="relative grid md:grid-cols-5 gap-6 sm:gap-8 items-center">
              <div className="md:col-span-3">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 sm:mb-5 leading-[1.15] md:leading-[1.1]">
                  {t.home.ctaTitle}
                </h2>
                <p className="text-white/65 max-w-xl leading-relaxed text-sm sm:text-base">
                  {t.home.ctaDesc}
                </p>
              </div>
              <div className="md:col-span-2 md:text-end">
                <Link
                  to="/contact"
                  className="group inline-flex items-center gap-3 bg-mint text-deep ps-6 sm:ps-7 pe-2 py-2 rounded-full font-bold hover:bg-white transition-all text-sm sm:text-base"
                >
                  {t.home.ctaBtn}
                  <span className="size-9 sm:size-10 rounded-full bg-deep text-mint grid place-items-center group-hover:rotate-45 transition-transform shrink-0">
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
