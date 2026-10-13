import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "About us — GameHub",
  description:
    "GameHub is a digital game store: a catalogue priced in rupees, payments through Razorpay, and purchases delivered straight to your account.",
};

export default function AboutPage() {
  return (
    <>
      <Kicker>About · GameHub</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">About us</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        GameHub is a digital store for games — a catalogue you can browse by genre,
        rating and price, priced in rupees end to end.
      </p>

      <Section title="What we sell">
        <p>
          Every title on GameHub is a digital game. There are no discs, no boxes and
          nothing to ship: buying a game gives you the licence that game provides,
          delivered straight to your account. Game titles, artwork and trademarks
          belong to their respective publishers and developers.
        </p>
      </Section>

      <Section title="How buying works">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Browse the{" "}
            <Link href="/games" className={inlineLink}>
              catalogue
            </Link>{" "}
            — every price is listed in Indian rupees, with no currency conversion at
            checkout.
          </li>
          <li>
            Pay through Razorpay, our payment provider. The methods offered and any
            tax on the order are shown before you confirm — see the{" "}
            <Link href="/payments" className={inlineLink}>
              payment policy
            </Link>
            .
          </li>
          <li>
            Once payment is confirmed, the purchase appears in your order history on
            the{" "}
            <Link href="/profile" className={inlineLink}>
              profile page
            </Link>
            .
          </li>
        </ol>
        <p>
          If something goes wrong — a purchase that never arrives or does not work as
          described — the{" "}
          <Link href="/refunds" className={inlineLink}>
            refund policy
          </Link>{" "}
          covers you for 7 days.
        </p>
      </Section>

      <Section title="How we show the catalogue">
        <p>
          Ratings and prices are shown as they are supplied to us, and the store page
          is always the current listing for a game. The store itself is built in the
          open — the source is published on{" "}
          <a
            href="https://github.com/naheel0/GameHub-fullstack"
            target="_blank"
            rel="noopener noreferrer"
            className={inlineLink}
          >
            GitHub
          </a>
          .
        </p>
      </Section>

      <Section title="Policies in plain words">
        <p>
          The day-to-day details live in the{" "}
          <Link href="/shipping" className={inlineLink}>
            shipping &amp; delivery
          </Link>
          ,{" "}
          <Link href="/cancellation" className={inlineLink}>
            cancellation
          </Link>{" "}
          and{" "}
          <Link href="/payments" className={inlineLink}>
            payment
          </Link>{" "}
          policies — written to be read, not skimmed.
        </p>
        <ContactLine />
      </Section>
    </>
  );
}
