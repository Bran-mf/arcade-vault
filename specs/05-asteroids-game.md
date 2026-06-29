---
spec: 05-asteroids-game
state: Approved
date: 2026-06-28
depends-on: none
objective: Implement the Asteroids arcade game at /player/rocas as a Next.js client page, porting game.js logic to a canvas-based React component.
---

## Scope

### In
- `components/games/AsteroidsGame.tsx` — canvas component with full game logic
  ported from `references/02-claude-asteroids-main/game.js`. Accepts callbacks:
  `onScore(n)`, `onLives(n)`, `onLevel(n)`, `onGameOver(score)`
- `lib/gameComponents.ts` — map of `gameId → React component`, starting with
  `rocas → AsteroidsGame`
- `app/player/[id]/page.tsx` — convert to `"use client"`, look up component from
  registry, wire HUD stats (score, lives, level) to component callbacks,
  wire PAUSA and FIN buttons to game state

### Not in
- Score persistence to Supabase
- Auth wall or login requirement
- Mobile/touch controls
- Nav link changes
- Any other game implementation (only `rocas` gets a real component)
- Changes to `/detalle/[id]` or any other page

## Implementation plan

1. **Game component** — create `components/games/AsteroidsGame.tsx` as `"use client"`:
   - Props: `onScore(n: number)`, `onLives(n: number)`, `onLevel(n: number)`,
     `onGameOver(score: number)`, `onPause?()`, `paused?: boolean`
   - `useRef<HTMLCanvasElement>` — canvas element, 800×600
   - `useEffect` — init game state, start `requestAnimationFrame` loop,
     attach `keydown`/`keyup` listeners on the canvas element, return cleanup
   - Port all classes/functions from `game.js` verbatim inside the effect,
     replacing `const canvas = document.getElementById(...)` with the ref
   - Call callbacks on state transitions:
     - `onScore` each time `score` changes
     - `onLives` each time `lives` changes
     - `onLevel` each time `level` changes
     - `onGameOver` when `state` becomes `'gameover'`
   - `paused` prop: when true, skip `update()` in the loop (still draw)
   - Canvas: `tabIndex={0}`, call `canvasRef.current.focus()` on mount
   - Canvas styled `width: 100%; height: 100%; object-fit: contain`

2. **Game registry** — create `lib/gameComponents.ts`:
   ```ts
   import dynamic from 'next/dynamic'
   export const GAME_COMPONENTS: Record<string, React.ComponentType<GameProps>> = {
     rocas: dynamic(() => import('@/components/games/AsteroidsGame'), { ssr: false }),
   }
   ```
   Export a `GameProps` interface with the four callbacks + `paused`.

3. **Player page** — convert `app/player/[id]/page.tsx` to `"use client"`:
   - `useState` for `score`, `lives`, `level`, `paused`, `gameOver`
   - Look up `GAME_COMPONENTS[id]`; if not found, render placeholder div
     (preserves existing mock UI for games not yet implemented)
   - Replace mock HUD values with live state:
     score → formatted string, lives → ♥ icons, level → zero-padded
   - Wire PAUSA button → toggle `paused`
   - Wire FIN button → navigate back to `/detalle/${id}`
   - Render `<GameComponent>` inside existing `.crt-screen > .game-arena` div,
     removing placeholder HTML (`.grid-floor`, `.enemy`, `.player-ship`)
   - Keep all existing CSS class names intact

## Acceptance criteria

- [ ] Navigating to `/player/rocas` renders the Asteroids canvas inside the CRT screen
- [ ] Ship moves with ArrowLeft/ArrowRight/ArrowUp; fires with Space
- [ ] Asteroids split correctly on bullet hit; particles appear on explosion
- [ ] Triple-shot power-up activates and expires as in the reference
- [ ] HUD in player page shows live score, lives (♥ icons), and level — updated in real time
- [ ] PAUSA button freezes game logic (canvas still visible); pressing again resumes
- [ ] FIN button navigates to `/detalle/rocas`
- [ ] Game over state shows overlay on canvas; Space restarts the game
- [ ] Keyboard input is scoped to the canvas — no arrow-key page scroll
- [ ] Other game IDs (e.g. `/player/caida`) still render the existing placeholder UI
- [ ] `npm run dev` has no TypeScript or build errors

## Decisions taken and discarded

- **`/player/[id]` as generic shell, not a new route** — reusing the existing
  player page keeps the routing consistent with the detalle "JUGAR" button and
  avoids a parallel route hierarchy.

- **Game registry (`lib/gameComponents.ts`) over inline switch** — registry lets
  future games be added by dropping a component + one line in the map, with no
  changes to the player page.

- **`dynamic(..., { ssr: false })` for game components** — canvas + RAF loop
  require browser APIs; SSR would throw. `dynamic` is the Next.js-idiomatic way
  to gate client-only code.

- **Keyboard events on canvas, not window** — scopes input to the game area,
  prevents arrow keys from scrolling the page when the game is focused.

- **No score persistence in this spec** — Supabase is set up (spec-04) but
  schema design for scores is deferred. This spec ships a playable game first.

- **Callbacks over shared state (zustand/context)** — game loop runs inside a
  single `useEffect`; prop callbacks are the lightest bridge to React state
  without adding a store dependency.

## Risks

- **Canvas focus for keyboard input** — canvas must receive focus on mount
  (call `canvasRef.current.focus()`) and set `tabIndex={0}`; missing either
  causes keys to be silently ignored.

- **`requestAnimationFrame` cleanup** — effect cleanup must cancel the pending
  RAF id and remove keydown/keyup listeners; missing cleanup causes multiple
  loops stacking on re-render.

- **`dynamic` import and TypeScript** — `GAME_COMPONENTS` value type must
  match `GameProps` exactly or TS will error at the call site in the player page.
