import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_supplier_payment_history - Supplier Accounts Payable read-only lookup.
 *
 * Unlike get_supplier_balances, this needs no two-source merge: supplier_id
 * is already a direct column on supplier_payments, so it's a single query
 * plus a supplier-name lookup for display, sorted most-recent-first.
 */

export type SupplierPaymentHistoryInput = { supplierName?: string; limit?: number };

export type SupplierPaymentRow = {
  payment_id: string;
  supplier_id: string;
  supplier_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
};

export type SupplierPaymentHistoryOutput = { payments: SupplierPaymentRow[] };

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const SUPPLIER_PAYMENT_HISTORY_DEFAULT_LIMIT = 10;
export const SUPPLIER_PAYMENT_HISTORY_MAX_LIMIT = 50;

export function validateSupplierPaymentHistoryInput(input: unknown): ValidationResult<SupplierPaymentHistoryInput> {
  if (input === null || input === undefined) return { ok: true, value: { limit: SUPPLIER_PAYMENT_HISTORY_DEFAULT_LIMIT } };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: SupplierPaymentHistoryInput = {};

  if (obj.supplierName !== undefined) {
    if (typeof obj.supplierName !== "string" || obj.supplierName.trim().length === 0) {
      return { ok: false, error: "supplierName must be a non-empty string when provided" };
    }
    if (obj.supplierName.length > 200) return { ok: false, error: "supplierName must be 200 characters or fewer" };
    result.supplierName = obj.supplierName.trim();
  }

  let limit = SUPPLIER_PAYMENT_HISTORY_DEFAULT_LIMIT;
  if (obj.limit !== undefined) {
    if (typeof obj.limit !== "number" || !Number.isInteger(obj.limit) || obj.limit < 1) {
      return { ok: false, error: "limit must be a positive integer" };
    }
    limit = Math.min(obj.limit, SUPPLIER_PAYMENT_HISTORY_MAX_LIMIT);
  }
  result.limit = limit;

  return { ok: true, value: result };
}

export type RawSupplierRow = { id: string; name: string };
export type RawPaymentDetailRow = {
  id: string;
  supplier_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string | null;
};

export type SupplierPaymentHistoryRawData = { suppliers: RawSupplierRow[]; payments: RawPaymentDetailRow[] };

/** Pure filter/sort/shape - no I/O, fully unit-testable. */
export function computeSupplierPaymentHistory(raw: SupplierPaymentHistoryRawData, filter: SupplierPaymentHistoryInput): SupplierPaymentHistoryOutput {
  const nameById = new Map(raw.suppliers.map((s) => [s.id, s.name]));

  let filtered = raw.payments;
  if (filter.supplierName) {
    const needle = filter.supplierName.toLowerCase();
    const matchingIds = new Set(raw.suppliers.filter((s) => s.name.toLowerCase().includes(needle)).map((s) => s.id));
    filtered = filtered.filter((p) => matchingIds.has(p.supplier_id));
  }

  const sorted = [...filtered].sort((a, b) => (b.created_at ?? b.payment_date).localeCompare(a.created_at ?? a.payment_date));
  const limited = sorted.slice(0, filter.limit ?? SUPPLIER_PAYMENT_HISTORY_DEFAULT_LIMIT);

  return {
    payments: limited.map((p) => ({
      payment_id: p.id,
      supplier_id: p.supplier_id,
      supplier_name: nameById.get(p.supplier_id) ?? "Unknown supplier",
      amount: p.amount,
      payment_date: p.payment_date,
      payment_method: p.payment_method,
      reference: p.reference,
      notes: p.notes,
    })),
  };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getSupplierPaymentHistory(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string) => Promise<SupplierPaymentHistoryRawData>
): Promise<ValidationResult<SupplierPaymentHistoryOutput>> {
  const validated = validateSupplierPaymentHistoryInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId);
  return { ok: true, value: computeSupplierPaymentHistory(raw, validated.value) };
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter in addition to RLS - defense in depth, matching every
 * other tool executor in this registry.
 */
export async function fetchSupplierPaymentHistoryRawData(supabase: SupabaseClient, businessId: string): Promise<SupplierPaymentHistoryRawData> {
  const [suppliersRes, paymentsRes] = await Promise.all([
    supabase.from("suppliers").select("id, name").eq("business_id", businessId),
    supabase
      .from("supplier_payments")
      .select("id, supplier_id, amount, payment_date, payment_method, reference, notes, created_at")
      .eq("business_id", businessId),
  ]);

  if (suppliersRes.error) throw suppliersRes.error;
  if (paymentsRes.error) throw paymentsRes.error;

  return {
    suppliers: (suppliersRes.data ?? []) as RawSupplierRow[],
    payments: (paymentsRes.data ?? []) as RawPaymentDetailRow[],
  };
}
