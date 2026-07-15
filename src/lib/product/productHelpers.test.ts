import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildProductNameMap,
  buildProductIndex,
  findProductByBarcode,
  filterProducts,
  getLowStockProducts,
  getTotalInventoryValue,
  getCategoryChips,
} from "./productHelpers.ts";
import type { ProductStock, Category } from "./types.ts";

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

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat1",
    business_id: "biz1",
    name: "Beverages",
    description: null,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

test("buildProductNameMap maps product_id to product_name", () => {
  const products = [
    makeProduct({ product_id: "p1", product_name: "Cola" }),
    makeProduct({ product_id: "p2", product_name: "Chips" }),
  ];
  assert.deepEqual(buildProductNameMap(products), { p1: "Cola", p2: "Chips" });
});

test("buildProductIndex maps product_id to the full record", () => {
  const cola = makeProduct({ product_id: "p1", product_name: "Cola" });
  const index = buildProductIndex([cola]);
  assert.equal(index.p1, cola);
});

test("findProductByBarcode matches exactly", () => {
  const products = [makeProduct({ product_id: "p1", barcode: "012345678905" })];
  const found = findProductByBarcode(products, "012345678905");
  assert.equal(found?.product_id, "p1");
});

test("findProductByBarcode is case-insensitive and whitespace-tolerant", () => {
  const products = [makeProduct({ product_id: "p1", barcode: "WGN8729755354" })];
  assert.equal(findProductByBarcode(products, "  wgn8729755354  ")?.product_id, "p1");
});

test("findProductByBarcode returns undefined when no match", () => {
  const products = [makeProduct({ barcode: "111" })];
  assert.equal(findProductByBarcode(products, "999"), undefined);
});

test("filterProducts filters by category, including 'all' and 'uncategorized'", () => {
  const products = [
    makeProduct({ product_id: "p1", category_id: "cat1" }),
    makeProduct({ product_id: "p2", category_id: null }),
    makeProduct({ product_id: "p3", category_id: "cat2" }),
  ];
  assert.equal(filterProducts(products, "all", "").length, 3);
  assert.deepEqual(filterProducts(products, "uncategorized", "").map(p => p.product_id), ["p2"]);
  assert.deepEqual(filterProducts(products, "cat1", "").map(p => p.product_id), ["p1"]);
});

test("filterProducts search matches name, sku, or barcode case-insensitively", () => {
  const products = [
    makeProduct({ product_id: "p1", product_name: "Cola 20oz", sku: "COLA-20", barcode: "111" }),
    makeProduct({ product_id: "p2", product_name: "Chips", sku: "CHP-01", barcode: "222" }),
  ];
  assert.deepEqual(filterProducts(products, "all", "cola").map(p => p.product_id), ["p1"]);
  assert.deepEqual(filterProducts(products, "all", "chp-01").map(p => p.product_id), ["p2"]);
  assert.deepEqual(filterProducts(products, "all", "222").map(p => p.product_id), ["p2"]);
  assert.equal(filterProducts(products, "all", "nonexistent").length, 0);
});

test("getLowStockProducts includes only active products below reorder level", () => {
  const products = [
    makeProduct({ product_id: "p1", status: "active", reorder_level: 10, quantity_on_hand: 5 }),
    makeProduct({ product_id: "p2", status: "inactive", reorder_level: 10, quantity_on_hand: 1 }),
    makeProduct({ product_id: "p3", status: "active", reorder_level: null, quantity_on_hand: 0 }),
    makeProduct({ product_id: "p4", status: "active", reorder_level: 10, quantity_on_hand: 10 }),
  ];
  const lowStock = getLowStockProducts(products);
  assert.deepEqual(lowStock.map(p => p.product_id), ["p1"]);
});

test("getLowStockProducts sorts most-short-of-target first", () => {
  const products = [
    makeProduct({ product_id: "p1", status: "active", reorder_level: 10, quantity_on_hand: 8 }), // short by 2
    makeProduct({ product_id: "p2", status: "active", reorder_level: 10, quantity_on_hand: 1 }), // short by 9
    makeProduct({ product_id: "p3", status: "active", reorder_level: 10, quantity_on_hand: 5 }), // short by 5
  ];
  const lowStock = getLowStockProducts(products);
  assert.deepEqual(lowStock.map(p => p.product_id), ["p2", "p3", "p1"]);
});

test("getTotalInventoryValue sums quantity_on_hand times average_cost", () => {
  const products = [
    makeProduct({ quantity_on_hand: 10, average_cost: 2 }),
    makeProduct({ quantity_on_hand: 5, average_cost: 3 }),
  ];
  assert.equal(getTotalInventoryValue(products), 35);
});

test("getTotalInventoryValue returns 0 for empty input", () => {
  assert.equal(getTotalInventoryValue([]), 0);
});

test("getCategoryChips builds All, Uncategorized, and per-category counts", () => {
  const products = [
    makeProduct({ product_id: "p1", category_id: "cat1" }),
    makeProduct({ product_id: "p2", category_id: "cat1" }),
    makeProduct({ product_id: "p3", category_id: null }),
  ];
  const categories = [makeCategory({ id: "cat1", name: "Beverages" }), makeCategory({ id: "cat2", name: "Snacks" })];
  const chips = getCategoryChips(products, categories);
  assert.deepEqual(chips, [
    { key: "all", label: "All", count: 3 },
    { key: "uncategorized", label: "Uncategorized", count: 1 },
    { key: "cat1", label: "Beverages", count: 2 },
    { key: "cat2", label: "Snacks", count: 0 },
  ]);
});
