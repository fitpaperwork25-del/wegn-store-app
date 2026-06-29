# AI Agent Guide

This document is written specifically for AI coding agents (Claude Code, Copilot, etc.) that will be working in the Wegn-Store codebase. Read this before making any changes.

**Related:** [09_QA_TEST_SUITE.md](09_QA_TEST_SUITE.md) · [08_DEPLOYMENT.md](08_DEPLOYMENT.md) · [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) · [11_DEVELOPER_HANDOFF.md](11_DEVELOPER_HANDOFF.md) · [INDEX.md](INDEX.md)

---

## Development Rules

1. **Read before writing.** `App.tsx` is 11,000+ lines. Always use `Read` or `Grep` to find the exact target section before editing. Never guess line numbers.

2. **Investigate first, change second.** For any bug, trace the full data flow (DB → loader → state → render) before proposing a fix. Report findings to the user before writing any code.

3. **Smallest safe change.** The codebase is large and interconnected. Prefer targeted edits over refactors. Do not improve or clean up code that is not directly relevant to the task.

4. **Run `npm run build` after every change.** TypeScript errors must be zero before committing. The build command runs `tsc -b` then `vite build`. A bundle size warning (> 500 KB) is expected and non-blocking.

5. **Do not commit without explicit instruction.** Commit only when the user explicitly asks. Never auto-commit after making changes.

6. **Preserve business rules.** Average cost, FEFO allocation, RLS policies, and `supplier_id` constraints are load-bearing. Do not simplify them without fully understanding their purpose. See [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md).

7. **Check migrations before any DB changes.** Any schema change requires a new SQL file in `supabase/migrations/` with a rollback path. Do not create columns directly in the Supabase Dashboard (this is what caused the `received_date` exception — see [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md)).

8. **Remember the `received_date` exception.** This column on `receiving_sessions` has no migration file. It must be handled specially when documenting or restoring the schema.

---

## Coding Guardrails

### Never Do These

| Guardrail | Why |
|---|---|
| Do not change `auth_business_id()` or RLS policies without a staging environment | A broken policy can lock out all users or leak data across tenants |
| Do not remove the `supplier_id` requirement from the supplier payment guard in the UI | `supplier_payments.supplier_id` is NOT NULL — removing the guard causes a DB insert failure |
| Do not use unstable `key` props on form inputs | Including a changing value in a React `key` causes unmount/remount on each keystroke, preventing `onBlur` from firing (root cause of the unit cost $0.00 bug, commit `77fd84c`) |
| Do not wrap `{sessionHistory.map(...)}` with a new outer wrapper | Without adjusting the `historyExpanded` Fragment boundary, this causes a JSX parse error. The closing `</>)}` must match the opening `{historyExpanded && (<>` exactly |
| Do not bypass `average_cost` recalculation with direct DB writes | Average cost is maintained by app logic, not DB triggers — direct writes will cause it to diverge |
| Do not add `useEffect` with missing dependencies | Causes stale closures or infinite re-render loops |
| Do not touch `handlePostReceivingSession` without reading it fully | Non-atomic; partial changes risk inventory corruption |
| Do not touch `handleCompleteSale` FEFO allocation without reading it fully | Writes span multiple tables; a partial failure desynchronizes `inventory_batches` and `inventory` |
| Do not touch `sessionPayments` transient state assumptions | Payment "remaining" is computed from this; it resets on page reload — this is expected behavior |

### Always Do These

| Requirement | Why |
|---|---|
| Run `npm run build` before committing | Catches TypeScript errors before they reach production |
| Use `Grep` to find exact code locations | Never guess line numbers in an 11,000-line file |
| Read surrounding context before editing | An edit in the wrong location is easy in a single large file |
| Add JSX Fragment wrappers when returning sibling elements in a conditional | `{condition && (<>...</>)}` is required when wrapping more than one sibling node |
| Use the `Promise.all` flush pattern before any post operation | Ensures in-memory cost edits are persisted to DB before inventory is updated (see `handlePostReceivingSession`) |

---

## Investigation-First Workflow

When given a bug report or a "why does X happen?" question:

