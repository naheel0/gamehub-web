# DESIGN.md

## World

**Crimson Arena.** User-pinned direction C from the Pinterest moodboard (4 dark
gaming-store refs read directly: Nexus Esports, LevelUp, GameZone, GameHoah).
Near-black ground, ONE hot accent, condensed poster display type, key-art hero
with a left text stack — the shared grammar of all four refs, specialized to
GameHub's crimson read of the Nexus ref.

Concept seed: `04902f49` (direction roll). The roll assigned an index from the
grounded catalog, but a user-pinned direction beats the roll — the user picked
C. All six dealt challengers were declined (both axes: audience identification
and product clarity), with one discipline raised in from **PC-98**: glows and
soft color fields render through an ordered-dither mask (3px crossed 45°
cells), never as
smooth gradients (see `.dither-glow`).

No image generation exists in this environment → code-led build, no comps.

## Palette

| Role | Hex | Use |
|------|-----|-----|
| bg | `#0d0d10` | page ground |
| bg-soft | `#121217` | alternate bands (ticker, genres, footer) |
| surface | `#17171d` | cards, meta panel |
| line | `rgb(255 255 255 / 0.09)` | hairlines, borders |
| heading | `#f4f1f2` | display text, CTA-on-dark secondary button |
| text | `#c7c4cb` | body copy (≥4.5:1 on bg) |
| muted | `#94909c` | meta, labels, nav links (≥4.5:1 on bg) |
| **accent** | `#ff2d55` | **every** CTA, price, count, active dot, focus ring, caret |
| edge | `#3ee6f0` | reserved: 1px hairline only — never text, never fill |

Rules: accent = actions/prices/active states, nothing else. Dark ink on accent
buttons (`text-bg`, ≥5:1). Cyan is a structural edge color only.

## Type

- **Display:** Big Shoulders Display (variable, native weights; no faux bold) —
  arena-poster condensed caps. Hero `clamp(2.9rem, 9vw, 6rem)` (6rem ceiling),
  tracking `-0.02em`, leading `0.92`.
