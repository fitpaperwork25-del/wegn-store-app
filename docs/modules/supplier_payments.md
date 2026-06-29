# Module: Supplier Payments

**Related:** [modules/supplier_invoices.md](supplier_invoices.md) · [modules/suppliers.md](suppliers.md) · [modules/receiving_sessions.md](receiving_sessions.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Record payments made to suppliers against completed, invoiced receiving sessions.

---

## Features

- "Record Payment" button on eligible receiving sessions
- "Link a supplier" nudge for sessions missing `supplier_id`
- Payment panel with date, amount, method, reference, notes fields
- Partial payments (multiple payments per session)
- Remaining balance display (`invoice_total − sum of payments`)
- "Invoice fully paid." read-only state when remaining ≤ 0
- "Paid" badge in session row when remaining ≤ 0
- Supplier Statement view (per-supplier breakdown — read-only)

---

## User Workflow

1. In Receiving Session History, click "Record Payment" on an eligible session.
2. Payment panel opens. Eligible = `status = completed`, `approved_by` is set, `invoice_total > 0`, `supplier_id` is linked.
3. If session has no `supplier_id`, an inline "Link a supplier to record payment" nudge appears.
4. Enter payment date, amount, method, optional reference/notes.
5. Save Payment → recorded in `supplier_payments`; panel shows "Invoice fully paid." when remaining = 0.
6. "Paid" badge appears in the session row when remaining ≤ 0.

---

## Database Tables

- `supplier_payments`
- `receiving_sessions`

---

## Business Rules

- `supplier_payments.supplier_id` is NOT NULL — a supplier must be linked to the session before a payment can be recorded.
- Payment amount cannot exceed remaining balance (+ $0.01 rounding tolerance).
- `sessionPayments` state is loaded lazily when the panel is opened. After a page reload, `sessionPayments` is empty until a panel is opened.
- When the payment panel is open and `loadSessionPayments` reveals remaining = 0 (e.g., session was previously fully paid on another device), the panel shows "Invoice fully paid." and hides the form — the Save button is not accessible.
- Payments can be partial (multiple payments per session).
- `remaining = invoice_total − sum(payments.amount)` — computed client-side from in-memory `sessionPayments` state.
- Payment is blocked if `amount > remaining + 0.01`.

**"Record Payment" button eligibility conditions (all must be true):**
1. `receiving_sessions.status = 'completed'`
2. `receiving_sessions.approved_by` is not null
3. `receiving_sessions.invoice_total > 0`
4. `receiving_sessions.supplier_id` is not null

---

## UI Components

- "Record Payment" button (shown on eligible session rows in Session History)
- "Link a supplier to record payment" nudge (shown when `supplier_id` is null)
- Payment panel (payment date, amount, method, reference, notes)
- Payment history list (all payments recorded for the session)
- "Invoice fully paid." read-only display (shown when remaining ≤ 0; replaces form and Save button)
- Green "Paid" badge in the session row (when remaining ≤ 0)
- Remaining balance display

---

## Edge Cases

- If payment is recorded but the session has no supplier linked (possible in legacy data), the Record Payment button will not appear.
- "Paid" badge uses in-memory `sessionPayments` state. After reload, if `sessionPayments` has not been loaded for that session, the badge may not appear until the panel is opened. (UX-02)
- The "Invoice fully paid." state is enforced in rendering even if the panel was opened before `sessionPayments` was loaded — the `remaining ≤ 0` check runs after `loadSessionPayments` completes.

---

## Known Issues

- No payment deletion or editing.
- Supplier Statement view exists (per-supplier breakdown) but is read-only. (UX-01)
- "Paid" badge may not show on page load until the panel is opened at least once. (UX-02)

---

## Test Checklist

See TC-06 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] "Record Payment" button appears only when all conditions met
- [ ] "Link Supplier" nudge appears for sessions with no supplier_id
- [ ] Payment amount validates against remaining balance
- [ ] Paid badge appears after full payment
- [ ] Panel shows "Invoice fully paid." when remaining = 0
- [ ] Partial payments accumulate correctly
- [ ] Supplier Statement shows correct totals
- [ ] Reload preserves paid state (panel loads from DB, shows "Invoice fully paid." — not the form)

---

## Future Enhancements

- Payment deletion and editing
- Supplier Statement with export capability

---

*Source: PLATFORM_REFERENCE.md §4 — Supplier Payments, §5 — Supplier Payments, §6 — Steps 11–12*
