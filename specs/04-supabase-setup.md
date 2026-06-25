---
spec: 04-supabase-setup
state: Approved
date: 2026-06-24
depends-on: none
objective: Install and configure Supabase (auth + database) in Next.js with browser and server clients, env vars, and OAuth providers (Google, GitHub, email+password).
---

## Scope

### In
- Install `@supabase/supabase-js` and `@supabase/ssr`
- `lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `lib/supabase/server.ts` — server client (`createServerClient`, cookies from `next/headers`)
- `.env.local` — `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `middleware.ts` — session refresh on every request via `updateSession`
- Supabase dashboard: enable Email+Password, Google, and GitHub OAuth providers

### Not in
- Any UI changes to `/auth` or any other page
- Database tables or migrations
- Connecting clients to existing components or routes
- RLS policies
- Auth callback route (`/auth/callback`) — deferred
- Protecting any routes (middleware only refreshes session, does not guard routes)

## Implementation plan

1. **Install packages** — `npm install @supabase/supabase-js @supabase/ssr`

2. **Env vars** — add to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — project URL from Supabase dashboard
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key from Supabase dashboard

3. **Browser client** — create `lib/supabase/client.ts`:
   - Export `createClient()` using `createBrowserClient` from `@supabase/ssr`
   - Reads env vars at call time (not module load) to support SSR

4. **Server client** — create `lib/supabase/server.ts`:
   - Export async `createClient()` using `createServerClient` from `@supabase/ssr`
   - Reads/writes cookies via `cookies()` from `next/headers`

5. **Middleware** — create `middleware.ts` at project root:
   - Call `updateSession(request)` on every request to refresh the Supabase session
   - `config.matcher` excludes `_next/static`, `_next/image`, and `favicon.ico`

6. **OAuth providers** — in Supabase dashboard:
   - Enable Email+Password (confirm email optional for now)
   - Enable Google provider: add Client ID + Secret from Google Cloud Console
   - Enable GitHub provider: add Client ID + Secret from GitHub OAuth App

## Acceptance criteria

- [ ] `@supabase/supabase-js` and `@supabase/ssr` appear in `package.json` dependencies
- [ ] `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `lib/supabase/client.ts` exports a `createClient()` function using `createBrowserClient`
- [ ] `lib/supabase/server.ts` exports an async `createClient()` function using `createServerClient` with cookie handling
- [ ] `middleware.ts` exists at project root and calls `updateSession` on every non-static request
- [ ] `npm run dev` has no TypeScript or build errors
- [ ] Supabase dashboard shows Email+Password, Google, and GitHub providers enabled

## Decisions taken and discarded

- **`@supabase/ssr` over `@supabase/auth-helpers-nextjs`** — `auth-helpers-nextjs`
  is deprecated. `@supabase/ssr` is the current recommended package for Next.js
  App Router with cookie-based session handling.

- **Both browser and server clients** — browser client for Client Components,
  server client for Server Components and Route Handlers. Single client would
  break SSR session access.

- **Middleware refreshes session only, does not guard routes** — route protection
  is UI/auth logic, deferred to a future spec. Middleware solely keeps the session
  token fresh on every request.

- **Auth callback route deferred** — OAuth redirects require `/auth/callback` to
  exchange the code for a session. Deferred because no UI is wired in this spec;
  callback route will be added when `/auth` page is implemented.

- **No tables in this spec** — schema design depends on product decisions
  (scores, profiles, games) not yet confirmed. Infrastructure first.

- **Remote Supabase project** — local dev stack (`supabase start`) not used;
  MCP server already configured against the remote project.
