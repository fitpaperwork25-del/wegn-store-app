# Module: POS (Point of Sale)

**Related:** [modules/inventory.md](inventory.md) · [modules/customers.md](customers.md) · [modules/loyalty.md](loyalty.md) · [modules/cash_drawer.md](cash_drawer.md) · [modules/returns.md](returns.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Complete a customer sale — add items to cart, apply discounts, process payment, print receipt.

---

## Features

- Barcode scan or product search/select to add items to cart
- Per-line quantity editing
- Discount (% or fixed amount)
- Customer lookup and attachment (by phone number)
- Loyalty point redemption
- Payment method selection (cash, card, bank transfer, mobile money, other)
- Sale completion with inventory deduction, payment recording, and loyalty point award
- Receipt modal with print option
- Sale void (reverses inventory, records refund payment)
- Price negotiation per cart line (when selling policy allows)

---

## User Workflow

1. Scan barcode or search/select product → added to cart.
2. Optionally attach customer (by phone number).
3. Optionally apply discount (% or fixed amount).
4. Optionally redeem loyalty points.
5. Select payment method (cash, card, bank transfer, mobile money, other).
6. Complete Sale → deducts inventory, records sale, records payment, awards loyalty points.
7. Receipt modal appears; can print.

---

## Database Tables

- `sales`
- `sale_items`
- `payments`
- `inventory`
- `inventory_transactions`
- `inventory_batches`
- `sale_item_batches`
- `customers`
- `loyalty_transactions`

---

## Business Rules

- Stock is checked before completing: if `quantity > quantity_on_hand`, sale is blocked.
- Tax is applied to the discounted subtotal: `tax = (subtotal - discount) × tax_rate`.
- Loyalty: 1 point earned per $1 of sale total (after discount, after tax). Points earned are floored.
- Loyalty redemption: 100 pts = $1.00, subtracted before tax. Cannot exceed customer balance.
- FEFO: At sale time, active batches for each cart product are fetched ordered by `expiration_date ASC NULLS LAST`. The soonest-expiring batch is consumed first. Each consumption is logged to `sale_item_batches` and `inventory_batches.quantity_remaining` is decremented.
- If a product has no active batches, FEFO allocation is skipped (no crash — batch deduction is optional).
- If `sellingPolicy = 'negotiated_pricing'`, a "Negotiate Price" button appears per cart line.
- Cashier must be selected if any active employees exist. Sale is blocked otherwise.
- Cart in progress triggers `beforeunload` warning to prevent accidental tab close.
- POS sales do NOT write `inventory_transactions` rows — sales are not visible in the transaction history view. (See BUG-03 in [../10_TROUBLESHOOTING.md](../10_TROUBLESHOOTING.md))

---

## UI Components

- Product search / barcode input field
- Cart line list with qty controls and line total
- Discount panel (% or fixed amount input)
- Customer lookup input (by phone number)
- Loyalty redemption field (points input)
- Payment method buttons (cash, card, bank transfer, mobile money, other)
- "Negotiate Price" button per cart line (visible when `negotiated_pricing` selling policy is active)
- Receipt modal with print button
- Cashier selector

---

## Edge Cases

- A product can be in the cart and sold even if it has no batches (FEFO skipped silently).
- Payment method `other` requires a reference field.
- Voiding a completed sale reverses inventory (adds back) and records a refund payment with `payment_type = 'refund'`.

---

## Known Issues

- No split-tender (one payment method per sale).
- No layaway or on-account sales.
- Void does not reverse loyalty points (BUG-01).
- Receipt prints via browser's print dialog (no thermal printer driver integration).

---

## Test Checklist

- [ ] Barcode scan adds product to cart
- [ ] Stock validation blocks oversell
- [ ] Discount (% and fixed) calculates correctly
- [ ] Tax applies to discounted amount
- [ ] Loyalty earned appears on receipt and updates balance
- [ ] Loyalty redemption reduces total and cannot exceed balance
- [ ] Payment completes, inventory decremented, transaction recorded
- [ ] FEFO: correct batch `quantity_remaining` decremented
- [ ] Void reverses inventory and records refund payment
- [ ] Cash drawer expected cash includes this sale

---

## Future Enhancements

- Split-tender (multiple payment methods per sale)
- Layaway or on-account sales
- Loyalty point reversal on void
- Thermal printer integration (ESC/POS)

---

*Source: PLATFORM_REFERENCE.md §4 — POS, §5 — Sales, §9 — Known Issues*
