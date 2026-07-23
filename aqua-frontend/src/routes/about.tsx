import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Award,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Star,
  Gem,
  Trophy,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick, useProjects, useProducts, useServices } from "@/lib/content";
import { useSiteSetting } from "@/lib/settings-api";
import { useReveal, useCountUp } from "@/lib/motion";
import { yearsInBusiness } from "@/lib/company";
import heroPool from "@/assets/hero-pool.jpg";
import p2 from "@/assets/project-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Aqua Pool Group | من نحن" },
      {
        name: "description",
        content:
          "Aqua Pool Group — three decades of luxury pool finishing, from Nablus to the wider region.",
      },
      { property: "og:title", content: "About Aqua Pool Group" },
      { property: "og:description", content: "Our story, values, and commitment to excellence." },
    ],
  }),
  component: About,
});

type AboutSetting = {
  story_ar?: string;
  story_en?: string;
  mission_ar?: string;
  mission_en?: string;
  vision_ar?: string;
  vision_en?: string;
};

const VALUE_ICON_MAP = {
  Award,
  Lightbulb,
  HeartHandshake,
  CheckCircle2,
  Shield,
  Sparkles,
  Users,
  Star,
  Gem,
  Trophy,
} as const;
type ValueIconKey = keyof typeof VALUE_ICON_MAP;
type ValueItem = {
  icon: ValueIconKey;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
};
type ValuesSetting = {
  title_ar?: string;
  title_en?: string;
  eyebrow_ar?: string;
  eyebrow_en?: string;
  items?: ValueItem[];
};

/** Eyebrow: small caps, wide tracking, teal — used at the head of every band. */
function Eyebrow({ children, rule = false }: { children: string; rule?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        dir="auto"
        className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-teal"
      >
        {children}
      </span>
      {rule && <span className="h-px flex-1 bg-deep/12" />}
    </div>
  );
}

