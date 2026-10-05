/** Pure, client-safe helpers shared by server and client components. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (price: number) => inr.format(price);

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
