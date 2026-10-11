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
- **CSS** — marquee ticker (46s linear, pause on hover), hover states
  (`transition 150–200ms`). Featured cards lift (`translate -4px` + accent
  border + `shadow-xl`) on hover.
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
CSS animations set `animation: none !important` (sweep forced to
`opacity: 0 !important`), motion `useReducedMotion` renders plain divs,
marquee freezes, three.js renders one frame.

## Content rules

Every number comes from the live API (count, prices in `Intl` INR, ratings,
genre counts). Empty and error states are honest but customer-toned ("We
couldn't load the catalog right now — refresh in a moment"): **customer-facing
copy never names the backend, API, or missing internals** (user-set,
production-level rule). No invented policies, testimonials, discounts, or
links; the single external link is the real GitHub repo. Genre chips on
`/games` are real controls (URL-backed filter route). Detail page: API
404/400 → real `not-found` ("Not in the arena"); transport failure → error
boundary that admits the store is unreachable — never a fake 404. Cart and
checkout are JWT-gated server-side and no auth exists in this frontend, so
the buy buttons show an honest on-click notice ("accounts open first") —
never a fake success.

## Components

`Navbar` (fixed; Store → `/games`, Genres → `/#genres`, logo → `/`) · `Hero` (art layer, dither glow, sweep,
embers, featured card: key-art rail + title/price line + genre + data strip
with rating, stock, dots and WCAG 2.2.2 pause — media-card grammar, see
"Registry sources") · `Ticker` (all titles,
`aria-hidden` as decorative repetition) · `FeaturedGrid` (top 6, Reveal
stagger; optional `heading`/`eyebrow`, reused on the detail page as
"More from the arena"; cards are `next/link` → `/games/[id]`) ·
`GenreRail` (counts) · `CtaBand` (grid floor + dither glow) ·
`Footer` (build-year constant) · `Reveal`, `CountUp`, `icons` (Phosphor behind a client
boundary — Phosphor calls `createContext`, illegal in Server Components) ·
`EmberField` · `CtaBand` is a client component (pointer-tracked glow) ·
`game/GameCard` (shared grid card: art with `onError` fallback, genre tag,
title, rating, INR price; used by `FeaturedGrid` and the catalog grid) ·
`game/ProductMedia` (stage + trailer/art tile rail; stage swaps are client
state, `art-in` class reuse; trailer facade → click-to-play
`youtube-nocookie.com` iframe, `autoplay=1` only after the click) ·
`game/BuyBox` (price, rating, stock, spec rows, quantity stepper, Add to
cart + Buy now → honest on-click gate notice, `role="status"`) ·
`catalog/CatalogToolbar` (client: 300ms-debounced search → `router.replace`,
genre tabs with accent underline, sort select, `CountUp` on the live count) ·
`catalog/CatalogPagination` (real `next/link` pages with aria labels) ·
`ui/Tilt` (pointer-tracked 3D perspective via GSAP `quickTo`, clamped ~5°,
gated on reduced motion + coarse pointers; wraps catalog cards).

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
  `redirect` to page 1 of the same filtered query. Honest empty
  (catalog down) and no-results (with real total) states; cards wrapped
  in `Tilt`.
- `not-found.tsx` ("Not in the arena") and `games/[id]/error.tsx` (honest
  API-down boundary) are shared/global.

## Known ceiling

- Gallery rail swaps the hero client-side; no deep-linkable image index
  (no route/query for it) — fine until shareable gallery states matter.
