import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE = "power2.out";

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
        const targets = opts.stagger ? (gsap.utils.toArray(el.children) as HTMLElement[]) : [el];
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
                  // Replay on every entry: play on enter (either direction),
                  // reverse back to the hidden `from` state on leave (either
                  // direction) — not once-only.
                  toggleActions: "play reverse play reverse",
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
export function useCountUp(value: number, format: (n: number) => string = (n) => String(n)) {
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
            el.textContent = format(Math.round(counter.n));
          },
        });
      });
    },
    { scope: ref, dependencies: [value] },
  );
  return ref;
}
