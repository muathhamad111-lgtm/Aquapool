import { createFileRoute } from "@tanstack/react-router";
import {
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
import { PageHero, SectionHeader } from "@/components/Section";
import { pick, useProjects, useProducts, useServices } from "@/lib/content";
import { useSiteSetting } from "@/lib/settings-api";
import { useReveal, useCountUp } from "@/lib/motion";
import heroPool from "@/assets/hero-pool.jpg";
import p2 from "@/assets/project-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Aqua Pool Group | من نحن" },
      {
        name: "description",
        content:
          "Aqua Pool Group — over 12 years delivering luxury pool finishing across the Middle East.",
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
  const fmt = (n: number) => (n > 0 ? `+${n}` : "0");
  const s1v = fmt(dbProjects.length);
  const s2v = fmt(dbProducts.length);
  const s3v = fmt(dbServices.length);
  const s1l = lang === "ar" ? "مشروع منجز" : "Projects Completed";
  const s2l = lang === "ar" ? "منتج متوفر" : "Products Offered";
  const s3l = lang === "ar" ? "خدمة مقدمة" : "Services Provided";

  const s1Ref = useCountUp(dbProjects.length, fmt);
  const s2Ref = useCountUp(dbProducts.length, fmt);
  const s3Ref = useCountUp(dbServices.length, fmt);

  const storyGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.12 });
  const valuesHeaderRef = useReveal<HTMLDivElement>("scroll");
  const valuesGridRef = useReveal<HTMLDivElement>("scroll", { stagger: 0.08 });
  const magazineRef = useReveal<HTMLDivElement>("scroll", { scale: 0.97 });

  return (
    <>
      <PageHero eyebrow="Who we are" title={t.about.title} subtitle={t.about.sub} />

      {/* Story bento */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div ref={storyGridRef} className="grid grid-cols-12 gap-3 md:gap-4">
            <div className="col-span-12 md:col-span-5 bento-card overflow-hidden min-h-[420px] md:min-h-[560px] relative">
              <img
                src={heroPool}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
            <div className="col-span-12 md:col-span-7 bento-card bg-white p-8 md:p-10 lg:p-14 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-teal">
                  Our story
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div
                className="rt-content text-lg text-foreground/80 leading-relaxed mb-5"
                dangerouslySetInnerHTML={{ __html: story }}
              />
              <div
                className="rt-content text-base text-foreground/65 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: mission }}
              />
              {vision && (
                <div
                  className="rt-content text-base text-foreground/65 leading-relaxed mt-3"
                  dangerouslySetInnerHTML={{ __html: vision }}
                />
              )}

              <div className="grid grid-cols-3 gap-6 pt-8 mt-8 border-t border-border">
                <div>
                  <div
                    ref={s1Ref}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-deep"
                  >
                    {s1v}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {s1l}
                  </div>
                </div>
                <div>
                  <div
                    ref={s2Ref}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-deep"
                  >
                    {s2v}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {s2l}
                  </div>
                </div>
                <div>
                  <div
                    ref={s3Ref}
                    className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-deep"
                  >
                    {s3v}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                    {s3l}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-b from-sand to-background">
        <div className="container-x">
          <div ref={valuesHeaderRef}>
            <SectionHeader eyebrow={valuesEyebrow} title={valuesTitle} />
          </div>
          <div ref={valuesGridRef} className="grid grid-cols-12 gap-3 md:gap-4">
            {valueItems.map((v, i) => {
              const Icon = VALUE_ICON_MAP[v.icon] ?? Star;
              const isDark = i % 4 === 1;
              return (
                <div
                  key={i}
                  className={`col-span-12 md:col-span-6 lg:col-span-3 bento-card p-7 min-h-[240px] flex flex-col justify-between transition-transform duration-300 ease-out hover:-translate-y-1 ${
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
                  <div>
                    <h3 className="font-bold text-lg mb-2">{pick(v.title_ar, v.title_en, lang)}</h3>
                    <p
                      className={`text-sm leading-relaxed ${isDark ? "text-white/65" : "text-foreground/65"}`}
                    >
                      {pick(v.desc_ar, v.desc_en, lang)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Magazine band */}
      <section className="py-14 sm:py-20 lg:py-28">
        <div className="container-x">
          <div
            ref={magazineRef}
            className="rounded-3xl overflow-hidden bg-deep text-white grid md:grid-cols-2"
          >
            <div className="relative min-h-[240px] sm:min-h-[320px]">
              <img src={p2} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
            </div>
            <div className="p-8 sm:p-10 md:p-16 lg:p-20 flex flex-col justify-center">
              <span className="text-[11px] font-bold tracking-[0.3em] uppercase text-mint mb-4">
                {t.about.valuesTitle}
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold leading-tight mb-5">
                {t.about.bandTitle}
              </h3>
              <p className="text-white/65 leading-relaxed">{t.about.bandDesc}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
