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
  hooks/        useTheme
  lib/
    api/        typed fetch client, error envelope, /health probe
    env.ts      validated env access
    query.ts    QueryClient (cold-start retry/backoff)
    supabase.ts Supabase client + access-token helper
  pages/        screen components (placeholders for now)
  providers/    ThemeProvider (data-theme on <html>)
  styles/       design-system tokens + globals
  types/        API types mirroring api-contracts.md
```

## Conventions

- **Money is a string**, never a number — parse only for display, re-serialize on submit.
- API is camelCase under `/api`; every request carries the Supabase bearer token.
- Cold starts (~30–60s on Render free tier) are handled by the 60s client timeout +
  query retry/backoff; a `/health` gate screen is still to be built.
- Design tokens only — no raw hex, spacing in multiples of 3, no font-weight > 400.
