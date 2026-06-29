# Module: Cash Drawer

**Related:** [modules/pos.md](pos.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Track opening float, cash sales, paid-outs, and closing count for cash drawer reconciliation.

---

## Features

- Open drawer with opening float
- Record paid-outs during the session
- Close drawer with physical cash count
- Expected cash calculation (float + cash sales − cash refunds − paid-outs)
- Over/short display
- Closed drawer session history

---

## User Workflow

1. Open Drawer — enter opening float.
2. During the session: record paid-outs as needed.
3. Close Drawer — enter physical closing count. System shows expected cash, over/short.

---

## Database Tables

- `drawer_sessions`
- `drawer_paid_outs`

---

## Business Rules

- Expected cash formula:
  ```
  expected_cash = opening_float
                + Σ(cash payments where payment_type = 'sale' and sale after drawer opened)
                − Σ(cash payments where payment_type = 'refund' and sale after drawer opened)
                − Σ(paid_outs)
  over_short = closing_count − expected_cash
  ```
- Cash sales are scoped to the current session by `opened_at` timestamp — only sales after the drawer was opened are included.
- `drawerCashSales` is computed as a memo from in-memory `sales` and `allPayments` state — it will not reflect sales made before the current state was loaded.
- Only one active drawer session per business (enforced by app logic, not DB constraint).

---

## UI Components

- Open Drawer form (opening float input)
- Paid-out form (amount and reason)
- Current session summary (expected cash, cash sales total, paid-outs total)
- Close Drawer form (physical closing count input)
- Over/short display
- Closed drawer session history list

---

## Edge Cases

- `drawerCashSales` is computed from in-memory state. If the page was loaded partway through a shift, sales before load time are included (they are in the loaded `sales` state), but only those after `opened_at` are counted.
- Only `completed` sales (not voided) are counted in expected cash.
- Only one active drawer session per business; opening a second requires closing the first.

---

## Known Issues

- No DB constraint prevents opening a second drawer session — only app logic blocks it.

---

## Test Checklist

See TC-07 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] Open drawer records opening float
- [ ] Cash sales accumulate in expected cash
- [ ] Paid-out reduces expected cash
- [ ] Closing count computes over/short correctly
- [ ] Closed drawer session stored in history

---

## Future Enhancements

- DB-level constraint to prevent multiple open drawer sessions
- Cash drawer report export

---

*Source: PLATFORM_REFERENCE.md §4 — Cash Drawer, §5 — Cash Drawer Behavior*
