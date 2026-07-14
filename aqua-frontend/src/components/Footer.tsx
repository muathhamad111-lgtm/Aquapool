import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick } from "@/lib/content";
import { useSiteSetting } from "@/lib/settings-api";
import logoWhite from "@/assets/logo/logo-white.svg";

type ContactSetting = {
  phone?: string;
  email?: string;
  address_ar?: string;
  address_en?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
};

export function Footer() {
  const { t, lang } = useLang();
  const contact = useSiteSetting<ContactSetting>("contact");
  const address = pick(contact?.address_ar, contact?.address_en, lang) || t.contact.address;
  const email = contact?.email || "info@aqua-pool-group.com";
  const phone = contact?.phone || "+966 500 000 000";

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
            <ul className="space-y-3 text-sm opacity-70">
              <li className="flex items-start gap-2">
                <MapPin className="size-4 shrink-0 mt-0.5" />{" "}
                <span className="min-w-0 break-words">{address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="size-4 shrink-0 mt-0.5" />{" "}
                <span className="min-w-0 break-all" dir="ltr">
                  {email}
                </span>
              </li>
              <li className="flex items-center gap-2" dir="ltr">
                <Phone className="size-4 shrink-0" /> {phone}
              </li>
            </ul>
          </div>
        </div>

        <div className="py-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4 text-xs opacity-50">
          <p>
            © {new Date().getFullYear()} Aqua Pool Group. {t.footer.rights}.
          </p>
          <div className="flex gap-5">
            {contact?.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="size-4 hover:text-mint" />
              </a>
            )}
            {contact?.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <Instagram className="size-4 hover:text-mint" />
              </a>
            )}
            {contact?.twitter && (
              <a
                href={contact.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="size-4 hover:text-mint" />
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
