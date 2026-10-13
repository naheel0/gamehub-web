import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WishlistClient from "@/components/wishlist/WishlistClient";
import GlbPanel from "@/components/three/GlbPanel";
import { ArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Wishlist — GameHub",
  description:
    "Every title you've saved on GameHub — move one to the cart when you're ready, or remove it from the arena.",
};

/**
 * Static shell (PPR): the poster heading renders instantly; the list body
 * resolves client-side because wishlist state is per-account.
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

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end">
          <header>
            <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">Your shortlist</p>
            <h1 className="mt-3 font-display text-[clamp(2.8rem,7vw,4.8rem)] leading-[0.9] uppercase">
              Your <span className="text-accent">wishlist</span>
            </h1>
            <p className="mt-3 max-w-[52ch] text-text">
              Titles you&apos;ve flagged for later — move one to the cart when you&apos;re ready.
            </p>
          </header>

          {/* CC BY rail — the wishlist's one 3D moment; caption required */}
          <div className="relative">
            <GlbPanel src="/models/steamdeck.glb" fitSize={0.34} className="h-56 sm:h-64 lg:h-72" />
            <a
              href="https://sketchfab.com/3d-models/steam-deck-console-46e0c05675a7442dbe73f261436e6819"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-4 font-mono text-[10px] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:text-accent"
            >
              Model: wallmasterr · CC BY 4.0
            </a>
          </div>
        </div>

        <div className="mt-10">
          <WishlistClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
