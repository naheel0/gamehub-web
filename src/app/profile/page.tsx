import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProfileClient from "@/components/profile/ProfileClient";

export const metadata: Metadata = {
  title: "Profile — GameHub",
  description:
    "Your GameHub profile — personal details, delivery addresses, and every order you've placed.",
};

/**
 * Static shell (PPR): poster heading renders instantly; details, addresses
 * and orders live client-side because they're per-account. Heading band
 * carries the panel grammar (dither glow + grid floor) as type — no scene
 * needed on a task page (cart grammar).
 */
export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <main id="top" className="mx-auto w-full max-w-7xl px-5 pt-24 pb-20 sm:px-8">
        <header className="relative overflow-hidden border border-line bg-surface/40 px-5 py-8 sm:px-8 sm:py-10">
          <div
            aria-hidden="true"
            className="grid-floor pointer-events-none absolute inset-0 opacity-70"
          />
          <div
            aria-hidden="true"
            className="dither-glow pointer-events-none absolute top-1/2 left-1/3 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 opacity-60"
          />
          <div className="relative">
            <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">Player one</p>
            <h1 className="mt-3 font-display text-[clamp(2.8rem,7vw,4.8rem)] leading-[0.9] uppercase">
              Your <span className="text-accent">profile</span>
            </h1>
            <p className="mt-3 max-w-[52ch] text-text">
              Details, delivery addresses, and every order you&apos;ve placed — all in one place.
            </p>
          </div>
        </header>

        <div className="mt-10">
          <ProfileClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
