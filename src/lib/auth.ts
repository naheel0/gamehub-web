import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE } from "./api";
import {
  ACCESS_MAX_AGE,
  AUTH_COOKIES,
  COOKIE_BASE as cookieBase,
  REFRESH_MAX_AGE,
} from "./auth-constants";

export { AUTH_COOKIES };

/**
 * Server-side proxy for the auth API (same CORS reason every other fetch
 * lives server-side). The JWT pair never reaches client JS: on success the
 * access token moves into our own httpOnly cookie, and the refresh token —
 * which the controller only ships via Set-Cookie, nulling it in the body —
 * is relayed from the backend's response header.
 *
 * Verified against backend source (GameHubApi):
 * - POST /api/Auth/login {email, password}
 * - POST /api/Auth/send-otp {email} → 6-digit code, emailed, 10 min expiry
 * - POST /api/Auth/verify-and-register {email, otp, password, confirmPassword,
 *   firstName, lastName, phone} (the docs' plain /register no longer exists)
 * - envelope {success, message, data}; access 15 min, refresh 7 days
 */

const OFFLINE_MSG = "We couldn't reach the store right now. Refresh in a moment.";

type AuthEnvelope = {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    role?: string;
    status?: string;
    accessToken?: string;
  };
};

/** Set the JWT pair on our response — single source of cookie truth. */
export function applyAuthCookies(
  response: NextResponse,
  token: string,
  rotatedRefresh?: string,
): NextResponse {
  response.cookies.set(AUTH_COOKIES.access, token, { ...cookieBase, maxAge: ACCESS_MAX_AGE });
  if (rotatedRefresh) {
    response.cookies.set(AUTH_COOKIES.refresh, rotatedRefresh, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
    });
  }
  return response;
}

/** The backend ships refreshToken via Set-Cookie (body field nulled). */
function refreshFromSetCookie(headers: Headers): string | undefined {
  const pair = headers
    .getSetCookie()
    .find((c) => c.startsWith("refreshToken="))
    ?.split(";")[0];
  return pair?.slice("refreshToken=".length);
}

/** One shared handler for the two token-issuing endpoints. */
export async function authFlow(
  endpoint: "login" | "verify-and-register",
  body: unknown,
): Promise<NextResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: OFFLINE_MSG }, { status: 502 });
  }

  let env: AuthEnvelope | null = null;
  try {
    env = (await res.json()) as AuthEnvelope;
  } catch {
    /* non-JSON error body — handled below */
  }

  const token = env?.data?.accessToken;
  if (!res.ok || !env?.success || !token) {
    // ponytail: backend's OTP-fail path reuses the refresh-token message
    // (copy-paste bug in AuthController.VerifyAndRegister) — translate the
    // one leaked string; delete when the backend message is fixed
    const raw = env?.message ?? "";
    const message =
      endpoint === "verify-and-register" && raw.includes("refresh token")
        ? "That code didn't match or has expired. Request a new code and try again."
        : raw || "Something went wrong. Try again.";
    return NextResponse.json({ message }, { status: res.ok ? 400 : res.status });
  }

  const { id, email, firstName, lastName, phone, role, status } = env.data!;
  const response = NextResponse.json(
    { user: { id, email, firstName, lastName, phone, role, status } },
    { status: 200 },
  );
  return applyAuthCookies(response, token, refreshFromSetCookie(res.headers));
}

/** send-otp: no tokens, just the backend's message forwarded honestly. */
export async function sendOtp(email: string): Promise<NextResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: OFFLINE_MSG }, { status: 502 });
  }
  let env: { message?: string } | null = null;
  try {
    env = await res.json();
  } catch {
    /* handled below */
  }
  return NextResponse.json(
    { message: env?.message || (res.ok ? "OTP sent to your email address." : "Try again.") },
    { status: res.ok ? 200 : res.status || 400 },
  );
}

/* ── Signed-in store relay (wishlist/cart) ───────────────────────────────
   Same CORS reason every fetch lives server-side: the browser only ever
   talks to these routes; the JWT pair stays in httpOnly cookies. */

/** Raw backend call with the bearer token. null = network-level failure.
 *  `stream` forwards the caller's body untouched — an admin upload rides
 *  multipart/form-data, whose boundary lives in the incoming content-type;
 *  undici requires `duplex: "half"` to stream a request body. */
