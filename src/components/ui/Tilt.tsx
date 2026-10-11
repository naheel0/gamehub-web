"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";

/**
 * Pointer-tracked 3D tilt (skill: gsap hover-microinteraction, Complex
 * tier): perspective rotation follows the cursor via quickTo (no tween
 * churn on move), clamped so the card never leaves its hit box, reverses
 * on leave. Gated: reduced motion, coarse pointers (touch), and no-JS all
 * ship the flat card.
 */
export default function Tilt({
  children,
  className,
  max = 5,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    gsap.set(el, { transformPerspective: 900 });
    const rxTo = gsap.quickTo(el, "rotationX", { duration: 0.3, ease: "power2.out" });
    const ryTo = gsap.quickTo(el, "rotationY", { duration: 0.3, ease: "power2.out" });

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ryTo(((e.clientX - r.left) / r.width - 0.5) * max * 2);
      rxTo(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
    };
    const onLeave = () => {
      rxTo(0);
      ryTo(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, max]);

  return (
    <div ref={ref} className={`will-change-transform ${className ?? ""}`}>
      {children}
    </div>
  );
}
