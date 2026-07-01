---
spec: 07-caida-game
state: Implemented
date: 2026-06-30
depends-on: 04-supabase-setup, 05-asteroids-game
objective: Implement Tetris ("CAÍDA") at /player/caida as a Next.js client component, porting references/games/03-claude-tetris/game.js logic to canvas, wired to the existing caida catalog row.
---

## Scope

### In
- `components/games/CaidaGame.tsx` — canvas component with full Tetris logic
  ported from `references/games/03-claude-tetris/game.js` (10×20 board, 7 pieces,
  wall kicks, ghost piece, soft/hard drop, level selector 1–15, line-clear scoring).
  Accepts callbacks: `onScore(n)`, `onLives(n)`, `onLevel(n)`, `onGameOver(score)`
- `lib/gameComponents.ts` — add `caida → CaidaGame` to `GAME_COMPONENTS`
- `lib/data.ts` — edit existing `caida` `GAMES` entry only if title/short/long
  copy needs adjustment (already correct per Block A confirmation — likely no-op)
- Supabase — no insert needed, `caida` row already exists in `games` table
  (spec-06); verify only

### Not in
- Auth wall or login requirement
- Mobile/touch controls
- Nav link changes
- Any other game's implementation (only `caida` gets a real component here,
  alongside the existing `rocas`)
- Changes to `/detalle/[id]` beyond what spec-06 already wired
- New `cover-tetro` CSS — existing cover art is kept as-is
- Sound effects (game.js has none to port)

## Data model

### `GAMES` catalog row (already exists in `lib/data.ts` and Supabase `games` table — no change, verified only)
| field   | value                                                              |
|---------|--------------------------------------------------------------------|
| `id`    | `caida`                                                             |
| `title` | `CAÍDA`                                                             |
| `short` | `Encaja las piezas antes de que el techo te aplaste.`               |
| `long`  | `Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.` |
| `cat`   | `PUZZLE`                                                            |
| `cover` | `cover-tetro`                                                       |
| `color` | `magenta`                                                           |

### Component-internal state (not persisted, not new schema)
- `startLevel` (1–15) — chosen via an in-canvas pre-game selector, ported from
  `game.js`'s level-select screen; drives initial `dropInterval` and initial
  `onLevel` callback value.
- `lines` — tracked internally for scoring/leveling math; not exposed as its
  own HUD callback (no `onLines` prop — matches the fixed 4-callback `GameProps`
  interface from spec-05).

## Implementation plan

1. **Game component** — create `components/games/CaidaGame.tsx` as `"use client"`:
   - Props: `onScore(n: number)`, `onLives(n: number)`, `onLevel(n: number)`,
     `onGameOver(score: number)`, `onPause?()`, `paused?: boolean` (matches
     `GameProps` from `lib/gameComponents.ts`, no interface changes)
   - `useRef<HTMLCanvasElement>` — canvas element, 800×600
   - `useEffect` — init game state (board, current/next piece, score, lines,
     level, dropInterval), start `requestAnimationFrame` loop, attach
     `keydown`/`keyup` listeners on the canvas element, return cleanup
   - Port all logic from `game.js` verbatim inside the effect: piece shapes,
     wall kicks, `clearLines()`, ghost piece, soft/hard drop, level-up on every
     10 lines, level-select pre-game screen (drawn on canvas, Enter/Space to
     confirm choice of 1–15 before board starts)
   - Controls: `ArrowLeft`/`ArrowRight` move, `ArrowUp` rotate, `ArrowDown`
     soft-drop, `Space` hard-drop, `KeyP`/`Escape` pause — all with
     `preventDefault()` on the canvas listener
   - Call callbacks on state transitions:
     - `onScore` each time `score` changes
     - `onLevel` each time `level` changes (including the initial value once
       level-select is confirmed)
     - `onLives` called once with `1` on mount and never again (no lives
       concept in this game — fixed value keeps the HUD heart icon populated
       without implying a life-loss mechanic)
     - `onGameOver` when `gameOver` becomes `true` (board topped out), fired
       exactly once per game via guard flag
   - `paused` prop: when true, skip drop/update logic in the loop (still draw
     board + piece); internal `KeyP`/`Escape` pause stays independent and only
     affects the game's own overlay, calling `onPause?.()` if provided
   - Canvas: `tabIndex={0}`, call `canvasRef.current.focus()` on mount
   - Canvas styled `width: 100%; height: 100%; object-fit: contain`
   - Cleanup cancels the RAF id and removes both listeners

