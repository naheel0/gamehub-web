/** Pure, client-safe helpers shared by server and client components. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (price: number) => inr.format(price);

/** 07 Aug 2026 — the one list-date shape (was duplicated per admin table). */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/**
 * Steam header art is 460px; the same app ships a 3840px library_hero.
 * Derive it from the app id, fall back to the header on a miss.
 */
export function heroArtUrl(headerUrl: string): string {
  const match = headerUrl.match(/\/apps\/(\d+)\//);
  return match
    ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${match[1]}/library_hero.jpg`
    : headerUrl;
}
