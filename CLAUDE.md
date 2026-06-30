# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Frontend for **cou$in**, a single-owner personal-finance app. React 19 + TypeScript 6 (Vite 8)
talking to a Node backend on Render. Feature-complete: 15 routes across Dashboard, Transactions,
Credit, Bills, Revenues, Recurrences, Wallets, Sources, Categories (each with list + detail where
applicable), plus Login.

## Commands

```bash
npm run dev        # Vite dev server on :5173
npm run build      # tsc -b && vite build (type-check is part of the build)
npm run preview    # serve the production build locally
npm run typecheck  # tsc only, no emit
npm run lint       # ESLint (flat config, eslint.config.js)
npm run format     # Prettier
```

No test runner is wired yet. **The repo's `test-generator` skill is configured for React
Native / Expo, but this is a web app** — if adding tests, use Vitest + `@testing-library/react`,
not RN tooling.

Requires `.env` (copy `.env.example`). `VITE_SUPABASE_ANON_KEY` must be filled or the app throws
a deliberate, descriptive boot error from `src/lib/env.ts`.

## Architecture

**State ownership (no global store):**
- **Server state** lives in the TanStack Query cache. One query hook per aggregate endpoint; page
  components own the query for their screen and pass data to presentational children via props.
- **Period & filters** live in **URL search params**, and double as the query key
  (`['wallet', id, period]`). `from`/`to` are concrete `YYYY-MM-DD` dates — the FE resolves presets
  ("last 3 months") to dates before calling; the BE never interprets preset names.
- **Theme** is the only global client state (React context + localStorage, `data-theme` on `<html>`).
- Local state (modals, dropdowns, draft custom-range dates, RHF form state) is never lifted.

**API layer (`src/lib/api/`):** all requests go through the `api` object in `client.ts`, which
injects the Supabase bearer token, parses the `{ error: { code, message, fields? } }` envelope into
a typed `ApiError`, applies a 60s timeout, and retries once after refreshing the session on a 401.
Cold-start resilience (Render free tier sleeps; first call takes ~30–60s) is handled by **query
retry/backoff in `query.ts`** (retries 5xx/network, never 4xx) plus the 60s timeout — not bespoke
per-call code. `GET /health` (`health.ts`) is the only unauthenticated route, for a warm-up gate.

**Auth:** Supabase JWT only. The FE owns the session (`@supabase/supabase-js`); the BE just verifies
the token. Single-owner — no signup, no per-user scoping; the token is an access gate. `getAccessToken()`
in `supabase.ts` feeds the API client.

## Domain rules that bite

- **Money is always a `string`** (decimal, e.g. `"1234.56"`) in and out — never a JS number. Parse only
  for display, re-serialize as a string on submit. Types enforce this (`Money = string` in `types/api.ts`).
- **Computed fields are BE-owned — never recompute on the FE.** Trust `kind`, `sign`, `flagged`,
  `hasLinkedTransaction`, `hasOpenItems`, `active` from responses. The one thing the FE *does* own is the
  legal `fromType → toType` matrix for the transaction modal — that's `src/constants/transactionMatrix.ts`
  (six combinations; wallet→wallet resolves to internalTransfer vs manualAdjustment by id equality).
- **API is camelCase**, all routes under `/api` except `/health`.
- Only `GET /transactions` paginates (cursor). Wallets/Sources/Categories are soft-deleted (archived),
  never hard-deleted. A transaction create returns `Transaction[]` (N rows when `installmentTotal > 1`).
- **Error handling by status:** 422 → map `fields` onto RHF `setError` (inline under inputs); 409 →
  business-rule block, show `message` as a blocking notice and proactively disable the triggering control.

## Design system (enforced, see design-system.md §8)

Tokens only — never raw hex in components. All spacing/size/radius are **multiples of 3px** (tokens
`--space-1..9`). Playfair Display serif only at ≥21px for monetary values; Inter for everything else.
**No `font-weight` above 400** (emphasis via colour/size). No `border-radius` above 6px, no shadows in
dark mode, no gradients/glows. `font-variant-numeric: tabular-nums` on every number. Semantic accent
colours (`--color-revenue/outcome/net/credit`) appear only on stat values, stat-card left borders, and
progress-bar fills.

