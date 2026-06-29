# Changelog

Commit history and resolved bug records.

**Related:** [11_DEVELOPER_HANDOFF.md](11_DEVELOPER_HANDOFF.md) · [modules/smart_receive.md](modules/smart_receive.md) · [modules/receiving_sessions.md](modules/receiving_sessions.md) · [INDEX.md](INDEX.md)

---

## Commit History (Most Recent First)

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
| `4ff41e4` | Stabilization & UX Phase 2+3 — Global Collapsible Sections |
| `08dd9fe` | Receiving Phase 2C notes and purchasing performance cleanup |
| `ed135b3` | Add Receiving Phase 2B — exception quantity capture at receive time |

---

## Resolved Bugs (Smart Receive and Receiving)

Full root-cause records for bugs that were diagnosed and fixed in this area.

| Bug | Root Cause | Fix Applied | Commit |
|---|---|---|---|
| Unit cost showing $0.00 after post | Cost input `key` prop included `unit_cost`, causing React to unmount on each keystroke — `onBlur` never fired | Stable key + pre-post `Promise.all` flush | `77fd84c` |
| Invoice total defaulting to $0.00 in invoice panel | `loadSessionHistoryItems` was called but return value was ignored; invoice panel used old (empty) items | Made `loadSessionHistoryItems` return items; invoice handler uses them to seed total | `b4dda9c` |
| "Invoice: pending" badge not clearing after save | `handleSaveInvoice` had no `loadSessionHistory()` call after save — relied on optimistic patch only | Added `await loadSessionHistory()` after successful save | `175dcea` |
| Record Payment not appearing after `supplier_id` was removed from guard | `supplier_payments.supplier_id` is NOT NULL FK — removing the guard caused a DB error on payment insert | Restored `supplier_id` guard; added inline "Link a supplier" nudge | `5387171` |
| Payment form open and enabled when remaining = $0 | `paymentPanelSessionId` set on click; `loadSessionPayments` then revealed remaining = 0; panel had no remaining guard | Added `remaining ≤ 0` guard inside panel — hides form, shows "Invoice fully paid." | `862d299` |

---

*Source: PLATFORM_REFERENCE.md §6 Step 14 — Known Resolved Bugs, §10 — Recent Commits*
