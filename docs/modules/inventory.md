# Module: Inventory

**Related:** [modules/smart_receive.md](smart_receive.md) · [modules/receiving_sessions.md](receiving_sessions.md) · [modules/pos.md](pos.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Full product catalog management — CRUD, stock adjustments, bulk import, barcode linking, expiration tracking, stock counts.

---

## Features

- Add, edit, and deactivate products
- Barcode assignment per product (unique per business)
- Category assignment
- Supplier linkage per product
- Stock adjustment (damaged, expired, stolen, correction)
- Bulk CSV product import
- Stock counts (physical vs. system qty, variance recording)
- Transaction history view
- Expiration Tracking section (view and write-off batches)
- Smart Receive and manual receiving session management (hosted in this tab)
- Receiving Session History with collapse/expand and Load More (20 per page)

---

## User Workflow

- Add/edit/deactivate products.
- Adjust inventory (damaged, expired, stolen, correction).
- Run stock counts.
- View transaction history.
- View/write-off expiration batches.

---

## Database Tables

- `products`
- `inventory`
- `inventory_transactions`
- `inventory_batches`
- `categories`

---

## Business Rules

- Adding a product also creates an `inventory` row (quantity 0).
- `average_cost` is set to `cost_price` on product creation; updated on receive.
- Adjustments write an `inventory_transactions` row and update `inventory.quantity_on_hand`.
- Write-off of a batch: decrements `inventory_batches.quantity_remaining`, updates `inventory.quantity_on_hand`, writes a transaction with `transaction_type = 'expired'`.
- Stock count: records a `stock_counts` + `stock_count_items` row; updates `inventory.quantity_on_hand` to counted qty; writes adjustment transactions.
- Barcode must be unique per business (enforced by index `idx_barcode_unique_per_business`).
- `average_cost` weighted average formula: `((qty_on_hand × old_avg_cost) + (qty_received × unit_cost)) / (qty_on_hand + qty_received)`. Updated only on receiving post, not on sales, returns, adjustments, or write-offs.

---

## UI Components

- Product list with search and filter
- Product form modal (name, SKU, barcode, prices, supplier, category, overhead/margin fields)
- Inventory adjustment dialog (reason dropdown, qty field)
- Expiration Tracking section (batch list, write-off action)
- Stock count UI (system qty vs. counted qty input, variance display)
- Bulk import CSV uploader
- Transaction history table with product and date filters
- Receiving Session History collapsible section (clickable header with count and arrow toggle)
- Load More button (appends next 20 sessions)

---

## Edge Cases

- If a product has no barcode, it cannot be scanned at POS (must be selected manually).
- Deactivated products remain in history but do not appear in POS search.
- Bulk CSV import: `name` and `selling_price` are required; `barcode` must be unique or row is skipped.
- If `reorder_level` is null, the product does not appear in low-stock alerts.

---

## Known Issues

- No batch-level cost editing after receive.
- No serial-number tracking.
- No multi-location stock.
- POS sales do NOT write `inventory_transactions` rows — POS transactions are not visible in the transaction history (BUG-03).

---

## Test Checklist

- [ ] Create product → inventory row created at 0
- [ ] Edit product saves all fields
- [ ] Deactivate product hides from POS
- [ ] Inventory adjustment updates quantity and writes transaction
- [ ] Write-off batch updates quantity_remaining and inventory qty
- [ ] Stock count records variance and updates system qty
- [ ] Bulk import creates products and inventory rows
- [ ] Duplicate barcode is rejected

---

## Future Enhancements

- Batch-level cost editing after receive
- Serial-number tracking
- Multi-location stock

---

*Source: PLATFORM_REFERENCE.md §4 — Inventory, §5 — Business Rules*
