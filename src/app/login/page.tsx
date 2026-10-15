import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import ControllerScene from "@/components/auth/ControllerScene";
import Reveal from "@/components/ui/Reveal";
import { ArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Sign in — GameHub",
  description: "Sign in to your GameHub account.",
};

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main id="top" className="grid min-h-svh lg:grid-cols-2">
        {/* form side */}
        <div className="order-2 flex flex-col justify-center px-5 py-14 sm:px-10 lg:order-1 lg:px-16">
          <Reveal y={20}>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to the arena
            </Link>
            <h1 className="font-display text-[clamp(2.6rem,6vw,4rem)] leading-[0.9] uppercase">
              Enter the <span className="text-accent">arena</span>
            </h1>
            <p className="mt-3 mb-8 max-w-[42ch] text-text">
              Sign in to pick up where you left off.
            </p>
            <AuthForm mode="login" />
          </Reveal>
        </div>

        {/* key side: slim band on mobile, full panel on desktop */}
        <div className="relative order-1 mt-16 h-52 overflow-hidden border-b border-line lg:order-2 lg:mt-0 lg:h-auto lg:border-b-0 lg:border-l">
          <div
            aria-hidden="true"
            className="dither-glow pointer-events-none absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 opacity-70"
          />
          <ControllerScene className="absolute inset-0" />
          <p className="absolute bottom-4 left-5 hidden font-mono text-[11px] tracking-[0.2em] text-muted uppercase sm:block lg:bottom-8 lg:left-8">
            Player one, sign in
          </p>
          {/* CC BY 4.0 requires crediting the model author */}
          <a
            href="https://sketchfab.com/3d-models/ps5-controller-b7bb9c5102a04cb0b1966c6d02bad7d6"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-4 bottom-4 font-mono text-[10px] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:text-accent lg:right-8 lg:bottom-8"
          >
            Model: Taohid Animation · CC BY 4.0
          </a>
        </div>
      </main>
    </>
  );
}
