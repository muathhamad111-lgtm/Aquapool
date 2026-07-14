import type { ReactNode } from "react";

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
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-teal">
            {eyebrow}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-deep leading-[1.15] md:leading-[1.1]">{title}</h2>
      {subtitle && (
        <p className={`mt-4 md:mt-5 text-sm sm:text-base md:text-lg text-foreground/65 leading-relaxed ${center ? "max-w-2xl mx-auto" : "max-w-2xl"}`}>
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
  children,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative bg-deep text-white overflow-hidden">
      {/* gradient mesh */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 60% at 20% 10%, rgba(92,189,185,0.18), transparent 60%), radial-gradient(50% 50% at 90% 80%, rgba(45,138,158,0.25), transparent 60%)",
        }}
      />
      {/* fine grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="container-x relative py-14 sm:py-20 md:py-28">
        {eyebrow && (
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <span className="size-1.5 rounded-full bg-mint" />
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.3em] uppercase text-mint">
              {eyebrow}
            </span>
          </div>
        )}
        <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] md:leading-[1.05] max-w-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 md:mt-6 text-base md:text-lg text-white/65 max-w-2xl leading-relaxed">{subtitle}</p>
        )}
        {children}
      </div>
    </section>
  );
}
