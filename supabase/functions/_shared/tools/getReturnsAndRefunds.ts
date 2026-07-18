import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_returns_and_refunds - Sales/POS Intelligence read-only lookup.
 *
 * A return is dated by its OWN created_at (return_items.created_at), never
 * the original sale's date - a return processed today against a sale from
 * last week is a "today's return." Confirmed by direct read of
 * handleConfirmReturn() in src/App.tsx: it inserts return_items and a
 * payments row (payment_type: 'refund') with fresh timestamps against a
 * sale_id that can be arbitrarily old.
 *
 * Per-line refund_amount is computed as quantity_returned * the original
 * sale_item's unit_price - the exact same arithmetic
 * handleConfirmReturn() itself uses to build the aggregate refund payment,
 * so this is a proven figure, not an inferred one. return_items has no
 * unit_price column of its own to read directly.
 */

export type ReturnsDateRange = "today" | "7d" | "30d" | "all";

export type ReturnsInput = {
  dateRange?: ReturnsDateRange;
  cashierName?: string;
};

export type ReturnLineOutput = {
  product_id: string;
  product_name: string;
  quantity_returned: number;
  reason: string | null;
  return_number: string | null;
  refund_amount: number;
  processed_by_name: string | null;
  created_at: string;
};

export type ReturnsOutput = {
  returns: ReturnLineOutput[];
  totals: { count: number; total_quantity_returned: number; total_refund_amount: number };
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const DATE_RANGE_VALUES = ["today", "7d", "30d", "all"] as const;

export function validateReturnsInput(input: unknown): ValidationResult<ReturnsInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: ReturnsInput = {};

  if (obj.dateRange !== undefined) {
    if (typeof obj.dateRange !== "string" || !(DATE_RANGE_VALUES as readonly string[]).includes(obj.dateRange)) {
      return { ok: false, error: `dateRange must be one of ${DATE_RANGE_VALUES.join(", ")}` };
    }
    result.dateRange = obj.dateRange as ReturnsDateRange;
  }

  if (obj.cashierName !== undefined) {
    if (typeof obj.cashierName !== "string" || obj.cashierName.trim().length === 0) {
      return { ok: false, error: "cashierName must be a non-empty string when provided" };
    }
    if (obj.cashierName.length > 200) return { ok: false, error: "cashierName must be 200 characters or fewer" };
    result.cashierName = obj.cashierName.trim();
  }

  return { ok: true, value: result };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type RawEmployeeRow = { id: string; name: string };
export type RawReturnItemRow = {
  id: string;
  sale_id: string;
  product_id: string;
  quantity_returned: number;
  reason: string | null;
  return_number: string | null;
  processed_by: string | null;
  created_at: string;
};
export type RawSaleItemUnitPriceRow = { sale_id: string; product_id: string; unit_price: number };
export type RawProductRow = { id: string; name: string };

export type ReturnsRawData = {
  employees: RawEmployeeRow[];
  /** Already server-filtered: business_id, dateRange (on the return's own created_at), processed_by (if cashierName resolved). */
  returnItems: RawReturnItemRow[];
  saleItemUnitPrices: RawSaleItemUnitPriceRow[];
  products: RawProductRow[];
};

/** Pure shape/aggregate - no I/O, fully unit-testable. */
export function computeReturns(raw: ReturnsRawData): ReturnsOutput {
  const employeeNameById = new Map(raw.employees.map((e) => [e.id, e.name]));
  const productNameById = new Map(raw.products.map((p) => [p.id, p.name]));
  const unitPriceByKey = new Map(raw.saleItemUnitPrices.map((si) => [`${si.sale_id}::${si.product_id}`, si.unit_price]));

  const returns: ReturnLineOutput[] = raw.returnItems.map((r) => {
    const unitPrice = unitPriceByKey.get(`${r.sale_id}::${r.product_id}`) ?? 0;
    return {
      product_id: r.product_id,
      product_name: productNameById.get(r.product_id) ?? "Unknown product",
      quantity_returned: r.quantity_returned,
      reason: r.reason,
      return_number: r.return_number,
      refund_amount: round2(r.quantity_returned * unitPrice),
      processed_by_name: r.processed_by ? employeeNameById.get(r.processed_by) ?? "Unknown" : null,
      created_at: r.created_at,
    };
  });

  const total_quantity_returned = returns.reduce((sum, r) => sum + r.quantity_returned, 0);
  const total_refund_amount = round2(returns.reduce((sum, r) => sum + r.refund_amount, 0));

  return { returns, totals: { count: returns.length, total_quantity_returned, total_refund_amount } };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getReturnsAndRefunds(
  rawInput: unknown,
  ctx: { businessId: string; businessDayStartIso?: string },
  fetcher: (businessId: string, filter: ReturnsInput, businessDayStartIso: string) => Promise<ReturnsRawData>
): Promise<ValidationResult<ReturnsOutput>> {
  const validated = validateReturnsInput(rawInput);
  if (!validated.ok) return validated;
  // businessDayStartIso is supplied by the client (the browser's own local
  // midnight, in UTC terms) so "today" means the STORE's business day, not
  // the server's - a Deno Edge Function has no timezone of its own to fall
  // back on correctly. The fallback here only degrades to the old
  // server-clock behavior for callers that don't supply it (e.g. tests).
  const businessDayStartIso = ctx.businessDayStartIso ?? serverLocalStartOfDayIso();
  const raw = await fetcher(ctx.businessId, validated.value, businessDayStartIso);
  return { ok: true, value: computeReturns(raw) };
}

function serverLocalStartOfDayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/** "today" uses the caller-supplied business-day-start instant directly (no
 * local-timezone decomposition here); "7d"/"30d" are plain rolling windows
 * from the real current instant, which every server clock already gets
 * right regardless of timezone. */
function rangeStartFor(dateRange: ReturnsDateRange, businessDayStartIso: string): string | null {
  if (dateRange === "all") return null;
  if (dateRange === "today") return businessDayStartIso;
  const days = dateRange === "7d" ? 7 : 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter on every query in addition to RLS - defense in depth,
 * matching every other tool executor in this registry.
 */
export async function fetchReturnsRawData(supabase: SupabaseClient, businessId: string, filter: ReturnsInput, businessDayStartIso: string = serverLocalStartOfDayIso()): Promise<ReturnsRawData> {
  const employeesRes = await supabase.from("employees").select("id, name").eq("business_id", businessId);
  if (employeesRes.error) throw employeesRes.error;
  const employees = (employeesRes.data ?? []) as RawEmployeeRow[];

  let processedByFilter: string[] | null = null;
  if (filter.cashierName) {
    const needle = filter.cashierName.toLowerCase();
    processedByFilter = employees.filter((e) => e.name.toLowerCase().includes(needle)).map((e) => e.id);
    if (processedByFilter.length === 0) return { employees, returnItems: [], saleItemUnitPrices: [], products: [] };
  }

  let query = supabase.from("return_items").select("id, sale_id, product_id, quantity_returned, reason, return_number, processed_by, created_at").eq("business_id", businessId);

  const rangeStart = rangeStartFor(filter.dateRange ?? "today", businessDayStartIso);
  if (rangeStart) query = query.gte("created_at", rangeStart);
  if (processedByFilter) query = query.in("processed_by", processedByFilter);

  const returnItemsRes = await query;
  if (returnItemsRes.error) throw returnItemsRes.error;
  const returnItems = (returnItemsRes.data ?? []) as RawReturnItemRow[];

  if (returnItems.length === 0) return { employees, returnItems: [], saleItemUnitPrices: [], products: [] };

  const saleIds = [...new Set(returnItems.map((r) => r.sale_id))];
  const productIds = [...new Set(returnItems.map((r) => r.product_id))];

  const saleItemsRes = await supabase.from("sale_items").select("sale_id, product_id, unit_price").eq("business_id", businessId).in("sale_id", saleIds);
  if (saleItemsRes.error) throw saleItemsRes.error;
  const saleItemUnitPrices = (saleItemsRes.data ?? []) as RawSaleItemUnitPriceRow[];

  const productsRes = await supabase.from("products").select("id, name").eq("business_id", businessId).in("id", productIds);
  if (productsRes.error) throw productsRes.error;
  const products = (productsRes.data ?? []) as RawProductRow[];

  return { employees, returnItems, saleItemUnitPrices, products };
}
