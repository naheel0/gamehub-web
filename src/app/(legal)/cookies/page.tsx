import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Cookie policy — GameHub",
  description:
    "Every cookie GameHub sets, how long it lasts and why — two essential sign-in cookies and nothing else.",
};

const ROWS: { name: string; kind: string; lasts: string; why: string }[] = [
  {
    name: "gh_access",
    kind: "Cookie (httpOnly)",
    lasts: "15 minutes",
    why: "Keeps you signed in during your visit.",
  },
  {
    name: "gh_refresh",
    kind: "Cookie (httpOnly)",
    lasts: "7 days",
    why: "Keeps you signed in between visits.",
  },
  {
    name: "gh_consent",
    kind: "Local storage",
    lasts: "Until you clear site data",
    why: "Remembers that you dismissed the cookie notice.",
  },
  {
    name: "gh_terms",
    kind: "Local storage",
    lasts: "Until you clear site data",
    why: "Records the date you agreed to the Terms at signup.",
  },
];

export default function CookiesPage() {
  return (
    <>
      <Kicker>Legal · Effective October 12, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Cookie policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Short version: GameHub sets two essential sign-in cookies and keeps two small
        preference records in your browser. There is nothing else — no tracking, no ads.
      </p>

      <Section title="Everything we set">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-line text-muted uppercase">
                <th className="py-2 pr-4 font-medium">Name</th>
                <th className="py-2 pr-4 font-medium">Type</th>
                <th className="py-2 pr-4 font-medium">Lasts</th>
                <th className="py-2 font-medium">Why</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.name} className="border-b border-line/60 align-top">
                  <td className="py-3 pr-4 text-accent">{r.name}</td>
                  <td className="py-3 pr-4 text-muted">{r.kind}</td>
                  <td className="py-3 pr-4 text-muted">{r.lasts}</td>
                  <td className="py-3 text-text">{r.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="About the two cookies">
        <p>
          <strong className="text-heading">gh_access</strong> and{" "}
          <strong className="text-heading">gh_refresh</strong> are how staying signed in
          works. Both are httpOnly, so scripts running on the page can never read them, and
          they carry no identifiers beyond your own session.
        </p>
        <p>
          <strong className="text-heading">gh_consent</strong> and{" "}
          <strong className="text-heading">gh_terms</strong> are not cookies at all — they
          are records in your own browser (local storage). They never leave your device.
        </p>
      </Section>

      <Section title="No tracking cookies">
        <p>
          GameHub runs no analytics, no advertising and no third-party tracking. There is no
          &ldquo;manage preferences&rdquo; panel because there are no optional cookies to
          manage — everything in the table is strictly necessary for the store to function.
        </p>
      </Section>

      <Section title="Controlling them">
        <p>
          Clear cookies and site data in your browser settings at any time. The two session
          cookies are removed with them, which signs you out of GameHub — sign in again and
          they are recreated. Your cart and wishlist live with your account, so nothing is
          lost.
        </p>
        <p>
          How we handle your information overall is described in the{" "}
          <Link href="/privacy" className={inlineLink}>
            privacy policy
          </Link>
          .
        </p>
        <ContactLine />
      </Section>
    </>
  );
}
