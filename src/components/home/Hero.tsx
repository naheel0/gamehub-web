"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Pause, Play, Star } from "@/components/ui/icons";
import EmberField from "./EmberField";
import { formatPrice, heroArtUrl } from "@/lib/format";
import type { Game } from "@/lib/types";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// wall-clock timing: default lag smoothing stretches the entrance into a
// crawl on slow-GPU devices (and headless captures), leaving the staggered
// CTAs visibly misaligned mid-tween. lagSmoothing(0) is GSAP's own fix.
gsap.ticker.lagSmoothing(0);

/**
 * Signature moment: the featured title swap — key art cuts to the next
 * game under a crimson sweep line while the meta card re-deals. The swap
 * itself is remount-driven CSS (see .deal-in/.art-in/.sweep-run); GSAP
 * owns the entrance and the scrub. Rotation is pausable (WCAG 2.2.2),
 * pauses off-tab, and never runs under prefers-reduced-motion.
 */
export default function Hero({ games, count }: { games: Game[]; count: number }) {
  const scope = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rotating = games.length > 1 && !paused && !reduce;

  // auto-advance, paused while the tab is hidden
  useEffect(() => {
    if (!rotating) return;
    const id = setInterval(
      () => !document.hidden && setIndex((i) => (i + 1) % games.length),
      6000,
    );
    return () => clearInterval(id);
  }, [rotating, games.length]);

  const game = games[index];

  // entrance: masked line rise, sub, CTAs, meta card (final state ships
  // when reduced motion — matchMedia gate, no timeline is built)
  useGSAP(
    () => {
      if (reduce) return;
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from("[data-hero-line]", { yPercent: 118, duration: 1, stagger: 0.1 }, 0)
        .from("[data-hero-sub]", { y: 22, opacity: 0, duration: 0.8 }, 0.35)
        .from("[data-hero-ctas]", { y: 18, opacity: 0, duration: 0.7 }, 0.5)
        .from("[data-hero-meta]", { x: -28, opacity: 0, duration: 0.8 }, 0.55);
    },
    { scope, dependencies: [reduce] },
  );

  // parallax scrub on exit (decorative only, ease none per GSAP rule)
  useGSAP(
    () => {
      if (reduce) return;
      gsap.to("[data-art]", {
        yPercent: 14,
        ease: "none",
        scrollTrigger: { trigger: scope.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-glow]", {
        opacity: 0.25,
        ease: "none",
        scrollTrigger: { trigger: scope.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope, dependencies: [reduce] },
  );

  const empty = !game;

  return (
    <section
      id="top"
      ref={scope}
      className="relative isolate flex min-h-[100svh] items-end overflow-hidden"
    >
      {/* key-art layer */}
      <div data-art className="absolute inset-0 -z-10">
        {game?.imageUrls[0] ? (
          <Image
            key={game.id}
            src={heroArtUrl(game.imageUrls[0])}
            alt={`${game.name} key art`}
            fill
            sizes="100vw"
            className="art-in object-cover object-center"
            onError={(e) => {
              // hashed store_item_assets apps may not serve derived names
              const t = e.currentTarget;
              if (t.dataset.fb) return;
              t.dataset.fb = "1";
              t.src = game.imageUrls[0];
            }}
          />
        ) : (
          <div className="grid-floor absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-bg/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/10 to-bg/70" />
        <div
          data-glow
          className="dither-glow absolute -left-32 top-1/4 h-[560px] w-[560px] opacity-90"
        />
        {/* crimson sweep: re-runs on every swap (remount via key) */}
        <div
          key={game?.id ?? "none"}
          data-sweep
          className="sweep-run absolute inset-x-0 top-1/2 h-px -rotate-2 bg-accent opacity-0 shadow-[0_0_18px_2px_rgb(255_45_85_/_0.8)]"
        />
      </div>

      <EmberField className="absolute inset-0 -z-10" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 pb-16 sm:px-8">
        <h1 className="font-display text-[clamp(2.9rem,9vw,6rem)] leading-[0.92] tracking-[-0.02em] uppercase">
          <span className="block overflow-hidden pb-1">
            <span data-hero-line className="block">
              {empty ? "CATALOG" : `${count} GAMES.`}
            </span>
          </span>
          <span className="block overflow-hidden pb-1">
            <span data-hero-line className="block text-accent">
              {empty ? "RELOADING." : "ONE ARENA."}
            </span>
          </span>
        </h1>

        <p data-hero-sub className="mt-6 max-w-[62ch] text-lg text-text sm:text-xl">
          {empty
            ? "The GameHub catalog did not load — the API may be starting up. Give it a moment and refresh."
            : "Epic adventures, fierce rivals, and everything in between — your next favorite game is waiting in the arena."}
        </p>

        {/* one shared height + one animation unit: staggered per-button tweens
            made the pair read as misaligned mid-entrance */}
        <div data-hero-ctas className="mt-9 flex flex-wrap items-center gap-3">
          <a
            data-hero-cta
            href="#featured"
            className="group inline-flex h-12 items-center gap-2 bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Browse the store
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
          <a
            data-hero-cta
            href="#genres"
            className="inline-flex h-12 items-center gap-2 border-2 border-heading px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-bg"
          >
            Shop by genre
          </a>
        </div>

        {/* featured card — media-card grammar (art rail + docked data strip):
            one swap unit, price anchored to the title, controls on the data row */}
        <div
          data-hero-meta
          className="mt-12 flex w-full max-w-xl border border-line bg-surface/90 shadow-xl backdrop-blur-md"
        >
          {game ? (
            <div key={game.id} className="deal-in flex w-full">
              {/* key-art rail */}
              <div className="relative w-24 shrink-0 border-r border-line sm:w-32">
                {game.imageUrls[0] ? (
                  <Image
                    src={game.imageUrls[0]}
                    alt=""
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid-floor absolute inset-0" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface/80" />
              </div>

              {/* content column */}
              <div className="min-w-0 flex-1">
                {/* title + price share the top line */}
                <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-2.5 sm:px-5">
                  <h2 className="min-w-0 font-display text-xl leading-[0.95] text-balance uppercase sm:text-2xl">
                    <Link
                      href={`/games/${game.id}`}
                      className="transition-colors duration-200 hover:text-accent"
                    >
                      {game.name}
                    </Link>
                  </h2>
                  <span className="shrink-0 font-mono text-lg leading-none font-bold tabular-nums text-accent sm:text-xl">
                    {formatPrice(game.price)}
                  </span>
                </div>

                {/* genre / platform */}
                <p className="px-4 pb-3 font-mono text-[11px] tracking-[0.14em] text-muted uppercase sm:px-5">
                  {game.genre} · {game.platform}
                </p>

                {/* data strip: rating · stock · rotation controls.
                    flex-wrap + nowrap groups: on narrow screens the controls
                    drop to their own line instead of breaking the labels */}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line bg-bg-soft/60 px-4 py-2.5 sm:px-5">
                  <div className="flex shrink-0 items-center gap-3 font-mono text-[11px] whitespace-nowrap tracking-[0.1em] uppercase">
                    <span className="flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-accent" weight="fill" />
                      <b className="font-bold tabular-nums text-heading">
                        {game.rating.toFixed(1)}
                      </b>
                      <span className="text-muted">/5</span>
                    </span>
                    <span aria-hidden="true" className="h-3 w-px bg-line" />
                    <span className="flex items-center gap-1.5">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 rounded-full ${
                          game.inStock ? "bg-accent" : "bg-muted"
                        }`}
                      />
                      <span className={game.inStock ? "text-heading" : "text-muted"}>
                        {game.inStock ? "In stock" : "Sold out"}
                      </span>
                    </span>
                  </div>

                  {games.length > 1 && (
                    <div className="flex shrink-0 items-center gap-2.5">
                      <div className="flex gap-1.5">
                        {games.map((g, i) => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-label={`Show ${g.name}`}
                            aria-current={i === index}
                            className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                              i === index ? "bg-accent" : "bg-line hover:bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[11px] tabular-nums text-muted">
                        {index + 1}/{games.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPaused((p) => !p)}
                        aria-label={
                          paused
                            ? "Resume featured rotation"
                            : "Pause featured rotation"
                        }
                        className="flex h-7 w-7 items-center justify-center border border-line text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
                      >
                        {paused ? (
                          <Play className="h-3.5 w-3.5" weight="fill" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" weight="fill" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p key="empty-meta" className="deal-in p-5 text-sm text-muted">
              Live titles will appear here as soon as the catalog responds.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
