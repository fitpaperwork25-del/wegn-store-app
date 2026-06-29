# Module: Supplier Invoices

**Related:** [modules/receiving_sessions.md](receiving_sessions.md) · [modules/supplier_payments.md](supplier_payments.md) · [modules/smart_receive.md](smart_receive.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Record or reconcile a supplier invoice against a completed receiving session.

---

## Features

- Invoice panel per completed receiving session (in Session History)
- Pre-fills invoice total from received items sum when `invoice_total = 0`
- Invoice number, date, total, freight cost, additional cost fields
- Automatic invoice status calculation (matched / variance / pending)
- Status badge in Session History row
- `approved_by` set on matched sessions (enables payment recording)
- Badge refresh after save (no stale "Invoice: pending")

---

## User Workflow

1. In Receiving Session History, click "Invoice" on a completed session.
2. Invoice panel opens — pre-filled with items total if `invoice_total = 0`.
3. Enter invoice number, date, total, freight, additional costs.
4. Save Invoice → updates `receiving_sessions` with invoice fields and sets `invoice_status` to `matched` or `variance`.
5. Badge in session history reflects current `invoice_status`.

---

## Database Tables

- `receiving_sessions`

---

## Business Rules

- `invoice_status`:
  - `matched` if `|invoice_total - calculated_total| ≤ 0.01`
  - `variance` if difference > 0.01
- Matching formula:
  ```
  calculated_total = sum(item.quantity × item.unitCost) + freight + additionalCost
  variance_amount  = invoice_total - calculated_total
  invoice_status   = |variance_amount| ≤ 0.01 ? "matched" : "variance"
  ```
- `approved_by` is set to `"auto"` for Smart Receive sessions where invoice matched at creation; otherwise must be manually set (note: manual approval UI is not yet implemented — `approved_by` is only set by Smart Receive auto-match or the invoice save path when `invoice_status = 'matched'`).
- After save, `loadSessionHistory()` is called to refresh the list and clear the "Invoice: pending" badge.
- `approved_by` being set is required for the "Record Payment" button to appear on the session row.

---

## UI Components

- Invoice panel (toggled by "Invoice" button on session row in Session History)
- Invoice number text input
- Invoice date input
- Invoice total amount input
- Freight cost input
- Additional cost input
- Save Invoice button
- Invoice status badge in session row (`pending` / `matched` / `variance`)

---

## Edge Cases

- If session was created by Smart Receive with a pre-matched invoice, the invoice fields are pre-populated and `invoice_status` is already `matched`.
- Opening the invoice panel when `invoice_total = 0` pre-fills the total from the sum of received item costs.
- A session can have `invoice_status = 'variance'` and still proceed to payment if the user manually sets `approved_by` in the database (no UI for this).

---

## Known Issues

- Manual approval workflow not implemented. `approved_by` must be set to something non-null for "Record Payment" to appear. For sessions created via Smart Receive with a matching invoice, this is set automatically. For manually created sessions, it must be set in the database or via a future UI.

---

## Test Checklist

See TC-05 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] Invoice panel pre-fills total from received items when `invoice_total = 0`
- [ ] Save Invoice updates badge to "matched" or "variance"
- [ ] Badge clears after save (no stale "Invoice: pending")
- [ ] Variance calculation is correct
- [ ] `approved_by` is set on matched sessions

---

## Future Enhancements

- Manual approval UI for variance sessions (currently requires direct DB edit)

---

*Source: PLATFORM_REFERENCE.md §4 — Supplier Invoices, §5 — Supplier Invoice Matching, §6 — Steps 9–10*
