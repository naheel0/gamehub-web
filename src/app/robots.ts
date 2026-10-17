import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/cart", "/checkout", "/order-confirmation", "/profile", "/wishlist"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
