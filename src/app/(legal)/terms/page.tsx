import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Terms of service — GameHub",
  description:
    "The ground rules for using GameHub: accounts, orders, acceptable use and the basics of how the store operates.",
};

export default function TermsPage() {
  return (
    <>
      <Kicker>Legal · Effective October 12, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Terms of service</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        These terms govern your use of GameHub. Creating an account or using the store means
        you accept them — please read them.
      </p>

      <Section title="Eligibility">
        <p>
          You must be at least 18 years old to create a GameHub account. If the law where
          you live sets a higher age for entering contracts, that age applies.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          Sign-up works by verifying your email with a one-time code, so keep that inbox
          current. Provide accurate details, keep your password to yourself, and tell us
          promptly if you think your account has been accessed by someone else. You are
          responsible for what happens under your account.
        </p>
      </Section>

      <Section title="The store and pricing">
        <p>
          GameHub lists games with prices in Indian rupees. Prices and availability can
          change at any time, and catalogue details are provided as listed. If a price or
          listing is obviously wrong, we may correct it — and if you have already ordered
          at the wrong price, we will contact you rather than quietly charge it.
        </p>
      </Section>

      <Section title="Orders">
        <p>
          Orders you place appear in the order history on your{" "}
          <Link href="/profile" className={inlineLink}>
            profile page
          </Link>
          . We may decline or cancel an order — for example, a pricing error, a stock issue
          or suspected fraud — and anything already paid will be refunded. Purchases are
          covered by the{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>
          .
        </p>
      </Section>

      <Section title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>use GameHub for anything unlawful, fraudulent or abusive;</li>
          <li>interfere with the site — hacking, overloading, scraping at scale or bypassing security;</li>
          <li>manipulate prices, ratings or order history;</li>
          <li>impersonate another person or misrepresent your affiliation.</li>
        </ul>
        <p>
          We may suspend an account that breaks these rules while we look into it.
        </p>
      </Section>

      <Section title="Ownership">
        <p>
          The GameHub name, site design and code are ours (the source is published on{" "}
          <a
            href="https://github.com/naheel0/GameHub-fullstack"
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLink}
          >
            GitHub
          </a>
          ). Game titles, artwork, logos and trademarks belong to their respective
          publishers and developers. Buying a game gives you the licence that game provides
          — not ownership of its content.
        </p>
      </Section>

      <Section title="External links">
        <p>
          GameHub links outward for attributions and source code (for example, the 3D
          model credits). Those sites run under their own terms and policies, not ours.
        </p>
      </Section>

      <Section title="Disclaimers and liability">
        <p>
          GameHub is provided &ldquo;as is&rdquo; without warranties beyond what the law
          requires. To the extent the law allows, we are not liable for indirect or
          consequential losses arising from your use of the site. Nothing in these terms
          limits rights you have under applicable consumer law that cannot be limited.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms; the current version always lives on this page with its
          effective date. Continuing to use GameHub after a change means you accept it.
        </p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of India.</p>
        <ContactLine />
      </Section>
    </>
  );
}