## Patterns (preferences — follow these)

**Screen logic lives in a hook, not the component.** Each page/screen has a co-located hook
(e.g. `useDashboard`) that owns *all* the logic — server queries, local state, derived values,
and event handlers — and returns them. The page component is presentational: it destructures
the hook and renders JSX, with no inline business logic, effects, or handler bodies. This is the
seam where the per-screen TanStack Query call, URL-param reads, and mutations are wired. The hook's
return object follows the ordering rule below (variables first, alphabetical; then handlers,
alphabetical).

**Minimize sources of truth — define once, derive everything.** A value's shape should have exactly
one definition. Enums and fixed domains are `as const` objects with the union type *derived* from
them, never hand-written parallel string unions. `src/constants/transactions.ts` is the reference
implementation:

```ts
export const TXN_KIND = { BillPaid: "billPaid", MoneyIn: "moneyIn" /* ... */ } as const;
export type TxnKind = (typeof TXN_KIND)[keyof typeof TXN_KIND];
```

Consumers (the from→to matrix, `types/api.ts`, forms) import these — they don't re-declare the
literals. Same principle elsewhere: API response shapes live once in `types/api.ts`; the
`ROUTES`/`NAV_GROUPS` config in `app/navigation.ts` is the only place paths are written. If you
catch yourself typing the same literal/shape in two files, hoist it. (TS `enum` is not an option
anyway — `erasableSyntaxOnly` forbids it, which is why `as const` is the standard here.)

## Conventions

Path alias `@/` → `src/`. Imports/keys/props ordered alphabetically where order has no meaning; hook
return objects group values (alphabetical) then functions (alphabetical). `erasableSyntaxOnly` and
`verbatimModuleSyntax` are on — no TS enums or parameter properties; type-only imports must use
`import type`. CSS Modules per component (`*.module.css`).

**No static text inside components or hooks.** Every user-visible string (labels, messages, tooltips,
placeholders, fallback values like `"—"`) must live in a `const` object declared **outside** the
component/hook, at the top of the file (after imports, before the function). Name the object `LABELS`
when it holds UI labels, `TEXT` when the strings are longer-form copy (messages, descriptions), or a
domain-specific name when that's clearer. Keys are alphabetical. This applies to every layer —
components, hooks, and pages. The only exemption is structural/technical strings (CSS class names,
query keys, route paths, HTML attributes) which are not user-visible.

## Established patterns (cross-cutting)

**Server validation → RHF field errors.** Every form that talks to the API passes `serverError`
(the mutation's `.error`) as a prop and maps it with `mapFieldErrors(serverError, setError)` inside a
`useEffect`. The utility (`src/lib/api/mapFieldErrors.ts`) handles 422 responses only; other statuses
are ignored. The return value (`true` if mapped) can prevent modal close on error.

**`TransactionsTable` is a smart component.** Unlike other components, `TransactionsTable`
(`src/components/TransactionsTable.tsx`) owns its own `useInfiniteQuery`, edit modal, and delete
modal. It accepts `from`/`to` and optional `wallet`/`category` filter props, making it droppable
into any detail page (WalletDetail, CategoryDetail) without the parent needing to manage transaction
state.

**`useWatch` over `watch()`.** For react-hook-form fields that drive conditional rendering (e.g.
`intervalUnit` in BillForm/RevenueForm), use `useWatch({ control, name })` instead of `watch()`.
This avoids `react-hooks/incompatible-library` lint warnings from the React Compiler eslint plugin.

**Charts use `useTheme()` for colors.** Recharts components (`CashFlowChart`, `BalanceChart`,
`VarianceChart`, `PatrimonyChart`, `BreakdownChart`, `DivergingBars`) read the current theme via
`useTheme()` and pass JS hex colors to Recharts props. CSS custom properties can't be used here
because Recharts expects resolved color values, not `var()` references.
