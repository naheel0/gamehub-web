import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeartScene from "@/components/wishlist/HeartScene";
import WishlistClient from "@/components/wishlist/WishlistClient";
import { ArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Wishlist — GameHub",
  description:
    "Every title you've saved on GameHub — move one to the cart when you're ready, or remove it from the arena.",
};

/**
 * Static shell (PPR): poster heading + sticky heart panel render instantly;
 * the list body resolves client-side because wishlist state is per-account.
 */
export default function WishlistPage() {
  return (
    <>
      <Navbar />
      <main id="top" className="mx-auto w-full max-w-7xl px-5 pt-24 pb-20 sm:px-8">
        <Link
          href="/games"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to the store
        </Link>

        <header className="mt-6">
          <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">Your shortlist</p>
          <h1 className="mt-3 font-display text-[clamp(2.8rem,7vw,4.8rem)] leading-[0.9] uppercase">
            Your <span className="text-accent">wishlist</span>
          </h1>
          <p className="mt-3 max-w-[52ch] text-text">
            Titles you&apos;ve flagged for later — move one to the cart when you&apos;re ready.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
          <WishlistClient />

          {/* panel: slim band on mobile, sticky poster on desktop */}
          <aside className="relative order-first h-44 overflow-hidden border border-line bg-surface/40 lg:order-none lg:sticky lg:top-24 lg:h-[440px] lg:self-start">
            <div
              aria-hidden="true"
              className="dither-glow pointer-events-none absolute top-1/2 left-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 opacity-70"
            />
            <HeartScene className="absolute inset-0" />
            <p className="absolute bottom-4 left-5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase">
              Saved for the arena
            </p>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
