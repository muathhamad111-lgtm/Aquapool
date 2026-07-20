/**
 * The dashboard's control metrics, in one place.
 *
 * Everything in the admin that isn't an `AdminField` — search boxes,
 * filters, the specifications editor's inputs — used to carry its own
 * hand-written padding and type size, which is how the dashboard ended up
 * with 66px fields sitting beside 32px ones. These constants are the shared
 * definition; import them rather than retyping the classes.
 *
 * They deliberately match `FormField`'s `sm` scale: ~40px tall, 14px text.
 */

/** A bordered text input, matching AdminField's height and type scale. */
export const adminInput =
  "w-full min-w-0 px-3 py-2.5 rounded-xl border border-border bg-white text-sm " +
  "outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20";

/** A compact control for toolbars — filters, search, pagination. */
export const adminControl =
  "h-10 px-3 rounded-xl border border-border bg-white text-sm " +
  "outline-none transition-shadow focus:border-teal focus:ring-2 focus:ring-teal/20";