1. **Do not change any code until the investigation is complete.**
2. Identify the relevant state variables (e.g., `paymentPanelSessionId`, `sessionPayments`).
3. Trace the data flow:
   - Which DB query populates the data? (`loadX` functions)
   - Which state variable holds it? (`useState`)
   - Which render path uses it? (JSX conditional)
   - When does it update? (after `await`, in `useEffect`, on event)
4. Identify the root cause precisely. State one sentence: "The form shows because `remaining` is computed from `sessionPayments` which is empty until `loadSessionPayments()` is called."
5. Report findings to the user.
6. Only then propose and implement the smallest safe fix.

---

## Testing Requirements

There is no automated test suite. All testing is manual.

**Minimum regression checks after any change:**

- [ ] POS sale completes (quantity decremented, receipt shown)
- [ ] Receiving post succeeds (inventory updated, session in history)
- [ ] Invoice save updates badge (matched/variance/pending)
- [ ] Supplier payment records and shows Paid badge
- [ ] Build passes: `npm run build` exits with zero TypeScript errors

**Full test suite:** See [09_QA_TEST_SUITE.md](09_QA_TEST_SUITE.md) — 10 manual test cases covering all major workflows.

Run the full suite after any change that touches:
- `handleCompleteSale`
- `handlePostReceivingSession`
- `handleSaveInvoice`
- `handleSavePayment`
- RLS functions or policies
- Any state variable that affects multiple modules

---

## Deployment Checklist

Before declaring a task complete:

- [ ] Feature works end-to-end in a browser (not just in code)
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No regressions in: POS sale, receiving post, invoice save, payment record
- [ ] The relevant module document in `docs/modules/` is updated if behavior changed
- [ ] A commit is made with a descriptive message
- [ ] The change is pushed to `origin/main`

To deploy (when authorized by user):

```bash
# 1. Build
npm run build

# 2. Deploy frontend
# Upload dist/ to hosting provider (Vercel, Netlify, Cloudflare Pages, etc.)
# Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the hosting provider

# 3. Deploy Edge Function (if changed)
supabase functions deploy process-invoice
supabase secrets set ANTHROPIC_API_KEY=<key>
```

See [08_DEPLOYMENT.md](08_DEPLOYMENT.md) for full details.

---

## Documentation Standards

When a change alters documented behavior:

1. **Update the relevant module file** in `docs/modules/` — specifically the Business Rules, Edge Cases, or Known Issues section.
2. **Update `docs/12_CHANGELOG.md`** with the commit hash, description, root cause (if a bug fix), and fix applied.
3. **Do not modify `PLATFORM_REFERENCE.md`** (master reference, preserved as-is).
4. **Do not create planning or analysis documents** as part of the task — work from conversation context.
5. **Add a `Needs verification` note** for any behavior you cannot confirm from static code analysis alone.

If a resolved bug should be added to the changelog:

```
| Bug description | Root cause | Fix applied | Commit hash |
```

If a new known issue is discovered, add it to [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) under the appropriate category (Confirmed Bugs / UX Improvements / Scalability).

---

## Do-Not-Touch-Without-Care Areas

| Area | Risk | Reason |
|---|---|---|
| `auth_business_id()` and RLS policies | Data isolation failure | Bugs here leak data across tenants |
| `handlePostReceivingSession` | Inventory corruption | Non-atomic; partial failure leaves inconsistent state |
| `handleCompleteSale` FEFO allocation | Inventory / batch sync | FEFO writes are across multiple tables; a partial failure means `inventory_batches` and `inventory` get out of sync |
| `supplier_payments.supplier_id` guard in UI | DB constraint violation | Column is NOT NULL; removing the guard will cause insert failures |
| `historyExpanded` Fragment boundary | JSX parse error | Closing `</>)}` must match opening `{historyExpanded && (<>` exactly |
| `average_cost` calculation in post | Cost accuracy | Weighted average formula must use `quantity_on_hand` before the new receive is added |
| `sessionPayments` transient state | "Fully paid" guard | Payment "remaining" is computed from this; it resets on page reload |

---

*Source: PLATFORM_REFERENCE.md §7 — How to Avoid Unsafe Changes, §9 — Do-Not-Touch areas, §10 — How Future Agents Should Approach Changes, Definition of Done*
