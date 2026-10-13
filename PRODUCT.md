# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router + TypeScript + Tailwind CSS v4 (user-specified: "use nextjs"). npm. Separate frontend, created outside the GameHub-fullstack repo at the user's direction; the legacy Vite `Frontend/` and the .NET `GameHubApi/` are untouched.

## Users

Gamers in India browsing for their next game to buy — comparing cover art, ratings and INR prices on desktop and phone. *(Inferred from the live catalog: all prices in INR, Steam key art, repo README targets Indian players via Razorpay.)*

## Product Purpose

Storefront for discovering and buying game keys from the GameHub catalog. This build's scope, user-set: **the landing page (`/`), the catalog (`/games`), the product detail page (`/games/[id]`), and account access (`/login`, `/signup`)**. Success: a first-time visitor knows what this store is within one viewport, can search/sort/filter the real catalog, any catalog card leads to a full spec/trailer/related view of that title, and a player can create a verified account and sign in.

## Positioning

The whole real catalog (20 titles) served live from the GameHub API — real games, real ratings, real INR prices — presented like a game-launch storefront rather than a generic shop template.

## Operating Context

- Backend: ASP.NET Core 8, live at `https://gamehub1-hsdtbxdcfvfva3fw.centralindia-01.azurewebsites.net`.
- Verified against the live deployment: `GET /api/Games` list params `page`, `pageSize`, `search`, `sortBy=name|price|rating`, `sortOrder=asc|desc`, `genre=RPG`, `platform=PC` all filter/sort server-side; out-of-range page → empty `items` + real `totalCount`. Detail `GET /api/Games/{id}` returns the bare object.
- Auth verified **from backend source** (controller + service, matches live probes): `POST /api/Auth/login` {email, password} → 200 `{success, message, data:{id, email, firstName, lastName, phone, role, status, accessToken}}` + `refreshToken` Set-Cookie; 401 "Invalid email or password."; 403 blocked. The docs' plain `/register` was **removed** — real signup is OTP: `POST /api/Auth/send-otp` {email} (6-digit code, emailed via SMTP, 10 min) then `POST /api/Auth/verify-and-register` {email, otp, password, confirmPassword, firstName, lastName, phone}. Access token 15 min, refresh 7 days. Backend DTOs carry **no validation attributes** — client validation is the real gate.
- Cart (`/api/Cart`) and wishlist (`/api/Wishlist`) are **401 JWT-gated** and wired through server-side relays (contracts verified from backend source: bare-array GETs, `{message}` mutations, idempotent add, cart qty 1–99). Profile, addresses, and order history relay the same way (`/api/Auth/profile`, `/api/Addresses`, `/api/Orders`). Orders can be placed with a saved `addressId` alone (backend snapshots items + address, clears the cart, lands `Pending`) — checkout stays gated on the payment story: the Razorpay payment-link step needs gateway keys.
- The API sends no `Access-Control-Allow-Origin` → **all fetching is server-side** (Server Components + PPR + route-handler proxies); browser-side fetch would be blocked by CORS.
- Backend quirk handled honestly: `verify-and-register` with a bad OTP reuses the "Invalid or expired refresh token." message (copy-paste bug in their controller) — the frontend translates that one leaked string to customer tone.

## Capabilities and Constraints

