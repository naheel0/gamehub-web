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
      {
        // admin uploads: CloudinaryStorageService returns result.SecureUrl —
        // https://res.cloudinary.com/<cloud>/image/upload/...
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // default 1MB clips real cover art — multipart overhead lives inside this cap
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
