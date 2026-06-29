# Module: Receiving Sessions

**Related:** [modules/smart_receive.md](smart_receive.md) · [modules/supplier_invoices.md](supplier_invoices.md) · [modules/inventory.md](inventory.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Manual version of Smart Receive — scan or add items to a draft session, set unit costs, then post to update inventory.

---

## Features

- Start a new draft receiving session (optional supplier and notes)
- Barcode scan input to add products (each scan = +1 qty)
- Quantity adjustment with +/− buttons or inline edit
- Unit cost per item (with onBlur persistence)
- Optional batch number and expiration date per line
- Product Resolution dialog for unknown barcodes
- Post Receiving to update inventory and complete session
- Session History with collapsible section (click header to expand/collapse)
- Load More (20 sessions per page, appended on click)
- Per-session Invoice and Record Payment panels (see related modules)

---

## User Workflow

1. Start a new session (optional: select supplier, add notes).
2. Scan barcodes or use the barcode scan input to add products.
3. Adjust quantities with +/− buttons or edit inline.
4. Set unit cost per item.
5. Optionally add batch/expiry details per line.
6. Post Receiving → inventory updated, session marked completed, appears in Session History.

---

## Database Tables

- `receiving_sessions`
- `receiving_items`
- `inventory`
- `inventory_transactions`
- `inventory_batches`

---

## Business Rules

- Only one active (draft) session allowed at a time per business.
- If a product barcode is not found on scan, a Product Resolution dialog opens — user can link to existing product or create new.
- Unit costs typed but not confirmed via onBlur are flushed via `Promise.all` before posting.
- Duplicate invoice guard: if the session has an `invoice_number` matching a completed session for the same supplier, user is prompted to confirm.
- Posting is sequential (not atomic). Each product is updated in a loop. Partial failure possible. (BUG-04)
- After post: `loadProducts`, `loadTransactions`, `loadSessionHistory`, `loadBatches` are all called.
- `average_cost` is updated on post using the weighted average formula. See [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md).
- Session History loads 20 sessions at a time (pagination via Load More).
- Session History section is collapsible: header shows `▶ / ▼ Receiving Session History (N shown)` and toggles on click.

---

## UI Components

- Barcode scan input field
- Session item list with qty +/− buttons and inline qty edit
- Unit cost input per line (persists on blur; flushed to DB before post)
- Batch number and expiration date fields per line
- Product Resolution dialog (for unknown barcodes — link to existing product or create new)
- Post Receiving button
- Session History collapsible section header (clickable, shows count with arrow indicator)
- Session History list (20 per page)
- Load More button (appended below list; hidden when no more sessions)
- Per-session action buttons: Invoice, Record Payment (eligibility-gated)

---

## Edge Cases

- Scanning the same barcode multiple times increments the existing line item's quantity.
- Unknown barcode triggers Product Resolution dialog; user can skip (line not added).
- A session can be started without a supplier; this blocks payment recording later.
- If the cost input has a value that was typed but not yet blurred, the pre-post `Promise.all` flush captures it.

---

## Known Issues

- Receiving post is not atomic — partial failures possible (BUG-04). If a product fails mid-loop, earlier products are already updated.
- No partial post (cannot post some items and leave others).
- No barcode scanning of quantities (each scan = +1 only; must edit qty manually for larger quantities).

---

## Test Checklist

See TC-04 and TC-10 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] Start session, scan product, quantity increments
- [ ] Unknown barcode triggers Product Resolution
- [ ] Unit cost saves on blur
- [ ] Post updates inventory qty and creates transaction
- [ ] Batch fields create inventory_batches row
- [ ] Session appears in Session History after post
- [ ] Duplicate invoice number shows warning
- [ ] Session History is collapsed by default; expands on header click
- [ ] Load More appends next 20 sessions
- [ ] Header count reflects number of sessions shown

---

## Future Enhancements

- Atomic receiving post (Postgres transaction via stored procedure)
- Partial post (post subset of items)
- Barcode scan with quantity (scan same item multiple times to auto-increment)

---

*Source: PLATFORM_REFERENCE.md §4 — Receiving Sessions, §6 Steps 7–8*
