import { Facebook, Instagram, Linkedin, MessageCircle, Twitter } from "lucide-react";
import { useSiteSetting } from "@/lib/settings-api";

export type ContactSetting = {
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
};

const CHANNELS = [
  { key: "instagram", icon: Instagram, label: "Instagram" },
  { key: "facebook", icon: Facebook, label: "Facebook" },
  { key: "twitter", icon: Twitter, label: "Twitter" },
  { key: "linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
] as const;

/**
 * The social accounts from site settings — the only contact data still kept
 * there, now that branches own addresses, phones and hours.
 *
 * An icon appears only when its link is filled in, so an unused platform
 * leaves no dead icon behind. Facebook and WhatsApp were editable in the
 * admin but had no icon anywhere on the site until now.
 */
export function SocialLinks({
  className = "",
  /** "inline" — bare icons in a row. "tile" — the footer's rounded glass squares. */
  variant = "inline",
}: {
  className?: string;
  variant?: "inline" | "tile";
}) {
  const contact = useSiteSetting<ContactSetting>("contact");

  const links = CHANNELS.map((channel) => ({
    ...channel,
    href: hrefFor(channel.key, contact?.[channel.key]),
  })).filter((channel) => channel.href !== null);

  if (links.length === 0) return null;

  const tile = variant === "tile";

  return (
    <div className={`flex items-center ${tile ? "flex-wrap gap-3" : "gap-4"} ${className}`}>
      {links.map(({ key, icon: Icon, label, href }) => (
        <a
          key={key}
          href={href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={
            tile
              ? "grid size-10.5 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-foam transition-colors hover:border-aqua/40 hover:bg-aqua/15 hover:text-aqua"
              : "transition-colors hover:text-mint"
          }
        >
          <Icon className={tile ? "size-4.5" : "size-4"} />
        </a>
      ))}
    </div>
  );
}

/**
 * WhatsApp is stored as a phone number, not a URL, so it becomes a wa.me
 * link — the digits only, since wa.me rejects spaces and a leading `+`.
 * Every other channel is already a full URL.
 */
function hrefFor(key: string, value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (key === "whatsapp") {
    const digits = trimmed.replace(/\D/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  }

  return trimmed;
}
