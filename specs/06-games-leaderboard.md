---
spec: 06-games-leaderboard
state: Approved
date: 2026-06-28
depends-on: 04-supabase-setup, 05-asteroids-game
objective: Create Supabase `games` and `scores` tables, seed the game catalog, wire `/salon` and `/detalle` to real data, and add anonymous score submission on game over.
---

## Scope

### In
- Supabase migration: `games` table seeded with the 8 existing games from `lib/data.ts`
- Supabase migration: `scores` table (empty, RLS open for anonymous inserts)
- `lib/supabase/queries.ts` — typed query helpers: `getGames()`, `getScores(gameId?)`, `insertScore()`
- `lib/data.ts` — remove `GAMES`, `MOCK_SCORES`, `Game`, `ScoreEntry`; keep `CATS`
- `/salon/page.tsx` — fetch real scores from Supabase (server component)
- `/detalle/[id]/page.tsx` — fetch real game + per-game scores from Supabase (server component)
- `/player/[id]/page.tsx` — on `onGameOver`, prompt player for a display name (1–12 chars, uppercase), submit score to Supabase, then show score on screen
- `best` and `plays` on game detail: computed via `MAX(score)` and `COUNT(*)` from scores table — no separate columns

### Not in
- Auth-gated score submission
- Admin UI to add/edit games
- Score editing or deletion
- Pagination on leaderboard (show top 15 max)
- Mobile layout changes
- Any game other than `rocas` submitting real scores (others still show empty leaderboard until implemented)
- `plays` count on `/biblioteca` card (stays hardcoded or hidden until a future spec)

## Data model

### `games` table
| column  | type | notes                           |
|---------|------|---------------------------------|
| `id`    | text | PK, e.g. `"rocas"`             |
| `title` | text | e.g. `"ROCAS"`                 |
| `short` | text | one-line teaser                 |
| `long`  | text | full description                |
| `cat`   | text | `"ARCADE"`, `"SHOOTER"`, etc.  |
| `cover` | text | CSS class, e.g. `"cover-rocas"` |
| `color` | text | `"yellow"`, `"cyan"`, etc.     |

### `scores` table
| column       | type        | notes                           |
|--------------|-------------|---------------------------------|
| `id`         | uuid        | PK, default `gen_random_uuid()` |
| `game_id`    | text        | FK → `games.id`                 |
| `player`     | text        | display name, 1–12 chars        |
| `score`      | integer     | raw score value                 |
| `created_at` | timestamptz | default `now()`                 |

### Computed on query (no stored columns)
- `best` — `SELECT MAX(score) FROM scores WHERE game_id = $1`
- `plays` — `SELECT COUNT(*) FROM scores WHERE game_id = $1`

### RLS
- `games`: read-only for everyone (SELECT only, no INSERT/UPDATE/DELETE from client)
- `scores`: SELECT for everyone; INSERT for everyone (anonymous play allowed); no UPDATE/DELETE

## Implementation plan

1. **Migration: `games` table** — apply via Supabase MCP:
   ```sql
   CREATE TABLE games (
     id text PRIMARY KEY,
     title text NOT NULL,
     short text NOT NULL,
     long text NOT NULL,
     cat text NOT NULL,
     cover text NOT NULL,
     color text NOT NULL
   );
   ALTER TABLE games ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "public read" ON games FOR SELECT USING (true);

   INSERT INTO games VALUES
     ('bloque-buster','BLOQUE BUSTER','Rebota la pelota y destruye muros de neón.','Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?','ARCADE','cover-bricks','cyan'),
     ('caida','CAÍDA','Encaja las piezas antes de que el techo te aplaste.','Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.','PUZZLE','cover-tetro','magenta'),
     ('serpentina','SERPENTINA','Crece sin morder tu propia cola.','Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.','ARCADE','cover-snake','green'),
     ('gloton','GLOTÓN','Devora puntos y escapa de los fantasmas.','Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.','ARCADE','cover-glot','yellow'),
     ('invasores','INVASORES','Defiende el planeta de filas alienígenas.','Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.','SHOOTER','cover-invaders','green'),
     ('rocas','ROCAS','Pulveriza asteroides en gravedad cero.','Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.','SHOOTER','cover-rocas','yellow'),
     ('ranaria','RANARIA','Cruza la autopista de pixeles.','Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.','ARCADE','cover-rana','green'),
     ('duelo-pixel','DUELO PIXEL','Dos paletas. Una pelota. Reflejos máximos.','El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.','VERSUS','cover-duelo','cyan');
   ```

