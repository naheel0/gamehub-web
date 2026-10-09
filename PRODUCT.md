# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 App Router + TypeScript + Tailwind CSS v4 (user-specified: "use nextjs"). npm. Separate frontend, created outside the GameHub-fullstack repo at the user's direction; the legacy Vite `Frontend/` and the .NET `GameHubApi/` are untouched.

## Users

Gamers in India browsing for their next game to buy — comparing cover art, ratings and INR prices on desktop and phone. *(Inferred from the live catalog: all prices in INR, Steam key art, repo README targets Indian players via Razorpay.)*

## Product Purpose

Storefront for discovering and buying game keys from the GameHub catalog. This build's scope, user-set: **the landing page and the product detail page (`/games/[id]`)** — presentation-only detail (no buy/cart this round). Success: a first-time visitor knows what this store is within one viewport, and any catalog card leads to a full spec/trailer/related view of that title.

## Positioning

The whole real catalog (20 titles) served live from the GameHub API — real games, real ratings, real INR prices — presented like a game-launch storefront rather than a generic shop template.

## Operating Context

- Backend: ASP.NET Core 8, live at `https://gamehub1-hsdtbxdcfvfva3fw.centralindia-01.azurewebsites.net`.
- Verified this session: `GET /api/Games?page=1&pageSize=100` → 200, `totalCount=20`, `totalPages=1`, single page gets the full catalog.
- The API sends no `Access-Control-Allow-Origin` → **all fetching is server-side** (Server Components + ISR); browser-side fetch would be blocked by CORS.
- Repo docs (`docs/api.md`, README) describe cart/orders/auth/admin endpoints; those are **unverified against this deployment** and out of scope for this round.

## Capabilities and Constraints

- In scope now: landing page (`/`) and product detail (`/games/[id]`), both fed by real catalog data.
- Out of scope this round (user-set): `/games` list route, cart, auth, checkout, admin, buy actions.
- Data shape (verified): list `GET /api/Games?page&pageSize` → `{success, message, data:{items:[…]}}` envelope; detail `GET /api/Games/{id}` returns the **bare game object** (`{id, name, genre, platform, price, rating, inStock, trailerUrl, imageUrls[], description}`); 99999/0 → 404, "abc" → 400.
- Prices are `2999.00` style decimals → render as INR (`₹2,999`).
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
- Absences that must not be fabricated: no customer testimonials, no review counts, no discounts/deals data, no shipping or returns policy, no live user counts.

## Product Principles

1. Real data only — every price, rating, and title comes from the API; if the API is down, say so honestly instead of faking content.
2. Browse-first: the catalog is the product; the page gets out of its way.
3. Mobile and desktop both get the full experience — key art and price legible at 375px.
4. Scope discipline: only `/` and `/games/[id]` exist; no route ships without real data behind it.

## Accessibility & Inclusion

Standard WCAG AA for a commerce landing page: body text ≥4.5:1, visible keyboard focus, reduced-motion honored by every animation, semantic landmarks, icon-only controls labeled. No product-specific standard was dictated by the user.
