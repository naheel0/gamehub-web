"use client";

import { useEffect, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

/**
 * Ticks a number up to its API-provided value when scrolled into view.
 * The final value ships in the HTML (static prerender is truthful); the
 * animation only rewrites textContent client-side, so no re-renders and
 * no hydration mismatch. Reduced motion: the value simply stands.
 * `format` renders money-style output (e.g. formatPrice) at every tick;
 * updates re-tick from the last shown value instead of restarting at 0.
 */
export default function CountUp({
  value,
  duration = 0.9,
  format,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  // callers may pass an inline formatter; the ref (synced in an effect,
  // before the tick effect) keeps identity churn out of the tick deps so
  // parent re-renders can't restart the animation
  const fmtRef = useRef(format);
  const fromRef = useRef(0);

  useEffect(() => {
    fmtRef.current = format;
  }, [format]);

  useEffect(() => {
    if (!inView || reduce) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const from = fromRef.current;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (duration * 1000));
      const n = Math.round(from + (value - from) * (1 - (1 - p) ** 3)); // easeOutCubic
      el.textContent = fmtRef.current ? fmtRef.current(n) : String(n);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {format ? format(value) : value}
    </span>
  );
}
