---
spec: 03-about-page
state: Approved
date: 2026-06-24
depends-on: 02-landing-page
objective: Implement the /about page ported from references/home-about/about.jsx, with a working contact form that sends email via Resend.
---

## Scope

### In
- `app/about/page.tsx` — new "use client" page, ported from `references/home-about/about.jsx`
  - About hero: kicker, h1, mission text, 3 highlight cards with pixel SVG icons
  - Animated divider (pixel dots + gradient bars)
  - Contact section: intro column + contact form with name/email/message fields
  - On success: terminal-success screen with fake OS output lines
  - On API error: terminal-success screen with error message instead of success line
  - Shake animation on empty-field submit attempt
- `app/api/contact/route.ts` — POST handler, calls Resend, returns `{ ok: true }` or `{ ok: false, error }`
- `app/globals.css` — append all about-specific CSS classes from `references/home-about/styles.css`
- `.env.local` — `RESEND_API_KEY` and `RESEND_TO_EMAIL` (destination) and `RESEND_FROM_EMAIL` (sender)

### Not in
- Nav link to /about (no Nav changes)
- Any changes to existing pages or routes
- Email templates / HTML email body (plain text only)
- Rate limiting or CAPTCHA on the contact form

## Implementation plan

1. **Install Resend** — `npm install resend`

2. **Env vars** — add to `.env.local`:
   - `RESEND_API_KEY` — Resend API key
   - `RESEND_TO_EMAIL` — bran9613@gmail.com
   - `RESEND_FROM_EMAIL` — sender address (Resend sandbox: `onboarding@resend.dev`)

3. **API route** — create `app/api/contact/route.ts`:
   - Parse `{ name, email, msg }` from POST body
   - Validate all three fields non-empty; return 400 if not
   - Call `resend.emails.send(...)` with subject `"[Arcade Vault] Nuevo mensaje de {name}"`
     and plain-text body containing name, email, and msg
   - Return `{ ok: true }` on success or `{ ok: false, error: string }` on failure

4. **About CSS** — append all about-specific rules from `references/home-about/styles.css`
   to `app/globals.css`:
   `.about`, `.about-hero`, `.about-title`, `.about-mission`,
   `.highlight-row`, `.highlight`, `.hl-icon`, `.hl-text`,
   `.about-divider`, `.div-bar`, `.div-pixels`,
   `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`,
   `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`,
   `.contact-form`, `.field`, `.terminal-success`, `.term-bar`,
   `.term-body`, `.term-title`, `.dot`, `.line`, `.prompt`, `.success`,
   `.dim`, `.caret`, `@keyframes shake`, `@keyframes pxblink`

5. **About page** — create `app/about/page.tsx` as `"use client"`:
   - `useReveal` hook (IntersectionObserver, same pattern as landing page)
   - `HighlightIcon` component (HEART, BROWSER, PLANT pixel SVGs)
   - `About` main component with all state (`form`, `sent`, `shake`, `error`)
   - Form submit POSTs to `/api/contact`; on `ok: true` → set `sent` to name;
     on `ok: false` → show terminal screen with error line instead of success line
   - Replace all vanilla-React hooks with standard React imports

## Acceptance criteria

- [ ] Navigating to `/about` renders the page without errors
- [ ] About hero shows kicker, h1 "ACERCA DE ARCADE VAULT", mission paragraph, and 3 highlight cards
- [ ] Each highlight card renders its pixel SVG icon (HEART/magenta, BROWSER/cyan, PLANT/green)
- [ ] Animated pixel divider renders between hero and contact sections
- [ ] Contact section shows intro column and form side-by-side (stacks on mobile ≤900px)
- [ ] Submitting form with any empty field triggers shake animation; no API call is made
- [ ] Submitting a valid form POSTs to `/api/contact` and shows terminal-success screen with sender's name
- [ ] Resend delivers the email to bran9613@gmail.com with subject "[Arcade Vault] Nuevo mensaje de {name}"
- [ ] If the API returns `ok: false`, terminal screen shows an error line instead of success line
- [ ] "ENVIAR OTRO MENSAJE" button resets form and returns to empty form state
- [ ] `.reveal` sections animate in on scroll via IntersectionObserver
- [ ] `npm run dev` has no TypeScript or build errors
- [ ] Page is readable and not broken at 375px width

## Decisions taken and discarded

- **Resend for email delivery** — chosen over Nodemailer (requires SMTP config) or
  EmailJS (client-side, exposes key). Resend has a simple REST SDK and free tier.

- **Plain-text email body** — no HTML template. Keeps the API route simple;
  content is internal/operational, not user-facing marketing.

- **Error shown in terminal screen (not inline)** — consistent with the success UX;
  both outcomes use the same terminal component, only the final line differs.
  Inline error was discarded for visual inconsistency.

- **No Nav link** — `/about` is reachable from landing page CTAs only.
  Nav changes deferred to avoid scope creep.

- **No rate limiting or CAPTCHA** — out of scope for this spec. Can be added
  as a hardening spec later if spam becomes an issue.

- **Env vars for all Resend config** — `RESEND_API_KEY`, `RESEND_TO_EMAIL`,
  `RESEND_FROM_EMAIL` kept in `.env.local`, never hardcoded.