function About() {
  const { t, lang } = useLang();
  const about = useSiteSetting<AboutSetting>("about");
  const valuesData = useSiteSetting<ValuesSetting>("values");
  const fallbackItems: ValueItem[] = (t.about.values as { t: string; d: string }[]).map(
    (vv, i) => ({
      icon:
        (["Award", "Lightbulb", "HeartHandshake", "CheckCircle2"] as ValueIconKey[])[i] ?? "Star",
      title_ar: vv.t,
      title_en: vv.t,
      desc_ar: vv.d,
      desc_en: vv.d,
    }),
  );
  const valueItems = valuesData?.items?.length ? valuesData.items : fallbackItems;
  const valuesTitle = pick(valuesData?.title_ar, valuesData?.title_en, lang) || t.about.valuesTitle;
  const valuesEyebrow =
    pick(valuesData?.eyebrow_ar, valuesData?.eyebrow_en, lang) || "What we stand for";
  const { data: dbProjects = [] } = useProjects();
  const { data: dbProducts = [] } = useProducts();
  const { data: dbServices = [] } = useServices();

  const story = pick(about?.story_ar, about?.story_en, lang) || t.about.p1;
  const mission = pick(about?.mission_ar, about?.mission_en, lang) || t.about.p2;
  const vision = pick(about?.vision_ar, about?.vision_en, lang);

  const years = yearsInBusiness();
  const fmt = (n: number) => (n > 0 ? `+${n}` : "0");
  const stats = [
    { v: fmt(dbProjects.length), l: lang === "ar" ? "مشروع منجز" : "Projects completed" },
    { v: fmt(dbProducts.length), l: lang === "ar" ? "منتج متوفر" : "Products offered" },
    { v: fmt(dbServices.length), l: lang === "ar" ? "خدمة مقدمة" : "Services provided" },
  ];
  // Fixed length (always 3) — unconditional hook calls, not derived from data.
  const statRefs = [
    useCountUp(dbProjects.length, fmt),
    useCountUp(dbProducts.length, fmt),
    useCountUp(dbServices.length, fmt),
  ];
  const badgeRef = useCountUp(years, fmt);

  const heroCopyRef = useReveal<HTMLDivElement>("mount", { stagger: 0.1, y: 20 });
  const heroArtRef = useReveal<HTMLDivElement>("mount", { y: 28, duration: 0.8 });
  const storyGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.12 });
  const valuesHeaderRef = useReveal<HTMLDivElement>("scroll");
  const valuesGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const bandRef = useReveal<HTMLDivElement>("scroll", { scale: 0.97 });

  return (
    <div className="bg-paper">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-cream to-paper">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(52% 60% at 88% 14%, rgba(92,189,185,0.28), transparent 62%), radial-gradient(46% 50% at 8% 88%, rgba(45,138,158,0.16), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0d2748 1px, transparent 1px), linear-gradient(to bottom, #0d2748 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* pt clears the fixed floating navbar (see components/Navbar.tsx). */}
        <div className="container-x relative grid items-center gap-12 pb-14 pt-28 sm:pb-16 sm:pt-32 lg:grid-cols-2 lg:gap-14 lg:pb-18">
          <div ref={heroCopyRef}>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-[13px] text-foreground/50"
            >
              <Link to="/" className="transition-colors hover:text-teal">
                {t.nav.home}
              </Link>
              <span className="opacity-50">/</span>
              <span className="font-bold text-teal">{t.about.title}</span>
            </nav>

            <div className="mt-6 flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-mint" />
              <span
                dir="auto"
                className="font-display text-[11px] font-bold uppercase tracking-[0.3em] text-teal"
              >
                Who we are
              </span>
            </div>

            <h1 className="mt-4 text-[clamp(2.6rem,6vw,5rem)] font-black leading-[1.08] tracking-tight text-deep">
              {t.about.title}
            </h1>

            <p className="mt-5 max-w-[32ch] text-[clamp(1.05rem,1.6vw,1.35rem)] leading-relaxed text-foreground/60">
              {t.about.sub}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-ocean"
              >
                {t.home.seeAllProjects}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:rotate-45" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center rounded-full border border-deep/15 px-6 py-3 text-[15px] font-bold text-deep transition-colors hover:bg-deep/5"
              >
                {t.nav.contact}
              </Link>
            </div>
          </div>

          <div ref={heroArtRef} className="relative">
            <div className="relative aspect-4/5 overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(10,30,60,0.45)]">
              <img
                src={heroPool}
                alt={
                  lang === "ar"
                    ? "مسبح فاخر من تنفيذ أكوا بول جروب"
                    : "A pool built by Aqua Pool Group"
                }
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div className="animate-floaty absolute -bottom-5 rounded-[20px] bg-white px-6 py-4 shadow-[0_20px_40px_-18px_rgba(10,30,60,0.35)] start-[-1.375rem]">
              <div ref={badgeRef} className="text-[38px] font-black leading-none text-deep">
                {fmt(years)}
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground/55">
                {t.home.statYears}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STORY ============ */}
      <section className="py-16 sm:py-18">
        <div className="container-x">
          <div ref={storyGridRef} className="grid items-stretch gap-5 md:grid-cols-2">
            <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-deep/8">
              <img
                src={p2}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </div>

            <div className="flex flex-col justify-center rounded-3xl border border-deep/8 bg-white p-8 shadow-[0_20px_50px_-40px_rgba(10,30,60,0.4)] sm:p-11">
              <Eyebrow rule>Our story</Eyebrow>
              <div
                className="rt-content mt-7 text-[1.2rem] leading-[1.75] text-foreground/80"
                dangerouslySetInnerHTML={{ __html: story }}
              />
              <div
                className="rt-content mt-4 text-[1.02rem] leading-[1.75] text-foreground/60"
                dangerouslySetInnerHTML={{ __html: mission }}
              />
              {vision && (
                <div
                  className="rt-content mt-3 text-[1.02rem] leading-[1.75] text-foreground/60"
                  dangerouslySetInnerHTML={{ __html: vision }}
                />
              )}

              <div className="mt-8 grid grid-cols-3 gap-6 border-t border-deep/10 pt-8">
                {stats.map((s, i) => (
                  <div key={s.l}>
                    <div
                      ref={statRefs[i]}
                      className="text-[clamp(1.9rem,3vw,2.8rem)] font-black leading-none text-deep"
                    >
                      {s.v}
                    </div>
                    <div className="mt-1.5 text-[11px] uppercase tracking-[0.12em] text-foreground/50">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ VALUES ============ */}
      <section className="bg-gradient-to-b from-cream to-paper py-16 sm:py-18">
        <div className="container-x">
          <div ref={valuesHeaderRef} className="mb-12 max-w-2xl">
            <Eyebrow rule>{valuesEyebrow}</Eyebrow>
            <h2 className="mt-4 text-[clamp(1.9rem,4vw,3.2rem)] font-black leading-tight text-deep">
              {valuesTitle}
            </h2>
          </div>

          <div
            ref={valuesGridRef}
            className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]"
          >
            {valueItems.map((v, i) => {
              const Icon = VALUE_ICON_MAP[v.icon] ?? Star;
              // One card per row of four is inverted, so the grid has a focal
              // point instead of reading as four identical tiles.
              const featured = i % 4 === 1;
              return (
                // Wrapper is the GSAP reveal target (it owns transform/opacity);
                // the hover lift lives on the inner card so the two never fight
                // over the same inline style.
                <div key={i} className="h-full">
                  <div
                    className={`flex h-full min-h-[240px] flex-col justify-between rounded-[22px] p-7 transition duration-300 hover:-translate-y-1.5 ${
                      featured
                        ? "bg-deep text-white hover:shadow-[0_24px_44px_-26px_rgba(10,30,60,0.5)]"
                        : "border border-deep/8 bg-white hover:shadow-[0_24px_44px_-30px_rgba(10,30,60,0.4)]"
                    }`}
                  >
                    <div
                      className={`grid size-12 place-items-center rounded-2xl ${
                        featured ? "bg-white/10" : "bg-mint/20"
                      }`}
                    >
                      <Icon className={`size-6 ${featured ? "text-mint" : "text-teal"}`} />
                    </div>
                    <div>
                      <h3
                        className={`mb-2 text-[1.2rem] font-extrabold ${featured ? "" : "text-deep"}`}
                      >
                        {pick(v.title_ar, v.title_en, lang)}
                      </h3>
                      <p
                        className={`text-[0.95rem] leading-relaxed ${
                          featured ? "text-white/65" : "text-foreground/62"
                        }`}
                      >
                        {pick(v.desc_ar, v.desc_en, lang)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ TRUST BAND ============ */}
      <section className="pb-20 pt-6 sm:pb-24">
        <div className="container-x">
          <div
            ref={bandRef}
            className="relative overflow-hidden rounded-[28px] border border-mint/30 bg-gradient-to-br from-lagoon to-cream p-10 sm:p-14"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(40% 80% at 92% 0%, rgba(92,189,185,0.4), transparent 60%)",
              }}
            />
            <div className="relative max-w-3xl">
              <Eyebrow>{t.about.promise}</Eyebrow>
              <h3 className="mt-3.5 text-[clamp(1.7rem,3.4vw,2.6rem)] font-black leading-tight text-deep">
                {t.about.bandTitle.replace("{years}", String(years))}
              </h3>
              <p className="mt-4 text-[1.1rem] leading-[1.75] text-foreground/68">
                {t.about.bandDesc}
              </p>
              <Link
                to="/contact"
                className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-deep px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-ocean"
              >
                {t.about.bandCta}
                <span className="grid size-6.5 place-items-center rounded-full bg-mint text-deep transition-transform duration-300 group-hover:rotate-45">
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
