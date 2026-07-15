import { test } from "node:test";
import assert from "node:assert/strict";
import { getSalesTodaySummary } from "./salesHelpers.ts";
import type { Sale, SaleItemRecord, EodPayment } from "./types.ts";
import type { ProductStock } from "../product/types.ts";

// getSalesTodaySummary compares created_at against `new Date()` internally,
// so fixtures must be built relative to the actual current time, not
// hardcoded dates, to stay correct regardless of when the suite runs.
function todayAt(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function yesterdayAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    cashier_id: null,
    customer_id: null,
    subtotal: 10,
    tax: 0,
    discount_amount: 0,
    total: 10,
    status: "completed",
    created_at: todayAt(10),
    ...overrides,
  };
}

function makeSaleItem(overrides: Partial<SaleItemRecord> = {}): SaleItemRecord {
  return {
    sale_id: "s1",
    product_id: "p1",
    quantity: 1,
    unit_price: 10,
    line_total: 10,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductStock> = {}): ProductStock {
  return {
    inventory_id: "inv1",
    business_id: "biz1",
    product_id: "p1",
    product_name: "Test Product",
    sku: null,
    barcode: null,
    selling_price: 10,
    quantity_on_hand: 100,
    reorder_level: 10,
    status: "active",
    average_cost: 4,
    cost_price: null,
    estimated_overhead_pct: 0,
    target_margin_percent: null,
    minimum_margin_percent: null,
    supplier_id: null,
    category_id: null,
    ...overrides,
  };
}

test("getSalesTodaySummary sums only today's completed sales for revenue/txnCount/avgSale", () => {
  const sales = [
    makeSale({ id: "s1", total: 30, created_at: todayAt(9) }),
    makeSale({ id: "s2", total: 20, created_at: todayAt(15) }),
    makeSale({ id: "s3", total: 999, status: "open", created_at: todayAt(10) }), // not completed
    makeSale({ id: "s4", total: 999, created_at: yesterdayAt(10) }), // yesterday
  ];
  const summary = getSalesTodaySummary(sales, [], [], [], {});
  assert.equal(summary.revenueToday, 50);
  assert.equal(summary.txnCount, 2);
  assert.equal(summary.avgSale, 25);
});

test("getSalesTodaySummary avgSale is 0 when there are no sales today", () => {
  const summary = getSalesTodaySummary([], [], [], [], {});
  assert.equal(summary.avgSale, 0);
  assert.equal(summary.txnCount, 0);
});

test("getSalesTodaySummary computes yesterday's revenue, count, and profit from COGS", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const saleItems = [makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 5 })];
  const products = [makeProduct({ product_id: "p1", average_cost: 4 })];
  const productIdMap = { p1: products[0] };
  const summary = getSalesTodaySummary(sales, saleItems, [], products, productIdMap);
  assert.equal(summary.yesterdaySalesCount, 1);
  assert.equal(summary.yesterdayRevenue, 100);
  // COGS = 5 * 4 = 20; profit = 100 - 20 = 80
  assert.equal(summary.yesterdayProfit, 80);
});

test("getSalesTodaySummary yesterdayProfit is null when there's no cost data", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const saleItems = [makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 5 })];
  const products = [makeProduct({ product_id: "p1", average_cost: 0 })];
  const summary = getSalesTodaySummary(sales, saleItems, [], products, { p1: products[0] });
  assert.equal(summary.yesterdayProfit, null);
});

test("getSalesTodaySummary yesterdayProfit is null when there are no items", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const summary = getSalesTodaySummary(sales, [], [], [], {});
  assert.equal(summary.yesterdayProfit, null);
});

test("getSalesTodaySummary sums yesterday's cash payments, excluding refunds and other methods", () => {
  const sales = [makeSale({ id: "y1", created_at: yesterdayAt(10) })];
  const payments: EodPayment[] = [
    { sale_id: "y1", payment_method: "cash", amount: 40, payment_type: "sale" },
    { sale_id: "y1", payment_method: "cash", amount: 15, payment_type: "refund" },
    { sale_id: "y1", payment_method: "card", amount: 25, payment_type: "sale" },
  ];
  const summary = getSalesTodaySummary(sales, [], payments, [], {});
  assert.equal(summary.yesterdayCash, 40);
});

test("getSalesTodaySummary identifies yesterday's top-selling product by quantity", () => {
  const sales = [makeSale({ id: "y1", created_at: yesterdayAt(10) })];
  const saleItems = [
    makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 3 }),
    makeSaleItem({ sale_id: "y1", product_id: "p2", quantity: 7 }),
  ];
  const products = [
    makeProduct({ product_id: "p1", product_name: "Cola" }),
    makeProduct({ product_id: "p2", product_name: "Chips" }),
  ];
  const productIdMap = Object.fromEntries(products.map(p => [p.product_id, p]));
  const summary = getSalesTodaySummary(sales, saleItems, [], products, productIdMap);
  assert.equal(summary.topYesterdayId, "p2");
  assert.equal(summary.topYesterdayName, "Chips");
  assert.equal(summary.topYesterdayQty, 7);
});

test("getSalesTodaySummary reports no top product when yesterday had no sales", () => {
  const summary = getSalesTodaySummary([], [], [], [], {});
  assert.equal(summary.topYesterdayId, null);
  assert.equal(summary.topYesterdayName, "—");
  assert.equal(summary.topYesterdayQty, 0);
});
