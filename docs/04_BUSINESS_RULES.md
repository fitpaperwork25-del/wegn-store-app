# Business Rules

**Related:** [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) · [modules/pos.md](modules/pos.md) · [modules/inventory.md](modules/inventory.md) · [modules/smart_receive.md](modules/smart_receive.md) · [modules/supplier_payments.md](modules/supplier_payments.md) · [INDEX.md](INDEX.md)

---

## Inventory Quantity Changes

Quantity on hand changes in exactly these scenarios:

| Event | Change | Table written |
|---|---|---|
| Receiving session posted | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| Rapid Receive posted | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| PO Receive (legacy) | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| Sale completed | `- quantity` per cart item | `inventory` (via POS flow) |
| Sale voided | `+ quantity` per item | `inventory`, `inventory_transactions` (type: `adjustment`) |
| Return processed | `+ quantity_returned` | `inventory`, `inventory_transactions` (type: `return`) |
| Manual adjustment | `+ or -` | `inventory`, `inventory_transactions` (type: `adjustment`) |
| Batch write-off | `- qty_written_off` | `inventory`, `inventory_transactions` (type: `expired`), `inventory_batches` |
| Stock count committed | set to `counted_qty` | `inventory`, `inventory_transactions` (type: `stock_count`) |

---

## Average Cost Updates

`products.average_cost` is updated only on **receiving post** using the weighted average formula:

```
new_average_cost = ((qty_on_hand × old_avg_cost) + (qty_received × unit_cost)) / (qty_on_hand + qty_received)
```

If `qty_on_hand + qty_received = 0`, `average_cost` is set to `unit_cost`.

Average cost is NOT recalculated on sales, returns, adjustments, or write-offs.

---

## Sales

1. Cart items are validated: `quantity ≤ quantity_on_hand` for each product.
2. Sale row is inserted with status `open`.
3. Sale items are inserted.
4. Payment is inserted.
5. For each cart item:
   - FEFO batches are allocated (soonest expiry first).
   - `inventory.quantity_on_hand` is decremented (via app logic — not a trigger).
   - Sale does NOT write an `inventory_transactions` row (unlike receiving). **Note:** This means POS sales do not appear in the transaction history view. Only receiving, adjustments, returns, and write-offs create transaction records.
6. Loyalty points are awarded.
7. Sale status is updated to `completed`.

---

## Returns / Refunds

1. Eligible qty per product = original sale qty − already returned qty.
2. `return_items` row created.
3. `payments` row created with `payment_type = 'refund'`.
4. `inventory.quantity_on_hand` incremented.
5. `inventory_transactions` row written with `transaction_type = 'return'`.
6. Batch quantities (`inventory_batches.quantity_remaining`) are NOT restored.
7. Loyalty points from the original sale are NOT reversed.

---

## Supplier Invoice Matching

During receiving session creation (Smart Receive):
```
calculated_total = sum(item.quantity × item.unitCost) + freight + additionalCost
variance_amount  = invoice_total - calculated_total
invoice_status   = |variance_amount| ≤ 0.01 ? "matched" : "variance"
```

When a user manually saves an invoice against a completed session, the same calculation runs and `invoice_status` is updated.

`approved_by` is set automatically to `"auto"` when `invoice_status = "matched"` via Smart Receive. For manually received sessions, the invoice save path sets `approved_by` when saving with `invoice_status = "matched"` — **Needs verification** of exact path.

---

## Supplier Payments

- `supplier_payments.supplier_id` is NOT NULL. Sessions must have `supplier_id` set before a payment can be recorded.
- `remaining = invoice_total − sum(payments.amount)` — computed client-side from in-memory `sessionPayments` state.
- Payment blocked if `amount > remaining + 0.01`.
- Multiple payments per session are supported (partial payments).
- `sessionPayments` is loaded lazily on panel open. After page reload, the badge may not reflect prior payments until the panel is opened.

---

## Cash Drawer Behavior

```
expected_cash = opening_float
              + Σ(cash payments where payment_type = 'sale' and sale after drawer opened)
              − Σ(cash payments where payment_type = 'refund' and sale after drawer opened)
              − Σ(paid_outs)
over_short = closing_count − expected_cash
```

The drawer session start time (`opened_at`) is used to scope which sales are included. Only `completed` sales (not voided) are counted.

---

## Role Permissions

| Permission | Owner | Manager | Cashier | Inventory Clerk |
|---|---|---|---|---|
| Complete sales | ✓ | ✓ | ✓ | ✗ |
| Void sales | ✓ | ✓ | ✗ | ✗ |
| Add/edit products | ✓ | ✓ | ✗ | ✓ |
| Adjust inventory | ✓ | ✓ | ✗ | ✓ |
| Deactivate products | ✓ | ✓ | ✗ | ✗ |
| Bulk import | ✓ | ✓ | ✗ | ✗ |
| Manage categories | ✓ | ✓ | ✗ | ✗ |
| Manage suppliers | ✓ | ✓ | ✗ | ✓ |
| Manage POs | ✓ | ✓ | ✗ | ✓ |
| Manage staff | ✓ | ✗ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✗ | ✗ |
| Change settings | ✓ | ✓ | ✗ | ✗ |

Note: these permissions are implemented via tab-level access control in `tabAccess` and boolean flags like `canVoidSales`. There is no field-level permission enforcement.

---

## Tenant / Business Isolation

Every table has a `business_id` column. RLS policies enforce `business_id = auth_business_id()` for all reads and writes. Cross-tenant data access is impossible at the DB level assuming RLS is correctly enabled and the `auth_business_id()` function is correct. The `businesses` table itself uses `owner_id = auth.uid()` — only the account owner can see or modify their own business profile.

---

## Barcode Handling

- Barcodes are stored on `products.barcode`.
- A partial unique index enforces one barcode per business (exact migration name: `20260621_barcode_unique_index.sql`).
- At POS and receiving, barcode lookup is: `products.find(p => String(p.barcode || "").trim() === code)`.
- Lookup is exact-match only (no fuzzy).
- If barcode is not found, a Product Resolution dialog opens to link or create the product.

---

## Expiration / Batch Tracking (FEFO)

- Batch records are created on receiving post (manual sessions) or at Smart Receive session creation, if batch/expiry fields are provided.
- `inventory_batches.quantity_remaining` starts equal to `quantity_received`.
- At POS sale, batches are fetched for all cart products ordered by `expiration_date ASC NULLS LAST` (FEFO index). Earliest-expiring batches are depleted first.
- When a batch's `quantity_remaining` reaches 0, it is set to `status = 'depleted'`.
- Write-offs: manual from the Expiration Tracking UI. Sets `status = 'expired'` when remaining hits 0 after write-off.
- Batches are shown in the "Expiration Tracking" section of the Inventory tab.
- FEFO filter: only shows batches linked to active receiving sessions (or orphan batches with no session).

---

*Source: PLATFORM_REFERENCE.md §5 — Business Rules*