- In scope now: landing (`/`), catalog (`/games` — URL-backed search, genre filter, sort, pagination over the API's verified params), product detail (`/games/[id]`), auth (`/login` + `/signup`, real OTP-verified accounts, JWT pair in httpOnly cookies — client JS never sees a token; signup gated behind a required Terms/Privacy consent checkbox), wishlist (`/wishlist` — move-to-cart, remove, Steam Deck CC BY panel rail) and cart (`/cart` — quantity stepper, remove, subtotal, honest checkout gate), catalog + related-rail cards carry quick cart/wishlist actions (heart state from one shared wishlist fetch; 401 routes to sign-in with a back-link), profile (`/profile` — details edit, address book CRUD with default handling, order history), the session-aware navbar (brand · links · actions: catalog search entry → `/games?q=`, live Cart/Wishlist count badges, one auth button — solid Sign in / signed-in disclosure menu with Profile + Sign out; landing-only store CTA; mobile drawer below lg), a cookie-consent corner card (browser-local dismissal record; states the two real session cookies honestly), and the legal pages (`/privacy`, `/terms`, `/refunds`, `/cookies` — copy limited to verified behavior; refunds are contact-based with a 7-day window, `contact@gamehub.com`).
- Out of scope (user-set / backend-gated): checkout completion (address book is ready; payment needs the Razorpay decision), password change (no backend endpoint), admin. Sessions auto-refresh transparently (`/api/auth/session` and the store relays retry once through the backend's refresh endpoint; refresh tokens are single-use, so concurrent 401s share one refresh call).
- Data shape (verified): list `GET /api/Games?page&pageSize` → `{success, message, data:{items:[…]}}` envelope; detail `GET /api/Games/{id}` returns the **bare game object** (`{id, name, genre, platform, price, rating, inStock, trailerUrl, imageUrls[], description}`); 99999/0 → 404, "abc" → 400.
- Prices are `2999.00` style decimals → render as INR (`₹2,999`).
- 3D models live in `public/models/` with a `CREDITS` line in the panel caption (CC BY requires it); the local `CREDITS.md` on the desktop asset folder is regenerated from each GLB's embedded `asset.extras` (author/license/source — Sketchfab embeds it on Download), so every downloaded model is attributable.
- Art is Steam CDN (`shared.fastly.steamstatic.com`), hotlinkable, must be allowed in `next.config` image domains.
- Currency, catalog content, and API availability are backend-owned; the frontend never invents prices, ratings, stock, or claims.

## Brand Commitments

- Product name: **GameHub**.
- Binding from the brief: must match the GameHub project theme (game store), real backend data only.
- Visual direction for this surface is owned by new-work and recorded in DESIGN.md.

## Evidence on Hand

- 20 real titles with genre, platform, INR price, 0–5 rating, stock flag, YouTube trailer embed, Steam header art — e.g. Elden Ring ₹3,999 (4.9), Cyberpunk 2077 ₹2,499 (4.3), The Witcher 3 ₹1,999 (4.9), God of War ₹3,499 (4.8).
- Genres present: Action Adventure, RPG, Action RPG, Shooter, Racing, Sports, Open World, Sandbox, Survival Horror, Sci-Fi RPG, Action Survival.
- Pinterest moodboard downloaded to `C:\Users\user\pinterest-vision-mcp\data\pinterest\20261010\dark_gaming_store_website_landing_page_u\` (4 dark gaming-store references reviewed).
- Absences that must not be fabricated: no customer testimonials, no review counts, no discounts/deals data, no shipping policy, no live user counts. (A refund policy exists at `/refunds` — contact-based, 7-day window — written by owner decision, not backend data.)

## Product Principles

1. Real data only — every price, rating, and title comes from the API; if the API is down, say so honestly instead of faking content.
2. Browse-first: the catalog is the product; the page gets out of its way.
3. Mobile and desktop both get the full experience — key art and price legible at 375px.
4. Scope discipline: only `/`, `/games`, `/games/[id]`, `/login`, and `/signup` exist; no route ships without real data behind it.
5. Production tone: customer-facing copy never names the backend, API, or missing internals — honest states are phrased for shoppers ("We couldn't load the catalog right now"), not developers.
6. Real accounts only: signup is the backend's actual OTP email verification; passwords never leave the browser except over the server-side proxy; no fake success.

## Accessibility & Inclusion

Standard WCAG AA for a commerce landing page: body text ≥4.5:1, visible keyboard focus, reduced-motion honored by every animation, semantic landmarks, icon-only controls labeled. No product-specific standard was dictated by the user.
