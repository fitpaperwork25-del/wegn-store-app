# Module: Reports

**Related:** [modules/pos.md](pos.md) · [modules/inventory.md](inventory.md) · [modules/returns.md](returns.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Sales analytics, inventory valuation, low-stock report, stock count history, PO report.

---

## Features

- Revenue Analytics (today / 7d / 30d / all time filter)
- Sales History (filterable, searchable, expandable per sale)
- Return History
- Inventory Valuation (per-product: qty × average_cost)
- Low Stock Report (products below reorder level)
- Stock Count History (past counts with variance per item)
- PO Report (purchase order summary)

---

## User Workflow

- Navigate to Reports tab.
- Select the desired report section.
- Apply date range or search filters as needed.
- Review results in-page.

---

## Database Tables

All major tables — data is computed from in-memory state, not dedicated reporting queries.

---

## Business Rules

- All report data is from in-memory state loaded at page load. Very large datasets (10,000+ transactions) may cause slow initial loads.
- Revenue is computed from `completed` sales only.
- Inventory Valuation = `quantity_on_hand × average_cost` per product.
- Low Stock = products where `quantity_on_hand < reorder_level` and `status = 'active'`. Products with `reorder_level = null` are excluded.
- Date range filters (today / 7d / 30d) are applied in-memory; no DB-scoped query is made at filter time.

---

## Sections in Detail

**Revenue Analytics:**
- Total revenue, transaction count, avg transaction, items sold, tax collected
- Payment method breakdown
- Daily breakdown
- Top products by units sold
- Filterable by: today / 7 days / 30 days / all time

**Sales History:**
- Full filterable/searchable sale list
- Details expandable per sale (line items, payment method, cashier, customer)
- Filter by cashier and date range

**Return History:**
- List of all return transactions

**Inventory Valuation:**
- Per-product snapshot of `qty × average_cost`

**Low Stock Report:**
- Products below reorder level

**Stock Count History:**
- Past counts with variance per item

**PO Report:**
- Purchase order summary

---

## UI Components

- Revenue analytics summary cards
- Date range filter (today / 7d / 30d / all time)
- Sales history table with search input and cashier filter
- Expandable sale rows (show line items)
- Return history table
- Inventory valuation table
- Low stock table
- Stock count history table with variance column
- PO report table

---

## Edge Cases

- If `reorder_level` is null on a product, it does not appear in the low stock report.
- POS sales do NOT write `inventory_transactions` rows — transaction history does not include POS sales (BUG-03).

---

## Known Issues

- No export to CSV or PDF (except PO PDF via html2canvas).
- All report data is from in-memory state — very large datasets (10,000+ transactions) may cause slow initial loads (SCALE-04).
- No scheduled or emailed reports.
- No pagination on Sales History (SCALE-05).

---

## Test Checklist

- [ ] Revenue totals match sum of completed sales
- [ ] Date range filter changes numbers correctly
- [ ] Sales history search finds by product name, customer, sale ID
- [ ] Inventory valuation reflects current qty × average_cost

---

## Future Enhancements

- CSV and PDF export for all report sections
- Pagination on Sales History and Transaction History
- Dedicated reporting DB queries (not in-memory computation)
- Scheduled or emailed reports

---

*Source: PLATFORM_REFERENCE.md §4 — Reports*
