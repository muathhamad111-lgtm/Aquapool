import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Globe, ArrowUpRight } from "lucide-react";
import logoColor from "@/assets/logo/logo-color.svg";
import { useLang } from "@/i18n/LanguageContext";

export function Navbar() {
  const { t, lang, toggle } = useLang();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/services", label: t.nav.services },
    { to: "/projects", label: t.nav.projects },
    { to: "/products", label: t.nav.products },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="container-x h-16 sm:h-20 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="Aqua Pool Group">
          <img src={logoColor} alt="Aqua Pool Group" className="h-9 sm:h-11 w-auto" />
        </Link>

        <div className="hidden lg:flex items-center gap-1 text-sm font-semibold">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`relative px-4 py-2 rounded-full transition-all ${
                  active
                    ? "text-deep bg-mint/20"
                    : "text-foreground/65 hover:text-deep hover:bg-muted"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 border border-border rounded-full text-xs font-bold hover:bg-deep hover:text-white hover:border-deep transition-all"
            aria-label="Toggle language"
          >
            <Globe className="size-3.5" />
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <Link
            to="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 bg-deep text-white ps-5 pe-2 py-2 rounded-full text-sm font-bold hover:bg-ocean transition-all group"
          >
            {t.nav.quote}
            <span className="size-7 rounded-full bg-mint text-deep grid place-items-center group-hover:rotate-45 transition-transform">
              <ArrowUpRight className="size-3.5" />
            </span>
          </Link>
          <button
            className="lg:hidden p-2 -m-2 text-deep"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-border bg-background animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="container-x py-4 flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`py-3 px-3 text-sm font-bold rounded-xl transition-colors ${
                    active ? "bg-mint/20 text-deep" : "text-foreground/80 hover:bg-muted"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-between bg-deep text-white ps-5 pe-2 py-2 rounded-full text-sm font-bold group"
            >
              {t.nav.quote}
              <span className="size-8 rounded-full bg-mint text-deep grid place-items-center group-hover:rotate-45 transition-transform">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
