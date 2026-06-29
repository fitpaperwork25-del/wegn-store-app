# Module: Returns

**Related:** [modules/pos.md](pos.md) · [modules/inventory.md](inventory.md) · [modules/loyalty.md](loyalty.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Process product returns against completed sales. Restores inventory, issues refund payment.

---

## Features

- Return dialog accessible from Sales History
- Per-line return quantity entry (up to available-to-return qty)
- Return reason (dropdown and notes)
- Inventory restoration on return
- Refund payment recording (same payment method as original sale)
- Return history view

---

## User Workflow

1. In Sales History, click Return on a completed sale.
2. System shows eligible return quantities (original qty − already returned).
3. Select return quantities, choose reason (dropdown + notes), submit.
4. Inventory restored, refund payment recorded.

---

## Database Tables

- `return_items`
- `payments`
- `inventory`
- `inventory_transactions`

---

## Business Rules

- Return qty cannot exceed available-to-return qty (original qty − already returned).
- A `return_items` row is created per line.
- A `payments` row is created with `payment_type = 'refund'` and the payment method used in the original sale.
- Inventory is restored: `quantity_on_hand += return_qty`. An `inventory_transactions` row with `transaction_type = 'return'` is written.
- Return does NOT restore batch quantities in `inventory_batches` (BUG-02).
- Return does NOT reverse loyalty points (known limitation).

---

## UI Components

- Return dialog (opened from Sales History, per completed sale)
- Per-line return qty input (limited to available-to-return qty)
- Return reason dropdown
- Notes field
- Submit Return button

---

## Edge Cases

- Partial return: only some items or partial quantities can be returned.
- A second return on the same sale is blocked for already-returned quantities.
- The refund payment method matches the original sale's payment method automatically.

---

## Known Issues

- Returns do NOT restore `inventory_batches.quantity_remaining` — batch records remain at their depleted level (BUG-02).
- Returns do NOT reverse loyalty points earned on the original sale.

---

## Test Checklist

- [ ] Return dialog shows correct available-to-return quantities
- [ ] Partial return allowed
- [ ] Inventory restored after return
- [ ] Refund payment recorded with correct payment method
- [ ] Returned quantity blocked on second return attempt
- [ ] Return appears in return history

---

## Future Enhancements

- Batch quantity restoration on return
- Loyalty point reversal on return

---

*Source: PLATFORM_REFERENCE.md §4 — Returns, §5 — Returns / Refunds*
