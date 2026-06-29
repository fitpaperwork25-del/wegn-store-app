# Module: Loyalty

Loyalty is not a standalone tab — it is embedded in the Customers and POS modules.

**Related:** [modules/pos.md](pos.md) · [modules/customers.md](customers.md) · [modules/returns.md](returns.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Reward customers with points for purchases, redeemable as discounts on future sales.

---

## Features

- Points earned automatically on every completed sale (1 point per $1 of final total)
- Points redeemable at POS (100 points = $1.00 discount)
- Real-time loyalty balance display at POS and in Customer detail
- Loyalty transaction history per customer (earned / redeemed)

---

## User Workflow

**Earning:** Attach customer to sale at POS → complete sale → points credited automatically.

**Redemption:** Attach customer to sale at POS → enter points to redeem in the loyalty redemption field → amount deducted from sale total before tax → complete sale.

---

## Database Tables

- `loyalty_transactions`
- `customers`
- `sales`

---

## Business Rules

- **Earning:** `floor(sale.total)` points per sale (1 pt per $1 of final total). Written to `loyalty_transactions` with `type = 'earned'`.
- **Redemption:** 100 pts = $1.00. Deducted from total before tax. Written with `type = 'redeemed'` and negative points.
- **Balance:** sum of all `loyalty_transactions.points` for the customer.
- Redemption is blocked if requested points exceed balance.
- Voiding a sale does NOT reverse loyalty points (BUG-01).
- Returns do NOT reverse loyalty points.

---

## UI Components

- Loyalty balance display at POS (when customer is attached)
- Loyalty redemption input field at POS
- Loyalty points earned shown on receipt
- Loyalty balance in Customer detail view
- Loyalty transaction history in Customer detail view

---

## Edge Cases

- If a customer is attached to a sale but has a zero loyalty balance, redemption is blocked.
- If a sale is voided after loyalty points were earned, those points remain credited to the customer (BUG-01).
- Redemption reduces the taxable total: `tax = (subtotal - discount - redemption_dollars) × tax_rate`.

---

## Known Issues

- Voiding a sale does NOT reverse loyalty points earned on that sale (BUG-01). Points remain credited after void.
- Returns do NOT reverse loyalty points earned on the original sale.

---

## Test Checklist

- [ ] Loyalty points awarded after sale completion
- [ ] Loyalty balance updates correctly
- [ ] Redemption reduces total before tax
- [ ] Redemption blocked if points exceed balance
- [ ] Points appear on receipt
- [ ] Void does NOT reverse points (expected behavior per current implementation)

---

## Future Enhancements

- Loyalty point reversal on void
- Loyalty point reversal on return
- Loyalty points expiry

---

*Source: PLATFORM_REFERENCE.md §4 — Loyalty, §5 — Sales (loyalty step)*