- **Body:** Barlow 400–700. Measure capped at `62ch` (hero) / `60ch` (CTA).
- **Data:** JetBrains Mono 500/700 — prices, ratings, counts, ticks. Mono is
  for numbers only (the craft floor's data exemption).

Scale steps: hero ≤6rem → section heads `clamp(2–3.75rem)` → card titles
`text-2xl` → body `text-lg/sm` → labels `text-xs` with `tracking-[0.16em]`
uppercase.

## Space & depth

Section rhythm `py-20…py-28`, container `max-w-7xl px-5/sm:px-8`, card grid
gap `6`. More space above headings than below (border-b divider under heads).
Shadows are theater-dark with offset + blur (`--shadow-md/lg/xl`); the meta
card and buttons use them. No zero-offset halos except the deliberate sweep
glow (it is a light source, not elevation).

## Motion

Tool routing (animation-orchestrator):

- **GSAP + ScrollTrigger + @gsap/react** — hero entrance (masked line rise,
  stagger 0.1, `expo.out`) and the parallax scrub (`yPercent` art + glow
  fade, `ease: none`, scrub:true, decorative only). `gsap.ticker.lagSmoothing(0)`
  — wall-clock timing: the default lag smoothing stretched the 1.35s
  entrance into a 30-60s crawl on throttled renderers, leaving the staggered
  CTAs visibly split mid-tween (the "misaligned buttons" report). The CTA
  pair also animates as ONE unit (`[data-hero-ctas]`, no per-button
  stagger) so it can never read as misaligned even mid-entrance.
- **CSS keyframes** — the featured-swap choreography (`.deal-in`,
  `.art-in`, `.sweep-run`), remount-driven by React `key`. A prior GSAP
  implementation of this swap failed silently in production (tweens set
  `from` state and never ticked); CSS remount animations cannot fail that
  way. `.sweep-run` is the signature moment: a crimson line crossing the art
  on every title change.
- **motion/react** — scroll entrances for sections via `Reveal`
  (`whileInView`, once, `y26`, `ease [0.16,1,0.3,1]`), staggered by card.
- **three.js** — ember field in the hero: 420 additive points, low-power
  renderer, pauses off-view/off-tab, one frame under reduced motion, silent
  skip without WebGL, full dispose on unmount. Lazy client-only.
- **three.js + GSAP** — the reusable model panel (`three/GlbPanel`, used by
  /cart + /signup): any CC BY GLB (arcade machine by Logotyp on signup,
  PS4 DualShock 4 by JeppeHove-Nyborg on cart) under the login scene's studio rig with a
  crimson rim/spill, entrance drop-in (`expo.out`) composed through
  `enter.p`, idle sway/bob + breathing spill, pointer parallax trailing the
  camera, drag-to-rotate. Same gates as EmberField: reduced motion = one
  frame at rest, off-view/off-tab = loop stops, WebGL failure = glow +
  caption still carry the panel.
- **CSS** — marquee ticker (46s linear, pause on hover), hover states
  (`transition 150–200ms`). Featured cards lift (`translate -4px` + accent
  border + `shadow-xl`) on hover. Navbar v4 (`badge-pop` on count mount,
  staggered `.drawer-in` rise, `.menu-in` 120ms account-menu fade+slide) —
  mount-driven `both`-fill keyframes, all `animation: none` under reduced
  motion (final state ships).
- **CSS — checkout & confirmation** — the insert-coin pay button
  (`.coin-scan` sheared highlight sweep + `.coin-pulse` glow, infinite
  loops, pulse gated `:not(:disabled)`), the HUD stage bar (square →
  `CheckCircle` swap on hand-off, no keyframes), and the confirmation
  achievement moment (`.win-flash` one-shot crimson flash + eight
  `.win-ray` spans radiating from the check, rest `opacity: 0` so a
  reduced-motion kill leaves nothing visible). Entrances ride `.deal-in`
  stagger; all keyframes sit in the reduced-motion kill list.
- **Tilt** (`ui/Tilt`, GSAP `quickTo`) — pointer-tracked 3D perspective on
  catalog cards: `rotationX/Y` follow the cursor (clamped ±5°,
  `transformPerspective: 900`, 0.3s `power2.out`, zero on leave), so the
  existing hover lift + accent border rides on a live plane. Gated three
  ways: `useReducedMotion`, `(hover: hover) and (pointer: fine)` media
  query (touch never gets tilt), and effect-only (no-JS ships flat).
- **Pointer-tracked glow** — the CTA band's `.dither-glow` follows the
  cursor (mouse-only, rAF-throttled, CSS `translate` transition trails it,
  parks center on leave, off under reduced motion and on touch).
- **CountUp** (`ui/CountUp`) — the CTA band's title count ticks up on
  scroll-in (`useInView` once, easeOutCubic, writes `textContent` — no
  re-renders). The final value ships in the prerendered HTML; reduced
  motion and no-JS both stand at the true number.

Reduced motion: GSAP gated by `if (reduce)` + matchMedia (final state ships),
CSS animations set `animation: none !important` (sweep and coin-scan forced
to `opacity: 0 !important`), motion `useReducedMotion` renders plain divs,
marquee freezes, three.js renders one frame.

## Content rules

Every number comes from the live API (count, prices in `Intl` INR, ratings,
genre counts). Empty and error states are honest but customer-toned ("We
couldn't load the catalog right now — refresh in a moment"): **customer-facing
copy never names the backend, API, or missing internals** (user-set,
production-level rule). No invented policies, testimonials, discounts, or
links; the single external link is the real GitHub repo — except the **CC BY
4.0 model credit** on `/login` (license obligation for the DualSense GLB:
author + license, linking to the original Sketchfab page; never remove it). Genre chips on
`/games` are real controls (URL-backed filter route). Detail page: API
404/400 → real `not-found` ("Not in the arena"); transport failure → error
boundary that admits the store is unreachable — never a fake 404. Auth: the
buy buttons show an honest on-click notice that points at `/login` — never a fake
success — and `/checkout` gates the same way (sign-in with `?next=` back to
the same URL, including `?buy=` params). Signup is the backend's real OTP email flow; backend error messages
surface verbatim (the one leaked "refresh token" string is translated).

## Components

`Navbar` (fixed, **v4 — brand · links · actions**; logo → `/`, links Store →
`/games`, Featured → `/#featured`, Genres → `/#genres` — Big Shoulders caps,
the sheared **active-route underline** keeps the lean grammar (crimson +
`aria-current`, hover previews it muted-white). Right cluster: inline search
(`type="search"`, sr-only label, accent caret) submits to `/games?q=…` and
clears — the catalog toolbar stays the live source of truth, empty submit =
`/games`; cart/wishlist badge links (**40px tap target**, `aria-label`
announces "Cart — 3 items", `aria-current` when active, `badge-pop` re-keys
on every `counts:changed` re-resolve); and **one auth button in three
states** — pending = EMPTY slot (never a false "signed out"), anon = solid
`Sign in` (heading ink, accent on hover) → `/login`, signed-in = `● name ˅`
disclosure menu (name + email, Profile row with `aria-current`, Sign out =
proxy POST revoking all backend refresh tokens + access jti, clearing local
cookies regardless) with outside-click/Escape close, focus returned to the
trigger, `aria-expanded`/`aria-haspopup`/`aria-controls` through `useId`.
The sheared arena CTA is **landing-only** (it duplicated the Store link on
every other route) and appears from `xl` (the cluster is too wide below it);
below `lg` the hamburger carries everything: drawer **portal'd to body**
(the header's backdrop-blur would become the containing block for its
position:fixed) — links → search → badge row → account (same states, menu
inline under the button) → landing-only CTA — Escape closes + focus
returns, Tab cycles inside, body scroll locks, route change/backdrop close.
Bar **scroll-lifts** (`bg-bg/95` + `shadow-lg` past 8px); motion stays
CSS-only — `badge-pop`, staggered `.drawer-in` rise, `.menu-in` 120ms
fade+slide — all `animation: none` under reduced motion (final state
ships) · `Hero` (art layer, dither glow, sweep,
embers, featured card: key-art rail + title/price line + genre + data strip
with rating, stock, dots and WCAG 2.2.2 pause — media-card grammar, see
"Registry sources") · `Ticker` (all titles,
`aria-hidden` as decorative repetition) · `FeaturedGrid` (top 6, Reveal
stagger; optional `heading`/`eyebrow`, reused on the detail page as
"More from the arena"; cards are `next/link` → `/games/[id]`) ·
`GenreRail` (counts; each chip deep-links the URL-backed filter: `/games?genre=`) · `CtaBand` (grid floor + dither glow) ·
`Footer` (v2 poster colophon: three-lean beat (underline grammar echoed),
four columns — brand + GitHub · Store · Help (About/FAQ/Contact/Profile) ·
Legal (all 7 policies + cookies) — skew-lean hover links matching the
navbar, mono meta bar with build-year constant + back-to-top; gamepad
`LogoMark` (Phosphor `GameController` fill in crimson `#ff2d55`, bare —
the old site's glyph, shared via `ui/logo-mark.tsx`; same artwork ships
as the favicon `app/icon.svg`), CSS-only motion, server component) ·
`CookieConsent`
(bottom-right corner card: `useSyncExternalStore` over
`localStorage.gh_consent` — server + hydration see "dismissed" (nothing in
SSR HTML), the card rises in once post-hydration via the `consent-in`
keyframe (in the reduced-motion kill list); honest two-cookie copy, no
fake preference toggles; dismissal stored browser-side only) ·
`Reveal`, `CountUp`, `icons` (Phosphor behind a client
boundary — Phosphor calls `createContext`, illegal in Server Components) ·
`EmberField` · `CtaBand` is a client component (pointer-tracked glow) ·
`game/GameCard` (shared grid card: art with `onError` fallback, genre tag,
title, rating, INR price; the link covers art + title only — a button
cannot nest inside a link — and the data strip carries optional quick
actions via the `actions` prop: catalog grid + detail related rail on,
landing hero grid stays the pure poster card) · `game/CardActions`
(client: icon cart quick-add (qty 1, "Added" check + aria-live) + wishlist
heart in the card strip; one shared `GET /api/wishlist` per page load in
a module-level Set read through `useSyncExternalStore` — SSR renders the
neutral outline, a 24-card grid is one request; heart fills only after
the server agrees, every mutation `announceCounts()`, 401 →
`/login?next=<path>`) ·
`game/ProductMedia` (stage + trailer/art tile rail; stage swaps are client
state, `art-in` class reuse; trailer facade → click-to-play
`youtube-nocookie.com` iframe, `autoplay=1` only after the click) ·
`game/BuyBox` (price, rating, stock, spec rows, quantity stepper, live
actions through the store relay: Add to cart posts real quantity, Buy now
hands off to `/checkout?buy=<id>&qty=` (the island places the order at pay
time), heart toggles the signed-in wishlist
(`aria-pressed`, fill = saved); 401 → sign-in gate notice, every mutation
announces `counts:changed`, `role="status"`) ·
`wishlist/WishlistClient`
(client state machine: skeleton / 401 gate / honest error + retry / empty /
rows with Move to cart + Remove; `deal-in` row stagger, `role="status"`
flash line; full-width list — the primitive heart panel was removed at the
user's request) · `cart/CartClient` (same state machine + sticky rail: `GlbPanel`
DualShock panel over the Summary, 1–99 stepper that resyncs from source after a
rejected change, live `Proceed to checkout` hand-off to `/checkout`) ·
`checkout/CheckoutClient` (one island serves both modes — cart lines or
`?buy=` single title: skeleton / 401 gate with `?next=` / honest error +
retry / empty-cart / ready; HUD stage bar (Cart → Delivery & pay → Razorpay,
active square → check when the hand-off starts), address radio cards with
pre-selected default + inline add form (AddressBook field grammar, shown
auto when the book is empty), summary rail with the store's 10% tax,
out-of-stock blocks the buy-now button, pay = order → create-link →
`gh_pending` draft → full-page `shortUrl` redirect; a failed link mint keeps
the placed order so retry never double-orders) ·
`checkout/OrderConfirmation` (Razorpay return island: paid → `confirm-link`
→ achievement card — `win-flash` + 8 `win-ray`s + `badge-pop` check, order
detail from `GET /api/orders/{orderId}`; failed → `restore` → honest
"nothing was charged, cart restored"; restore failed → check-your-cart copy;
no params → resume the stashed link or a store pointer; draft read+cleared
synchronously before any await, once-guard so double-effects can neither
confirm nor restore twice) · `three/GlbPanel` (the reusable
CC BY model panel: any GLB in `public/models` via the `src` prop + a `fitSize`
(metres) that normalizes mixed-unit GLBs so the fixed rig + 0.1 near plane
behave identically — a 0.03-unit GLB would otherwise clip behind the near
plane. Studio rig as the login DualSense: RoomEnvironment PMREM, white key
+ crimson rim/spill, idle sway/bob + breathing spill + pointer parallax +
drag-to-rotate. Camera fit is **contain** (fits both dimensions) and
**idempotent** — recomputed on every ResizeObserver tick from the captured
model bbox, because the load-time canvas size is pre-layout. Lifecycle
mirrors `ControllerScene`: WebGL try/catch, off-view/off-tab
pause, one frame under reduced motion, full dispose; load failure = glow +
caption only. **Swap point for future models**: point `src` at a GLB, set
`fitSize`, add the CC BY caption; attribution comes from the GLB's embedded
`asset.extras` (author/license/source — see CREDITS.md)) · `profile/ProfileClient` (one GET-profile probe gates
the whole section: skeleton / 401 gate / error + retry; three ARIA tabs —
Details / Addresses / Orders — panels stay mounted once visited so a
half-typed address form survives a tab switch; Details = edit form via PUT,
backend messages surface verbatim, save announces `counts:changed` so the
navbar chip follows the name) · `profile/AddressBook` (cards with default
badge, set-default, two-step Remove confirm; one inline form shared by add
+ edit, "set as default" pre-checked when the book is empty — the backend
doesn't auto-promote a first address; POST appends the returned row, the
rest update locally) · `profile/OrderHistory` (order cards: short id, date,
status chip — text always, colour never alone — item lines linked to
`/games/[id]`, backend-computed subtotal/tax/total, shipping snapshot;
history rows carry full detail so there's no drill-down) ·
`catalog/CatalogToolbar` (client: 300ms-debounced search → `router.replace`,
genre tabs with accent underline, sort select, `CountUp` on the live count) ·
`catalog/CatalogPagination` (real `next/link` pages with aria labels) ·
`ui/Tilt` (pointer-tracked 3D perspective via GSAP `quickTo`, clamped ~5°,
gated on reduced motion + coarse pointers; wraps catalog cards) ·
`auth/AuthForm` (client, one component both modes: login = email+password;
signup = step 1 `send-otp` → step 2 OTP + names/phone/password with resend
cooldown; client validation is the real gate — backend DTOs have none;
backend errors surface verbatim via `role="alert"`; success swaps in a
signed-in panel, `?next=` read client-side at click with open-redirect
guard) · `auth/ControllerScene` (login only;
signup uses `three/GlbPanel` with the arcade machine): the CC BY 4.0
DualSense GLB by Taohid Animation
(`public/models/dualsense.glb`, 6 MB, lazy client load) in the studio's
**Midnight Black** finish — recolor + canvas-drawn △○×□ decal projection
(`DecalGeometry`) ported from the dualsense-controller project; RoomEnvironment
PMREM rig + arena crimson spill light; idle sway + pointer parallax +
**drag-to-rotate** (fine pointers; `touch-action: pan-y` keeps vertical
swipes scrolling); GSAP entrance composes through an `enter.p` progress,
never over the per-frame transforms; same lifecycle gates as GlbPanel.
Model failure/WebGL absence = empty panel, page stands).

## Registry sources

Sourced via the **21st.dev MCP** (search + 2 code retrievals, free tier) and
the **shadcn MCP** (registry view + audit checklist):

- *21st · Product Card (deltacomponents)* — compound-section discipline:
  card = title zone / data strip / docked controls with type inherited from
  the root, "a card is not a control" (interactive elements live in their
  own row). Informed the featured-card rebuild.
- *21st · Marquee (kevingirelli)* — pause on hover **and keyboard focus**
  plus a reduced-motion scroll box; the ticker already met this, kept as
  confirmation of the pattern.
- *shadcn · Button + audit checklist* — uniform control height (both hero
  CTAs `h-12`), single global `:focus-visible` accent ring (globals.css),
  import/TS/lint/remotePatterns/Playwright verification pass.

## Exceptions / waivers

- **content-hidden-at-rest:** hero display lines ship in the DOM and are
  hidden only inside the GSAP entrance (`useGSAP` layout timing, before
  first paint). If JS fails entirely they stay visible — the inverse risk
  (permanently hidden content) was chosen deliberately.
- Font metrics warning: `Big Shoulders` has no fallback-metric override in
  next/font (warning only; font loads, no size-adjust on the fallback).
- **codex-grid-background (advisory, detector):** `.grid-floor` in
  `globals.css` (line 127) is the committed world grammar — Crimson Arena
  panel floors on cart/checkout/confirmation header bands — not a
  generated filler field; the "reserve grid overlays for measurement
  surfaces" rule is waived for this one utility, which is the only place
  the pattern is used.

## Routes

- `/` — static (Revalidate 1h / Expire 1d).
- `/games/[id]` — `fetchGame` (`'use cache'` + `cacheLife`, same 1h/1d);
  `generateStaticParams` seeds ids 1–20 from the cached list; unknown ids
  render via the PPR shell on demand (`dynamicParams` export is rejected by
  Next 16.4 under `cacheComponents`). Layout: back link → split e-com body
  (`ProductMedia` left: stage + trailer/art tile rail; `BuyBox` right:
  genre eyebrow, `h1`, price, rating/stock, spec rows, quantity, buy
  actions) → Related (`FeaturedGrid` reuse) → Footer.
  `generateMetadata` sets title/description + OpenGraph art from the same
  cached fetch.
- `/games` — PPR: static shell (header band with dither glow + sweep)
  wraps a `<Suspense>` body (`CatalogSkeleton` fallback, `aria-busy`) so
  `searchParams` never blocks prerender. Body: `fetchGamesPage`
  (`'use cache'`, `pageSize=12`) with the API's verified params —
  `page`, `search`, `genre`, `sortBy=name|price|rating`, `sortOrder` —
  mapped from URL state (`q`, `genre`, `sort`, `page`); all filter state
  lives in the URL (`router.replace`, scroll preserved). `SORTS`/`sortKeyOf`
  live in `src/lib/catalog.ts` (shared, outside the client boundary).
  Out-of-range page (API returns empty items + real totalCount) →
  `redirect` to page 1 of the same filtered query. The catalog fetchers'
  cached core **throws** on transport/contract failure (thrown results are
  never cached) and an uncached wrapper returns `null`; `/games` renders
  the honest error state for `null` — a cold backend shows it once and the
  next request recovers, instead of caching a fake empty catalog.
  No-results state carries the real total; cards wrapped
  in `Tilt`.
- `not-found.tsx` ("Not in the arena") and `games/[id]/error.tsx` (honest
  API-down boundary) are shared/global.
- `/login` and `/signup` — fully static (○); split `min-h-svh` grid: form
  left ("Enter the arena" / "Press start" + `AuthForm`), 3D panel right —
  login = `ControllerScene` DualSense, signup = `GlbPanel` arcade machine
  (Logotyp, "Insert coin"; caption + credit stack in the mobile `h-52`
  band below the fixed nav, split across the full-height desktop panel). `?next=` is read
  client-side at click time (keeps the page static; `//`-guard blocks open
  redirects). Auth itself runs through **route-handler proxies**
  (`/api/auth/login`, `/api/auth/send-otp`, `/api/auth/verify-and-register`)
  which server-side fetch the backend (CORS), forward backend messages
  verbatim, and on success move the JWT pair into **httpOnly cookies**
  (`gh_access` 15 min, `gh_refresh` 7 days — lifetimes match the backend's
  JwtSettings; the refresh value is relayed from the backend's Set-Cookie
  header since its body field is nulled). Client JS never sees a token.
  `GET /api/auth/session` — one round trip for the navbar: profile + cart +
  wishlist counts (Bearer), with one transparent `/api/Auth/refresh` retry
  when the access token expired (relayed `gh_refresh` value sent as the
  backend's `refreshToken` Cookie; rotated pair re-applied); no cookie →
  `{user:null}` with zero backend calls; network failure → 502 so the
  client keeps "unresolved" rather than claiming signed-out. `POST
  /api/auth/logout` — backend `Logout` revokes all refresh tokens +
  blacklists the access jti in one call; our cookies clear even if that
  call fails.
- `/wishlist` and `/cart` — static (○) shells: poster heading + panel
  render instantly; the list body resolves client-side because both are
  per-account. `/wishlist` = poster heading + Steam Deck `GlbPanel` rail
  (the user-approved Phase-2 slot; CC BY caption — wallmasterr) + full-width
  `WishlistClient` (the old heart scene panel was removed at the user's
  request). `/cart` = poster heading band (dither glow + grid floor — the
  panel grammar carried as type: this is the app's most task-focused page)
  + `CartClient` (list left, sticky rail right: `GlbPanel` DualShock panel
  + Summary). Five **store relay**
  routes (`/api/wishlist[...]`, `/api/cart[...]`) forward to the backend
  with the httpOnly access token via the shared `relay()` in
  `lib/auth.ts`: one transparent refresh retry on 401, honest status
  passthrough (401 = really signed out / session dead, 502 = couldn't reach
  the store → error + retry, never a false sign-out), `{gameId}` path
  segments validated `^\d+$` before touching upstream. Refresh tokens are
  single-use backend-side, so `tryRefresh` dedupes concurrent 401s (navbar
  session + page fetch on the same load) into one call. Mutations announce
  `counts:changed` (window event) → navbar badges re-resolve. The summary
  rail hands off live via `Proceed to checkout` → `/checkout`.
- `/checkout` — PPR (◐): static poster shell ("Insert coin" / Check **out**
  band) wraps a `<Suspense>` body that resolves `?buy=&qty=`
  (`fetchGame` server-side + one cold-start retry — price/stock never trust
  the client) then mounts `CheckoutClient`. Pay flow: `POST /api/orders`
  (or `/api/orders/buy-now`) → `POST /api/payments/create-link/{purchaseId}`
  → `gh_pending` draft in localStorage → full-page redirect to Razorpay's
  `shortUrl`.
- `/order-confirmation` — PPR (◐): Razorpay returns with
  `razorpay_payment_link_{id,status}` + `razorpay_payment_id` +
  `reference_id=purchase-{id}-…`; server-read params stream behind a
  skeleton (Suspense in the page — no `useSearchParams` in the build).
  Paid → `POST /api/payments/confirm-link` (`{purchaseId,
  razorpayPaymentLinkId, razorpayPaymentId}`; amount omitted — the backend
  derives it in paise) → achievement card; failed/cancelled →
  `POST /api/payments/restore/{purchaseId}` puts the cart back; neither
  path fabricates state (`confirm-link` trusts the caller by backend
  design; a stale `restore` just 404s into the honest copy).
- The payment work rides the same `relay()` contract: six new routes
  (`/api/orders` POST + `/api/orders/buy-now` + `/api/orders/[orderId]` +
  `/api/payments/create-link/[purchaseId]` + `/api/payments/confirm-link` +
  `/api/payments/restore/[purchaseId]`), GUID/`^\d+$` path validation and
  DTO-shape checks (`addressId` GUID, `paymentMethod: "Razorpay"`,
  quantity 1–99) before touching upstream.
- `/profile` — static (○) shell: poster heading band (dither glow + grid
  floor, cart grammar) + `ProfileClient`. Three ARIA tab panels:
  **Details** (GET/PUT `/api/profile` → `/api/Auth/profile`; envelope
  `{success, data:{id, firstName, lastName, email, phone, role, status}}`;
  email conflict → 400 with the backend message surfaced verbatim),
  **Addresses** (full CRUD + `PUT {id}/default` — the address book checkout
  was waiting on), **Orders** (`GET /api/Orders` bare array of full
  `OrderDto`s). Five more relay routes (`/api/profile`, `/api/addresses[...]`,
  `/api/orders`) on the same `relay()` contract; address paths validated as
  GUIDs before touching upstream. The navbar account chip links here.
- `/privacy`, `/terms`, `/refunds`, `/cookies` — static (○) legal pages
  under an `(legal)` route-group layout (Navbar + narrow prose column +
  Footer, shared `legal-ui.tsx` prose primitives). Copy is limited to
  verified facts: exactly two httpOnly session cookies (`gh_access`
  15 min / `gh_refresh` 7 d) plus two browser-local records
  (`gh_consent`, `gh_terms`), zero analytics/tracking, collection table
  mirrors only what the backend DTOs require (email, name, phone,
  password, addresses, orders, cart/wishlist), refunds = contact-based
  7-day window (`contact@gamehub.com` + order ID — no refund flow exists
  to claim), Terms set 18+ eligibility. Signup step 2 gates
  `verify-and-register` behind a required Terms/Privacy checkbox
  (client-side gate; no backend consent endpoint yet, so the receipt —
  policy version + timestamp — is written to `localStorage.gh_terms`).
  `CookieConsent` mounts once in the root layout (see Components).

## Admin appendix

`/admin` is an appendix to Crimson Arena, not a second brand: same tokens,
no new palette, no storefront nav leak (entry is the bare URL or the
Admin-only row on `/profile`). `robots.txt` disallows `/admin`; pages carry
`robots: {index: false}` and `export const instant = false` (every admin
read touches cookies — never prerendered). `requireAdmin()` lives in the
layout (tri-state: admin / denied→`/login?next=` / unreachable→honest
error); server actions re-assert by relaying to `[Authorize(Roles="Admin")]`
endpoints — the backend is the authorization, never the UI.

- **Shell:** left rail on desktop (wordmark + `AdminNav` + session footer
  with email and ADMIN chip), top band under 640px. `AdminNav` marks the
  active section with the leaning crimson tick + `aria-current`.
- **Type:** the same three voices at working sizes — display h1 (list
  `5xl/6xl`, record `4xl/5xl`), mono for every datum (ids, dates, money,
  chips, labels at `10–11px tracking-[0.16em|0.3em] uppercase`), Barlow
  body. Eyebrows are accent mono; section labels are muted mono.
- **Accent discipline (unchanged):** CTAs, links, prices/`Total spent`,
  sort glyph, armed-confirm state, error-banner border. Role/status/stock
  chips stay `border-line text-heading` — state is never a call to action.
- **Tables:** all state in the URL (`?q&sort&dir&page` + entity filters),
  defaults omitted; sortable headers are real links with `aria-sort` +
  glyph; `CatalogPagination` reuse; `contain-paint` + `min-w` scroller so
  table width never scrolls the 390px root; distinct unfiltered vs
  filtered empty states with Clear; out-of-range page redirects to page 1
  of the same filtered query.
- **Forms & mutations:** AuthForm input language (`border-line`, accent
  focus shadow). Reads are RSC; writes are server actions with PRG +
  `Flash` deal-in banners. Rejected submits keep typed values (controlled
  fields); GET-form echoes use key-remount (defaultValue doesn't rewrite
  on client-side navigation). Two-step armed confirms (`onSubmit` guard,
  submit stays `type="submit"`, arm label names the target) for
  destructive verbs; order status is allowlisted to the backend enum
  before it leaves.
- **Deliberate absences:** backend `DELETE` order is not surfaced
  (cancel by status, never erase); user block/activate/role/delete are
  unwired pending the owner's call plus self-protection (an admin cannot
  block, demote or delete themselves). Route tokens are the controllers'
  own (`api/admin/games`, `api/admin/AdminOrders`, `api/admin/AdminUsers`).
- **Known artifact:** `notFound()` renders the arena 404 under the PPR
  shell's 200 status (noindex + robots-disallowed; E2E asserts the copy,
  not the status).

## Known ceiling

- Gallery rail swaps the hero client-side; no deep-linkable image index
  (no route/query for it) — fine until shareable gallery states matter.
- Admin: populated orders branches (rows, detail, status form) are
  code-review-only until a real order exists — the prod DB holds zero and
  rows are never fabricated. Login success card's handoff button reads
  "Enter the store" even when `?next=` points at /admin — copy nit, the
  destination is honored.
