# System Architecture

**Related:** [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) · [08_DEPLOYMENT.md](08_DEPLOYMENT.md) · [05_PLATFORM_DECISIONS.md](05_PLATFORM_DECISIONS.md) · [INDEX.md](INDEX.md)

---

## Frontend Structure

| File | Responsibility |
|---|---|
| `src/main.tsx` | React entry point; mounts `<AuthGate />` inside `<StrictMode>` |
| `src/AuthGate.tsx` | Handles Supabase email/password login and signup; passes `userId` and `onSignOut` to `<App />` |
| `src/App.tsx` | Entire application — all state, all data loaders, all event handlers, all UI (~11,050 lines) |
| `src/supabase.ts` | Creates and exports the Supabase JS v2 client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `src/App.css` | Global styles |

**Stack:**
- React 19.2
- TypeScript 6
- Vite 8
- `@supabase/supabase-js` v2
- `html2canvas` v1.4 + `jsPDF` v4 (PO PDF download)
- No routing library — navigation is `activeTab` state
- No state management library — all state is `useState` in `App`
- No UI component library — all UI is inline JSX with inline styles

**Key architectural fact:** There is no component tree. The entire application is a single React function component (`App`) with approximately 350+ state variables, 100+ async functions, and the full render tree — all in one file. This is intentional (avoids prop-drilling and keeps the app portable) but is the primary scalability constraint.

---

## Backend / Supabase Structure

| Layer | Details |
|---|---|
| Database | PostgreSQL via Supabase (hosted) |
| Auth | Supabase Auth — email/password only |
| RLS | Row Level Security on every table; enforced via `auth_business_id()` function |
| Edge Function | `supabase/functions/process-invoice/index.ts` — Deno runtime, calls Anthropic API |
| Storage | Not used |
| Realtime | Not used |

---

## Deployment Flow

```
npm run build
  → tsc -b (TypeScript type check)
  → vite build (bundles to dist/)
```

Built output: `dist/` directory. Deployment target is **not configured** in the repo (no `vercel.json`, no `netlify.toml`, no CI/CD pipeline). Deployment is manual. **Needs verification** on the exact hosting provider.

The Supabase Edge Function is deployed separately via Supabase CLI:
```
supabase functions deploy process-invoice
```

See [08_DEPLOYMENT.md](08_DEPLOYMENT.md) for full deployment instructions.

---

## Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (frontend) | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | Yes | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Supabase Edge Function secret | Yes | Claude API key for Smart Receive invoice parsing |

The `.env` file is not committed. `.env.example` shows the required keys. The Anthropic key lives only in Supabase's secret store and is never exposed to the browser.

---

## Major Files and Responsibilities

```
wegn-store-app/
├── src/
│   ├── main.tsx              # Entry point
│   ├── AuthGate.tsx          # Auth layer
│   ├── App.tsx               # Entire application (~11,050 lines)
│   ├── supabase.ts           # Supabase client
│   └── App.css               # Global styles
├── supabase/
│   ├── functions/
│   │   └── process-invoice/
│   │       └── index.ts      # AI invoice parsing Edge Function
│   └── migrations/           # SQL migration history (25 files)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── .env.example              # Required env var template
├── package.json
├── tsconfig.app.json
├── vite.config.ts
├── PLATFORM_REFERENCE.md    # Master single-document reference
└── docs/                    # This documentation library
```

---

## Known Architectural Constraints

1. **Single-file app.** `App.tsx` is ~11,050 lines. It cannot be split without a significant refactor. Avoid adding large features inline — future features should consider componentization first.
2. **No router.** Navigation is `activeTab` state. Deep-linking and browser back/forward do not work.
3. **No test suite.** There are zero automated tests. All verification is manual.
4. **No error boundaries.** A rendering crash in any section will crash the entire app. Deferred to Technical Backlog.
5. **Bundle size.** Build output is ~1.37 MB JS (356 KB gzipped). Vite warns about this. No code splitting is implemented.
6. **Transient state.** Several key state slices (`sessionPayments`, `sessionHistoryItems`, `batches`) are component-level and reset on page reload. This is expected behavior — the app reloads from Supabase on each mount.
7. **PO signatures in localStorage.** Digital signatures for purchase orders are stored in `localStorage`, not the database. They are device-specific and not persisted to the backend.
8. **`received_date` column.** This column exists on `receiving_sessions` in Supabase and is referenced in `loadSessionHistory`'s SELECT, but there is no migration file for it — it was created directly in the Supabase Dashboard. Any fresh project restore must add it manually.

For the rationale behind these constraints, see [05_PLATFORM_DECISIONS.md](05_PLATFORM_DECISIONS.md).

---

*Source: PLATFORM_REFERENCE.md §2 — System Architecture*
