import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSupplierPaymentHistoryInput,
  computeSupplierPaymentHistory,
  getSupplierPaymentHistory,
  SUPPLIER_PAYMENT_HISTORY_MAX_LIMIT,
  type SupplierPaymentHistoryRawData,
} from "./getSupplierPaymentHistory.ts";

// ---- validateSupplierPaymentHistoryInput ----

test("defaults to limit 10 with no filters when input is undefined", () => {
  const result = validateSupplierPaymentHistoryInput(undefined);
  assert.deepEqual(result, { ok: true, value: { limit: 10 } });
});

test("rejects non-object input", () => {
  const result = validateSupplierPaymentHistoryInput("cba");
  assert.equal(result.ok, false);
});

test("rejects empty supplierName", () => {
  const result = validateSupplierPaymentHistoryInput({ supplierName: "" });
  assert.equal(result.ok, false);
});

test("rejects non-integer limit", () => {
  const result = validateSupplierPaymentHistoryInput({ limit: 2.5 });
  assert.equal(result.ok, false);
});

test("caps a requested limit at the maximum, never errors past it", () => {
  const result = validateSupplierPaymentHistoryInput({ limit: 9999 });
  assert.deepEqual(result, { ok: true, value: { limit: SUPPLIER_PAYMENT_HISTORY_MAX_LIMIT } });
});

// ---- computeSupplierPaymentHistory ----

function rawData(overrides: Partial<SupplierPaymentHistoryRawData>): SupplierPaymentHistoryRawData {
  return { suppliers: [], payments: [], ...overrides };
}

test("sorts payments most-recent-first by created_at", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    payments: [
      { id: "p1", supplier_id: "s1", amount: 50, payment_date: "2026-07-01", payment_method: "cash", reference: null, notes: null, created_at: "2026-07-01T10:00:00Z" },
      { id: "p2", supplier_id: "s1", amount: 75, payment_date: "2026-07-05", payment_method: "check", reference: null, notes: null, created_at: "2026-07-05T10:00:00Z" },
    ],
  });
  const result = computeSupplierPaymentHistory(raw, { limit: 10 });
  assert.equal(result.payments[0].payment_id, "p2", "the more recent payment must come first");
  assert.equal(result.payments[1].payment_id, "p1");
});

test("filters to a single supplier by case-insensitive partial name match", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }, { id: "s2", name: "Other Supplier" }],
    payments: [
      { id: "p1", supplier_id: "s1", amount: 50, payment_date: "2026-07-01", payment_method: "cash", reference: null, notes: null, created_at: "2026-07-01T10:00:00Z" },
      { id: "p2", supplier_id: "s2", amount: 75, payment_date: "2026-07-05", payment_method: "check", reference: null, notes: null, created_at: "2026-07-05T10:00:00Z" },
    ],
  });
  const result = computeSupplierPaymentHistory(raw, { supplierName: "cba", limit: 10 });
  assert.equal(result.payments.length, 1);
  assert.equal(result.payments[0].supplier_name, "CBA Supplies");
});

test("respects the limit after sorting", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    payments: [
      { id: "p1", supplier_id: "s1", amount: 10, payment_date: "2026-07-01", payment_method: "cash", reference: null, notes: null, created_at: "2026-07-01T10:00:00Z" },
      { id: "p2", supplier_id: "s1", amount: 20, payment_date: "2026-07-02", payment_method: "cash", reference: null, notes: null, created_at: "2026-07-02T10:00:00Z" },
      { id: "p3", supplier_id: "s1", amount: 30, payment_date: "2026-07-03", payment_method: "cash", reference: null, notes: null, created_at: "2026-07-03T10:00:00Z" },
    ],
  });
  const result = computeSupplierPaymentHistory(raw, { limit: 1 });
  assert.equal(result.payments.length, 1);
  assert.equal(result.payments[0].payment_id, "p3");
});

test("returns an empty list rather than an error when the supplier has no payments", () => {
  const raw = rawData({ suppliers: [{ id: "s1", name: "CBA Supplies" }], payments: [] });
  const result = computeSupplierPaymentHistory(raw, { limit: 10 });
  assert.deepEqual(result.payments, []);
});

// ---- getSupplierPaymentHistory orchestration ----

test("getSupplierPaymentHistory returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getSupplierPaymentHistory({ limit: -1 }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getSupplierPaymentHistory passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getSupplierPaymentHistory({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
