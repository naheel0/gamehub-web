import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import { fetchGame } from "@/lib/api";
import { ArrowLeft } from "@/components/ui/icons";
import { CoinArt } from "@/components/ui/EmptyArt";

export const metadata: Metadata = {
  title: "Checkout — GameHub",
  description:
    "Choose a delivery address, review your order total, then pay through Razorpay.",
};

type Search = Promise<{ buy?: string; qty?: string }>;

/**
 * Checkout shell: the poster heading prerenders instantly; ?buy=&qty=
 * resolution (incl. the server-side game fetch for single-title orders)
 * streams behind a skeleton — games-page PPR grammar. Auth is gated
 * client-side (per-account fetches) with a ?next= back here.
 */
export default function CheckoutPage({ searchParams }: { searchParams: Search }) {
  return (
    <>
      <Navbar />
      <main id="top" className="mx-auto w-full max-w-7xl px-5 pt-24 pb-20 sm:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
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
          {/* the poster moment: the eyebrow's coin spins while the body streams */}
          <div className="pointer-events-none absolute top-1/2 right-6 hidden -translate-y-1/2 sm:block">
            <CoinArt className="h-14 w-14" />
          </div>
          <div className="relative">
            <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">
              Insert coin
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.8rem,7vw,4.8rem)] leading-[0.9] uppercase">
              Check <span className="text-accent">out</span>
            </h1>
            <p className="mt-3 max-w-[52ch] text-text">
              Choose where it lands, review the total, then finish up on Razorpay.
            </p>
          </div>
        </header>

        <div className="mt-10">
          <Suspense
            fallback={
              <div aria-busy="true" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
                <div className="grid gap-3 sm:gap-4">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-28 animate-pulse border border-line bg-surface motion-reduce:animate-none"
                    />
                  ))}
                </div>
                <div className="h-72 animate-pulse border border-line bg-surface motion-reduce:animate-none" />
              </div>
            }
          >
            <CheckoutBody searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}

async function CheckoutBody({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const buyId = sp.buy ? Number(sp.buy) : 0;
  const isBuy = Number.isInteger(buyId) && buyId > 0;
  // cold starts flake fetches — one retry before the island reports it honestly
  const buyGame = isBuy ? ((await fetchGame(buyId)) ?? (await fetchGame(buyId))) : null;
  const buyQty = Math.min(99, Math.max(1, Number(sp.qty) || 1));

  return (
    <CheckoutClient
      mode={isBuy ? "buy" : "cart"}
      buyId={isBuy ? buyId : null}
      buyGame={buyGame}
      buyQty={buyQty}
    />
  );
}
