---
spec: 02-landing-page
state: Approved
date: 2026-06-21
depends-on: 01-mvp-screens
objective: Replace the root redirect with a full landing page at `/` ported from references/home-about/home.jsx, with all home-specific CSS appended to globals.css.
---

## Scope

### In
- `app/page.tsx` — replace `redirect('/biblioteca')` with the full landing page component
- Seven sections ported from `references/home-about/home.jsx`:
  1. Hero — floating pixel silhouettes, eyebrow, h1 (3 lines), subtitle, two CTAs, scroll indicator
  2. Why Arcade Vault — 4 feature cards with pixel SVG icons
  3. Games Available Now — mini-rail of first 6 games from `GAMES`, links to `/detalle/[id]`
  4. Stats strip — 3 stat blocks (hardcoded copy)
  5. Live Activity — ticker (7 hardcoded rows) + top-5 players today (hardcoded)
  6. Pricing — single price card + FAQ (hardcoded copy)
  7. Final CTA — pixel h2 + pulse button
- All home-specific CSS classes appended to `app/globals.css`
- Scroll-reveal (`IntersectionObserver`) on sections marked `.reveal`
- CTAs navigate to existing routes: `/biblioteca`, `/auth`, `/detalle/[id]`, `/salon`

### Not in
- `/about` page (deferred)
- Real score/activity data (all hardcoded mock)
- Any new API routes or data fetching
- Changes to Nav, footer, or any other existing page

## Implementation plan

1. **Append home CSS** — copy all home-specific rules from
   `references/home-about/styles.css` into `app/globals.css`:
   `.home-hero`, `.home-silos`, `.silo` (s1–s8) + float animations,
   `.home-title`, `.home-sub`, `.home-ctas`, `.hero-eyebrow`, `.hero-scroll`,
   `.home-section`, `.section-head`, `.kicker`, `.section-rule`,
   `.feature-grid`, `.feature-card`, `.ft-icon`, `.ft-title`, `.ft-desc`,
   `.mini-rail`, `.mini-card`, `.mini-cover`, `.mini-meta`,
   `.home-stats`, `.stats-inner`, `.stat-block`,
   `.activity-grid`, `.activity-card`, `.ac-head`, `.ticker`, `.tick-row`,
   `.top-list`, `.top-row`, `.top1/.top2/.top3`,
   `.pricing-grid`, `.price-card`, `.pc-*`, `.pricing-faq`, `.faq-item`,
   `.home-final`, `.final-title`, `.final-cta`, `.reveal`/`.reveal.in`.

2. **Landing page component** — rewrite `app/page.tsx` as a `"use client"`
   component. Port all JSX from `references/home-about/home.jsx`:
   - `useReveal` hook (IntersectionObserver on `.reveal` elements)
   - `FloatingSilhouettes` (8 pixel SVGs)
   - `FeatureIcon` (4 pixel SVG icons: GAMEPAD, FREE, TROPHY, ROCKET)
   - `MiniCard` sub-component
   - `Home` main component with all 7 sections
   - Replace `navigate({ name: "biblioteca" })` → `<Link href="/biblioteca">` /
     router.push; same for `/auth`, `/detalle/[id]`, `/salon`
   - Import `GAMES` from `@/lib/data`

## Acceptance criteria

- [ ] Navigating to `/` renders the landing page (no redirect to `/biblioteca`)
- [ ] Hero section shows floating pixel silhouettes, eyebrow text with blinking cursor, 3-line h1, subtitle, and two CTA buttons
- [ ] "EXPLORAR JUEGOS" button navigates to `/biblioteca`
- [ ] "CREAR CUENTA" button navigates to `/auth`
- [ ] "¿POR QUÉ ARCADE VAULT?" section renders all 4 feature cards with pixel SVG icons
- [ ] Games preview mini-rail shows exactly 6 cards; clicking any navigates to `/detalle/[id]`
- [ ] "VER TODOS LOS JUEGOS →" button navigates to `/biblioteca`
- [ ] Stats strip renders 3 stat blocks with correct copy
- [ ] Live Activity section renders 7 ticker rows and top-5 player list; "VER SALÓN →" navigates to `/salon`
- [ ] Pricing section renders price card with feature list and FAQ with 3 items
- [ ] "EMPEZAR GRATIS →" and "INSERTAR MONEDA →" buttons navigate to `/auth` and `/biblioteca` respectively
- [ ] `.reveal` sections animate in on scroll via IntersectionObserver
- [ ] `npm run dev` has no TypeScript or build errors
- [ ] Page is readable and not broken at 375 px width

## Decisions taken and discarded

- **`"use client"` for the entire page** — `useReveal` (IntersectionObserver)
  and any router.push calls require a client component. No server-component
  split attempted; the page has no data fetching that would benefit from SSR.

- **Root route becomes landing page** — `/` renders Home instead of redirecting
  to `/biblioteca`. Biblioteca remains at its own route. Reason: a landing page
  is the canonical entry point; the redirect was a placeholder from spec 01.

- **All activity/ticker data hardcoded inline** — no new data file or API.
  Consistent with how spec 01 handled mock scores. Real activity feed deferred
  to a future spec.

- **CSS appended to globals.css** — home-specific classes added to the existing
  global stylesheet, consistent with spec 01's approach for the design system.
  No CSS Modules or scoped styles.

- **`/about` deferred** — `references/home-about/about.jsx` exists but is
  explicitly out of scope for this spec.
