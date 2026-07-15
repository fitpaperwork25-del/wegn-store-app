import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateSupplierBalancesInput,
  computeSupplierBalances,
  statusFor,
  getSupplierBalances,
  type SupplierBalancesRawData,
} from "./getSupplierBalances.ts";

// ---- validateSupplierBalancesInput ----

test("accepts undefined/null input with no filters", () => {
  const result = validateSupplierBalancesInput(undefined);
  assert.deepEqual(result, { ok: true, value: {} });
});

test("rejects non-object input", () => {
  const result = validateSupplierBalancesInput("cba");
  assert.equal(result.ok, false);
});

test("rejects empty supplierName", () => {
  const result = validateSupplierBalancesInput({ supplierName: "   " });
  assert.equal(result.ok, false);
});

test("rejects invalid statusFilter", () => {
  const result = validateSupplierBalancesInput({ statusFilter: "overdue" });
  assert.equal(result.ok, false);
});

test("accepts valid supplierName and statusFilter, trims the name", () => {
  const result = validateSupplierBalancesInput({ supplierName: "  CBA Supplies  ", statusFilter: "unpaid" });
  assert.deepEqual(result, { ok: true, value: { supplierName: "CBA Supplies", statusFilter: "unpaid" } });
});

// ---- statusFor ----

test("statusFor: outstanding when nothing paid", () => {
  assert.equal(statusFor(100, 0), "outstanding");
});

test("statusFor: partial when some but not all paid", () => {
  assert.equal(statusFor(100, 40), "partial");
});

test("statusFor: paid once balance reaches zero, tolerant of overpayment", () => {
  assert.equal(statusFor(100, 100), "paid");
  assert.equal(statusFor(100, 100.004), "paid");
});

// ---- computeSupplierBalances ----

function rawData(overrides: Partial<SupplierBalancesRawData>): SupplierBalancesRawData {
  return { suppliers: [], receivingSessions: [], supplierInvoices: [], payments: [], ...overrides };
}

test("supplier_invoices-sourced invoice with no payments is outstanding", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    supplierInvoices: [{ id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices.length, 1);
  assert.equal(result.invoices[0].status, "outstanding");
  assert.equal(result.invoices[0].outstanding, 500);
  assert.equal(result.totals.total_outstanding, 500);
});

test("supplier_invoices-sourced invoice with a partial payment is partial", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    supplierInvoices: [{ id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 }],
    payments: [{ receiving_session_id: null, supplier_invoice_id: "inv1", amount: 200 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices[0].status, "partial");
  assert.equal(result.invoices[0].paid, 200);
  assert.equal(result.invoices[0].outstanding, 300);
});

test("receiving_sessions invoice resolved via FK supplier_id", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    receivingSessions: [{ id: "rs1", supplier_id: "s1", supplier_name: null, invoice_number: "RS-1", invoice_date: "2026-06-01", invoice_total: 100 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices.length, 1);
  assert.equal(result.invoices[0].source, "receiving_session");
  assert.equal(result.invoices[0].supplier_id, "s1");
});

test("receiving_sessions invoice with null supplier_id resolves by case-insensitive supplier_name match", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    receivingSessions: [{ id: "rs1", supplier_id: null, supplier_name: "cba supplies", invoice_number: "RS-1", invoice_date: "2026-06-01", invoice_total: 100 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices.length, 1);
  assert.equal(result.invoices[0].supplier_id, "s1");
});

test("receiving_sessions invoice with unresolvable supplier_name is excluded, not misattributed", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    receivingSessions: [{ id: "rs1", supplier_id: null, supplier_name: "Nonexistent Co", invoice_number: "RS-1", invoice_date: "2026-06-01", invoice_total: 100 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices.length, 0);
});

