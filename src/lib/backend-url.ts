/** Backend origin — one source, importable from proxy.ts. lib/api.ts
 *  pulls in next/cache, which must never be bundled into the proxy, so
 *  the raw constant lives here and both import from it. */
// ponytail: env override for local dev, deployed URL as default.
export const API_BASE =
  process.env.BACKEND_API_URL ??
  "https://gamehub1-hsdtbxdcfvfva3fw.centralindia-01.azurewebsites.net";
