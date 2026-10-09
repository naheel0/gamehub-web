"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "@/components/ui/icons";

/**
 * Click-to-play trailer facade: the poster ships with the page and no
 * third-party request happens until the player asks for it (youtube-nocookie,
 * autoplay only after the click gesture). Static under reduced motion.
 */
export default function Trailer({
  url,
  name,
  poster,
}: {
  url: string;
  name: string;
  poster?: string;
}) {
  const [playing, setPlaying] = useState(false);

  /* HUD corner ticks: 1px accent brackets, structural not decorative fill */
  const ticks = (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
      <span className="absolute top-0 left-0 h-3 w-3 border-t border-l border-accent/70" />
      <span className="absolute top-0 right-0 h-3 w-3 border-t border-r border-accent/70" />
      <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-accent/70" />
      <span className="absolute right-0 bottom-0 h-3 w-3 border-r border-b border-accent/70" />
    </span>
  );

  if (playing) {
    const embed =
      url.replace(/(www\.)?youtube\.com\/embed\//, "www.youtube-nocookie.com/embed/") +
      (url.includes("?") ? "&" : "?") +
      "autoplay=1";
    return (
      <div className="relative aspect-video overflow-hidden border border-line bg-bg">
        <iframe
          src={embed}
          title={`${name} trailer`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play the ${name} trailer`}
      className="group relative block aspect-video w-full overflow-hidden border border-line bg-bg-soft"
    >
      {ticks}
      {poster && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-bg/40 transition-colors duration-200 group-hover:bg-bg/25"
      />
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center bg-accent text-bg shadow-xl transition-transform duration-200 group-hover:scale-110 active:scale-95">
          <Play className="h-7 w-7" weight="fill" />
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-3 left-4 font-mono text-[11px] tracking-[0.14em] text-heading uppercase"
      >
        Trailer
      </span>
    </button>
  );
}
