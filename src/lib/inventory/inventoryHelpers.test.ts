import { test } from "node:test";
import assert from "node:assert/strict";
import { getInventoryDashboardSummary } from "./inventoryHelpers.ts";
import type { ProductStock } from "../product/types.ts";

function makeProduct(overrides: Partial<ProductStock> = {}): ProductStock {
  return {
    inventory_id: "inv1",
    business_id: "biz1",
    product_id: "p1",
    product_name: "Test Product",
    sku: null,
    barcode: null,
    selling_price: 10,
    quantity_on_hand: 0,
    reorder_level: 10,
    status: "active",
    average_cost: 2,
    cost_price: null,
    estimated_overhead_pct: 0,
    target_margin_percent: null,
    minimum_margin_percent: null,
    supplier_id: null,
    category_id: null,
    ...overrides,
  };
}

test("getInventoryDashboardSummary computes reorder cost using cost_price when present", () => {
  const products = [makeProduct({ quantity_on_hand: 2, reorder_level: 10, cost_price: 3, average_cost: 5 })];
  const summary = getInventoryDashboardSummary(products);
  // qty = max(1, 10 - 2) = 8; cost = cost_price (3) -> 8 * 3 = 24
  assert.equal(summary.buyTodayCost, 24);
});

test("getInventoryDashboardSummary falls back to average_cost when cost_price is null", () => {
  const products = [makeProduct({ quantity_on_hand: 5, reorder_level: 10, cost_price: null, average_cost: 4 })];
  const summary = getInventoryDashboardSummary(products);
  // qty = max(1, 10 - 5) = 5; cost = average_cost (4) -> 5 * 4 = 20
  assert.equal(summary.buyTodayCost, 20);
});

test("getInventoryDashboardSummary clamps reorder quantity to at least 1", () => {
  const products = [makeProduct({ quantity_on_hand: 10, reorder_level: 5, cost_price: 2 })];
  const summary = getInventoryDashboardSummary(products);
  // 5 - 10 = -5, clamped to 1 -> 1 * 2 = 2
  assert.equal(summary.buyTodayCost, 2);
});

test("getInventoryDashboardSummary counts zero-quantity products as out of stock", () => {
  const products = [
    makeProduct({ product_id: "p1", quantity_on_hand: 0 }),
    makeProduct({ product_id: "p2", quantity_on_hand: 3 }),
    makeProduct({ product_id: "p3", quantity_on_hand: 0 }),
  ];
  const summary = getInventoryDashboardSummary(products);
  assert.equal(summary.outOfStockCount, 2);
});

test("getInventoryDashboardSummary returns zeroes for empty input", () => {
  const summary = getInventoryDashboardSummary([]);
  assert.deepEqual(summary, { buyTodayCost: 0, outOfStockCount: 0 });
});
