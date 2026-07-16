import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateGetCashDrawerStatusInput,
  computeCashDrawerStatus,
  getCashDrawerStatus,
  type CashDrawerStatusRawData,
} from "./getCashDrawerStatus.ts";

// ---- validateGetCashDrawerStatusInput ----

test("accepts undefined/null input", () => {
  assert.deepEqual(validateGetCashDrawerStatusInput(undefined), { ok: true, value: {} });
});

test("accepts an empty object", () => {
  assert.deepEqual(validateGetCashDrawerStatusInput({}), { ok: true, value: {} });
});

test("rejects non-object input", () => {
  assert.equal(validateGetCashDrawerStatusInput("open").ok, false);
});

// ---- computeCashDrawerStatus ----

function rawData(overrides: Partial<CashDrawerStatusRawData>): CashDrawerStatusRawData {
  return { session: null, employees: [], paidOuts: [], salesSinceOpen: [], cashPayments: [], ...overrides };
}

test("is_open is false and session is null when no drawer is open", () => {
  const result = computeCashDrawerStatus(rawData({}));
  assert.equal(result.is_open, false);
  assert.equal(result.session, null);
});

test("expected_cash_now equals opening_float when there are no sales or paid-outs", () => {
  const raw = rawData({ session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" } });
  const result = computeCashDrawerStatus(raw);
  assert.equal(result.is_open, true);
  assert.equal(result.session!.expected_cash_now, 100);
  assert.equal(result.session!.cash_sales_since_open, 0);
});

test("cash_sales_since_open is cash-in minus cash-refunds (mirrors drawerCashSales exactly)", () => {
  const raw = rawData({
    session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" },
    cashPayments: [
      { sale_id: "s1", amount: 50, payment_type: "sale" },
      { sale_id: "s2", amount: 30, payment_type: "sale" },
      { sale_id: "s2", amount: 10, payment_type: "refund" },
    ],
  });
  const result = computeCashDrawerStatus(raw);
  assert.equal(result.session!.cash_sales_since_open, 70);
});

test("expected_cash_now = opening_float + cash_sales_since_open - total_paid_outs (mirrors handleCloseDrawer exactly)", () => {
  const raw = rawData({
    session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" },
    cashPayments: [{ sale_id: "s1", amount: 80, payment_type: "sale" }],
    paidOuts: [{ amount: 20, reason: "Supplies", created_at: "2026-07-16T09:00:00Z" }],
  });
  const result = computeCashDrawerStatus(raw);
  // 100 + 80 - 20 = 160
  assert.equal(result.session!.expected_cash_now, 160);
  assert.equal(result.session!.total_paid_outs, 20);
});

test("attaches cashier_name from the employees lookup", () => {
  const raw = rawData({
    session: { id: "d1", cashier_id: "e1", opening_float: 100, opened_at: "2026-07-16T08:00:00Z" },
    employees: [{ id: "e1", name: "Alice" }],
  });
  const result = computeCashDrawerStatus(raw);
  assert.equal(result.session!.cashier_name, "Alice");
});

test("cashier_name is null when the session has no cashier_id (owner operating directly)", () => {
  const raw = rawData({ session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" } });
  const result = computeCashDrawerStatus(raw);
  assert.equal(result.session!.cashier_name, null);
});

test("paid_outs list is passed through with amount, reason, and created_at", () => {
  const raw = rawData({
    session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" },
    paidOuts: [{ amount: 15, reason: "Change for customer", created_at: "2026-07-16T10:00:00Z" }],
  });
  const result = computeCashDrawerStatus(raw);
  assert.deepEqual(result.session!.paid_outs, [{ amount: 15, reason: "Change for customer", created_at: "2026-07-16T10:00:00Z" }]);
});

test("never reports an over/short figure - that requires a physical count this tool doesn't have", () => {
  const raw = rawData({ session: { id: "d1", cashier_id: null, opening_float: 100, opened_at: "2026-07-16T08:00:00Z" } });
  const result = computeCashDrawerStatus(raw);
  assert.equal("over_short" in result.session!, false);
  assert.equal("closing_count" in result.session!, false);
});

// ---- getCashDrawerStatus orchestration ----

test("getCashDrawerStatus returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getCashDrawerStatus("bogus", { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getCashDrawerStatus passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getCashDrawerStatus({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