2. **Migration: `scores` table** — apply via Supabase MCP:
   ```sql
   CREATE TABLE scores (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     game_id text NOT NULL REFERENCES games(id),
     player text NOT NULL,
     score integer NOT NULL,
     created_at timestamptz NOT NULL DEFAULT now()
   );
   ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "public read"   ON scores FOR SELECT USING (true);
   CREATE POLICY "public insert" ON scores FOR INSERT WITH CHECK (true);
   ```

3. **Query helpers** — create `lib/supabase/queries.ts`:
   - `getGames(): Promise<Game[]>` — `SELECT * FROM games ORDER BY title`
   - `getGame(id): Promise<Game | null>` — single row by PK
   - `getScores(gameId?: string): Promise<ScoreEntry[]>` — all scores or filtered by `game_id`, ordered by `score DESC`, limit 15
   - `getGameStats(id): Promise<{ best: number; plays: number }>` — `SELECT MAX(score), COUNT(*) FROM scores WHERE game_id = $1`
   - `insertScore(gameId, player, score): Promise<void>` — insert one row
   - Export `Game` and `ScoreEntry` types (replacing those deleted from `lib/data.ts`)

4. **Clean `lib/data.ts`** — remove `Game`, `ScoreEntry`, `GAMES`, `MOCK_SCORES`; keep `CATS`

5. **`/salon/page.tsx`** — convert to async server component:
   - Call `getScores()` (no filter = all games), pass to existing render logic
   - Call `getGames()` for the tab list
   - Remove `"use client"` and `useState` — tabs become `searchParams`-driven (URL param `?game=rocas`)

6. **`/detalle/[id]/page.tsx`** — update data fetching:
   - Replace `GAMES.find(...)` with `getGame(id)`
   - Replace `MOCK_SCORES.filter(...)` with `getScores(id)`
   - Replace `game.best` / `game.plays` with `getGameStats(id)` result

7. **`/player/[id]/page.tsx`** — add game-over score submission:
   - On `onGameOver(score)`: set `gameOver = true`, store score in state
   - Render an overlay (inside `.crt-screen`) with:
     - Final score display
     - Text input for player name (maxLength 12, auto-uppercase)
     - "ENVIAR" button → calls `insertScore(id, player, score)`, then navigates to `/detalle/${id}`
     - "REINTENTAR" button → resets game without submitting
   - Input validation: trim whitespace, reject empty string before submit

## Acceptance criteria

- [ ] `games` table exists in Supabase with 8 rows matching `lib/data.ts` seed data
- [ ] `scores` table exists in Supabase, empty, with correct schema
- [ ] RLS: anonymous SELECT works on both tables; anonymous INSERT works on `scores`; INSERT on `games` is blocked
- [ ] `lib/data.ts` no longer exports `GAMES`, `MOCK_SCORES`, `Game`, or `ScoreEntry`
- [ ] `lib/supabase/queries.ts` exports all five helpers with correct TypeScript types
- [ ] `/salon` renders with real data from Supabase; tab filter works via `?game=` URL param
- [ ] `/detalle/rocas` shows correct `best` and `plays` computed from scores table (empty = 0 / "0")
- [ ] `/detalle/rocas` leaderboard shows scores from Supabase, max 15 rows
- [ ] Playing Asteroids to game over shows the name-input overlay inside the CRT screen
- [ ] Submitting a name + score inserts a row in `scores` and redirects to `/detalle/rocas`
- [ ] The submitted score appears in `/detalle/rocas` leaderboard and `/salon` on next load
- [ ] Empty player name is rejected (button disabled or inline error)
- [ ] "REINTENTAR" on game over restarts the game without inserting a score row
- [ ] `npm run dev` has no TypeScript or build errors

## Decisions taken and discarded

- **Computed `best` and `plays` over stored columns** — avoids drift between the
  scores table and a denormalized counter. Cost is one extra aggregation query per
  detalle page load; acceptable at this scale.

- **Anonymous INSERT with display name prompt** — no auth required to submit a
  score. Simpler UX for casual play; score integrity is not a concern at this stage.

- **`searchParams`-driven tabs on `/salon`** — removing `useState` lets `/salon`
  stay a server component, keeping data fetching simple and avoiding a client
  boundary just for tab state.

- **Limit 15 rows on leaderboard queries** — matches the existing mock data size
  and keeps the UI uncluttered. No pagination in this spec.

- **`lib/supabase/queries.ts` over inline Supabase calls in each page** — single
  source for query logic; pages stay thin. Easier to swap or cache later.

- **Full text fields in `games` table** — no normalization of `cat` or `color`
  into enum/lookup tables. Overkill for 8 rows; string columns are fine.

- **No real scores for non-`rocas` games** — only Asteroids has a wired game loop.
  Other games show an empty leaderboard until each gets a spec of its own.
