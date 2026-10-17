"use client";

import { createRoot } from "react-dom/client";
import { CoinArt } from "@/components/ui/EmptyArt";

/**
 * The add-to-cart moment: a spinning coin arcs from the clicked control to
 * the navbar cart icon, where the badge pop (announceCounts → badge-pop)
 * is the landing. Pure WAAPI — no React state, no global registry. Call it
 * only on confirmed success, and it no-ops under prefers-reduced-motion,
 * where the badge stays the whole story.
 */
export function flyToCart(from: Element) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.querySelector('header a[href="/cart"]');
  if (!target) return;

  const SIZE = 28;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  // a 0×0 rect means the control is display:none — an arc to nowhere reads
  // as a glitch; let the badge pop alone tell the story
  if (a.width === 0 || a.height === 0 || b.width === 0 || b.height === 0) return;
  const x0 = a.left + a.width / 2 - SIZE / 2;
  const y0 = a.top + a.height / 2 - SIZE / 2;
  const x1 = b.left + b.width / 2 - SIZE / 2;
  const y1 = b.top + b.height / 2 - SIZE / 2;
  // quadratic arc: crest lifts above the straight line
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - 140;

  const host = document.createElement("span");
  host.setAttribute("aria-hidden", "true");
  host.dataset.ghFly = "1";
  host.style.cssText = `position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;pointer-events:none;z-index:80;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  root.render(<CoinArt className="h-full w-full text-accent" />);

  const frames = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t ** 2 * x1;
    const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t ** 2 * y1;
    return {
      transform: `translate(${x}px, ${y}px) scale(${1 - 0.55 * t})`,
      opacity: t > 0.85 ? 0 : 1,
      offset: t,
    };
  });
  const anim = host.animate(frames, {
    duration: 700,
    easing: "cubic-bezier(0.33, 0, 0.2, 1)",
  });
  anim.onfinish = () => {
    root.unmount();
    host.remove();
  };
}
