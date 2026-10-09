"use client";

import Link from "next/link";

/** API/transport failure on a detail route — honest, never a fake404. */
export default function GameError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[70svh] w-full max-w-xl flex-col items-start justify-center px-5 py-28">
      <p className="font-mono text-xs tracking-[0.16em] text-accent uppercase">
        Connection failed
      </p>
      <h1 className="mt-3 font-display text-5xl uppercase">The arena went quiet.</h1>
      <p className="mt-4 text-text">
        The GameHub API did not respond — the catalog service may be starting up.
        Give it a moment and try again.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-12 items-center bg-accent px-7 font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center border-2 border-heading px-7 font-semibold text-heading transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-bg"
        >
          Back to the store
        </Link>
      </div>
    </main>
  );
}
