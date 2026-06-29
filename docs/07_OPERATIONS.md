# Operations

Day-to-day development and operational procedures.

**Related:** [08_DEPLOYMENT.md](08_DEPLOYMENT.md) · [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) · [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) · [INDEX.md](INDEX.md)

---

## How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start dev server
npm run dev
# → opens at http://localhost:5173
```

---

## How to Build

```bash
npm run build
# → TypeScript check (tsc -b) then Vite bundle
# → Output: dist/
```

Build succeeds = TypeScript passes + bundle generated. There is no automated test run in the build step.

The bundle size warning (> 500 KB) is expected and non-blocking.

---

## How to Check Git Status

```bash
git status                  # working tree state
git log --oneline -10       # recent commits
git diff --stat             # staged/unstaged changes
```

---

## How to Verify Production

1. Open the production URL and log in.
2. Run a test sale: add a product to cart, complete sale, verify receipt.
3. Open Inventory and verify product quantity decremented.
4. Navigate to Reports → verify today's revenue shows the test sale.

---

## How to Avoid Unsafe Changes

1. **Always run `npm run build` before committing.** TypeScript errors will catch type mismatches.
2. **Never edit `App.tsx` without reading the surrounding context.** The file is 11,000+ lines. Edits in the wrong location are easy.
3. **Do not add `useEffect` with missing dependencies** — it will cause stale closures or infinite loops.
4. **Do not change `auth_business_id()` or RLS policies** without testing in a staging environment. A broken policy can lock out all users.
5. **Do not remove `supplier_id` requirement from supplier payment guards.** `supplier_payments.supplier_id` is NOT NULL — a payment without it will fail at the DB level.
6. **Do not use unstable `key` props on form inputs** (e.g., including a changing value in the key). This causes React to unmount/remount the input and prevents `onBlur` from firing.
7. **Do not wrap the session list `{sessionHistory.map(...)}` with an outer wrapper** without also adjusting the `historyExpanded` Fragment boundary.
8. **Avoid direct DB writes that bypass `average_cost` recalculation** — it is maintained by the app, not DB triggers.

---

*Source: PLATFORM_REFERENCE.md §7 — Operational Guide*
