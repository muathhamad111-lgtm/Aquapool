import { createFileRoute, Link } from "@tanstack/react-router";
import {
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
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { useServices, useProjects, useProducts, pick } from "@/lib/content";
import { useSiteSetting } from "@/lib/settings-api";
import { useReveal, useCountUp } from "@/lib/motion";
import { yearsInBusiness } from "@/lib/company";
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

  const projects = dbProjects.slice(0, 3).map((p) => ({
    img: p.image_url,
    t: pick(p.title_ar, p.title_en, lang),
    c: pick(p.location_ar, p.location_en, lang),
    catLabel: t.projects.filter[p.category as keyof typeof t.projects.filter] ?? p.category,
  }));

  const products = dbProducts.slice(0, 4).map((p) => ({
    img: p.image_url,
    t: pick(p.title_ar, p.title_en, lang),
    c: pick(p.caption_ar, p.caption_en, lang),
    catLabel: t.products.categories[p.category as keyof typeof t.products.categories] ?? p.category,
  }));

  // The hero photograph fills the panel behind the copy, so the scrim has to
  // fall on whichever side the text starts from — no logical equivalent of a
  // gradient angle exists in CSS, so it's computed from the direction.
  const heroScrim = `linear-gradient(${dir === "rtl" ? "255deg" : "105deg"}, oklch(0.19 0.06 253 / 0.96) 0%, oklch(0.19 0.06 253 / 0.82) 40%, oklch(0.19 0.06 253 / 0.35) 100%)`;

  const years = yearsInBusiness();
  const plus = (n: number) => `+${n}`;
  const stats = [
    { v: plus(years), l: t.home.statYears },
    { v: "4.9", l: t.home.statRating },
    { v: plus(dbProjects.length), l: t.home.statProjects },
    { v: plus(dbProducts.length), l: t.home.statProducts },
  ];
  // Fixed length (always 4), so these stay unconditional hook calls rather
  // than anything derived from the arrays above.
  const statRefs = [
    useCountUp(years, plus),
    useCountUp(4.9, (n) => n.toFixed(1), 1),
    useCountUp(dbProjects.length, plus),
    useCountUp(dbProducts.length, plus),
  ];

  const heroRef = useReveal<HTMLDivElement>("mount", { stagger: 0.12, y: 20 });
  const aboutCopyRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const aboutStatsRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const servicesHeaderRef = useReveal<HTMLDivElement>("scroll");
  const servicesGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const projectsHeaderRef = useReveal<HTMLDivElement>("scroll");
  const projectsGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const productsHeaderRef = useReveal<HTMLDivElement>("scroll");
  const productsGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.06 });
  const ctaRef = useReveal<HTMLDivElement>("scroll", { scale: 0.97 });

  return (
    <div className="night-scope bg-night text-foam">
      {/* ============ HERO ============ */}
      <section
        id="home"
        className="relative flex min-h-[100svh] items-center overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-36"
      >
        <div aria-hidden className="absolute inset-0">
          <img src={heroImg} alt="" className="size-full object-cover" />
          <div className="absolute inset-0" style={{ background: heroScrim }} />
        </div>
        <div
          aria-hidden
          className="animate-floaty absolute top-[16%] size-[340px] rounded-full blur-[20px]"
          style={{
            insetInlineStart: "-80px",
            background: "radial-gradient(circle, rgba(111,227,198,0.22), transparent 70%)",
          }}
        />

        {/* w-full is load-bearing: as a flex item this shrink-wraps to its
            content, and container-x's own `margin-inline: auto` then centres
            that narrow box instead of starting it at the inline edge. */}
        <div ref={heroRef} className="container-x relative w-full">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-aqua/30 bg-aqua/10 px-5 py-2.5 text-xs font-bold leading-relaxed text-aqua-2 sm:text-[13px]">
            <span className="animate-pulse-ring size-2 shrink-0 rounded-full bg-aqua" />
            {heroTag}
          </div>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.25rem,7vw,5.25rem)] font-extrabold leading-[1.18] tracking-tight">
            {/* `bg-clip-text` paints the gradient inside the element's own box.
                On an inline span that box is only font-size tall, and Tajawal's
                Arabic ascenders sit above it — so the tops of the glyphs were
                being cut off. inline-block makes the box the full line box, and
                the padding adds headroom for the ink that still overshoots it;
                the negative margins keep the surrounding rhythm unchanged. */}
            {heroTitle ? (
              <span className="-my-[0.14em] inline-block bg-gradient-to-l from-aqua-2 to-aqua bg-clip-text py-[0.14em] text-transparent">
                {heroTitle}
              </span>
            ) : (
              <>
                {t.home.titleA}
                <br />
                <span className="-my-[0.14em] inline-block bg-gradient-to-l from-aqua-2 to-aqua bg-clip-text py-[0.14em] text-transparent">
                  {t.home.titleB}
                </span>
              </>
            )}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-loose text-foam/75 sm:text-lg">
            {heroSubtitle}
          </p>

          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link
              to="/projects"
              className="group inline-flex items-center gap-3 rounded-full bg-aqua py-2 ps-6 pe-2 text-sm font-extrabold text-night transition-shadow hover:shadow-[0_14px_34px_-8px_rgba(111,227,198,0.55)] sm:text-base"
            >
              {heroCta}
              <span className="grid size-10 place-items-center rounded-full bg-night text-aqua transition-transform duration-300 group-hover:rotate-45 sm:size-11">
                <ArrowUpRight className="size-5" />
              </span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:text-base"
            >
              {t.nav.quote}
            </Link>
          </div>
        </div>

        <a
          href="#about"
          className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-xs font-semibold text-foam/50 transition-colors hover:text-aqua [@media(max-height:720px)]:hidden"
        >
          {t.home.discover}
          <span className="flex h-11 w-6.5 items-start justify-center rounded-[14px] border-2 border-foam/30 pt-2">
            <span className="animate-scroll-dot size-1.5 rounded-full bg-aqua" />
          </span>
        </a>
      </section>

      {/* ============ ABOUT + STATS ============ */}
      <section id="about" className="scroll-mt-20 bg-night py-16 sm:py-24 lg:py-32">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div ref={aboutCopyRef}>
            <p
              dir="auto"
              className="font-display text-[13px] font-bold uppercase tracking-[0.28em] text-aqua"
            >
              {t.home.aboutLabel}
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {t.home.aboutTitle}
            </h2>
            <p className="mt-6 text-base leading-loose text-foam/70 sm:text-[17px]">
              {t.home.aboutP1}
            </p>
            <p className="mt-4 text-base leading-loose text-foam/70 sm:text-[17px]">
              {t.home.aboutP2}
            </p>
          </div>

          <div ref={aboutStatsRef} className="grid grid-cols-2 gap-4">
            {stats.map((s, i) => (
              <div
                key={s.l}
                className="rounded-[22px] border border-aqua/15 bg-gradient-to-br from-aqua/10 to-white/[0.02] px-6 py-7"
              >
                <div
                  ref={statRefs[i]}
                  className="font-display text-[clamp(2rem,4vw,2.875rem)] font-extrabold leading-none text-aqua"
                >
                  {s.v}
                </div>
                <div className="mt-2 text-sm font-medium text-foam/65">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section
        id="services"
        className="scroll-mt-20 bg-gradient-to-b from-night to-night-2 py-16 sm:py-24 lg:py-32"
      >
        <div className="container-x">
          <div
            ref={servicesHeaderRef}
            className="mb-12 flex flex-wrap items-end justify-between gap-5 sm:mb-14"
          >
            <div className="max-w-2xl">
              <p
                dir="auto"
                className="font-display text-[13px] font-bold uppercase tracking-[0.28em] text-aqua"
              >
                01 — Services
              </p>
              <h2 className="mt-3.5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {t.home.servicesTitle}
              </h2>
              <p className="mt-3.5 text-base text-foam/65 sm:text-[17px]">{t.home.servicesSub}</p>
            </div>
            <Link
              to="/services"
              className="group inline-flex items-center gap-2.5 border-b border-aqua/40 pb-1 text-sm font-bold text-aqua sm:text-[15px]"
            >
              {t.home.seeAllServices}
              <ArrowUpRight className="size-4.5 transition-transform duration-300 group-hover:rotate-45" />
            </Link>
          </div>

          <div ref={servicesGridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((item, i) => {
              const Icon = item.icon;
              return (
                // Wrapper is the GSAP reveal target (it owns transform/opacity);
                // the hover lift lives on the inner card so the two never fight
                // over the same inline style.
                <div key={i} className="h-full">
                  <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-2 hover:border-aqua/45 hover:bg-aqua/[0.06] hover:shadow-[0_20px_44px_rgba(0,0,0,0.28)]">
                    <div className="font-display text-sm font-extrabold text-aqua/55">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="mt-5 grid size-14 place-items-center rounded-2xl bg-aqua/12 text-aqua">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="mt-5 text-xl font-extrabold">{item.t}</h3>
                    <div
                      className="rt-content mt-3 text-[15px] leading-relaxed text-foam/65"
                      dangerouslySetInnerHTML={{ __html: item.d }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ PROJECTS ============ */}
      <section id="projects" className="scroll-mt-20 bg-night-2 py-16 sm:py-24 lg:py-32">
        <div className="container-x">
          <div ref={projectsHeaderRef} className="mb-12 text-center sm:mb-14">
            <p
              dir="auto"
              className="font-display text-[13px] font-bold uppercase tracking-[0.28em] text-aqua"
            >
              02 — Portfolio
            </p>
            <h2 className="mt-3.5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {t.home.projectsTitle}
            </h2>
            <p className="mt-3.5 text-base text-foam/65 sm:text-[17px]">{t.home.projectsSub}</p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-10 text-center text-foam/60">
              {lang === "ar" ? "لا توجد مشاريع منشورة بعد." : "No published projects yet."}
            </div>
          ) : (
            <div ref={projectsGridRef} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <div key={i} className="h-full">
                  <Link
                    to="/projects"
                    className="group relative block aspect-4/5 overflow-hidden rounded-3xl border border-white/[0.08] transition-transform duration-300 hover:-translate-y-1.5"
                  >
                    <img
                      src={p.img}
                      alt={p.t}
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-night/95 via-night/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6 text-start">
                      <p className="text-xs font-bold tracking-[0.1em] text-aqua">{p.catLabel}</p>
                      <h3 className="mt-1.5 text-xl font-extrabold sm:text-[22px]">{p.t}</h3>
                      {p.c && <p className="mt-1 text-sm text-foam/65">{p.c}</p>}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div className="mt-11 text-center">
            <Link
              to="/projects"
              className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-white/10"
            >
              {t.home.seeAllProjects}
            </Link>
          </div>
        </div>
      </section>

      {/* ============ PRODUCTS ============ */}
      <section
        id="products"
        className="scroll-mt-20 bg-gradient-to-b from-night-2 to-night py-16 sm:py-24 lg:py-32"
      >
        <div className="container-x">
          <div
            ref={productsHeaderRef}
            className="mb-12 flex flex-wrap items-end justify-between gap-5 sm:mb-14"
          >
            <div className="max-w-2xl">
              <p
                dir="auto"
                className="font-display text-[13px] font-bold uppercase tracking-[0.28em] text-aqua"
              >
                03 — Catalog
              </p>
              <h2 className="mt-3.5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {t.home.productsTitle}
              </h2>
              <p className="mt-3.5 text-base text-foam/65 sm:text-[17px]">{t.home.productsSub}</p>
            </div>
            <Link
              to="/products"
              className="group inline-flex items-center gap-2.5 border-b border-aqua/40 pb-1 text-sm font-bold text-aqua sm:text-[15px]"
            >
              {t.home.seeAllProducts}
              <ArrowUpRight className="size-4.5 transition-transform duration-300 group-hover:rotate-45" />
            </Link>
          </div>

          <div ref={productsGridRef} className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <div key={i} className="h-full">
                <Link
                  to="/products"
                  className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-white/[0.03] transition duration-300 hover:-translate-y-2 hover:border-aqua/45 hover:shadow-[0_20px_44px_rgba(0,0,0,0.28)]"
                >
                  <div className="relative aspect-square overflow-hidden bg-night-2">
                    <img
                      src={p.img}
                      alt={p.t}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3.5 rounded-full bg-aqua px-2.5 py-1 text-[11px] font-extrabold text-night end-3.5">
                      {p.catLabel}
                    </span>
                  </div>
                  <div className="p-5 text-start">
                    <h3 className="text-[17px] font-extrabold leading-snug">{p.t}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[13px] text-foam/60">{p.c}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-night px-4 pb-16 pt-4 sm:px-6 sm:pb-24 lg:px-8">
        <div
          ref={ctaRef}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[34px] border border-aqua/20 bg-gradient-to-br from-night-2 to-night p-10 text-center sm:p-14 lg:p-20"
        >
          <div
            aria-hidden
            className="animate-floaty absolute -top-16 size-[260px] rounded-full blur-[10px]"
            style={{
              insetInlineEnd: "-60px",
              background: "radial-gradient(circle, rgba(111,227,198,0.25), transparent 70%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-[3.5rem]">
              {t.home.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-loose text-foam/75 sm:text-lg">
              {t.home.ctaDesc}
            </p>
            <Link
              to="/contact"
              className="group mt-9 inline-flex items-center gap-3 rounded-full bg-aqua py-2.5 ps-7 pe-2.5 text-base font-extrabold text-night transition-shadow hover:shadow-[0_14px_34px_-8px_rgba(111,227,198,0.55)] sm:text-[17px]"
            >
              {t.home.ctaBtn}
              <span className="grid size-11 place-items-center rounded-full bg-night text-aqua transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="size-5" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
