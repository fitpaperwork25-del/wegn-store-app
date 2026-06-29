# Troubleshooting, Known Issues, and Deferred Improvements

**Related:** [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) · [02_ARCHITECTURE.md](02_ARCHITECTURE.md) · [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) · [12_CHANGELOG.md](12_CHANGELOG.md) · [INDEX.md](INDEX.md)

---

## Common Issues and Fixes

| Issue | Check |
|---|---|
| "Failed to load" on any data | Check Supabase project is up; verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Smart Receive fails | Verify `ANTHROPIC_API_KEY` is set in Supabase Edge Function secrets; check function is deployed |
| RLS errors (permission denied) | Check that `auth_business_id()` function is deployed; check that user has a row in `businesses` |
| Invoice total shows $0.00 | Open receiving session history items first; or enter total manually |
| Payment panel shows "Invoice fully paid." unexpectedly | Session already has payments in DB — this is correct behavior |
| `received_date` column error | Column was added directly in Supabase Dashboard — verify it exists on `receiving_sessions` in your Supabase project; add manually if missing: `ALTER TABLE receiving_sessions ADD COLUMN IF NOT EXISTS received_date date;` |
| Build fails on TypeScript errors | Run `tsc --noEmit` to see specific errors before attempting fixes |

---

## Confirmed Bugs

| ID | Description | Severity | Notes |
|---|---|---|---|
| BUG-01 | Voiding a sale does NOT reverse loyalty points | Medium | Points remain credited after void |
| BUG-02 | Returns do NOT restore `inventory_batches.quantity_remaining` | Medium | Batch qty stays at consumed level even after return |
| BUG-03 | POS sales do NOT write `inventory_transactions` rows | Low | Sales are not visible in transaction history |
| BUG-04 | Receiving post is not atomic — partial failures possible | High | If any product fails mid-loop, earlier products are already updated |
| BUG-05 | `received_date` column has no migration file | Medium | Fresh DB restore will fail without manually adding this column |
| BUG-06 | `inventory_batches` RLS uses owner-only policy | Medium | Auth-linked staff may not be able to read batch data |

---

## UX Improvements

| ID | Description | Priority |
|---|---|---|
| UX-01 | "Record Payment" button shows before `sessionPayments` are loaded; badge may be wrong until panel is opened | Medium |
| UX-02 | Session History badge for "Paid" requires panel to have been opened at least once since page load | Low |
| UX-03 | Receiving post progress is not shown (loading spinner, but no per-item feedback for long sessions) | Low |
| UX-04 | PO email is `mailto:` only — no reliable delivery for suppliers without a default mail client | Medium |
| UX-05 | No way to cancel a payment attempt once "Save Payment" is clicked | Low |
| UX-06 | Negotiated pricing with approval (`negotiated_with_approval` policy) — approval flow not implemented | Medium |

---

## Scalability Improvements

| ID | Description | Priority |
|---|---|---|
| SCALE-01 | `App.tsx` is ~11,050 lines — needs componentization before major feature additions | High |
| SCALE-02 | Bundle is 1.37 MB / 356 KB gzip — no code splitting | Medium |
| SCALE-03 | All data loaded at startup in one `useEffect` — slow for large datasets | Medium |
| SCALE-04 | Sales and transaction history are fully in-memory — will be slow with 10,000+ records | High |
| SCALE-05 | No pagination on Sales History, Transaction History, or Customer list | Medium |
| SCALE-06 | No automated report generation — all reports computed from in-memory state | Low |

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

## Future Features (Customer-Driven, Do Not Build Yet)

The following have been identified but must not be built until customer demand is confirmed:

- Multi-location inventory
- Thermal printer integration (ESC/POS)
- Offline mode / PWA
- Staff invite via email (partially scaffolded via `auth_user_id`)
- Automated low-stock alerts / email notifications
- Accounting integration
- Tax reporting (by tax category)
- Product variants / modifiers
- Subscription / recurring orders

---

*Source: PLATFORM_REFERENCE.md §7 — Troubleshooting, §9 — Known Issues and Deferred Improvements*
