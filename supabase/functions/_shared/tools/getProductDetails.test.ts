import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeProductDetails,
  getProductDetails,
  type ProductDetailsRawData,
  type RawProductDetailRow,
} from "./getProductDetails.ts";

function rawData(overrides: Partial<ProductDetailsRawData>): ProductDetailsRawData {
  return { products: [], suppliers: [], categories: [], ...overrides };
}

function product(overrides: Partial<RawProductDetailRow>): RawProductDetailRow {
  return {
    id: "p1",
    name: "Milk",
    sku: null,
    barcode: null,
    status: "active",
    selling_price: 0,
    quantity_on_hand: 0,
    supplier_id: null,
    category_id: null,
    cost_price: null,
    average_cost: 0,
    estimated_overhead_pct: 0,
    target_margin_percent: null,
    minimum_margin_percent: null,
    ...overrides,
  };
}

// ---- computeProductDetails: pricing math, mirrors CatalogManagementPanel.tsx exactly ----

test("break_even_price applies overhead on top of average_cost", () => {
  const raw = rawData({ products: [product({ average_cost: 10, estimated_overhead_pct: 20 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].break_even_price, 12);
});

test("break_even_price equals average_cost when overhead is 0", () => {
  const raw = rawData({ products: [product({ average_cost: 10, estimated_overhead_pct: 0 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].break_even_price, 10);
});

test("minimum_safe_price is null when minimum_margin_percent is unset (matches the 'mm > 0 ? ... : null' rule)", () => {
  const raw = rawData({ products: [product({ average_cost: 10, minimum_margin_percent: null })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].minimum_safe_price, null);
});

test("minimum_safe_price is null when minimum_margin_percent is exactly 0", () => {
  const raw = rawData({ products: [product({ average_cost: 10, minimum_margin_percent: 0 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].minimum_safe_price, null);
});

test("minimum_safe_price is computed from break-even when minimum_margin_percent is set", () => {
  const raw = rawData({ products: [product({ average_cost: 10, estimated_overhead_pct: 0, minimum_margin_percent: 25 })] });
  const result = computeProductDetails(raw);
  // breakEven=10, minSafe = 10 * 1.25 = 12.5
  assert.equal(result.products[0].minimum_safe_price, 12.5);
});

test("target_price is null when target_margin_percent is unset", () => {
  const raw = rawData({ products: [product({ average_cost: 10, target_margin_percent: null })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].target_price, null);
});

test("target_price is computed from break-even when target_margin_percent is set", () => {
  const raw = rawData({ products: [product({ average_cost: 10, estimated_overhead_pct: 0, target_margin_percent: 50 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].target_price, 15);
});

test("current_margin_percent reflects the listed selling price against break-even", () => {
  const raw = rawData({ products: [product({ average_cost: 10, estimated_overhead_pct: 0, selling_price: 20 })] });
  const result = computeProductDetails(raw);
  // breakEven=10, margin = (20-10)/20*100 = 50%
  assert.equal(result.products[0].current_margin_percent, 50);
});

test("current_margin_percent is null when selling_price is 0, never divides by zero", () => {
  const raw = rawData({ products: [product({ average_cost: 10, selling_price: 0 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].current_margin_percent, null);
});

test("attaches supplier_name and category_name from lookups", () => {
  const raw = rawData({
    products: [product({ supplier_id: "s1", category_id: "c1" })],
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    categories: [{ id: "c1", name: "Dairy" }],
  });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].supplier_name, "CBA Supplies");
  assert.equal(result.products[0].category_name, "Dairy");
});

test("supplier_name and category_name are null when the product has none set", () => {
  const raw = rawData({ products: [product({ supplier_id: null, category_id: null })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].supplier_name, null);
  assert.equal(result.products[0].category_name, null);
});

test("cost_price and average_cost pass through unmodified - no cost/margin data is ever withheld here (unlike search_products)", () => {
  const raw = rawData({ products: [product({ cost_price: 7.5, average_cost: 8 })] });
  const result = computeProductDetails(raw);
  assert.equal(result.products[0].cost_price, 7.5);
  assert.equal(result.products[0].average_cost, 8);
});

// ---- getProductDetails orchestration (reuses validateSearchProductsInput) ----

test("getProductDetails returns a validation error without ever calling the fetcher (query required)", async () => {
  let called = false;
  const result = await getProductDetails({}, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getProductDetails rejects an empty query the same way search_products does", async () => {
  const result = await getProductDetails({ query: "   " }, { businessId: "b1" }, async () => rawData({}));
  assert.equal(result.ok, false);
});

test("getProductDetails passes businessId and the validated query through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  let receivedQuery = "";
  await getProductDetails({ query: "milk" }, { businessId: "biz-42" }, async (businessId, input) => {
    receivedBusinessId = businessId;
    receivedQuery = input.query;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
  assert.equal(receivedQuery, "milk");
});
