# QA and Regression Test Suite

This is a manual test plan. Run after any significant change before shipping. There is no automated test suite.

**Related:** [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) · [modules/pos.md](modules/pos.md) · [modules/smart_receive.md](modules/smart_receive.md) · [modules/supplier_payments.md](modules/supplier_payments.md) · [INDEX.md](INDEX.md)

---

## TC-01: End-to-End Sale

**Setup:** At least one active product with stock > 0 and a known barcode.

1. Log in as owner.
2. Go to POS tab.
3. Scan product barcode → verify it appears in cart.
4. Set qty to 2 → verify line total = 2 × unit price.
5. Apply 10% discount → verify subtotal − 10%.
6. Select cash payment.
7. Click Complete Sale.
8. **Expected:** Receipt modal appears with correct totals. Inventory decremented by 2. Transaction recorded.
9. Go to Inventory → verify `quantity_on_hand` decreased by 2.
10. Go to Reports → verify today's revenue includes this sale.

**Pass criteria:** Receipt shown, qty updated, revenue shown.

---

## TC-02: Return / Refund

**Setup:** A completed sale (from TC-01 or existing).

1. Go to Reports → Sales History.
2. Find the sale. Click Return.
3. Enter return qty = 1 for the product.
4. Select reason, click Submit Return.
5. **Expected:** Return recorded. Inventory incremented by 1. Refund payment with `payment_type = 'refund'` recorded.
6. Verify quantity in Inventory tab.
7. Try to return more than available → should be blocked.

**Pass criteria:** Qty restored, refund payment recorded, excess return blocked.

---

## TC-03: Smart Receive (Full Path)

**Setup:** A supplier invoice image (JPEG or PDF). At least one product on the invoice matches a product in the catalog.

1. Go to Inventory tab.
2. Click Smart Receive.
3. Upload the invoice file.
4. Wait for AI extraction. Verify supplier name, invoice number, items extracted.
5. Match any unmatched items. If creating a new product, fill name and price.
6. Click Create Receiving Session.
7. **Expected:** Navigated to Inventory tab with an active draft session. Items and costs pre-populated.
8. Adjust a unit cost. Click out of field (onBlur) → cost saved.
9. Click Post Receiving.
10. **Expected:** Session completed. Inventory updated. Session appears in Session History.
11. In Session History, find the session. Verify "Invoice: matched" or "Invoice: variance" badge.
12. If matched and supplier linked: Record Payment button should appear. Click it, enter amount, save.
13. **Expected:** "Paid" badge appears. Panel shows "Invoice fully paid."

**Pass criteria:** AI extracts correctly, session created, inventory updated, payment recorded.

---

## TC-04: Manual Receiving

1. Go to Inventory tab.
2. Click Start New Session. Select a supplier. Click Start.
3. Scan a product barcode → added with qty 1.
4. Edit unit cost → cost saves.
5. Increment qty to 3.
6. Add batch/expiry fields.
7. Click Post Receiving.
8. **Expected:** Inventory +3. Transaction recorded. Batch record created. Session in history.

**Pass criteria:** Qty updated, batch created, session in history.

---

## TC-05: Supplier Invoice Save

**Setup:** A completed receiving session without invoice fields set.

1. Find session in Receiving Session History.
2. Click Invoice.
3. Verify invoice total is pre-filled from received items sum (if not already set).
4. Enter invoice number, date. Adjust total to create a variance.
5. Save Invoice.
6. **Expected:** Badge updates to "variance". "Invoice: pending" badge is gone.
7. Re-open invoice, correct total to match. Save again.
8. **Expected:** Badge updates to "matched".

**Pass criteria:** Badge reflects correct status after save.

---

## TC-06: Supplier Payment

**Setup:** A receiving session with `status = completed`, `approved_by` set, `invoice_total > 0`, and `supplier_id` linked.

1. Find session in history. Verify "Record Payment" button appears.
2. Click Record Payment. Verify panel opens with remaining = invoice_total.
3. Enter partial payment (e.g., 50% of total). Save.
4. **Expected:** Panel shows updated Paid/Remaining. "Record Payment" button still shows (still a balance).
5. Click Record Payment again. Enter remaining balance. Save.
6. **Expected:** "Paid" badge appears. Panel shows "Invoice fully paid." when reopened.
7. Reload page. Open payment panel again.
8. **Expected:** Panel loads from DB, shows "Invoice fully paid." — not the form.

**Pass criteria:** Partial payments work, full payment shows paid state, reload preserves state.

---

## TC-07: Cash Drawer

1. Open Drawer with $100 float.
2. Complete a $25 cash sale (TC-01 path).
3. Record a $10 paid-out.
4. Close Drawer → enter $115 as physical count.
5. **Expected:** Expected cash = $100 + $25 - $10 = $115. Over/short = $0.00.

**Pass criteria:** Expected cash calculation is correct.

---

## TC-08: Staff Role Permissions

1. Add a Cashier employee with a PIN (e.g., 1234).
2. Log out / lock screen appears.
3. Enter PIN 1234.
4. **Expected:** Logged in as cashier. Only Dashboard, POS, Customers tabs visible.
5. Navigate to POS. Complete a sale.
6. Attempt to access Inventory via URL — should redirect or be hidden.
7. Log out. Enter owner bypass.
8. **Expected:** All tabs visible.

**Pass criteria:** Tab restriction enforced. Cashier cannot access restricted tabs.

---

## TC-09: Inventory Transaction History

1. Go to Inventory tab.
2. Filter transactions by product and date range.
3. Verify a "receiving" transaction appears after TC-04.
4. Verify a "return" transaction appears after TC-02.
5. Verify types shown correctly.

**Pass criteria:** Transactions reflect all inventory-changing events with correct types.

---

## TC-10: Receiving Session History — Load More and Collapse

**Setup:** 21+ completed receiving sessions.

1. Go to Inventory tab. Expand Receiving Session History (click header).
2. **Expected:** Up to 20 sessions shown. "Load More" button appears.
3. Click Load More.
4. **Expected:** Next 20 sessions appended. Load More disappears when no more sessions.
5. Click the header again to collapse.
6. **Expected:** Session list and Load More hidden.
7. Click to expand again.
8. **Expected:** List reappears; count in header is correct.

**Pass criteria:** Load More appends correctly. Collapse/expand toggles correctly. Count in header is accurate.

---

*Source: PLATFORM_REFERENCE.md §8 — QA and Regression Test Suite*
