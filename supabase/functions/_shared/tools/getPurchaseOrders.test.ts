import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateGetPurchaseOrdersInput,
  computePurchaseOrders,
  getPurchaseOrders,
  type PurchaseOrdersRawData,
} from "./getPurchaseOrders.ts";

// ---- validateGetPurchaseOrdersInput ----

test("accepts undefined/null input with no filters", () => {
  const result = validateGetPurchaseOrdersInput(undefined);
  assert.deepEqual(result, { ok: true, value: {} });
});

test("rejects non-object input", () => {
  const result = validateGetPurchaseOrdersInput("PO-1");
  assert.equal(result.ok, false);
});

test("rejects empty poNumber", () => {
  const result = validateGetPurchaseOrdersInput({ poNumber: "  " });
  assert.equal(result.ok, false);
});

test("rejects invalid status", () => {
  const result = validateGetPurchaseOrdersInput({ status: "shipped" });
  assert.equal(result.ok, false);
});

test("accepts every valid status value including 'open'", () => {
  for (const status of ["draft", "ordered", "partially_received", "received", "cancelled", "open", "all"]) {
    const result = validateGetPurchaseOrdersInput({ status });
    assert.equal(result.ok, true, `${status} should be valid`);
  }
});

test("rejects negative minSubtotal/maxSubtotal", () => {
  assert.equal(validateGetPurchaseOrdersInput({ minSubtotal: -1 }).ok, false);
  assert.equal(validateGetPurchaseOrdersInput({ maxSubtotal: -1 }).ok, false);
});

test("rejects minSubtotal greater than maxSubtotal", () => {
  const result = validateGetPurchaseOrdersInput({ minSubtotal: 500, maxSubtotal: 100 });
  assert.equal(result.ok, false);
});

test("accepts and trims poNumber/supplierName/productName", () => {
  const result = validateGetPurchaseOrdersInput({ poNumber: "  PO-1  ", supplierName: " CBA ", productName: " Milk " });
  assert.deepEqual(result, { ok: true, value: { poNumber: "PO-1", supplierName: "CBA", productName: "Milk" } });
});

// ---- computePurchaseOrders ----

function rawData(overrides: Partial<PurchaseOrdersRawData>): PurchaseOrdersRawData {
  return { purchaseOrders: [], suppliers: [], itemProducts: [], ...overrides };
}

test("attaches supplier_name from the suppliers lookup", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [{ id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: 100, notes: null, created_at: "2026-07-01T00:00:00Z" }],
  });
  const result = computePurchaseOrders(raw, {});
  assert.equal(result.purchase_orders[0].supplier_name, "CBA Supplies");
});

test("computes item_count from the item/product join", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [{ id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: 100, notes: null, created_at: "2026-07-01T00:00:00Z" }],
    itemProducts: [
      { purchase_order_id: "po1", product_name: "Milk 1 Liter" },
      { purchase_order_id: "po1", product_name: "Bread" },
    ],
  });
  const result = computePurchaseOrders(raw, {});
  assert.equal(result.purchase_orders[0].item_count, 2);
});

test("productName filter excludes purchase orders with no matching line item", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [
      { id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: 100, notes: null, created_at: "2026-07-01T00:00:00Z" },
      { id: "po2", po_number: "PO-2", status: "draft", supplier_id: "s1", subtotal: 50, notes: null, created_at: "2026-07-01T00:00:00Z" },
    ],
    itemProducts: [
      { purchase_order_id: "po1", product_name: "Milk 1 Liter" },
      { purchase_order_id: "po2", product_name: "Bread" },
    ],
  });
  const result = computePurchaseOrders(raw, { productName: "milk" });
  assert.equal(result.purchase_orders.length, 1);
  assert.equal(result.purchase_orders[0].po_number, "PO-1");
  assert.deepEqual(result.purchase_orders[0].matched_products, ["Milk 1 Liter"]);
});

test("productName match is case-insensitive and partial", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [{ id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: 100, notes: null, created_at: "2026-07-01T00:00:00Z" }],
    itemProducts: [{ purchase_order_id: "po1", product_name: "Milk 1 Liter" }],
  });
  const result = computePurchaseOrders(raw, { productName: "MILK" });
  assert.equal(result.purchase_orders.length, 1);
});

test("totals.subtotal_sum is computed exactly over the returned set only", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [
      { id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: 100.5, notes: null, created_at: "2026-07-01T00:00:00Z" },
      { id: "po2", po_number: "PO-2", status: "draft", supplier_id: "s1", subtotal: 49.5, notes: null, created_at: "2026-07-01T00:00:00Z" },
    ],
  });
  const result = computePurchaseOrders(raw, {});
  assert.equal(result.totals.subtotal_sum, 150);
  assert.equal(result.totals.count, 2);
});

test("null subtotal is treated as 0, never crashes the sum", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    purchaseOrders: [{ id: "po1", po_number: "PO-1", status: "draft", supplier_id: "s1", subtotal: null, notes: null, created_at: "2026-07-01T00:00:00Z" }],
  });
  const result = computePurchaseOrders(raw, {});
  assert.equal(result.purchase_orders[0].subtotal, 0);
  assert.equal(result.totals.subtotal_sum, 0);
});

test("unresolvable supplier_id falls back to a placeholder rather than crashing", () => {
  const raw = rawData({
    suppliers: [],
    purchaseOrders: [{ id: "po1", po_number: "PO-1", status: "draft", supplier_id: "missing", subtotal: 10, notes: null, created_at: "2026-07-01T00:00:00Z" }],
  });
  const result = computePurchaseOrders(raw, {});
  assert.equal(result.purchase_orders[0].supplier_name, "Unknown supplier");
});

// ---- getPurchaseOrders orchestration ----

test("getPurchaseOrders returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getPurchaseOrders({ status: "shipped" }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getPurchaseOrders passes businessId and the validated filter through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  let receivedFilter: unknown = null;
  await getPurchaseOrders({ status: "open" }, { businessId: "biz-42" }, async (businessId, filter) => {
    receivedBusinessId = businessId;
    receivedFilter = filter;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
  assert.deepEqual(receivedFilter, { status: "open" });
});
