# Developer Handoff

**Related:** [12_CHANGELOG.md](12_CHANGELOG.md) · [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) · [09_QA_TEST_SUITE.md](09_QA_TEST_SUITE.md) · [08_DEPLOYMENT.md](08_DEPLOYMENT.md) · [INDEX.md](INDEX.md)

---

## Current Git State

- **Branch:** `main`
- **Latest commit:** `862d299` — Show paid invoice payment panel read only (2026-06-29)
- **Repository:** `https://github.com/fitpaperwork25-del/wegn-store-app`

---

## Recent Commits (Most Recent First)

| Commit | Description |
|---|---|
| `862d299` | Payment panel: hide form and show "Invoice fully paid." when remaining ≤ 0 |
| `a34025b` | Receiving Session History: collapsible section with arrow toggle and count |
| `ea5d453` | Receiving Session History: Load More (20 per page, append) |
| `175dcea` | Reload receiving history after invoice save (clears stale "Invoice: pending" badge) |
| `5387171` | Restore supplier_id requirement for Record Payment; add inline "Link a supplier" nudge |
| `18035b2` | Fix supplier invoice status display (badge uses `invoice_status` field) |
| `b4dda9c` | Default supplier invoice total from received items when `invoice_total = 0` |
| `77fd84c` | Persist receiving item costs before posting (stable key + pre-post flush) |
| `00f7771` | Fix receiving session state handling |
| `e5b3cec` | Stabilization and performance memoization |

Full resolved bug history: see [12_CHANGELOG.md](12_CHANGELOG.md).

---

## Build Status

**Last successful build:** `a34025b` and subsequent commits — all pass `tsc -b && vite build` with no TypeScript errors. Only warning is bundle size (> 500 KB), which is expected and non-blocking.

---

## Deployment URL

**Needs verification.** The hosting target is not defined in the repository. See [08_DEPLOYMENT.md](08_DEPLOYMENT.md).

---

## Supabase Project Info

**Needs verification.** The Supabase project URL is in `.env` (not committed). The Edge Function `process-invoice` must be deployed and `ANTHROPIC_API_KEY` must be set as a secret.

---

## How Future Agents Should Approach Changes

1. **Read before writing.** App.tsx is 11,000+ lines. Always `Read` the target section before editing. Never guess line numbers — use `Grep` to find exact text.
2. **Investigate first, change second.** For any bug, trace the full data flow (DB → loader → state → render) before proposing a fix.
3. **Smallest safe change.** The codebase is large and interconnected. Prefer targeted edits over refactors.
4. **Run `npm run build` after every change.** TypeScript errors must be zero before committing.
5. **Do not commit without instruction.** Commit only when the user explicitly asks.
6. **Preserve business rules.** Average cost, FEFO allocation, RLS policies, and `supplier_id` constraints are load-bearing — do not simplify them without understanding the implications.
7. **Check migrations before DB changes.** Any schema change needs a new SQL file in `supabase/migrations/` with rollback SQL included.
8. **Remember the `received_date` exception.** This column has no migration — it must be handled specially when documenting or restoring the schema.

Full agent guide: see [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md).

---

## Definition of Done for Future Work

A change is complete when:
- [ ] The feature works end-to-end in a browser (not just in code)
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No regressions in: POS sale, receiving post, invoice save, payment record
- [ ] The relevant sections of the documentation are updated if behavior changes
- [ ] A commit is made with a descriptive message
- [ ] The change is pushed to `origin/main`

---

*Source: PLATFORM_REFERENCE.md §10 — Developer Handoff*
