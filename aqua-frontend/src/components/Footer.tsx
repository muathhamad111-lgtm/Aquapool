import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick } from "@/lib/content";
import { branchAddress, usePublicBranches } from "@/lib/branches-api";
import { SocialLinks } from "@/components/SocialLinks";
import logoWhite from "@/assets/logo/logo-white.svg";

export function Footer() {
  const { t, lang } = useLang();
  const { data: branches = [] } = usePublicBranches();

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

  return (
    <footer className="bg-deep text-white/85 mt-16 sm:mt-20 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(60% 80% at 80% 0%, rgba(92,189,185,0.18), transparent 60%)",
        }}
      />
      <div className="container-x relative">
        <div className="py-10 sm:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 border-b border-white/10">
          <div className="col-span-2 md:col-span-2 space-y-5">
            <img src={logoWhite} alt="Aqua Pool Group" className="h-10 sm:h-12 w-auto" />
            <p className="max-w-sm text-sm leading-loose opacity-65">{t.footer.tagline}</p>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <h5 className="text-white font-bold text-xs sm:text-sm uppercase tracking-widest">
              {t.footer.links}
            </h5>
            <ul className="space-y-3 text-sm opacity-70">
              <li>
                <Link to="/about" className="hover:text-mint transition-colors">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-mint transition-colors">
                  {t.nav.services}
                </Link>
              </li>
              <li>
                <Link to="/projects" className="hover:text-mint transition-colors">
                  {t.nav.projects}
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-mint transition-colors">
                  {t.nav.products}
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <h5 className="text-white font-bold text-xs sm:text-sm uppercase tracking-widest">
              {t.footer.contact}
            </h5>
            {/* Each line appears only when the primary branch actually has
                that detail — every field but the name is optional. */}
            <ul className="space-y-3 text-sm opacity-70">
              {address && (
                <li className="flex items-start gap-2">
                  <MapPin className="size-4 shrink-0 mt-0.5" />{" "}
                  <span className="min-w-0 break-words">{address}</span>
                </li>
              )}
              {email && (
                <li className="flex items-start gap-2">
                  <Mail className="size-4 shrink-0 mt-0.5" />{" "}
                  <a href={`mailto:${email}`} className="min-w-0 break-all" dir="ltr">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" />{" "}
                  {/* dir on the number, never on the row: putting it on the
                      <li> flips the flex direction too, so the icon jumps to
                      the opposite side of the address and email above it. */}
                  <a href={`tel:${phone.replace(/\s/g, "")}`} dir="ltr">
                    {phone}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="py-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 text-xs opacity-50">
          <p>
            © {new Date().getFullYear()} Aqua Pool Group. {t.footer.rights}.
          </p>
          {/* Facebook and WhatsApp were editable in the admin but had no
              icon here at all until this moved to the shared component. */}
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
