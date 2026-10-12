import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartClient from "@/components/cart/CartClient";
import { ArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Cart — GameHub",
  description:
    "Your GameHub cart — check quantities and your subtotal, then head to checkout.",
};

/**
 * Static shell (PPR): poster heading renders instantly; lines, summary and
 * checkout live client-side because cart state is per-account. The heading
 * band carries the panel grammar (dither glow + grid floor) as type instead
 * of a scene — this is the app's most task-focused page.
 */
export default function CartPage() {
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

        <header className="relative mt-6 overflow-hidden border border-line bg-surface/40 px-5 py-8 sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="grid-floor pointer-events-none absolute inset-0 opacity-70"
          />
          <div
            aria-hidden="true"
            className="dither-glow pointer-events-none absolute top-1/2 left-1/3 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 opacity-60"
          />
          <div className="relative">
            <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">Loadout check</p>
            <h1 className="mt-3 font-display text-[clamp(2.8rem,7vw,4.8rem)] leading-[0.9] uppercase">
              Your <span className="text-accent">cart</span>
            </h1>
            <p className="mt-3 max-w-[52ch] text-text">
              Check your picks and quantities, then head to checkout.
            </p>
          </div>
        </header>

        <div className="mt-10">
          <CartClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
