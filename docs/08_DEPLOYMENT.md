# Deployment

**Related:** [02_ARCHITECTURE.md](02_ARCHITECTURE.md) · [07_OPERATIONS.md](07_OPERATIONS.md) · [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) · [INDEX.md](INDEX.md)

---

## Overview

The application consists of two independently deployed components:

1. **Frontend** — static files built by Vite, hosted on a static hosting provider.
2. **Supabase Edge Function** — `process-invoice` Deno function, deployed via Supabase CLI.

Deployment is fully manual. There is no CI/CD pipeline configured in the repository (no `vercel.json`, no `netlify.toml`).

---

## Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (frontend) | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | Yes | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Supabase Edge Function secret | Yes | Claude API key for Smart Receive |

The `.env` file is not committed. `.env.example` contains the required key names. The `ANTHROPIC_API_KEY` is a server-side secret set only in Supabase and is never exposed to the browser.

---

## Frontend Deployment

```bash
# 1. Build
npm run build
# → Runs: tsc -b (TypeScript check) then vite build
# → Output: dist/

# 2. Upload dist/ to static hosting
# Options: Vercel, Netlify, Cloudflare Pages, manual server
# Needs verification — exact hosting provider is not configured in repo

# 3. Set environment variables in the hosting provider
#    VITE_SUPABASE_URL=<your-supabase-url>
#    VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Note:** The deployment target is **not configured** in the repository. **Needs verification** on the exact hosting provider.

---

## Edge Function Deployment

The Smart Receive AI invoice parsing function must be deployed separately via the Supabase CLI.

```bash
# Deploy the Edge Function
supabase functions deploy process-invoice

# Set the Anthropic API key as a secret (server-side only)
supabase secrets set ANTHROPIC_API_KEY=<your-anthropic-key>
```

If the Edge Function is not deployed or the secret is not set, Smart Receive will fail with an error.

---

## Database Migrations

Schema migrations live in `supabase/migrations/`. Apply them via Supabase CLI or the Supabase Dashboard.

```bash
supabase db push
```

**Critical:** The `received_date` column on `receiving_sessions` has **no migration file** — it was created directly in the Supabase Dashboard. Any fresh project restore must add it manually:

```sql
ALTER TABLE receiving_sessions ADD COLUMN IF NOT EXISTS received_date date;
```

---

## Deployment Verification

After deploying, verify the following:

1. Open the production URL and log in.
2. Complete a test sale at POS — verify receipt and inventory decrement.
3. Upload a test invoice via Smart Receive — verify AI extraction succeeds.
4. Check Reports — verify today's revenue includes the test sale.

---

## Supabase Project Info

**Needs verification.** The Supabase project URL is in `.env` (not committed). The Edge Function `process-invoice` must be deployed and `ANTHROPIC_API_KEY` must be set as a secret.

---

*Source: PLATFORM_REFERENCE.md §2 — Deployment Flow, §7 — How to Deploy, §10 — Supabase Project Info*
