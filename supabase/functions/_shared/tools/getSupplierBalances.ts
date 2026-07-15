import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_supplier_balances - Supplier Accounts Payable read-only lookup.
 *
 * Mirrors the two-source merge loadSupplierStatement() in App.tsx already
 * uses (receiving_sessions-backed invoices + supplier_invoices rows,
 * deduplicated by invoice_number, payments aggregated by whichever FK a
 * supplier_payments row uses) - generalized here from "one supplier" to
 * "every supplier in this business," with totals computed once here so the
 * model is never asked to sum invoice figures itself.
 */

export type SupplierBalancesInput = { supplierName?: string; statusFilter?: "unpaid" | "partial" | "paid" | "all" };

export type SupplierInvoiceRow = {
  supplier_id: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string | null;
  invoice_total: number;
  paid: number;
  outstanding: number;
  status: "outstanding" | "partial" | "paid";
  source: "receiving_session" | "purchase_order";
};

export type SupplierBalanceSummary = {
  supplier_id: string;
  supplier_name: string;
  total_invoiced: number;
  total_paid: number;
  total_outstanding: number;
  invoice_count: number;
};

export type SupplierBalancesOutput = {
  /** Line-level invoices, filtered by supplierName and statusFilter. */
  invoices: SupplierInvoiceRow[];
  /** Per-supplier totals across ALL of that supplier's invoices (statusFilter
   *  never narrows this - a supplier with one paid and one unpaid invoice
   *  must still show its true outstanding total here), filtered only by
   *  supplierName. Includes every supplier in the business, even ones with
   *  zero invoices (total_outstanding: 0), so "which suppliers have no
   *  outstanding balance" is answerable without a false negative. */
  bySupplier: SupplierBalanceSummary[];
  /** Computed over `invoices` (the filtered set) - the model reports these
   *  numbers directly rather than summing the list itself. */
  totals: { total_invoiced: number; total_paid: number; total_outstanding: number; invoice_count: number; supplier_count: number };
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const STATUS_FILTER_VALUES = ["unpaid", "partial", "paid", "all"] as const;

export function validateSupplierBalancesInput(input: unknown): ValidationResult<SupplierBalancesInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: SupplierBalancesInput = {};

  if (obj.supplierName !== undefined) {
    if (typeof obj.supplierName !== "string" || obj.supplierName.trim().length === 0) {
      return { ok: false, error: "supplierName must be a non-empty string when provided" };
    }
    if (obj.supplierName.length > 200) return { ok: false, error: "supplierName must be 200 characters or fewer" };
    result.supplierName = obj.supplierName.trim();
  }

  if (obj.statusFilter !== undefined) {
    if (typeof obj.statusFilter !== "string" || !(STATUS_FILTER_VALUES as readonly string[]).includes(obj.statusFilter)) {
      return { ok: false, error: `statusFilter must be one of ${STATUS_FILTER_VALUES.join(", ")}` };
    }
    result.statusFilter = obj.statusFilter as SupplierBalancesInput["statusFilter"];
  }

  return { ok: true, value: result };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Same rule as getSupplierInvoiceStatus() in src/lib/purchasing/purchasingHelpers.ts - duplicated here (not imported) because Deno edge functions in this codebase never cross-import from src/. */
export function statusFor(invoiceTotal: number, paid: number): "outstanding" | "partial" | "paid" {
  const remaining = round2(invoiceTotal - paid);
  if (remaining <= 0) return "paid";
  if (paid > 0) return "partial";
  return "outstanding";
}

export type RawSupplierRow = { id: string; name: string };
export type RawReceivingSessionRow = {
  id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string;
  invoice_date: string | null;
  invoice_total: number;
};
export type RawSupplierInvoiceRow = {
  id: string;
  supplier_id: string;
  invoice_number: string;
  invoice_date: string | null;
  original_amount: number;
};
export type RawPaymentRow = { receiving_session_id: string | null; supplier_invoice_id: string | null; amount: number };

export type SupplierBalancesRawData = {
  suppliers: RawSupplierRow[];
  receivingSessions: RawReceivingSessionRow[];
  supplierInvoices: RawSupplierInvoiceRow[];
  payments: RawPaymentRow[];
};

/**
 * Pure merge/aggregate - no I/O, fully unit-testable. FK-linked
 * receiving_sessions rows are processed before name-matched ones so they
 * win invoice_number dedupe ties, matching loadSupplierStatement()'s rule
 * exactly.
 */
export function computeSupplierBalances(raw: SupplierBalancesRawData, filter: SupplierBalancesInput): SupplierBalancesOutput {
  const supplierNameById = new Map(raw.suppliers.map((s) => [s.id, s.name]));
  const suppliersByLowerName = new Map(raw.suppliers.map((s) => [s.name.toLowerCase(), s]));

  const linked = raw.receivingSessions.filter((s) => s.supplier_id);
  const unlinked = raw.receivingSessions.filter((s) => !s.supplier_id);
  const orderedSessions = [...linked, ...unlinked];

  const sessionInvoiceKey = new Map<string, string>();
  const byKey = new Map<string, RawReceivingSessionRow & { resolvedSupplierId: string }>();

  for (const s of orderedSessions) {
    const resolvedSupplierId = s.supplier_id ?? (s.supplier_name ? suppliersByLowerName.get(s.supplier_name.toLowerCase())?.id ?? null : null);
    if (!resolvedSupplierId) continue;
    const key = `${resolvedSupplierId}::${s.invoice_number}`;
    sessionInvoiceKey.set(s.id, key);
    if (!byKey.has(key)) byKey.set(key, { ...s, resolvedSupplierId });
  }

  const paidBySessionInvoiceKey = new Map<string, number>();
  for (const p of raw.payments) {
    if (!p.receiving_session_id) continue;
    const key = sessionInvoiceKey.get(p.receiving_session_id);
    if (!key) continue;
    paidBySessionInvoiceKey.set(key, round2((paidBySessionInvoiceKey.get(key) ?? 0) + p.amount));
  }

  const paidByInvoiceId = new Map<string, number>();
  for (const p of raw.payments) {
    if (!p.supplier_invoice_id) continue;
    paidByInvoiceId.set(p.supplier_invoice_id, round2((paidByInvoiceId.get(p.supplier_invoice_id) ?? 0) + p.amount));
  }

  const allInvoices: SupplierInvoiceRow[] = [];

  for (const [key, s] of byKey) {
    const paid = paidBySessionInvoiceKey.get(key) ?? 0;
    allInvoices.push({
      supplier_id: s.resolvedSupplierId,
      supplier_name: supplierNameById.get(s.resolvedSupplierId) ?? s.supplier_name ?? "Unknown supplier",
      invoice_number: s.invoice_number,
      invoice_date: s.invoice_date,
      invoice_total: s.invoice_total,
      paid,
      outstanding: round2(s.invoice_total - paid),
      status: statusFor(s.invoice_total, paid),
      source: "receiving_session",
    });
  }

  for (const inv of raw.supplierInvoices) {
    const paid = paidByInvoiceId.get(inv.id) ?? 0;
    allInvoices.push({
      supplier_id: inv.supplier_id,
      supplier_name: supplierNameById.get(inv.supplier_id) ?? "Unknown supplier",
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      invoice_total: inv.original_amount,
      paid,
      outstanding: round2(inv.original_amount - paid),
      status: statusFor(inv.original_amount, paid),
      source: "purchase_order",
    });
  }

  const nameNeedle = filter.supplierName?.toLowerCase();
  const supplierScope = nameNeedle ? raw.suppliers.filter((s) => s.name.toLowerCase().includes(nameNeedle)) : raw.suppliers;
  const scopedSupplierIds = new Set(supplierScope.map((s) => s.id));

  const bySupplier: SupplierBalanceSummary[] = supplierScope.map((s) => {
    const invoicesForSupplier = allInvoices.filter((i) => i.supplier_id === s.id);
    const total_invoiced = round2(invoicesForSupplier.reduce((sum, i) => sum + i.invoice_total, 0));
    const total_paid = round2(invoicesForSupplier.reduce((sum, i) => sum + i.paid, 0));
    return {
      supplier_id: s.id,
      supplier_name: s.name,
      total_invoiced,
      total_paid,
      total_outstanding: round2(total_invoiced - total_paid),
      invoice_count: invoicesForSupplier.length,
    };
  });

  let invoices = allInvoices.filter((i) => scopedSupplierIds.has(i.supplier_id));
  if (filter.statusFilter && filter.statusFilter !== "all") {
    // The tool's public statusFilter value is "unpaid" (matches how users
    // ask); the internal status label is "outstanding" (matches
    // getSupplierInvoiceStatus() in src/lib/purchasing/purchasingHelpers.ts).
    const targetStatus = filter.statusFilter === "unpaid" ? "outstanding" : filter.statusFilter;
    invoices = invoices.filter((i) => i.status === targetStatus);
  }

  const totals = invoices.reduce(
    (acc, i) => {
      acc.total_invoiced = round2(acc.total_invoiced + i.invoice_total);
      acc.total_paid = round2(acc.total_paid + i.paid);
      acc.total_outstanding = round2(acc.total_outstanding + i.outstanding);
      return acc;
    },
    { total_invoiced: 0, total_paid: 0, total_outstanding: 0 }
  );

  return {
    invoices,
    bySupplier,
    totals: {
      ...totals,
      invoice_count: invoices.length,
      supplier_count: new Set(invoices.map((i) => i.supplier_id)).size,
    },
  };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getSupplierBalances(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string) => Promise<SupplierBalancesRawData>
): Promise<ValidationResult<SupplierBalancesOutput>> {
  const validated = validateSupplierBalancesInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId);
  return { ok: true, value: computeSupplierBalances(raw, validated.value) };
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter on every query in addition to RLS - defense in depth,
 * matching createSupabaseProductSearchExecutor()'s existing pattern.
 */
export async function fetchSupplierBalancesRawData(supabase: SupabaseClient, businessId: string): Promise<SupplierBalancesRawData> {
  const [suppliersRes, sessionsRes, invoicesRes, paymentsRes] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("business_id", businessId),
    supabase
      .from("receiving_sessions")
      .select("id, supplier_id, supplier_name, invoice_number, invoice_date, invoice_total")
      .eq("business_id", businessId)
      .eq("status", "completed")
      .not("invoice_number", "is", null),
    supabase.from("supplier_invoices").select("id, supplier_id, invoice_number, invoice_date, original_amount").eq("business_id", businessId),
    supabase.from("supplier_payments").select("receiving_session_id, supplier_invoice_id, amount").eq("business_id", businessId),
  ]);

  if (suppliersRes.error) throw suppliersRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (invoicesRes.error) throw invoicesRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return {
    suppliers: (suppliersRes.data ?? []) as RawSupplierRow[],
    receivingSessions: (sessionsRes.data ?? []) as RawReceivingSessionRow[],
    supplierInvoices: (invoicesRes.data ?? []) as RawSupplierInvoiceRow[],
    payments: (paymentsRes.data ?? []) as RawPaymentRow[],
  };
}
