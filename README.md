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
  pages/        implemented screens and co-located query hooks
  providers/    ThemeProvider (data-theme + data-palette on <html>)
  styles/       design-system tokens + globals
  types/        API types mirroring api-contracts.md
```

## Conventions

- **Money is a string**, never a number — parse only for display, re-serialize on submit.
- API is camelCase under `/api`; every request carries the Supabase bearer token.
- Cold starts (~30–60s on Render free tier) are handled by the 60s client timeout +
  query retry/backoff; the `/health` gate shows server warm-up progress.
- Design tokens only — no raw hex in components, spacing in multiples of 3, no font-weight > 400.

## Appearance

Open **Appearance** from the sidebar or sign-in screen to select **Monochrome, Purple,
Green, Blue, or Light**. All themes share the same layout. Palettes, outlined navigation,
and the corner SVG dot mask in `public/textures/` follow the local Mute
reference. The sidebar has a plain background to keep navigation legible.
Cousin's Shinx mark replaces its tail star with a `$` and adds three electric
sparks. The sidebar, sign-in screen, server wake-up screen, and favicon share the same
traced SVG geometry. The outline follows the text color; sparks, eyes, ear markings,
ankle bands, and tail follow the selected accent. Light mode uses dark outlines without
glow. The restrained brand glow in dark palettes is a deliberate exception to the
interface's no-glow rule. Source artwork and a palette preview live in `docs/brand/`.
Income, expenses, and warnings retain
separate semantic colors, including in charts.

Preferences use `cousin-theme` and `cousin-sidebar` in localStorage and synchronize across
tabs. Existing `dark` preferences resolve to Monochrome. Without a saved theme, the system
color scheme selects Monochrome or Light. When browser storage is blocked, appearance and
navigation remain usable for the current visit.

Layout adapts to desktop, tablet, and mobile. Wide financial tables scroll within their
frames; forms stack on small screens and dialogs contain scrolling and keyboard focus.
Run `npm test` for existing financial/form tests plus appearance persistence and palette
coverage, and `npm run lint` / `npm run build` before delivery.

## Transaction cleanup and explainable reporting

Use **Export report** on Transactions to download **CSV** or **Markdown (.md)** for a custom
start/end date range (inclusive, by purchase/movement date). Exports fetch every matching
page and include all transactions in the period, independent of table filters and row
selection. CSV includes exact decimal amounts, category allocations, counterparties,
classification, installments and settlement dates; Markdown adds server-calculated totals.
Closing the dialog cancels an in-progress export; failed requests never download a partial report.

Transactions supports description search, wallet/category filters (including Uncategorized),
category edits, and bulk assignment to up to 200 selected rows. Filters persist in the URL.
Creation requires an active category; existing uncategorized history is preserved.
A shared edit dialog keeps category edits available from wallet and category detail tables.

Dashboard totals expose **View details**, listing the exact contributions with their statement
or obligation date, purchase/movement date, and actual settlement date. Net and savings rate
show their formula. Dashboard calculations keep their existing date basis.

Wallets includes a **Cash forecast** preview below Patrimony Trend. The 30/60/90-day horizon
always starts today, independently of the selected history period. It shows projected closing
and lowest balances and the contributing schedule. Only already-generated scheduled items
are included; this is a cash projection, not an investment valuation or spending allowance.
