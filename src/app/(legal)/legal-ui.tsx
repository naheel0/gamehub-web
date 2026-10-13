import type { ReactNode } from "react";

/** Prose primitives shared by the four legal pages — one source of heading
 *  styles so the document set reads as one voice. */

export const inlineLink =
  "text-heading underline decoration-accent decoration-2 underline-offset-4 hover:text-accent";

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-mono text-xs tracking-[0.16em] text-accent uppercase">{children}</p>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl tracking-wide text-heading uppercase">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-text">{children}</div>
    </section>
  );
}

/** Contact line reused by every legal page — the one real channel. */
export function ContactLine() {
  return (
    <p>
      Questions? Email{" "}
      <a href="mailto:contact@gamehub.com" className={inlineLink}>
        contact@gamehub.com
      </a>
      .
    </p>
  );
}
