"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

/**
 * Honest, non-modal cookie notice as a small corner card — quiet,
 * dismissible, never a fake preferences center (the site sets only the
 * two httpOnly session cookies, so there is nothing to toggle).
 * Dismissal lives in localStorage — the record stays in the browser only.
 *
 * Reads storage via useSyncExternalStore: server and hydration both see
 * "dismissed" (no mismatch, nothing in SSR HTML), then the real value
 * lands right after hydration and the card rises in once. Same-tab
 * dismissal can't fire the `storage` event, so the click keeps its own
 * state on top. Not a toast: consent must survive until acknowledged.
 */
const readDismissed = () => {
  try {
    return localStorage.getItem("gh_consent") === "1";
  } catch {
    return true; // storage blocked (private mode): never nag
  }
};

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export default function CookieConsent() {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => true);
  const [hidden, setHidden] = useState(false);

  if (dismissed || hidden) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("gh_consent", "1");
    } catch {
      // storage blocked: dismissed for this visit only
    }
    setHidden(true);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="consent-in fixed right-4 bottom-4 left-4 z-50 border border-line border-l-2 border-l-accent bg-surface p-5 shadow-[0_20px_44px_-16px_rgb(0_0_0_/_0.75)] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[20.5rem]"
    >
      <p className="font-mono text-[11px] tracking-[0.14em] text-accent uppercase">Cookies</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Two essential cookies keep you signed in — no tracking, no ads.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Link
          href="/cookies"
          className="font-mono text-[11px] tracking-[0.1em] text-muted uppercase underline decoration-dotted underline-offset-4 transition-colors duration-200 hover:text-accent"
        >
          Cookie policy
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="h-9 shrink-0 bg-accent px-5 text-xs font-semibold text-bg transition-transform duration-150 hover:-translate-y-0.5"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
