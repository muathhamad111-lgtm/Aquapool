import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = "power2.out";

/**
 * ScrollTrigger measures each trigger's start/end in page coordinates once, when
 * the trigger is created, and does not re-measure on its own.
 *
 * Every list on this site is fetched client-side, so the document keeps growing
 * after those measurements are taken — the homepage went from ~4,100px at mount
 * to ~5,500px once services, projects and products arrived. Triggers below the
 * fold then referred to scroll offsets over a thousand pixels away from where
 * their element actually was, and sections sat at opacity 0 in the middle of the
 * viewport, permanently, still occupying space as a tall blank gap.
 *
 * One debounced observer, installed on first use, re-measures whenever the
 * document changes height. `ScrollTrigger.refresh()` also re-evaluates each
 * trigger's state, so anything already scrolled past is revealed immediately
 * rather than waiting for a scroll event that will never come.
 */
let autoRefreshWired = false;
function wireAutoRefresh() {
  if (autoRefreshWired || typeof window === "undefined") return;
  autoRefreshWired = true;

  let frame = 0;
  const refresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => ScrollTrigger.refresh());
  };

  // Late-loading images (hero, cards) shift everything below them.
  window.addEventListener("load", refresh);
  // Everything else that changes the page height: query results landing, web
  // fonts swapping in, a filter collapsing a grid.
  new ResizeObserver(refresh).observe(document.body);
}

type RevealOpts = {
  /** Animate direct children individually (staggered) instead of the container as one block. */
  stagger?: number;
  /** Vertical travel distance in px. Defaults to 24. */
  y?: number;
  /** Starting scale (e.g. 0.97) for a subtle scale-up-in-place reveal. Omit for no scale animation. */
  scale?: number;
  duration?: number;
  /** Only relevant for trigger "scroll". */
  start?: string;
};

/**
 * Fade (+ optional slide-up / scale-up) reveal, gated entirely behind
 * `prefers-reduced-motion: no-preference` — reduced-motion users simply see
 * elements at their natural CSS opacity (1), no animation ever runs for them.
 */
export function useReveal<T extends HTMLElement>(
  trigger: "mount" | "scroll",
  opts: RevealOpts = {},
) {
  const ref = useRef<T>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        wireAutoRefresh();
        const targets = opts.stagger ? (gsap.utils.toArray(el.children) as HTMLElement[]) : [el];
        // Nothing to hide yet — a staggered grid whose rows arrive with the
        // query. Bailing keeps us from creating a trigger with no targets.
        if (targets.length === 0) return;
        const from: gsap.TweenVars = { opacity: 0, y: opts.y ?? 24 };
        const to: gsap.TweenVars = {
          opacity: 1,
          y: 0,
          duration: opts.duration ?? 0.6,
          ease: EASE,
          stagger: opts.stagger ?? 0,
        };
        if (opts.scale !== undefined) {
          from.scale = opts.scale;
          to.scale = 1;
        }
        gsap.set(targets, from);
        gsap.to(targets, {
          ...to,
          ...(trigger === "scroll"
            ? {
                scrollTrigger: {
                  trigger: el,
                  start: opts.start ?? "top 85%",
                  // Reveal once, then stay revealed. This previously replayed
                  // in both directions ("play reverse play reverse"), which
                  // meant every "leave" actively re-hid the element — so any
                  // mismeasured trigger (see wireAutoRefresh) left content
                  // stuck at opacity 0 in full view instead of merely skipping
                  // an animation. An entrance effect must never be able to
                  // hide content the reader has already reached.
                  once: true,
                },
              }
            : {}),
        });
      });
    },
    { scope: ref },
  );
  return ref as RefObject<T>;
}

/**
 * Counts a number up from 0 to `value` once the element scrolls into view.
 * Reduced-motion users just keep whatever static text is already rendered in
 * JSX (the effect never runs), so the initial render must already show the
 * real final value.
 */
export function useCountUp(
  value: number,
  format: (n: number) => string = (n) => String(n),
  /** Fractional digits to keep while counting. 0 (the default) hands `format`
      whole numbers, which is what a count of rows always wants; a rating like
      4.9 needs 1 so it doesn't tick up as 5. */
  decimals = 0,
) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const counter = { n: 0 };
        gsap.to(counter, {
          n: value,
          duration: 1.2,
          ease: EASE,
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = format(
              decimals > 0 ? Number(counter.n.toFixed(decimals)) : Math.round(counter.n),
            );
          },
        });
      });
    },
    { scope: ref, dependencies: [value, decimals] },
  );
  return ref;
}
