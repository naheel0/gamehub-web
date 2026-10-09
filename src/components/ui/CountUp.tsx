"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Ticks a number up to its API-provided value when scrolled into view.
 * The final value ships in the HTML (static prerender is truthful); the
 * animation only rewrites textContent client-side, so no re-renders and
 * no hydration mismatch. Reduced motion: the value simply stands.
 */
export default function CountUp({ value, duration = 0.9 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView || reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      el.textContent = String(Math.round(value * (1 - (1 - p) ** 3))); // easeOutCubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {value}
    </span>
  );
}
