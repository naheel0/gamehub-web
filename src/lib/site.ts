/**
 * The site's public origin — one place for metadataBase, sitemap and
 * robots. Env-driven because the app isn't tied to a host yet: set
 * NEXT_PUBLIC_SITE_URL at deploy (e.g. https://gamehub.example.com) and
 * every absolute URL follows.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
