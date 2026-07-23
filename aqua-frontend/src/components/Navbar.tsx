import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import logoWhite from "@/assets/logo/logo-white.svg";
import { useLang } from "@/i18n/LanguageContext";

export function Navbar() {
  const { t, lang, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";
  const progressRef = useRef<HTMLDivElement>(null);

  // close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // lock body scroll when drawer open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Read-progress bar, homepage only. Written straight to the DOM rather than
  // through state: it changes on every frame of a scroll, and re-rendering the
  // whole nav that often is wasteful.
  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => {
      const track = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${track > 0 ? (window.scrollY / track) * 100 : 0}%`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/services", label: t.nav.services },
    { to: "/projects", label: t.nav.projects },
    { to: "/products", label: t.nav.products },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <>
      {isHome && (
        <div className="fixed inset-x-0 top-0 z-[60] h-[3px] bg-white/5">
          <div
            ref={progressRef}
            className="h-full w-0 bg-gradient-to-r from-aqua to-aqua-2 transition-[width] duration-100 ease-linear"
          />
        </div>
      )}

      {/* Fixed rather than sticky: the bar is a floating pill with transparent
          space around it, so page content has to run underneath it all the way
          to the top edge. Sticky would instead reserve a band of whatever the
          root background happens to be, leaving a seam above every page whose
          first section is coloured. Each page's first section carries the top
          padding that keeps its content clear of the pill. */}
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-[18px]">
        <nav className="mx-auto flex h-[62px] max-w-[1180px] items-center justify-between gap-5 rounded-full border border-white/12 bg-chrome/72 ps-3 pe-5 shadow-[0_22px_50px_-26px_rgba(6,20,38,0.9)] backdrop-blur-[22px] backdrop-saturate-150 sm:h-[70px]">
          <Link to="/" className="flex shrink-0 items-center ps-2" aria-label="Aqua Pool Group">
            <img src={logoWhite} alt="Aqua Pool Group" className="h-9 w-auto sm:h-10" />
          </Link>

          <div className="hidden items-center gap-1 text-[14.5px] font-semibold lg:flex">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`relative px-4 py-2.5 transition-colors ${
                    active ? "text-white" : "text-white/72 hover:text-white"
                  }`}
                >
                  {l.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-1/2 h-[2.5px] w-5 -translate-x-1/2 rounded-full bg-mint"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <button
              onClick={toggle}
              className="grid size-10 place-items-center rounded-full border border-white/16 bg-white/8 text-xs font-bold text-white transition-colors hover:bg-white/18"
              aria-label="Toggle language"
            >
              {lang === "ar" ? "EN" : "ع"}
            </button>

            {/* The design's literal CSS puts the wider padding on the icon side,
                which reads as an authoring slip in an RTL document — the roomy
                side belongs to the label, as on every other CTA on the site. */}
            <Link
              to="/contact"
              className="hidden items-center gap-2.5 rounded-full bg-mint py-2.5 ps-[22px] pe-2.5 text-[14.5px] font-extrabold text-night transition-all hover:-translate-y-px hover:bg-[#7ad3cf] sm:inline-flex"
            >
              {t.nav.quote}
              <span className="grid size-[30px] place-items-center rounded-full bg-night text-mint">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>

            <button
              className="grid size-10 place-items-center rounded-full border border-white/16 bg-white/8 text-white lg:hidden"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile drawer — a second floating panel under the pill, so the
            chrome keeps its shape instead of turning into a full-width sheet. */}
        {open && (
          <div className="mx-auto mt-2.5 max-w-[1180px] rounded-[28px] border border-white/12 bg-chrome/95 p-3 shadow-[0_22px_50px_-26px_rgba(6,20,38,0.9)] backdrop-blur-[22px] backdrop-saturate-150 lg:hidden">
            <div className="flex flex-col gap-1">
              {links.map((l) => {
                const active = pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                      active ? "bg-white/10 text-mint" : "text-white/75 hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-between rounded-full bg-mint py-2.5 ps-5 pe-2.5 text-sm font-extrabold text-night"
              >
                {t.nav.quote}
                <span className="grid size-8 place-items-center rounded-full bg-night text-mint">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
