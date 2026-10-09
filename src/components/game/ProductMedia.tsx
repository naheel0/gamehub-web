"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "@/components/ui/icons";
import Trailer from "./Trailer";
import { heroArtUrl } from "@/lib/format";

/**
 * E-com media gallery: one big stage + a tile rail underneath (Amazon-style).
 * The rail leads with a Trailer tile when the API sent a trailerUrl, then the
 * 1..N artwork tiles. Art prefers Steam's tall library_hero crop and falls
 * back to the API's own header on a load error. Tile swaps reuse the .art-in
 * remount animation.
 */
export default function ProductMedia({
  name,
  imageUrls,
  trailerUrl,
}: {
  name: string;
  imageUrls: string[];
  trailerUrl?: string;
}) {
  const [tab, setTab] = useState<"trailer" | number>(trailerUrl ? "trailer" : 0);
  const [view, setView] = useState(() => ({
    src: heroArtUrl(imageUrls[0] ?? ""),
    fallback: imageUrls[0] ?? "",
  }));

  const pickArt = (i: number) => {
    const original = imageUrls[i];
    setTab(i);
    setView({ src: heroArtUrl(original), fallback: original });
  };

  return (
    <div>
      {/* stage */}
      <div className="border border-line bg-bg-soft">
        {tab === "trailer" && trailerUrl ? (
          <Trailer url={trailerUrl} name={name} poster={imageUrls[0]} />
        ) : (
          <div className="relative aspect-video overflow-hidden">
            {view.src ? (
              <Image
                key={view.src}
                src={view.src}
                alt={`${name} key art`}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="art-in object-cover"
                onError={() =>
                  setView((v) =>
                    v.src !== v.fallback ? { ...v, src: v.fallback } : v,
                  )
                }
              />
            ) : (
              <div className="grid-floor absolute inset-0" />
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-bg/40 via-transparent to-transparent"
            />
          </div>
        )}
      </div>

      {/* tile rail */}
      <div
        role="group"
        aria-label={`${name} media`}
        className="mt-3 flex flex-wrap gap-3"
      >
        {trailerUrl && (
          <button
            type="button"
            onClick={() => setTab("trailer")}
            aria-label={`Show the ${name} trailer`}
            aria-current={tab === "trailer"}
            className={`relative flex h-16 w-28 shrink-0 flex-col items-center justify-center gap-1 border bg-surface transition-colors duration-200 sm:h-[72px] sm:w-32 ${
              tab === "trailer"
                ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]"
                : "border-line hover:border-muted"
            }`}
          >
            <Play className="h-5 w-5 text-accent" weight="fill" />
            <span className="font-mono text-[10px] tracking-[0.12em] text-muted uppercase">
              Trailer
            </span>
          </button>
        )}
        {imageUrls.map((u, i) => (
          <button
            key={u}
            type="button"
            onClick={() => pickArt(i)}
            aria-label={`Show image ${i + 1} of ${imageUrls.length}`}
            aria-current={tab === i}
            className={`relative h-16 w-28 shrink-0 overflow-hidden border transition-colors duration-200 sm:h-[72px] sm:w-32 ${
              tab === i
                ? "border-accent shadow-[0_0_0_1px_var(--color-accent)]"
                : "border-line hover:border-muted"
            }`}
          >
            <Image src={u} alt="" fill sizes="128px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
