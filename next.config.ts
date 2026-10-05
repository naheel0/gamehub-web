import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // This network resolves the Steam CDN through NAT64 (IPv4-mapped
    // 64:ff9b::), which Next's private-IP guard rejects. Public
    // deployments resolve normally; this only unblocks art locally.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
        pathname: "/steam/apps/**",
      },
      {
        protocol: "https",
        hostname: "shared.fastly.steamstatic.com",
        pathname: "/store_item_assets/**",
      },
    ],
  },
};

export default nextConfig;
