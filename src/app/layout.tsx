import type { Metadata } from "next";
import { Big_Shoulders, Barlow, JetBrains_Mono } from "next/font/google";
import CookieConsent from "@/components/layout/CookieConsent";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const bigShoulders = Big_Shoulders({
  variable: "--font-bigshoulders",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GameHub — the whole catalog, live",
  description:
    "Every GameHub title, rating and price in rupees — search, compare and find your next game.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bigShoulders.variable} ${barlow.variable} ${jetbrains.variable} h-full antialiased`}
    >
      {/*
        THESIS: A game store whose first viewport proves the mechanism — the
        catalog is live — instead of promising it; refuses the generic
        game-shop hero of neon hype over stock art.

        OWN-WORLD: Crimson Arena. Near-black ground (#0d0d10), one locked
        crimson accent (#ff2d55) for every CTA, price and active state,
        cyan only as a 1px hairline edge. Big Shoulders Display poster type,
        Barlow body, JetBrains Mono for all numbers, ordered-dither glows,
        theater-dark shadows, grain.

        STORY: Visitor lands on rotating key-art hero with live count and
        prices, scrolls the real title ticker, scans top-rated cards with
        INR prices, reads genre counts, acts on Browse the store.

        FIRST VIEWPORT: Fixed nav over full-bleed library_hero art with
        dithered crimson glow and three.js embers; display headline
        "<n> GAMES. / ONE ARENA.", live-catalog sub-line, crimson primary +
        hairline secondary buttons, featured-game meta card with pause-able
        rotation; masked line rise, crimson sweep on every swap.

        FORM: Storefront catalog, user-pinned direction C "Crimson Arena"
        from the Pinterest moodboard (Nexus Esports x LevelUp refs).
        Seed key: 04902f49 (user pin beats the roll; PC-98 dither raise).

        FINISH: unreviewed and undocumented is unfinished; this build ends
        with the finish review, the verdict, DESIGN.md, and every shipping
        raster carrying its provenance.
      */}
      <body className="grain min-h-full flex flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
