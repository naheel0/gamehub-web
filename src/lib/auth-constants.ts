/** Cookie contract shared by the auth relay (lib/auth.ts) and the /admin
 *  proxy (src/proxy.ts). Single source so the two token paths cannot drift.
 *  Kept import-light on purpose: the proxy runs before next/headers exists. */
export const AUTH_COOKIES = { access: "gh_access", refresh: "gh_refresh" } as const;

// matches backend JwtSettings: AccessTokenExpirationMinutes 15 / RefreshTokenExpirationDays 7
export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 7 * 24 * 3600;

export const COOKIE_BASE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};
