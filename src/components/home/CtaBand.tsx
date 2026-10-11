"use client";

import { useEffect, useRef } from "react";
import { ArrowRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import CountUp from "@/components/ui/CountUp";

/**
 * CTA band with the PC-98 dither glow tracking the pointer (mouse-only,
 * rAF-throttled, parks center on leave, off under reduced motion — the
 * light trails via a CSS translate transition, no JS lerp).
 */
export default function CtaBand({ count }: { count: number }) {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pending = useRef({ x: 0, y: 0 });
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const track = (clientX: number, clientY: number, pointer: string) => {
    if (pointer !== "mouse" || reduce.current) return;
    pending.current = { x: clientX, y: clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const section = sectionRef.current;
      const glow = glowRef.current;
      if (!section || !glow) return;
      const r = section.getBoundingClientRect();
      const x = pending.current.x - r.left - r.width / 2;
      const y = pending.current.y - r.top - r.height / 2;
      glow.style.translate = `calc(-50% + ${x}px) calc(-50% + ${y}px)`;
    });
  };

  return (
    <section
      ref={sectionRef}
      onPointerMove={(e) => track(e.clientX, e.clientY, e.pointerType)}
      onPointerLeave={() => {
        if (glowRef.current) glowRef.current.style.translate = "-50% -50%";
      }}
      className="relative isolate overflow-hidden border-t border-line"
    >
      <div className="grid-floor absolute inset-0 -z-10" />
      <div
        ref={glowRef}
        className="dither-glow absolute top-1/2 left-1/2 h-[640px] w-[640px] opacity-70 transition-[translate] duration-500 ease-out motion-reduce:transition-none"
        style={{ translate: "-50% -50%" }}
      />
      <div className="mx-auto w-full max-w-4xl px-5 py-28 text-center sm:px-8">
        <Reveal>
          <h2 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] uppercase">
            Pick your next game
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-lg text-text">
            {count > 0 ? (
              <>
                <CountUp value={count} /> titles, rated and priced in rupees.
              </>
            ) : (
              "Rated and priced in rupees."
            )}
          </p>
          <a
            href="#featured"
            className="group mt-9 inline-flex items-center gap-2 bg-accent px-8 py-4 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Browse the store
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
