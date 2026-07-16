import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateLowStockInput,
  computeLowStockProducts,
  getLowStockProducts,
  type LowStockRawData,
} from "./getLowStockProducts.ts";

// ---- validateLowStockInput ----

test("accepts undefined/null input with no filters", () => {
  assert.deepEqual(validateLowStockInput(undefined), { ok: true, value: {} });
});

test("rejects non-object input", () => {
  assert.equal(validateLowStockInput("CBA").ok, false);
});

test("rejects empty supplierName", () => {
  assert.equal(validateLowStockInput({ supplierName: "  " }).ok, false);
});

test("accepts and trims a valid supplierName", () => {
  assert.deepEqual(validateLowStockInput({ supplierName: " CBA Supplies " }), { ok: true, value: { supplierName: "CBA Supplies" } });
});

// ---- computeLowStockProducts ----

function rawData(overrides: Partial<LowStockRawData>): LowStockRawData {
  return { products: [], suppliers: [], sales30d: [], saleItems: [], ...overrides };
}

test("includes a product below its reorder_level", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 3 }],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.low_stock_products.length, 1);
  assert.equal(result.low_stock_products[0].product_id, "p1");
});

test("excludes a product at or above its reorder_level", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 10 }],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.low_stock_products.length, 0);
});

test("excludes a product with no reorder_level set (matches getLowStockProducts()'s rule)", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: null, supplier_id: null, quantity_on_hand: 0 }],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.low_stock_products.length, 0);
});

test("sorts most-short-of-target first (matches getLowStockProducts()'s exact sort)", () => {
  const raw = rawData({
    products: [
      { id: "p1", name: "Slightly low", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 9 },
      { id: "p2", name: "Very low", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 1 },
    ],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.low_stock_products[0].product_id, "p2");
  assert.equal(result.low_stock_products[1].product_id, "p1");
});

test("supplierName filters to products from a matching supplier", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }, { id: "s2", name: "Northwind" }],
    products: [
      { id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: "s1", quantity_on_hand: 1 },
      { id: "p2", name: "Bread", sku: null, barcode: null, reorder_level: 10, supplier_id: "s2", quantity_on_hand: 1 },
    ],
  });
  const result = computeLowStockProducts(raw, { supplierName: "cba" });
  assert.equal(result.low_stock_products.length, 1);
  assert.equal(result.low_stock_products[0].product_id, "p1");
});

test("suggested_reorder_qty matches aiReorderRecs' exact velocity formula (7-day preferred)", () => {
  const now = Date.now();
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 2 }],
    sales30d: [{ id: "s1", created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() }],
    saleItems: [{ sale_id: "s1", product_id: "p1", quantity: 14 }], // 14 units in 7d window -> velocity 2/day
  });
  const result = computeLowStockProducts(raw, {});
  // velocity = 14/7 = 2/day; targetStock = ceil(2*30) + 10 = 70; qty = max(1, ceil(70-2)) = 68
  assert.equal(result.low_stock_products[0].suggested_reorder_qty, 68);
  assert.equal(result.low_stock_products[0].has_sales_data, true);
});

test("suggested_reorder_qty falls back to 30-day average velocity when nothing sold in the last 7 days", () => {
  const now = Date.now();
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 5 }],
    sales30d: [{ id: "s1", created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString() }],
    saleItems: [{ sale_id: "s1", product_id: "p1", quantity: 30 }], // outside 7d, inside 30d
  });
  const result = computeLowStockProducts(raw, {});
  // velocity = 30/30 = 1/day; targetStock = ceil(1*30) + 10 = 40; qty = max(1, ceil(40-5)) = 35
  assert.equal(result.low_stock_products[0].suggested_reorder_qty, 35);
});

test("has_sales_data is false and suggested_reorder_qty is 0 when nothing sold in 30 days", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 1 }],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.low_stock_products[0].has_sales_data, false);
  assert.equal(result.low_stock_products[0].suggested_reorder_qty, 0);
});

test("totals.count matches the returned list length", () => {
  const raw = rawData({
    products: [
      { id: "p1", name: "A", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 1 },
      { id: "p2", name: "B", sku: null, barcode: null, reorder_level: 10, supplier_id: null, quantity_on_hand: 2 },
    ],
  });
  const result = computeLowStockProducts(raw, {});
  assert.equal(result.totals.count, 2);
});

// ---- getLowStockProducts orchestration ----

test("getLowStockProducts returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getLowStockProducts({ supplierName: "" }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getLowStockProducts passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getLowStockProducts({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
