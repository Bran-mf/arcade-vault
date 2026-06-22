@AGENTS.md

## Styling: Tailwind CSS v4

This project uses Tailwind **v4** — breaking changes from v3:
- No `tailwind.config.js` — configure themes via `@theme` in `globals.css`
- Use `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- PostCSS plugin is `@tailwindcss/postcss`, not `tailwindcss`

## Design Reference

`references/` contains the complete working prototype (vanilla React + CDN Babel). Port all UI from there — it includes auth, game library, detail view, hall of fame, and the full neon/retro CSS design system (`references/styles.css`).

## Path Alias

`@/*` resolves to the **project root** (`./*`), not `src/`.

## skills
Always use /frontend-design to create ui