import { useState } from "react";
import { ChevronDown, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { pick } from "@/lib/content";
import { branchAddress, branchMapsUrl } from "@/lib/branches-api";
import type { DbBranch } from "@/lib/admin-api";

/**
 * The contact page's location list: each branch shows only its name until
 * clicked, then reveals its address, phone, email and hours underneath.
 * Collapsed by default keeps a long list scannable — the visitor picks the
 * branch they care about instead of scrolling past every one's details.
 *
 * The first branch starts open so the page never reads as empty, and
 * because it is the primary location most visitors want.
 */
export function BranchesAccordion({ branches }: { branches: DbBranch[] }) {
  const { t, lang } = useLang();
  const [openId, setOpenId] = useState<string | null>(branches[0]?.id ?? null);

  if (branches.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border">
      {branches.map((branch) => {
        const isOpen = openId === branch.id;
        const address = branchAddress(branch, lang);
        const hours = pick(branch.hours_ar, branch.hours_en, lang);
        const mapsUrl = branchMapsUrl(branch);
        const panelId = `branch-panel-${branch.id}`;

        return (
          <div key={branch.id}>
            <button
              type="button"
              // Toggles rather than always opening: clicking the open branch
              // closes it, which is what a visitor expects from a header
              // that just expanded.
              onClick={() => setOpenId(isOpen ? null : branch.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="w-full flex items-center gap-3 p-4 sm:p-5 text-start hover:bg-muted/40 transition-colors"
            >
              <span className="size-9 rounded-xl bg-teal/10 grid place-items-center shrink-0">
                <MapPin className="size-4 text-teal" />
              </span>
              <span className="flex-1 min-w-0 font-bold text-deep text-sm sm:text-base">
                {pick(branch.name_ar, branch.name_en, lang)}
              </span>
              <ChevronDown
                aria-hidden
                className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOpen && (
              <div id={panelId} className="px-4 sm:px-5 pb-5 -mt-1">
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  {address && (
                    <li className="flex items-start gap-2.5">
                      <MapPin className="size-4 shrink-0 mt-0.5 text-teal" />
                      <span className="leading-snug">{address}</span>
                    </li>
                  )}
                  {branch.phone && (
                    <li className="flex items-center gap-2.5">
                      <Phone className="size-4 shrink-0 text-teal" />
                      {/* tel: strips spaces — dialers reject them in the
                          href even though they belong in the visible text. */}
                      <a
                        href={`tel:${branch.phone.replace(/\s/g, "")}`}
                        dir="ltr"
                        className="hover:text-deep"
                      >
                        {branch.phone}
                      </a>
                    </li>
                  )}
                  {branch.email && (
                    <li className="flex items-center gap-2.5 min-w-0">
                      <Mail className="size-4 shrink-0 text-teal" />
                      <a
                        href={`mailto:${branch.email}`}
                        dir="ltr"
                        className="hover:text-deep truncate"
                      >
                        {branch.email}
                      </a>
                    </li>
                  )}
                  {hours && (
                    <li className="flex items-start gap-2.5">
                      <Clock className="size-4 shrink-0 mt-0.5 text-teal" />
                      <span className="leading-snug">{hours}</span>
                    </li>
                  )}
                </ul>

                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-xs font-bold text-deep hover:bg-muted transition-colors"
                  >
                    <MapPin className="size-3.5" />
                    {t.contact.directions}
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
