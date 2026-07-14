import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSearchProductsInput,
  sanitizeForPostgrestFilter,
  searchProducts,
  SEARCH_PRODUCTS_DEFAULT_LIMIT,
  SEARCH_PRODUCTS_MAX_LIMIT,
  type ProductSearchExecutor,
  type ProductSearchRow,
} from "./searchProducts.ts";

// ---- validateSearchProductsInput ----

test("rejects non-object input", () => {
  const result = validateSearchProductsInput("cola");
  assert.equal(result.ok, false);
});

test("rejects missing query", () => {
  const result = validateSearchProductsInput({});
  assert.equal(result.ok, false);
});

test("rejects empty/whitespace-only query", () => {
  const result = validateSearchProductsInput({ query: "   " });
  assert.equal(result.ok, false);
});

test("rejects overly long query", () => {
  const result = validateSearchProductsInput({ query: "a".repeat(201) });
  assert.equal(result.ok, false);
});

test("rejects non-integer limit", () => {
  const result = validateSearchProductsInput({ query: "cola", limit: 3.5 });
  assert.equal(result.ok, false);
});

test("rejects zero/negative limit", () => {
  const result = validateSearchProductsInput({ query: "cola", limit: 0 });
  assert.equal(result.ok, false);
});

test("applies the default limit when none is given", () => {
  const result = validateSearchProductsInput({ query: "cola" });
  assert.ok(result.ok);
  if (result.ok) assert.equal(result.value.limit, SEARCH_PRODUCTS_DEFAULT_LIMIT);
});

test("caps a requested limit at the maximum, never errors past it", () => {
  const result = validateSearchProductsInput({ query: "cola", limit: 999 });
  assert.ok(result.ok);
  if (result.ok) assert.equal(result.value.limit, SEARCH_PRODUCTS_MAX_LIMIT);
});

test("trims the query", () => {
  const result = validateSearchProductsInput({ query: "  cola  " });
  assert.ok(result.ok);
  if (result.ok) assert.equal(result.value.query, "cola");
});

// ---- sanitizeForPostgrestFilter ----

test("strips PostgREST filter-structural characters from search text", () => {
  assert.equal(sanitizeForPostgrestFilter("cola, 20oz (large)"), "cola 20oz large");
});

test("leaves ordinary search text untouched", () => {
  assert.equal(sanitizeForPostgrestFilter("Coca-Cola 20oz"), "Coca-Cola 20oz");
});

// ---- searchProducts (pure orchestration, mock executor) ----

const SAMPLE_ROW: ProductSearchRow = {
  product_id: "p1",
  product_name: "Coca-Cola 20oz",
  sku: "COKE20",
  barcode: "012000001283",
  selling_price: 2.5,
  quantity_on_hand: 40,
  status: "active",
};

test("returns a validation error without ever calling the executor", async () => {
  let called = false;
  const executor: ProductSearchExecutor = async () => {
    called = true;
    return [SAMPLE_ROW];
  };

  const result = await searchProducts({}, { businessId: "biz-1" }, executor);

  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("passes the caller's businessId through to the executor - tenant isolation", async () => {
  let receivedBusinessId: string | null = null;
  const executor: ProductSearchExecutor = async (params) => {
    receivedBusinessId = params.businessId;
    return [SAMPLE_ROW];
  };

  await searchProducts({ query: "cola" }, { businessId: "biz-42" }, executor);

  assert.equal(receivedBusinessId, "biz-42");
});

test("returns the executor's rows shaped as the tool output", async () => {
  const executor: ProductSearchExecutor = async () => [SAMPLE_ROW];

  const result = await searchProducts({ query: "cola" }, { businessId: "biz-1" }, executor);

  assert.deepEqual(result, { ok: true, value: { products: [SAMPLE_ROW] } });
});

test("returns an empty product list rather than an error when nothing matches", async () => {
  const executor: ProductSearchExecutor = async () => [];

  const result = await searchProducts({ query: "no-such-product" }, { businessId: "biz-1" }, executor);

  assert.deepEqual(result, { ok: true, value: { products: [] } });
});

test("no cost/margin fields ever appear in the output shape", async () => {
  const executor: ProductSearchExecutor = async () => [SAMPLE_ROW];

  const result = await searchProducts({ query: "cola" }, { businessId: "biz-1" }, executor);

  assert.ok(result.ok);
  if (result.ok) {
    for (const product of result.value.products) {
      assert.equal("cost_price" in product, false);
      assert.equal("average_cost" in product, false);
      assert.equal("target_margin_percent" in product, false);
    }
  }
});
