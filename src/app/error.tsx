"use client";

import Link from "next/link";

/**
 * App-level error boundary: honest failure copy, a retry that replays the
 * failed segment (reset), and a way back to the store. Sits inside the
 * root layout (fonts/tokens available) but must carry its own content —
 * page chrome like the navbar lives per page, not in the layout.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <div className="deal-in w-full max-w-md border border-line bg-surface p-8 text-center ring-1 ring-accent/40">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Signal lost
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none uppercase">
          Something broke
        </h1>
        <p className="mt-4 text-sm text-text">
          That page hit an error on our side. Nothing was charged or changed
          — try again, or head back to the store.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 items-center bg-accent px-6 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center border border-line px-6 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:text-accent"
          >
            Back to the store
          </Link>
        </div>
      </div>
    </main>
  );
}
