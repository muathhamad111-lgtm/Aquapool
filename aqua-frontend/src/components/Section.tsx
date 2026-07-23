import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/i18n/LanguageContext";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 md:mb-12 ${center ? "text-center" : ""} ${center ? "" : "max-w-3xl"}`}>
      {eyebrow && (
        <div className="flex items-center gap-3 mb-4">
          {center && <span className="hidden md:block h-px w-10 bg-teal" />}
          <span
            dir="auto"
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-teal"
          >
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-deep leading-[1.15] md:leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 md:mt-5 text-sm sm:text-base md:text-lg text-foreground/65 leading-relaxed ${center ? "max-w-2xl mx-auto" : "max-w-2xl"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  eyebrow,
  /** Label for the current page in the trail. Omit to render no breadcrumb. */
  breadcrumb,
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumb?: string;
  children?: ReactNode;
}) {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden bg-deep text-white">
      {/* Depth: a wide glow behind the heading, a cooler one low on the
          opposite side — otherwise the flat blue reads as a printed block. */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(55% 70% at 78% 6%, rgba(92,189,185,0.20), transparent 62%), radial-gradient(50% 60% at 8% 96%, rgba(45,138,158,0.24), transparent 62%)",
        }}
      />
      {/* fine grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      {/* Fades the grid out at the bottom edge rather than cutting it off. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: "linear-gradient(to bottom, transparent, var(--deep))" }}
      />

      {/* pt clears the fixed floating navbar (see components/Navbar.tsx) while
          the hero's own background still runs to the top edge behind it. */}
      <div className="container-x relative pb-20 pt-28 sm:pb-24 sm:pt-32 md:pb-32 md:pt-40">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-2 text-[13px]">
            <Link to="/" className="text-white/45 transition-colors hover:text-mint">
              {t.nav.home}
            </Link>
            <span className="text-white/25">/</span>
            <span className="font-bold text-mint">{breadcrumb}</span>
          </nav>
        )}

        {eyebrow && (
          <div className="mb-5 flex items-center gap-3">
            <span className="size-1.5 rounded-full bg-mint" />
            <span
              dir="auto"
              className="text-[10px] font-bold uppercase tracking-[0.3em] text-mint sm:text-[11px]"
            >
              {eyebrow}
            </span>
          </div>
        )}

        <h1 className="max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-black leading-[1.12]">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-white/60 sm:text-lg md:text-xl">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
