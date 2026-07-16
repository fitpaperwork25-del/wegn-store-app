import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateExpirationBatchCapture,
  buildInventoryBatchRow,
  buildTrackingRecord,
  type TrackingContext,
} from "./trackingCapture.ts";

const ctx: TrackingContext = { businessId: "biz1", productId: "prod1", supplierId: "sup1", supplierName: "CBA Supplies" };

// ---- validateExpirationBatchCapture ----

test("rejects missing batchNumber", () => {
  const result = validateExpirationBatchCapture({ batchNumber: "", expirationDate: "2026-12-01" });
  assert.equal(result.ok, false);
});

test("rejects whitespace-only batchNumber", () => {
  const result = validateExpirationBatchCapture({ batchNumber: "   ", expirationDate: "2026-12-01" });
  assert.equal(result.ok, false);
});

test("rejects missing expirationDate", () => {
  const result = validateExpirationBatchCapture({ batchNumber: "LOT-1", expirationDate: "" });
  assert.equal(result.ok, false);
});

test("accepts when both required fields are present", () => {
  const result = validateExpirationBatchCapture({ batchNumber: "LOT-1", expirationDate: "2026-12-01" });
  assert.equal(result.ok, true);
});

// ---- buildInventoryBatchRow ----

test("shapes a purchase_order-sourced row with PO linkage set and session linkage null", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 50, unitCost: 3 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.equal(row.purchase_order_id, "po1");
  assert.equal(row.purchase_order_item_id, "poi1");
  assert.equal(row.receiving_session_id, null);
  assert.equal(row.receiving_session_item_id, null);
});

test("shapes a receiving_session-sourced row with session linkage set and PO linkage null", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 50, unitCost: 3 },
    { kind: "receiving_session", receivingSessionId: "rs1", receivingSessionItemId: "rsi1" },
    ctx
  );
  assert.equal(row.receiving_session_id, "rs1");
  assert.equal(row.receiving_session_item_id, "rsi1");
  assert.equal(row.purchase_order_id, null);
  assert.equal(row.purchase_order_item_id, null);
});

test("quantity_remaining starts equal to quantity_received", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 50, unitCost: 3 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.equal(row.quantity_received, 50);
  assert.equal(row.quantity_remaining, 50);
});

test("status is always 'active' on creation", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 1, unitCost: 1 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.equal(row.status, "active");
});

test("optional lotNumber and manufacturedDate default to null when omitted", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 1, unitCost: 1 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.equal(row.lot_number, null);
  assert.equal(row.manufactured_date, null);
});

test("supplier_id and supplier_name pass through from context", () => {
  const row = buildInventoryBatchRow(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 1, unitCost: 1 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.equal(row.supplier_id, "sup1");
  assert.equal(row.supplier_name, "CBA Supplies");
});

// ---- buildTrackingRecord (the dispatch point) ----

test("dispatches 'none' to null - no row is created for an untracked product", () => {
  const result = buildTrackingRecord({ mode: "none" }, { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" }, ctx);
  assert.equal(result, null);
});

test("dispatches 'expiration_batch' to a built row", () => {
  const result = buildTrackingRecord(
    { mode: "expiration_batch", batchNumber: "LOT-1", expirationDate: "2026-12-01", quantityReceived: 10, unitCost: 2 },
    { kind: "purchase_order", purchaseOrderId: "po1", purchaseOrderItemId: "poi1" },
    ctx
  );
  assert.notEqual(result, null);
  assert.equal(result!.batch_number, "LOT-1");
});
