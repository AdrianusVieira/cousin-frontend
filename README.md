# cou$in — frontend

Financial assistant frontend. React + TypeScript (Vite), TanStack Query, React Router,
react-hook-form + Zod, Recharts. Talks to the cou$in backend (see `frontend-integration.md`).

## Setup

```bash
npm install
cp .env.example .env   # then fill in VITE_SUPABASE_ANON_KEY
npm run dev
```

The app **throws a clear boot error until `VITE_SUPABASE_ANON_KEY` is set** in `.env`
(Supabase dashboard → Project Settings → API → anon/publishable key — not the JWT secret).

## Scripts

| Script              | Does                          |
| :------------------ | :---------------------------- |
| `npm run dev`       | Vite dev server on :5173      |
| `npm run build`     | Type-check + production build |
| `npm run typecheck` | `tsc` only                    |
| `npm run lint`      | ESLint                        |
| `npm run format`    | Prettier                      |

## Layout

```
src/
  app/          shell, sidebar, navigation config, routes
  constants/    transaction from→to matrix
  hooks/        useTheme, local sidebar preferences
  lib/
    api/        typed fetch client, error envelope, /health probe
    env.ts      validated env access
    query.ts    QueryClient (cold-start retry/backoff)
    supabase.ts Supabase client + access-token helper
  pages/        screen components (placeholders for now)
  providers/    ThemeProvider (data-theme + data-palette on <html>)
  styles/       design-system tokens + globals
  types/        API types mirroring api-contracts.md
```

## Conventions

- **Money is a string**, never a number — parse only for display, re-serialize on submit.
- API is camelCase under `/api`; every request carries the Supabase bearer token.
- Cold starts (~30–60s on Render free tier) are handled by the 60s client timeout +
  query retry/backoff; a `/health` gate screen is still to be built.
- Design tokens only — no raw hex in components, spacing in multiples of 3, no font-weight > 400.

## Appearance

Open **Appearance** from the sidebar or sign-in screen to select **Monochrome, Purple,
Green, Blue, or Light**. All themes share the same layout. Palettes, outlined navigation,
and the original curved SVG dot masks in `public/textures/` follow the local Mute
reference; Cousin keeps its wordmark and favicon. Income, expenses, and warnings retain
separate semantic colors, including in charts.

Preferences use `cousin-theme` and `cousin-sidebar` in localStorage and synchronize across
tabs. Existing `dark` preferences resolve to Monochrome. Without a saved theme, the system
color scheme selects Monochrome or Light. When browser storage is blocked, appearance and
navigation remain usable for the current visit.

Layout adapts to desktop, tablet, and mobile. Wide financial tables scroll within their
frames; forms stack on small screens and dialogs contain scrolling and keyboard focus.
Run `npm test` for existing financial/form tests plus appearance persistence and palette
coverage, and `npm run lint` / `npm run build` before delivery.
