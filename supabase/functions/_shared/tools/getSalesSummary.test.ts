import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSalesSummaryInput,
  computeSalesSummary,
  getSalesSummary,
  type SalesSummaryRawData,
} from "./getSalesSummary.ts";

// ---- validateSalesSummaryInput ----

test("accepts undefined/null input with no filters", () => {
  const result = validateSalesSummaryInput(undefined);
  assert.deepEqual(result, { ok: true, value: {} });
});

test("rejects non-object input", () => {
  assert.equal(validateSalesSummaryInput("today").ok, false);
});

test("rejects invalid dateRange", () => {
  assert.equal(validateSalesSummaryInput({ dateRange: "yesterday" }).ok, false);
});

test("accepts every valid dateRange value", () => {
  for (const dateRange of ["today", "7d", "30d", "all"]) {
    assert.equal(validateSalesSummaryInput({ dateRange }).ok, true, `${dateRange} should be valid`);
  }
});

test("rejects empty cashierName", () => {
  assert.equal(validateSalesSummaryInput({ cashierName: "  " }).ok, false);
});

test("rejects negative minTotal/maxTotal", () => {
  assert.equal(validateSalesSummaryInput({ minTotal: -1 }).ok, false);
  assert.equal(validateSalesSummaryInput({ maxTotal: -1 }).ok, false);
});

test("rejects minTotal greater than maxTotal", () => {
  assert.equal(validateSalesSummaryInput({ minTotal: 200, maxTotal: 100 }).ok, false);
});

// ---- computeSalesSummary ----

function rawData(overrides: Partial<SalesSummaryRawData>): SalesSummaryRawData {
  return { employees: [], sales: [], payments: [], saleItemProducts: [], ...overrides };
}

test("computes revenue, count, and avg_sale exactly", () => {
  const raw = rawData({
    sales: [
      { id: "s1", cashier_id: null, total: 100, created_at: "2026-07-15T10:00:00Z" },
      { id: "s2", cashier_id: null, total: 50.5, created_at: "2026-07-15T11:00:00Z" },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.totals.count, 2);
  assert.equal(result.totals.revenue, 150.5);
  assert.equal(result.totals.avg_sale, 75.25);
});

test("largest_sale is the max total in the set", () => {
  const raw = rawData({
    sales: [
      { id: "s1", cashier_id: null, total: 40, created_at: "2026-07-15T10:00:00Z" },
      { id: "s2", cashier_id: null, total: 220, created_at: "2026-07-15T11:00:00Z" },
      { id: "s3", cashier_id: null, total: 90, created_at: "2026-07-15T12:00:00Z" },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.totals.largest_sale, 220);
});

test("splits cash/card/other totals from payments, excluding nothing but summing exactly", () => {
  const raw = rawData({
    sales: [{ id: "s1", cashier_id: null, total: 100, created_at: "2026-07-15T10:00:00Z" }],
    payments: [
      { sale_id: "s1", payment_method: "cash", amount: 60 },
      { sale_id: "s1", payment_method: "card", amount: 40 },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.totals.cash_total, 60);
  assert.equal(result.totals.card_total, 40);
  assert.equal(result.totals.other_total, 0);
});

test("unrecognized payment methods fall into other_total", () => {
  const raw = rawData({
    sales: [{ id: "s1", cashier_id: null, total: 100, created_at: "2026-07-15T10:00:00Z" }],
    payments: [{ sale_id: "s1", payment_method: "gift_card", amount: 100 }],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.totals.other_total, 100);
});

test("by_cashier groups and sorts by revenue descending, unassigned sales grouped separately", () => {
  const raw = rawData({
    employees: [{ id: "e1", name: "Alice" }, { id: "e2", name: "Bob" }],
    sales: [
      { id: "s1", cashier_id: "e1", total: 50, created_at: "2026-07-15T10:00:00Z" },
      { id: "s2", cashier_id: "e2", total: 200, created_at: "2026-07-15T11:00:00Z" },
      { id: "s3", cashier_id: null, total: 10, created_at: "2026-07-15T12:00:00Z" },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.deepEqual(result.by_cashier.map((c) => c.cashier_name), ["Bob", "Alice", "Unassigned"]);
  assert.equal(result.by_cashier[0].revenue, 200);
});

test("top_products ranks by quantity sold descending", () => {
  const raw = rawData({
    sales: [{ id: "s1", cashier_id: null, total: 100, created_at: "2026-07-15T10:00:00Z" }],
    saleItemProducts: [
      { sale_id: "s1", product_id: "p1", product_name: "Milk", quantity: 3, line_total: 9 },
      { sale_id: "s1", product_id: "p2", product_name: "Bread", quantity: 8, line_total: 16 },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.top_products[0].product_id, "p2");
  assert.equal(result.top_products[0].qty_sold, 8);
});

test("sales list is capped at 50 but totals reflect the full set", () => {
  const sales = Array.from({ length: 60 }, (_, i) => ({
    id: `s${i}`,
    cashier_id: null,
    total: 10,
    created_at: new Date(2026, 6, 15, 0, i).toISOString(),
  }));
  const raw = rawData({ sales });
  const result = computeSalesSummary(raw);
  assert.equal(result.sales.length, 50);
  assert.equal(result.totals.count, 60);
  assert.equal(result.totals.revenue, 600);
});

test("sales list is sorted most-recent-first", () => {
  const raw = rawData({
    sales: [
      { id: "old", cashier_id: null, total: 10, created_at: "2026-07-14T10:00:00Z" },
      { id: "new", cashier_id: null, total: 10, created_at: "2026-07-15T10:00:00Z" },
    ],
  });
  const result = computeSalesSummary(raw);
  assert.equal(result.sales[0].sale_id, "new");
});

test("returns zeroed totals for an empty result set without dividing by zero", () => {
  const result = computeSalesSummary(rawData({}));
  assert.equal(result.totals.count, 0);
  assert.equal(result.totals.avg_sale, 0);
  assert.equal(result.totals.largest_sale, 0);
});

// ---- getSalesSummary orchestration ----

test("getSalesSummary returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getSalesSummary({ dateRange: "yesterday" }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getSalesSummary passes businessId and the validated filter through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getSalesSummary({ dateRange: "7d" }, { businessId: "biz-42" }, async (businessId, filter) => {
    receivedBusinessId = businessId;
    assert.deepEqual(filter, { dateRange: "7d" });
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