2. **Game registry** — edit `lib/gameComponents.ts`:
   ```ts
   caida: dynamic(() => import("@/components/games/CaidaGame"), { ssr: false }),
   ```

3. **Catalog** — no edit required; verify existing `caida` row in `lib/data.ts`
   (and Supabase `games` table) matches the Data model section above.

4. **Cover CSS** — no edit required; `.cover-tetro` in `app/globals.css` is
   kept as-is.

5. **Supabase** — no migration needed; `caida` row already seeded in spec-06.
   Verify via `list_tables`/`execute_sql` that the row exists and matches.

6. **No change to `app/player/[id]/page.tsx`** — it resolves any registered
   `GAME_COMPONENTS[id]` generically; score submission already flows through
   `app/actions.ts` → `insertScore` from spec-06.

## Acceptance criteria

- [ ] Navigating to `/player/caida` renders the Tetris canvas inside the CRT screen
- [ ] Level-select screen (1–15) shows before the board starts; chosen level sets initial `dropInterval`
- [ ] Piece moves with ArrowLeft/ArrowRight, rotates with ArrowUp, soft-drops with ArrowDown, hard-drops with Space
- [ ] Ghost piece renders at the piece's eventual landing position
- [ ] Line clears score correctly (100/300/500/800 × level) and level increases every 10 lines
- [ ] HUD in player page shows live score and level — updated in real time; lives icon shows fixed at 1
- [ ] PAUSA button freezes drop/movement (canvas still visible); pressing again resumes
- [ ] KeyP/Escape also pauses/resumes from within the game itself
- [ ] FIN button navigates to `/detalle/caida`
- [ ] Game over (board topped out) shows overlay on canvas, fires `onGameOver` exactly once, triggers the name-input/score-submission flow from spec-06
- [ ] Keyboard input is scoped to the canvas — no arrow-key/space page scroll
- [ ] Other unimplemented game IDs still render the existing placeholder UI
- [ ] `npm run dev` has no TypeScript or build errors
- [ ] `/salon` and `/detalle/caida` show real scores after submitting one

## Decisions taken and discarded

- **Reuse existing `caida` catalog row and cover art unchanged** — id, cat,
  color, cover all already fit Tetris; touching them would be scope creep on
  a spec that's purely "wire up the game logic."

- **Fixed `onLives(1)` instead of adding a 5th callback or dropping the HUD
  heart** — keeps `GameProps` interface stable across all games (matches
  spec-05's decision to keep the registry/interface generic); avoids a
  game-specific prop just for one game with no lives concept.

- **Level-select screen ported as in-canvas UI, not a page-level React state**
  — keeps all game logic inside the single `useEffect`/canvas boundary,
  consistent with spec-05's "port verbatim inside the effect" approach; avoids
  a second client-state layer in the player page.

- **Registry + `dynamic(..., { ssr: false })`** — same rationale as spec-05:
  canvas/RAF code needs browser APIs, registry lets games be added with one
  line and no player-page changes.

- **Keyboard events on canvas, not window** — same rationale as spec-05:
  scopes input, prevents arrow/space page scroll.

- **No sound** — `game.js` reference has no audio to port; out of scope.

## Risks

- **Canvas focus for keyboard input** — same risk as spec-05: missing
  `tabIndex={0}` or `.focus()` on mount silently drops all keys.

- **`requestAnimationFrame` cleanup** — cleanup must cancel the pending RAF id
  and remove keydown/keyup listeners; missing cleanup stacks multiple loops on
  re-render/retry.

- **Wall-kick porting fidelity** — Tetris rotation near walls/floor is easy to
  subtly break during the port; verify against the reference visually for all
  7 piece types before calling this done.

- **Double-pause sources** — the game has its own internal KeyP/Escape pause
  *and* the player page's PAUSA prop; if not unified carefully (e.g. internal
  pause state also respecting the `paused` prop, and vice versa), the two can
  get out of sync and show inconsistent overlays.

- **`onLives(1)` being mistaken for a real mechanic** — future maintainers
  might assume this game has 1 life and try to wire a life-loss condition;
  the decisions section above should prevent that confusion.
