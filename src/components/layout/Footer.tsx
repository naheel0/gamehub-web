import type { ReactNode } from "react";
import Link from "next/link";
import LogoMark from "@/components/ui/logo-mark";
import { CaretUp } from "@/components/ui/icons";

// Evaluated once at build time → stable across prerenders.
const YEAR = new Date().getFullYear();

/** Sheared lean underline — the arena mark drawn as the hover state. */
const lean = (
  <span
    aria-hidden="true"
    className="absolute -bottom-1 left-0 h-0.5 w-full origin-left -skew-x-[26deg] scale-x-0 bg-heading/50 transition-transform duration-200 group-hover:scale-x-100"
  />
);

const FOOT_LINK =
  "group relative w-fit tracking-widest text-muted uppercase transition-colors duration-200 hover:text-heading";

function FooterLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={FOOT_LINK}>
      {children}
      {lean}
    </Link>
  );
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <p className="font-mono text-xs tracking-[0.16em] text-muted uppercase">{title}</p>
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </nav>
  );
}

/**
 * Footer — the arena poster's colophon. Three-slash brand beat on top (the
 * mark echoed as pure CSS bars), four balanced columns (brand · Store ·
 * Help · Legal — every destination the site has, nothing invented), and a
 * mono meta bar with back-to-top. Link hovers reuse the navbar's skew-lean
 * grammar; motion stays CSS-only (always-loaded chrome — animation-
 * orchestrator: micro-interaction, 0 KB; a scroll-reveal would ship
 * 30–80 KB of GSAP for a footer fade). Server component, no client JS.
 */
export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-soft">
      <div className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8">
        {/* the mark echoed: three leaning bars, accent → ink → ghost */}
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="h-3.5 w-5 -skew-x-[26deg] bg-accent" />
          <span className="h-3.5 w-5 -skew-x-[26deg] bg-heading" />
          <span className="h-3.5 w-5 -skew-x-[26deg] bg-muted/30" />
        </div>

        <div className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-2xl leading-none tracking-wide text-heading uppercase">
                GameHub
              </span>
            </Link>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-muted">
              Discover, compare and buy games — every title, rating and price in
              rupees.
            </p>
            <a
              href="https://github.com/naheel0/GameHub-fullstack"
              rel="noopener noreferrer"
              target="_blank"
              className={`${FOOT_LINK} mt-5 inline-block text-sm`}
            >
              Source on GitHub
              {lean}
            </a>
          </div>

          <Column title="Store">
            <FooterLink href="/games">Store</FooterLink>
            <FooterLink href="/#featured">Featured</FooterLink>
            <FooterLink href="/#genres">Genres</FooterLink>
          </Column>

          <Column title="Help">
            <FooterLink href="/about">About</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
            <FooterLink href="/contact">Contact</FooterLink>
            <FooterLink href="/profile">Profile</FooterLink>
          </Column>

          <Column title="Legal">
            <FooterLink href="/privacy">Privacy</FooterLink>
            <FooterLink href="/terms">Terms</FooterLink>
            <FooterLink href="/refunds">Refunds</FooterLink>
            <FooterLink href="/cookies">Cookies</FooterLink>
            <FooterLink href="/shipping">Shipping</FooterLink>
            <FooterLink href="/cancellation">Cancellation</FooterLink>
            <FooterLink href="/payments">Payments</FooterLink>
          </Column>
        </div>

        <div className="mt-12 flex items-center justify-between gap-4 border-t border-line pt-6 font-mono text-xs tracking-widest text-muted uppercase">
          <p>© {YEAR} GameHub</p>
          <a
            href="#top"
            className="group inline-flex items-center gap-1.5 transition-colors duration-200 hover:text-heading"
          >
            Back to top
            <CaretUp
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
