# AGENTS.md

## Repo Reality
- This is a single root Vite + React app. The current `README.md` still documents an old `backend/` + `frontend/` layout; trust root `package.json` + current source tree instead.
- Runtime data/auth is Supabase-first (`src/supabaseClient.ts`, `src/services/api.ts`), not an in-repo Express backend.

## Setup That Blocks Work If Missed
- Required env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Missing either var throws immediately from `src/supabaseClient.ts` during app startup.
- Start from `.env.example`; secrets stay in `.env` (`.gitignore` already excludes it).

## Verified Commands
- Install deps: `npm install`
- Dev server: `npm run dev` (Vite on `5173`, bound to `0.0.0.0`)
- One-shot tests: `npm test -- --run` (`npm test` alone is watch mode)
- Single test file: `npm test -- src/store/store.test.ts --run`
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit` (no npm script exists)
- There is no `lint` script; do not assume `npm run lint` exists.

## Current Baseline Failures (Not Your New Regression)
- `npm test -- --run` currently fails on `src/pages/AdminPanel.test.tsx` (syntax error in `ResizeObserver` mock).
- `npx tsc --noEmit` also fails on the same file because tests are under `src/` and included by `tsconfig.json`.
- `npm run build` succeeds; it warns about large chunks (>500 kB).

## High-Leverage Code Map
- App entry: `src/main.tsx` -> `src/App.tsx`.
- Auth bootstrap: `initAuthListener()` from `src/store/index.ts`, called in `App`.
- Route/role gating: `src/components/ProtectedRoute.tsx` and route table in `src/App.tsx`.
- API behavior is centralized in `src/services/api.ts`; start there for data-flow changes.
- Supabase edge functions live in `supabase/functions/create-user` and `supabase/functions/delete-user`.

## Supabase + Ops Gotchas
- Admin create/delete user flows call edge functions via `supabase.functions.invoke(...)` from `src/services/api.ts`.
- `delete-user` function is destructive: deletes attendance, sessions, profile row, then auth user.
- `scripts/test_delete_as_admin.js`, `scripts/test_delete_integration.js`, and `scripts/verify_user.js` use hard-coded Supabase project values and can mutate real remote data; do not run as routine checks.

## Frontend Conventions Easy To Miss
- Username login is normalized to `username@system.local` in both `src/pages/Login.tsx` and `src/services/api.ts`; keep both paths aligned.
- i18n is manual in `src/store/languageSlice.ts`; when adding UI text, add both `en` and `ar` keys.
- Use `tests/utils.tsx` for component tests so QueryClient + Router providers are present.
- For Pinggy tunnel HMR, set `PINGGY=true` (enables Vite `wss` HMR override in `vite.config.js`).
