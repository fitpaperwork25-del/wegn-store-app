# Module: Smart Receive

Smart Receive is the most complex workflow in the platform. It converts a supplier invoice image or PDF into a fully pre-populated receiving session using AI extraction.

**Related:** [modules/receiving_sessions.md](receiving_sessions.md) · [modules/supplier_invoices.md](supplier_invoices.md) · [modules/supplier_payments.md](supplier_payments.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../12_CHANGELOG.md](../12_CHANGELOG.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Upload a supplier invoice (image or PDF) → Claude AI extracts line items → user reviews matches → receiving session created in draft → user posts to update inventory.

---

## Features

- Invoice upload (JPEG, PNG, or PDF)
- AI extraction via Anthropic claude-sonnet-4-6 (multimodal, PDF beta support)
- Automatic supplier name matching
- Product line item matching (exact/fuzzy) with manual fallback
- Batch number and expiration date extraction per line
- Duplicate invoice detection (at session creation and at manual post)
- Pre-populated receiving session with full invoice fields
- Auto-approval on matched invoices (`approved_by = "auto"`)
- Immediate readiness for payment recording on matched sessions

---

## User Workflow

### Step 1: Upload Invoice

User opens the Smart Receive panel (button in Inventory tab header) and uploads an image (JPEG, PNG) or PDF file.

### Step 2: AI Parsing (`processSmartReceiveInvoice`)

- File is read as base64 in the browser using `FileReader`.
- A call is made to the Supabase Edge Function `process-invoice` (via `supabase.functions.invoke`).
- The Edge Function sends the base64 file to the Anthropic API (`claude-sonnet-4-6` model via `https://api.anthropic.com/v1/messages`).
- The prompt instructs Claude to return a strict JSON object:
  ```json
  {
    "supplier": "string",
    "invoiceNumber": "string",
    "invoiceDate": "YYYY-MM-DD",
    "items": [
      { "description": "string", "quantity": number, "unitCost": number,
        "batchNumber": "string or null", "expirationDate": "YYYY-MM-DD or null" }
    ],
    "freight": number,
    "additionalCost": number,
    "invoiceTotal": number
  }
  ```
- The Edge Function parses the first `{...}` JSON block from Claude's response and returns it.
- The Anthropic API key (`ANTHROPIC_API_KEY`) lives only in the Edge Function's environment — it is never sent to or exposed in the browser.

### Step 3: Supplier Matching

After extraction, the app attempts to auto-match the extracted `supplier` name to an existing `suppliers` record:
- Exact match (case-insensitive) on `supplier.name`.
- If matched: `smartReceiveLinkedSupplierId` is set to the matched supplier's UUID.
- If no match: displayed as "Unlinked" — user can manually select from supplier list, create a new supplier, or choose "Continue Unlinked."

Three supplier resolution cases in the UI:
1. **Auto-matched:** supplier found, `Link Supplier` button is pre-selected.
2. **No match:** user picks from dropdown or creates.
3. **AI wrong name:** user overrides with correct supplier via the "Select correct supplier" picker.

"Continue Unlinked" sets `smartReceiveLinkedSupplierId = ""`. The session will have `supplier_id = null` and `supplier_name = extracted_name`.

### Step 4: Product Matching

Each extracted line item is matched against the product catalog:
- Match strategy: exact or fuzzy match on `description` vs. `product_name`, `sku`, or `barcode` — matching logic is in the UI with manual fallback (auto-match is attempted; unresolved items show in yellow).
- Per line, the user can: select an existing product, create a new product (inline), or leave unmatched (line is skipped when creating the session).
- `smartReceiveMatches[i]` holds the resolved `product_id` for line `i` or `""` if unresolved.

### Step 5: Batch / Expiry Extraction

If Claude extracts `batchNumber` or `expirationDate` for a line item, these are stored in `smartReceiveItemBatch[i]`. The user can view/edit them in the Smart Receive review UI before creating the session.

Date formats recognized by the prompt include: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, `MMM YYYY`, `MM/YYYY`, and others.

### Step 6: Receiving Session Creation (`handleCreateSmartReceivingSession`)

When user clicks "Create Receiving Session":

1. **Duplicate invoice guard:** queries `receiving_sessions` for any existing session with the same `invoice_number` and `supplier_id` in `draft` or `completed` status. If found, shows a warning with option to proceed.
2. Computes `calculated_total` and `variance_amount`.
3. Sets `invoice_status = 'matched'` if `|variance| ≤ 0.01`, else `'variance'`.
4. Inserts the `receiving_sessions` row with full invoice fields.
5. Inserts `receiving_items` rows for all matched products.
6. If any items had batch/expiry data (`smartReceiveItemBatch`), inserts `inventory_batches` rows immediately (not deferred to post time).
7. Sets `activeReceivingSession` to the newly created session (by ID — does not re-query for "newest draft").
8. Navigates to Inventory tab.

### Step 7: Unit Cost Persistence

Unit costs from the extracted invoice are stored in `receiving_items.unit_cost` at session creation. When the user adjusts costs in the session view, `handleSessionItemCostChange` immediately writes to the DB via `supabase.from("receiving_items").update({ unit_cost, total_cost })`.

Before posting, a `Promise.all` flush writes all in-memory costs to the DB, capturing any cost that was typed but not yet onBlurred:
```js
await Promise.all(
  sessionItems.map(item =>
    supabase.from("receiving_items")
      .update({ unit_cost: item.unit_cost, total_cost: item.unit_cost * item.quantity_received })
      .eq("id", item.id)
  )
);
```

This fix was required because the cost input previously had an unstable `key` prop (`key={cost-${item.id}-${item.unit_cost}}`), causing React to unmount the input on every keystroke, preventing onBlur from firing.

### Step 8: Posting Inventory (`handlePostReceivingSession`)

See [receiving_sessions.md](receiving_sessions.md) — Business Rules. The FEFO batch is created at post time if batch fields exist in `sessionItemBatch` and a batch for that session item does not already exist (prevents double-batch for Smart Receive sessions where batches were pre-created at session creation).

After post: `loadProducts`, `loadTransactions`, `loadSessionHistory`, `loadBatches` are all called.

### Step 9: Supplier Invoice Fields

Smart Receive pre-populates all invoice fields at session creation:
- `invoice_number`, `invoice_date`, `invoice_total`, `freight_cost`, `additional_cost`
- `calculated_total`, `variance_amount`, `invoice_status`
- `approved_by = "auto"`, `approved_at`, `approval_note` — set automatically when `invoice_status = 'matched'`

This means Smart Receive sessions with matched invoices are immediately ready for payment recording (no manual invoice save needed).

### Step 10: Reconciliation

If `invoice_status = 'variance'`, the session shows in history with a "variance" badge. The user can open the Invoice panel, review, and re-save with corrected figures. The reconciliation formula is the same as manual sessions.

### Step 11: Supplier Payment

Same as described in [supplier_payments.md](supplier_payments.md). Because Smart Receive sets `approved_by` automatically on match, the "Record Payment" button appears immediately for matched sessions that have a linked `supplier_id`.

### Step 12: Paid / Read-Only State

When `remaining ≤ 0`:
- Button area shows green "Paid" badge instead of "Record Payment" button.
- Payment panel (if open) shows "Invoice fully paid." and hides the form and Save button.
- This prevents double-payment even if `sessionPayments` was not yet loaded at the time the panel was opened.

### Step 13: Duplicate Invoice Protection

Two layers:
1. At Smart Receive session creation: checks for existing `draft` or `completed` sessions with the same `invoice_number` + `supplier_id`. Shows a blocking warning with "Cancel" or "Create Anyway."
2. At manual post: checks for existing `completed` sessions with the same `invoice_number` + `supplier_id`. Shows a `window.confirm` dialog.

---

## Database Tables

- `receiving_sessions`
- `receiving_items`
- `inventory_batches`
- `suppliers`
- `products`

---

## Business Rules

- `invoice_status = 'matched'` when `|invoice_total - calculated_total| ≤ 0.01`; `'variance'` otherwise.
- `approved_by` is set to `"auto"` automatically on matched Smart Receive sessions.
- Batches with expiry data are inserted at session creation (not at post time) for Smart Receive sessions.
- Post time prevents double-batch: if a batch already exists for a session item, a new one is not created.
- `supplier_id` may be null if the user selected "Continue Unlinked." Payment recording is then unavailable.

---

## UI Components

- File upload input (JPEG, PNG, PDF)
- AI extraction loading state / error display
- Supplier resolution picker (auto-matched badge, manual dropdown, "Continue Unlinked" option)
- Product matching table (yellow highlight for unresolved items)
- Per-line product selector and inline "Create new product" flow
- Batch number and expiration date fields per line
- "Create Receiving Session" button
- Duplicate invoice warning dialog

---

## Edge Cases

- If supplier is not found in the catalog, user can create a new one inline or continue unlinked (no `supplier_id` — payment recording blocked).
- If AI returns wrong supplier name, user can override via the "Select correct supplier" picker.
- If a line item has no product match, it is skipped when creating the session.
- If duplicate invoice is detected, user can cancel or proceed anyway.

---

## Known Issues

All bugs in this area have been resolved. See resolved bug table below.

---

## Resolved Bugs

| Bug | Root Cause | Fix Applied | Commit |
|---|---|---|---|
| Unit cost showing $0.00 after post | Cost input `key` prop included `unit_cost`, causing React to unmount on each keystroke — `onBlur` never fired | Stable key + pre-post `Promise.all` flush | `77fd84c` |
| Invoice total defaulting to $0.00 in invoice panel | `loadSessionHistoryItems` was called but return value was ignored; invoice panel used old (empty) items | Made `loadSessionHistoryItems` return items; invoice handler uses them to seed total | `b4dda9c` |
| "Invoice: pending" badge not clearing after save | `handleSaveInvoice` had no `loadSessionHistory()` call after save — relied on optimistic patch only | Added `await loadSessionHistory()` after successful save | `175dcea` |
| Record Payment not appearing after `supplier_id` was removed from guard | `supplier_payments.supplier_id` is NOT NULL FK — removing the guard caused a DB error on payment insert | Restored `supplier_id` guard; added inline "Link a supplier" nudge | `5387171` |
| Payment form open and enabled when remaining = $0 | `paymentPanelSessionId` set on click; `loadSessionPayments` then revealed remaining = 0; panel had no remaining guard | Added `remaining ≤ 0` guard inside panel — hides form, shows "Invoice fully paid." | `862d299` |

---

## Test Checklist

See TC-03 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] Invoice upload triggers AI extraction
- [ ] Supplier auto-matched when name found in catalog
- [ ] Unmatched products shown in yellow; user can resolve manually
- [ ] Batch/expiry data extracted and editable before session creation
- [ ] "Create Receiving Session" creates session with all invoice fields pre-populated
- [ ] `invoice_status` set correctly (matched or variance)
- [ ] Duplicate invoice warning shown when same invoice_number + supplier exists
- [ ] Post Receiving updates inventory and creates batches
- [ ] "Record Payment" button available immediately for matched sessions with linked supplier

---

## Future Enhancements

None documented in the current issue backlog.

---

*Source: PLATFORM_REFERENCE.md §6 — Smart Receive Deep Documentation*
