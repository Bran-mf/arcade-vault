---
spec: 01-mvp-screens
state: Approved
date: 2026-06-21
depends-on: —
objective: Port all five Arcade Vault screens from the vanilla-React reference into Next.js App Router pages with pixel-perfect neon/retro UI and placeholder data — no real game logic, no real auth.
---

## Scope

### In
- Global layout: sticky nav, footer, neon background (grid + scanlines + noise layers)
- `/` → redirects to `/biblioteca`
- `/biblioteca` — hero, search, category chips, game card grid (tilt effect on hover)
- `/detalle/[id]` — cover art, game info, stat strip, leaderboard table (mock data)
- `/player/[id]` — CRT screen placeholder with animated arena, HUD, pause/end buttons, game-over modal (no real score ticker — static or frozen UI)
- `/auth` — login/register form UI, guest button, social buttons (no real auth, form submits nowhere)
- `/salon` — podium + full leaderboard table (mock data)
- `lib/data.ts` — GAMES array and CATS array (copied from reference)
- CSS design system ported to `globals.css` as plain CSS (all custom properties, neon classes, animations)
- Nav with mobile hamburger + slide-out panel; active link state per route

### Not in
- Real authentication (NextAuth, Supabase, or any backend)
- Score persistence (no localStorage writes, no API)
- Playable games (the CRT arena is a static animated placeholder)
- Score ticker / live game logic in `/player`
- Any backend, database, or API routes

## Data model

### `lib/data.ts`

```ts
export type Game = {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string   // CSS class name e.g. "cover-bricks"
  color: string   // button accent: "cyan" | "magenta" | "yellow"
  best: number    // top score shown on card
}

export const CATS: string[] = ["TODOS", "ARCADE", "PUZZLE", "ACCIÓN", "CLÁSICO"]

export const GAMES: Game[] = [ /* 8 entries copied verbatim from references/data.jsx */ ]
```

### Mock scores (inline, not a separate file)

Each screen that needs scores (`/detalle/[id]` leaderboard, `/salon` podium + table) imports a
`MOCK_SCORES` array defined in `lib/data.ts`:

```ts
export type ScoreEntry = {
  player: string
  score: number
  gameId: string
  date: string   // display string e.g. "21/06/2026"
}

export const MOCK_SCORES: ScoreEntry[] = [ /* ~15 hardcoded entries */ ]
```

No other persistent or server-side data.

## Implementation plan

1. **CSS design system** — *removed as this step was already done. (the styles on references/styles.css are already implementd in app/globals.css)

2. **Data file** — create `lib/data.ts` with `Game`, `ScoreEntry` types, `CATS`, `GAMES` (8 entries),
   and `MOCK_SCORES` (~15 entries).

3. **Root layout** (`app/layout.tsx`) — add the fixed background layers (`av-bg`, `av-noise`),
   render `<Nav>` and `<footer>` around `{children}`, keep `av-main` wrapper.

4. **Nav component** (`components/Nav.tsx`) — sticky nav with logo, desktop links, coin counter,
   auth button (static, links to `/auth`), hamburger + mobile slide-out panel. Active state via
   `usePathname()`.

5. **Root redirect** (`app/page.tsx`) — `redirect('/biblioteca')`.

6. **Library screen** (`app/biblioteca/page.tsx`) — hero with flicker title, search input,
   category chips, `av-grid` of `<GameCard>` components. Filter logic is client-side (`"use client"`).
   `<GameCard>` includes the 3-D tilt effect on `onMouseMove`.

7. **Detail screen** (`app/detalle/[id]/page.tsx`) — reads `id` from params, finds game in `GAMES`,
   renders cover art div, info column, stat strip, leaderboard table filtered from `MOCK_SCORES`.
   "JUGAR" button links to `/player/[id]`.

8. **Player screen** (`app/player/[id]/page.tsx`) — static CRT arena (animated grid floor,
   player ship bob, three drifting enemies), frozen HUD (score "00000", lives "♥ ♥ ♥", level "01"),
   pause/end/exit buttons present but non-functional except "SALIR" which navigates back to
   `/detalle/[id]`.

9. **Auth screen** (`app/auth/page.tsx`) — login/register tab UI, username + password fields,
   guest button, Google/GitHub social buttons. No form submission wired up.

10. **Hall of Fame screen** (`app/salon/page.tsx`) — page header, game-filter chips (one per game
    + "TODOS"), podium (top 3 from `MOCK_SCORES`), full table of all entries with gold/silver/bronze
    row highlights.

## Acceptance criteria

- [ ] `npm run dev` starts with no TypeScript or build errors
- [ ] Navigating to `/` redirects to `/biblioteca`
- [ ] Library page renders all 8 game cards with cover art (CSS-only), title, short description,
      best score, and JUGAR button
- [ ] Search input filters cards by title in real time; category chips filter by cat
- [ ] Card hover triggers 3-D tilt effect
- [ ] Clicking a card or JUGAR navigates to `/detalle/[id]`
- [ ] Detail page shows correct game data for the given id; leaderboard shows filtered mock scores
- [ ] Clicking JUGAR on detail page navigates to `/player/[id]`
- [ ] Player page shows animated CRT arena (grid scrolls, ship bobs, enemies drift) with frozen HUD
- [ ] SALIR button on player page returns to `/detalle/[id]`
- [ ] Auth page renders both tabs (INICIAR SESIÓN / CREAR CUENTA), email field appears only on
      register tab, no errors on submit
- [ ] Hall of Fame renders podium with top 3 and full table with all mock scores
- [ ] Nav shows active underline on the current route; hamburger opens/closes mobile panel
- [ ] All neon animations play (flicker on hero h1, blink cursor, gridscroll, bob, drift)
- [ ] App is readable and not broken at 375 px width (mobile)

## Decisions taken and discarded

- **App Router over single-page hash router** — Next.js App Router used for real URL routes
  (`/biblioteca`, `/detalle/[id]`, etc.) instead of replicating the reference's manual hash-based
  router. Reason: idiomatic Next.js, enables future SSR/SSG without refactor.

- **Plain CSS over Tailwind for design system** — the neon design system (custom properties,
  clip-paths, multi-layer box-shadows, pseudo-element animations) is ported verbatim into
  `globals.css` rather than rewritten in Tailwind utilities. Reason: the reference CSS is
  highly specific and would lose fidelity if translated to utility classes; keeping it as-is
  is faster and safer for a visual-parity goal.

- **Auth screen is UI-only placeholder** — no NextAuth, Supabase, or localStorage session.
  The form renders but submits nowhere. Deferred to a future spec.

- **Player screen is a static animated placeholder** — the score ticker, lives decrement, and
  game-over modal interaction from the reference are not implemented. The CRT arena CSS animations
  run but no game logic exists. Deferred to a future spec.

- **Mock scores inline in `lib/data.ts`** — no separate JSON file or API. Reason: simplest
  approach for a purely visual MVP with no backend.

- **`"use client"` only where needed** — Library page (filter state) and Nav (pathname, mobile
  open state) are client components; Detail, Player, Auth, and Hall of Fame pages are server
  components where possible.
