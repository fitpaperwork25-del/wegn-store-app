import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateProductVelocityInput,
  computeProductSalesVelocity,
  getProductSalesVelocity,
  type ProductVelocityRawData,
} from "./getProductSalesVelocity.ts";

// ---- validateProductVelocityInput ----

test("defaults to limit 15 when input is undefined", () => {
  assert.deepEqual(validateProductVelocityInput(undefined), { ok: true, value: { limit: 15 } });
});

test("rejects non-object input", () => {
  assert.equal(validateProductVelocityInput("15").ok, false);
});

test("rejects non-integer limit", () => {
  assert.equal(validateProductVelocityInput({ limit: 2.5 }).ok, false);
});

test("rejects zero/negative limit", () => {
  assert.equal(validateProductVelocityInput({ limit: 0 }).ok, false);
});

test("caps a requested limit at the maximum", () => {
  assert.deepEqual(validateProductVelocityInput({ limit: 9999 }), { ok: true, value: { limit: 50 } });
});

// ---- computeProductSalesVelocity ----

function rawData(overrides: Partial<ProductVelocityRawData>): ProductVelocityRawData {
  return { products: [], sales30d: [], saleItems: [], ...overrides };
}

const now = Date.now();
const within3Days = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString();
const within20Days = new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString();

test("a product with zero quantity sold in the last 30 days is dormant", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Stale Item", status: "active" }],
  });
  const result = computeProductSalesVelocity(raw, { limit: 15 });
  assert.deepEqual(result.dormant_products, [{ product_id: "p1", product_name: "Stale Item" }]);
});

test("a product sold only 20 days ago (within 30d, outside 7d) is not dormant and not in top sellers this week", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Slow Mover", status: "active" }],
    sales30d: [{ id: "s1", created_at: within20Days }],
    saleItems: [{ sale_id: "s1", product_id: "p1", quantity: 5 }],
  });
  const result = computeProductSalesVelocity(raw, { limit: 15 });
  assert.deepEqual(result.dormant_products, []);
  assert.deepEqual(result.top_sellers_this_week, []);
});

test("a product sold within the last 7 days appears in top sellers, ranked by quantity", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk", status: "active" }, { id: "p2", name: "Bread", status: "active" }],
    sales30d: [{ id: "s1", created_at: within3Days }],
    saleItems: [
      { sale_id: "s1", product_id: "p1", quantity: 3 },
      { sale_id: "s1", product_id: "p2", quantity: 10 },
    ],
  });
  const result = computeProductSalesVelocity(raw, { limit: 15 });
  assert.equal(result.top_sellers_this_week[0].product_id, "p2");
  assert.equal(result.top_sellers_this_week[0].qty_sold_last_7_days, 10);
  assert.equal(result.dormant_products.length, 0);
});

test("inactive products are excluded from dormant_products even with zero sales", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Discontinued", status: "inactive" }],
  });
  const result = computeProductSalesVelocity(raw, { limit: 15 });
  assert.deepEqual(result.dormant_products, []);
});

test("top_sellers_this_week respects the limit", () => {
  const products = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: `Product ${i}`, status: "active" }));
  const saleItems = products.map((p, i) => ({ sale_id: "s1", product_id: p.id, quantity: i + 1 }));
  const raw = rawData({ products, sales30d: [{ id: "s1", created_at: within3Days }], saleItems });
  const result = computeProductSalesVelocity(raw, { limit: 2 });
  assert.equal(result.top_sellers_this_week.length, 2);
  assert.equal(result.top_sellers_this_week[0].product_id, "p4");
});

// ---- getProductSalesVelocity orchestration ----

test("getProductSalesVelocity returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getProductSalesVelocity({ limit: -1 }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getProductSalesVelocity passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getProductSalesVelocity({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
