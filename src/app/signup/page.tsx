import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import AuthForm from "@/components/auth/AuthForm";
import GlbPanel from "@/components/three/GlbPanel";
import { ArrowLeft } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Create your account — GameHub",
  description: "Join GameHub — verify your email and create your account.",
};

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main id="top" className="grid min-h-svh lg:grid-cols-2">
        {/* form side */}
        <div className="order-2 flex flex-col justify-center px-5 py-14 sm:px-10 lg:order-1 lg:px-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-mono text-xs tracking-[0.14em] text-muted uppercase transition-colors duration-200 hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the arena
          </Link>
          <h1 className="font-display text-[clamp(2.6rem,6vw,4rem)] leading-[0.9] uppercase">
            Press <span className="text-accent">start</span>
          </h1>
          <p className="mt-3 mb-8 max-w-[46ch] text-text">
            Verify your email, choose a password, and the arena is yours.
          </p>
          <AuthForm mode="signup" />
        </div>

        {/* key side: slim band on mobile, full panel on desktop */}
        <div className="relative order-1 mt-16 h-52 overflow-hidden border-b border-line lg:order-2 lg:mt-0 lg:h-auto lg:border-b-0 lg:border-l">
          <div
            aria-hidden="true"
            className="dither-glow pointer-events-none absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 opacity-70"
          />
          <GlbPanel src="/models/arcademachine.glb" fitSize={1.7} className="absolute inset-0" />
          {/* caption + credit: stacked in the short mobile band, split across
              the full-height desktop panel */}
          <p className="absolute bottom-3 left-5 font-mono text-[11px] tracking-[0.2em] text-muted uppercase lg:bottom-8 lg:left-8">
            Insert coin
          </p>
          {/* CC BY 4.0 requires crediting the model author — top-left on
              mobile (the tall cabinet occupies the center column), split
              across the full-height desktop panel */}
          <a
            href="https://sketchfab.com/3d-models/arcade-machine-a914bf3651e3496ea708dc0782eca212"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 left-5 font-mono text-[10px] tracking-[0.1em] text-muted uppercase transition-colors duration-200 hover:text-accent lg:top-auto lg:right-8 lg:bottom-8 lg:left-auto"
          >
            Model: Logotyp · CC BY 4.0
          </a>
        </div>
      </main>
    </>
  );
}