export async function backendFetch(
  path: string,
  token: string,
  init?: { method?: string; body?: unknown; contentType?: string | null; stream?: boolean },
): Promise<Response | null> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  let body: BodyInit | undefined;
  if (init?.stream) {
    if (init.contentType) headers["Content-Type"] = init.contentType;
    body = init.body as ReadableStream;
  } else if (init?.body instanceof FormData) {
    // multipart admin upload: fetch sets the boundary itself (a hand-set
    // content-type would break it); re-serializable, so unlike a raw stream
    // this body can still ride the transparent refresh retry in relay()
    body = init.body;
  } else if (init?.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  try {
    return await fetch(`${API_BASE}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body,
      cache: "no-store",
      ...(init?.stream ? { duplex: "half" } : {}),
    } as RequestInit);
  } catch {
    return null;
  }
}

type RefreshOutcome =
  | { kind: "ok"; token: string; rotated?: string }
  | { kind: "dead" } // backend said no — revoked/expired/malformed
  | { kind: "network" }; // couldn't reach it / upstream 5xx — not the user's fault

// The backend revokes the refresh token on every rotation (AuthService:
// existing.Revoked = true), so two concurrent 401s (navbar session + page
// fetch on the same load) must share ONE refresh call. The settled result
// is held briefly so stragglers holding the old cookie hit it too.
const refreshInflight = new Map<string, Promise<RefreshOutcome>>();
const REFRESH_HOLD_MS = 5000;

async function doRefresh(refresh: string): Promise<RefreshOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/Auth/refresh`, {
      method: "POST",
      headers: { Cookie: `refreshToken=${refresh}` },
      cache: "no-store",
    });
  } catch {
    return { kind: "network" };
  }
  if (res.status >= 500) return { kind: "network" };
  try {
    const env = (await res.json()) as { success?: boolean; data?: { accessToken?: string } };
    if (!res.ok || !env.success || !env.data?.accessToken) return { kind: "dead" };
    return { kind: "ok", token: env.data.accessToken, rotated: refreshFromSetCookie(res.headers) };
  } catch {
    return { kind: "dead" };
  }
}

export function tryRefresh(refresh: string): Promise<RefreshOutcome> {
  const run =
    refreshInflight.get(refresh) ??
    doRefresh(refresh).then((outcome) => {
      const forget = () => {
        if (refreshInflight.get(refresh) === run) refreshInflight.delete(refresh);
      };
      setTimeout(forget, REFRESH_HOLD_MS);
      return outcome;
    });
  refreshInflight.set(refresh, run);
  return run;
}

type RelayMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Forward one signed-in store call (cart, wishlist, profile, addresses,
 * orders) with the signed-in user's token: rotate-first when gh_access has
 * already died (15-min max-age), then one transparent refresh retry on 401
 * (cookie rotation lands on this response), honest status passthrough
 * otherwise.
 * 401 = genuinely signed out or session dead; 502 = we couldn't reach the
 * store — the client keeps those apart so it never claims a false sign-out.
 * opts.request streams an incoming body (multipart admin upload) upstream
 * untouched; opts.passthrough copies named response headers back (paging
 * rides X-Total-Count, which a rebuilt response would otherwise drop). */
export async function relay(
  method: RelayMethod,
  path: string,
  body?: unknown,
  opts?: { request?: Request; passthrough?: string[] },
): Promise<NextResponse> {
  const store = await cookies();
  const originalAccess = store.get(AUTH_COOKIES.access)?.value;
  let access = originalAccess;
  let rotated: string | undefined;

  // gh_access dies with the JWT (15-min max-age), so a missing cookie is also
  // what a normal expiry looks like — a surviving gh_refresh means the session
  // may still be alive, so rotate instead of forcing a sign-in. No gh_refresh
  // at all is a genuinely signed-out caller.
  if (!access) {
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    if (!refresh) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
    const renewed = await tryRefresh(refresh);
    if (renewed.kind === "network") {
      return NextResponse.json({ message: OFFLINE_MSG }, { status: 502 });
    }
    if (renewed.kind !== "ok") {
      return NextResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
    }
    access = renewed.token;
    rotated = renewed.rotated;
  }

  const streaming = opts?.request !== undefined;
  const contentType = opts?.request?.headers.get("content-type") ?? null;
  const sendBody = streaming ? opts!.request!.body : body;
  const forward = { method, body: sendBody, contentType, stream: streaming };

  let token = access;
  let res = await backendFetch(path, token, forward);

  // a streamed body is consumed by the first attempt and cannot be replayed,
  // so multipart calls do not get the transparent refresh retry: the proxy
  // keeps gh_access fresh on every admin navigation, and a genuine 401 here
  // means the caller should re-authenticate and resubmit the upload.
  if (res?.status === 401 && !streaming) {
    const refresh = store.get(AUTH_COOKIES.refresh)?.value;
    const renewed = refresh ? await tryRefresh(refresh) : { kind: "dead" as const };
    if (renewed.kind === "network") {
      return NextResponse.json({ message: OFFLINE_MSG }, { status: 502 });
    }
    if (renewed.kind === "dead") {
      return NextResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
    }
    token = renewed.token;
    rotated = renewed.rotated;
    res = await backendFetch(path, token, forward);
  }
  if (!res) return NextResponse.json({ message: OFFLINE_MSG }, { status: 502 });

  // 204/205 are null-body statuses — handing them an empty string body
  // throws (TypeError: Invalid response status code), which killed the
  // admin delete relay the first time it ran
  const text = res.status === 204 || res.status === 205 ? null : await res.text();
  const response = new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
  // selected response headers must survive the relay (X-Total-Count carries
  // paging for every admin list) instead of being rebuilt away
  for (const name of opts?.passthrough ?? []) {
    const value = res.headers.get(name);
    if (value) response.headers.set(name, value);
  }
  if (token !== originalAccess || rotated) applyAuthCookies(response, token, rotated);
  return response;
}
