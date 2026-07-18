import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateReturnsInput,
  computeReturns,
  getReturnsAndRefunds,
  type ReturnsRawData,
} from "./getReturnsAndRefunds.ts";

// ---- validateReturnsInput ----

test("accepts undefined/null input with no filters", () => {
  assert.deepEqual(validateReturnsInput(undefined), { ok: true, value: {} });
});

test("rejects non-object input", () => {
  assert.equal(validateReturnsInput("today").ok, false);
});

test("rejects invalid dateRange", () => {
  assert.equal(validateReturnsInput({ dateRange: "lastweek" }).ok, false);
});

test("rejects empty cashierName", () => {
  assert.equal(validateReturnsInput({ cashierName: "" }).ok, false);
});

// ---- computeReturns ----

function rawData(overrides: Partial<ReturnsRawData>): ReturnsRawData {
  return { employees: [], returnItems: [], saleItemUnitPrices: [], products: [], ...overrides };
}

test("computes refund_amount as quantity_returned times the original sale_item unit_price", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk" }],
    returnItems: [{ id: "r1", sale_id: "s1", product_id: "p1", quantity_returned: 2, reason: "Damaged", return_number: "RET-1", processed_by: null, created_at: "2026-07-15T10:00:00Z" }],
    saleItemUnitPrices: [{ sale_id: "s1", product_id: "p1", unit_price: 3.5 }],
  });
  const result = computeReturns(raw);
  assert.equal(result.returns[0].refund_amount, 7);
  assert.equal(result.totals.total_refund_amount, 7);
});

test("falls back to 0 refund_amount when no matching sale_item unit_price is found, never crashes", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk" }],
    returnItems: [{ id: "r1", sale_id: "s1", product_id: "p1", quantity_returned: 2, reason: null, return_number: null, processed_by: null, created_at: "2026-07-15T10:00:00Z" }],
  });
  const result = computeReturns(raw);
  assert.equal(result.returns[0].refund_amount, 0);
});

test("attaches product_name and processed_by_name from lookups", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk" }],
    employees: [{ id: "e1", name: "Alice" }],
    returnItems: [{ id: "r1", sale_id: "s1", product_id: "p1", quantity_returned: 1, reason: null, return_number: null, processed_by: "e1", created_at: "2026-07-15T10:00:00Z" }],
    saleItemUnitPrices: [{ sale_id: "s1", product_id: "p1", unit_price: 5 }],
  });
  const result = computeReturns(raw);
  assert.equal(result.returns[0].product_name, "Milk");
  assert.equal(result.returns[0].processed_by_name, "Alice");
});

test("total_quantity_returned and count sum across all lines exactly", () => {
  const raw = rawData({
    products: [{ id: "p1", name: "Milk" }, { id: "p2", name: "Bread" }],
    returnItems: [
      { id: "r1", sale_id: "s1", product_id: "p1", quantity_returned: 2, reason: null, return_number: "RET-1", processed_by: null, created_at: "2026-07-15T10:00:00Z" },
      { id: "r2", sale_id: "s1", product_id: "p2", quantity_returned: 3, reason: null, return_number: "RET-1", processed_by: null, created_at: "2026-07-15T10:00:00Z" },
    ],
    saleItemUnitPrices: [
      { sale_id: "s1", product_id: "p1", unit_price: 2 },
      { sale_id: "s1", product_id: "p2", unit_price: 4 },
    ],
  });
  const result = computeReturns(raw);
  assert.equal(result.totals.count, 2);
  assert.equal(result.totals.total_quantity_returned, 5);
  assert.equal(result.totals.total_refund_amount, 16);
});

// ---- getReturnsAndRefunds orchestration ----

test("getReturnsAndRefunds returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getReturnsAndRefunds({ dateRange: "bogus" }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getReturnsAndRefunds passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getReturnsAndRefunds({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});

// ---- B2: "today" must use the client's local business day, not the server's clock ----

test("getReturnsAndRefunds passes ctx.businessDayStartIso through to the fetcher unchanged", async () => {
  let received = "";
  const clientMidnight = "2026-07-18T05:00:00.000Z"; // e.g. UTC-5 store's local midnight
  await getReturnsAndRefunds({ dateRange: "today" }, { businessId: "b1", businessDayStartIso: clientMidnight }, async (_businessId, _filter, businessDayStartIso) => {
    received = businessDayStartIso;
    return rawData({});
  });
  assert.equal(received, clientMidnight);
});

test("getReturnsAndRefunds falls back to a server-computed business-day start when the client doesn't supply one", async () => {
  let received = "";
  await getReturnsAndRefunds({ dateRange: "today" }, { businessId: "b1" }, async (_businessId, _filter, businessDayStartIso) => {
    received = businessDayStartIso;
    return rawData({});
  });
  assert.notEqual(received, "");
  assert.doesNotThrow(() => new Date(received).toISOString());
});
