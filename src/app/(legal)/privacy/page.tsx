import type { Metadata } from "next";
import Link from "next/link";
import { ContactLine, Kicker, Section, inlineLink } from "../legal-ui";

export const metadata: Metadata = {
  title: "Privacy policy — GameHub",
  description:
    "What GameHub collects, why we collect it, and the cookies we use. No analytics, no tracking, no ads.",
};

export default function PrivacyPage() {
  return (
    <>
      <Kicker>Legal · Effective October 12, 2026</Kicker>
      <h1 className="mt-3 font-display text-5xl uppercase">Privacy policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This policy covers the GameHub store and your GameHub account. It follows one rule:
        we only collect what the store actually needs to work.
      </p>

      <Section title="What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-heading">Account details</strong> — email address, first
            name, last name and phone number, set when you register. Used to create your
            account, sign you in and identify your orders.
          </li>
          <li>
            <strong className="text-heading">Your password</strong> — used only to sign you
            in. It is sent over an encrypted connection and never shown back to you.
          </li>
          <li>
            <strong className="text-heading">Email verification codes</strong> — a one-time
            6-digit code proves the email is yours. Codes expire in 10 minutes.
          </li>
          <li>
            <strong className="text-heading">Delivery addresses</strong> — recipient name,
            street, city, state, postal code, country and phone, saved in your address book
            so orders can be delivered.
          </li>
          <li>
            <strong className="text-heading">Orders</strong> — the games you bought, prices,
            totals, order status and payment method, so you have history and support can
            help.
          </li>
          <li>
            <strong className="text-heading">Cart and wishlist</strong> — the items you save,
            stored with your account so they are still there next visit.
          </li>
          <li>
            <strong className="text-heading">Consent records</strong> — the date you accepted
            the cookie notice and agreed to the Terms at signup. These live in your own
            browser, not on our servers.
          </li>
        </ul>
      </Section>

      <Section title="How we use it">
        <p>
          To run the store: keep you signed in, remember your cart and wishlist, deliver
          purchases, keep your order history, and answer you if you contact us. That is all
          — your details are never used for advertising.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          GameHub sets exactly two cookies, both strictly necessary for signing in:{" "}
          <strong className="text-heading">gh_access</strong> (15 minutes) and{" "}
          <strong className="text-heading">gh_refresh</strong> (7 days). Both are httpOnly,
          so page scripts cannot read them. The full table lives on the{" "}
          <Link href="/cookies" className={inlineLink}>
            cookie policy
          </Link>{" "}
          page.
        </p>
      </Section>


      <Section title="No tracking">
        <p>
          GameHub contains no analytics, no advertising and no tracking scripts — there is
          nothing on this site that follows you around the web. We do not sell, rent or
          trade your personal information.
        </p>
      </Section>

      <Section title="Who can see it">
        <p>
          Only the people and services that operate GameHub and fulfil your orders. If a
          payment provider processes your purchase, they handle your payment details under
          their own privacy policy. We never share your data for marketing.
        </p>
      </Section>

      <Section title="Retention and deletion">
        <p>
          Your details stay while your account is open. Ask us to delete your account and
          its data at any time by email and we will remove it, except records we must keep
          by law.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          You can view and correct your name, email and phone on the{" "}
          <Link href="/profile" className={inlineLink}>
            profile page
          </Link>
          , and manage your addresses there too. For access, deletion or any other question
          about your data, email us.
        </p>
        <ContactLine />
      </Section>

      <Section title="Changes">
        <p>
          When this policy changes, the new version appears here with an updated effective
          date.
        </p>
      </Section>
    </>
  );
}
