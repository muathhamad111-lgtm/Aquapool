# Aqua — Work Log

Dated record of substantial changes: what shipped, why, and what was learned.
The Git history is authoritative for _what_ changed; this file exists for the
reasoning that a diff cannot carry.

Newest first.

---

## 2026-07-23 — Blue heroes, and the clipped gradient headline

Redesigned the hero on services / projects / products (breadcrumb, dot
eyebrow, larger clamped title, wider lead, grid fading out at the bottom) and
moved every dark surface onto one blue hue. Details are in the commits; two
things are worth writing down.

**`--ink` is separate from `--deep` on purpose.** `--deep` now carries enough
chroma to read as blue across a whole hero, which is right there and wrong for
a paragraph. `--foreground` points at `--ink`: same lightness, a quarter of the
saturation. **`--chrome` is likewise deliberately darker than `--deep`** — the
navbar pill floats directly over these heroes and dissolved into them when it
sat at a similar lightness.

**The homepage headline was clipped along its top edge.** `bg-clip-text` paints
the gradient inside the element's _own box_, and on an `inline` span that box is
only font-size tall — measured at 84px against a 99px line box. Tajawal's Arabic
ascenders sit above it, so the shadda on «عزّز» was simply not painted. The word
read as «عزز». The fix is `inline-block` (box becomes the full line box) plus
`py-[0.14em]` for the ink that still overshoots, with matching negative margins
so the surrounding rhythm is unchanged.

Worth knowing: the fallback branch of that same heading already had
`inline-block`, so the bug only appeared once a hero title came from the
database — i.e. only in production. `src/routes/admin.tsx` still has the
uncorrected pattern; its text is Latin with no diacritics so nothing clips
today, but it would if that heading ever became Arabic.

---

## 2026-07-22 — Public site redesign (homepage, About, header, footer)

Three Claude Design files were imported and implemented against the live data
layer rather than their static placeholders:

| Design file                  | Implemented in              |
| ---------------------------- | --------------------------- |
| `Aqua Pool Homepage.dc.html` | `src/routes/index.tsx`      |
| `Aqua About Us.dc.html`      | `src/routes/about.tsx`      |
| header from the About file   | `src/components/Navbar.tsx` |

Every list still comes from the existing DB hooks (`useServices`,
`useProjects`, `useProducts`, `useSiteSetting`); the designs' placeholder
slots and hardcoded figures were dropped.

### What shipped

- **Homepage** — full-viewport photo hero on a new "Night Aqua" dark palette,
  an about band with live counters, then services / portfolio / catalog and a
  CTA card.
- **About** — replaced the dark `PageHero` band with a light paper/cream
  editorial layout: breadcrumb hero with a floating stat badge, story card,
  auto-fit values grid, lagoon trust band.
- **Header** — one floating glass pill across every public route, replacing the
  previous split between a light interior bar and a homepage overlay.
- **Footer** — moved to the night palette, gained a "follow us" column;
  `SocialLinks` grew a `tile` variant for it.
- **`src/lib/company.ts`** — new. `FOUNDED = 1995` in one place, so every
  "years of experience" figure derives from it instead of drifting.

### Decisions worth keeping

- **Two palettes, deliberately.** "Night Aqua" (`--night`, `--aqua`, `--foam`)
  drives the dark homepage and footer; the original Ocean Deep tokens still
  drive every light page; `--paper`/`--cream`/`--lagoon` are the About page's
  warm surfaces. Ocean Deep was left untouched so the redesign could not shift
  pages it did not cover.
- **The navbar is `fixed`, not `sticky`.** It is a pill with transparent space
  around it, so page content must run underneath it to the top edge. Sticky
  reserves a band of the root background instead, which showed as a pale seam
  above every page with a coloured first section. The consequence is a
  contract: **each page's first section owns the top padding that clears the
  bar** — currently `PageHero`, the About hero, and the product detail page.
- **The design's CTA padding was not copied literally.** Its CSS puts the wider
  padding on the icon side, which in an RTL document is the arrow badge rather
  than the label. Read as an authoring slip and flipped to match every other
  CTA on the site.
- **The "12 years" figure in the designs was not copied.** The homepage design
  establishes a 1995 founding; About still said 12 years. Both now derive from
  `company.ts`. The prose in `translations.ts` (`about.p1`) still says 12 — it
  is a fallback overridden by the `about` site setting, so the real copy lives
  in the admin.

### Bugs found and fixed during review

A full pass was done by driving real Chrome over all six public routes, at
1440px and 414px, in both languages.

1. **Hero copy rendered centred instead of at the inline edge.** The hero
   `<section>` is a flex container, so its `container-x` child shrink-wrapped
   and `margin-inline: auto` then centred that narrow box. Fixed with `w-full`.
2. **Numbered eyebrows reordered under RTL.** `01 — Services` rendered as
   `SERVICES — 01`, likewise Portfolio and Catalog: a leading digit run is
   weakly-directional, so bidi moved it to the far end of an RTL paragraph.
   Fixed with `dir="auto"` on every eyebrow — Latin ones resolve LTR, Arabic
   ones (`وعدنا`, an admin-supplied eyebrow) stay RTL.
3. **Scroll reveals left whole sections permanently invisible.** See below —
   this was the serious one.

### The scroll-reveal failure (root cause)

Reported as blank gaps mid-page. Measured on production before the fix: **11
hidden elements on `/`** (the entire about band, heading, both paragraphs, all
four stat cards) and **7 on `/about`** (story card, values header, three value
cards), all sitting at `opacity: 0` in full view while still occupying layout
space.

Two causes compounded:

- ScrollTrigger measures a trigger's start/end **once**, at creation, and never
  re-measures. Every list here loads client-side, so the homepage grows from
  ~4,076px at mount to ~5,463px once the queries land — triggers below the fold
  then referred to scroll offsets up to ~1,400px from where their element
  actually was.
- `toggleActions: "play reverse play reverse"` meant every "leave" actively
  **re-hid** the element. So a mismeasured leave fired while the section was on
  screen, and it stayed hidden forever.

Fixed in `src/lib/motion.ts` by re-measuring on any document height change (one
debounced `ResizeObserver` plus the `load` event) and by revealing **once** and
staying revealed. The second change is the important one: an entrance animation
must never be able to hide content the reader has already reached — that closes
the whole failure class, not just this instance.

**Verification note for next time:** neither local dev (CORS blocks the
production API) nor staging (near-empty database) reproduces this — the page
never grows there. It was reproduced by proxying the production API into a
local build through the browser, which grew the page the identical 1,387px.
An initial "this is just a screenshot artifact" conclusion was wrong; a slow
synthetic scroll masks it, and only realistic wheel-flick scrolling surfaces it.

### Deployed

Staging then production, via `scripts/deploy-frontend.sh`. Final production
release `20260722-233918`. No API or database changes were involved.