test("FK-linked session wins invoice_number dedup tie over a name-matched duplicate, payments merged under one key", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    receivingSessions: [
      { id: "rs-unlinked", supplier_id: null, supplier_name: "CBA Supplies", invoice_number: "DUPE-1", invoice_date: "2026-06-01", invoice_total: 100 },
      { id: "rs-linked", supplier_id: "s1", supplier_name: null, invoice_number: "DUPE-1", invoice_date: "2026-06-01", invoice_total: 100 },
    ],
    payments: [{ receiving_session_id: "rs-unlinked", supplier_invoice_id: null, amount: 30 }],
  });
  const result = computeSupplierBalances(raw, {});
  assert.equal(result.invoices.length, 1, "duplicate invoice_number for the same supplier must collapse to one row");
  assert.equal(result.invoices[0].paid, 30, "a payment against the deduped-away session id must still be counted");
});

test("bySupplier includes every supplier even with zero invoices, for 'no outstanding balance' queries", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }, { id: "s2", name: "Never Invoiced Co" }],
    supplierInvoices: [{ id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 }],
  });
  const result = computeSupplierBalances(raw, {});
  const s2 = result.bySupplier.find((s) => s.supplier_id === "s2");
  assert.ok(s2, "supplier with no invoices must still appear in bySupplier");
  assert.equal(s2!.total_outstanding, 0);
});

test("bySupplier reflects a supplier's TRUE total even when statusFilter narrows the invoice list", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    supplierInvoices: [
      { id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 },
      { id: "inv2", supplier_id: "s1", invoice_number: "PO-2", invoice_date: "2026-07-02", original_amount: 200 },
    ],
    payments: [{ receiving_session_id: null, supplier_invoice_id: "inv2", amount: 200 }],
  });
  const result = computeSupplierBalances(raw, { statusFilter: "unpaid" });
  assert.equal(result.invoices.length, 1, "statusFilter should narrow the invoice list to only PO-1");
  const s1 = result.bySupplier.find((s) => s.supplier_id === "s1");
  assert.equal(s1!.total_outstanding, 500, "bySupplier must still reflect the supplier's true total, not the filtered subset");
});

test("supplierName filters both invoices and bySupplier to matching suppliers only", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }, { id: "s2", name: "Other Supplier" }],
    supplierInvoices: [
      { id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 },
      { id: "inv2", supplier_id: "s2", invoice_number: "PO-2", invoice_date: "2026-07-01", original_amount: 300 },
    ],
  });
  const result = computeSupplierBalances(raw, { supplierName: "cba" });
  assert.equal(result.invoices.length, 1);
  assert.equal(result.bySupplier.length, 1);
  assert.equal(result.totals.total_outstanding, 500);
});

test("totals are computed only over the filtered invoices, not the full data set", () => {
  const raw = rawData({
    suppliers: [{ id: "s1", name: "CBA Supplies" }],
    supplierInvoices: [
      { id: "inv1", supplier_id: "s1", invoice_number: "PO-1", invoice_date: "2026-07-01", original_amount: 500 },
      { id: "inv2", supplier_id: "s1", invoice_number: "PO-2", invoice_date: "2026-07-02", original_amount: 200 },
    ],
    payments: [{ receiving_session_id: null, supplier_invoice_id: "inv2", amount: 200 }],
  });
  const result = computeSupplierBalances(raw, { statusFilter: "paid" });
  assert.equal(result.totals.total_outstanding, 0);
  assert.equal(result.totals.invoice_count, 1);
});

// ---- getSupplierBalances orchestration ----

test("getSupplierBalances returns a validation error without ever calling the fetcher", async () => {
  let called = false;
  const result = await getSupplierBalances({ statusFilter: "bogus" }, { businessId: "b1" }, async () => {
    called = true;
    return rawData({});
  });
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("getSupplierBalances passes businessId through to the fetcher - tenant isolation", async () => {
  let receivedBusinessId = "";
  await getSupplierBalances({}, { businessId: "biz-42" }, async (businessId) => {
    receivedBusinessId = businessId;
    return rawData({});
  });
  assert.equal(receivedBusinessId, "biz-42");
});
