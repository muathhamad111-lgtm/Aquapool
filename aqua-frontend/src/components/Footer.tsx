import { Link, useRouterState } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { branchAddress, usePublicBranches } from "@/lib/branches-api";
import { SocialLinks } from "@/components/SocialLinks";
import logoWhite from "@/assets/logo/logo-white.svg";

export function Footer() {
  const { t, lang } = useLang();
  const { data: branches = [] } = usePublicBranches();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The gap exists to separate the dark footer from light page content. The
  // homepage already ends dark, where that gap would read as a stray light
  // band across the page.
  const gap = pathname === "/" ? "" : "mt-16 sm:mt-20";

  // The footer has room for one location, so it shows the primary branch —
  // the first in sort order; every branch is listed on the contact page.
  //
  // No fallback to the old site setting: branches own these details now and
  // the setting's copies are no longer editable in the admin, so falling
  // back to them would pin stale data on every page with no way to correct
  // it. With no branches the block simply renders nothing.
  const primary = branches[0];
  const address = primary ? branchAddress(primary, lang) : "";
  const email = primary?.email ?? "";
  const phone = primary?.phone ?? "";

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/about", label: t.nav.about },
    { to: "/services", label: t.nav.services },
    { to: "/projects", label: t.nav.projects },
    { to: "/products", label: t.nav.products },
    { to: "/contact", label: t.nav.contact },
  ] as const;

  return (
    <footer className={`relative overflow-hidden bg-night text-foam ${gap}`}>
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background: "radial-gradient(60% 80% at 80% 0%, rgba(111,227,198,0.14), transparent 60%)",
        }}
      />
      <div className="container-x relative">
        <div className="grid gap-10 border-b border-white/10 py-14 sm:gap-11 sm:py-20 md:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-sm">
            <img src={logoWhite} alt="Aqua Pool Group" className="h-11 w-auto" />
            <p className="mt-5 text-[15px] leading-loose text-foam/60">{t.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-sm font-extrabold tracking-[0.05em] text-aqua">{t.footer.links}</h4>
            <ul className="mt-5 flex flex-col gap-3">
              {links.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-[15px] text-foam/70 transition-colors hover:text-aqua"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-extrabold tracking-[0.05em] text-aqua">
              {t.footer.contact}
            </h4>
            {/* Each line appears only when the primary branch actually has
                that detail — every field but the name is optional. */}
            <ul className="mt-5 flex flex-col gap-3.5 text-[15px] text-foam/70">
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-aqua" />
                  <span className="min-w-0 break-words">{address}</span>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0 text-aqua" />
                  <a
                    href={`mailto:${email}`}
                    className="min-w-0 break-all transition-colors hover:text-aqua"
                    dir="ltr"
                  >
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="size-4 shrink-0 text-aqua" />
                  {/* dir on the number, never on the row: putting it on the
                      <li> flips the flex direction too, so the icon jumps to
                      the opposite side of the address and email above it. */}
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="transition-colors hover:text-aqua"
                    dir="ltr"
                  >
                    {phone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-extrabold tracking-[0.05em] text-aqua">
              {t.footer.follow}
            </h4>
            <SocialLinks variant="tile" className="mt-5" />
          </div>
        </div>

        <p className="py-7 text-center text-sm text-foam/45">
          © {new Date().getFullYear()} Aqua Pool Group. {t.footer.rights}.
        </p>
      </div>
    </footer>
  );
}
