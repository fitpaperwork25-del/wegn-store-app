import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_sales_summary - Sales/POS Intelligence read-only lookup.
 *
 * Covers the transaction-level questions (totals, cash/card split, largest
 * sale, per-cashier breakdown, top products, amount-range filtering) in one
 * tool, mirroring getSalesTodaySummary()'s "completed sales only" rule and
 * loadSales()'s server-side date-range filtering - both in src/App.tsx /
 * src/lib/sales/salesHelpers.ts, not importable from a Deno edge function,
 * so the same business rules are reimplemented here rather than shared.
 */

export type SalesSummaryDateRange = "today" | "7d" | "30d" | "all";

export type SalesSummaryInput = {
  dateRange?: SalesSummaryDateRange;
  cashierName?: string;
  minTotal?: number;
  maxTotal?: number;
};

export type SalesSummarySaleRow = {
  sale_id: string;
  cashier_name: string | null;
  total: number;
  created_at: string;
  payment_methods: string[];
};

export type SalesSummaryCashierBreakdown = { cashier_name: string; sale_count: number; revenue: number };
export type SalesSummaryTopProduct = { product_id: string; product_name: string; qty_sold: number; revenue: number };

export type SalesSummaryOutput = {
  /** Most recent 50 matching sales - totals below are computed over the
   *  FULL matching set, never truncated, even when this list is capped. */
  sales: SalesSummarySaleRow[];
  totals: { count: number; revenue: number; avg_sale: number; largest_sale: number; cash_total: number; card_total: number; other_total: number };
  by_cashier: SalesSummaryCashierBreakdown[];
  top_products: SalesSummaryTopProduct[];
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const DATE_RANGE_VALUES = ["today", "7d", "30d", "all"] as const;
const SALES_LIST_CAP = 50;

export function validateSalesSummaryInput(input: unknown): ValidationResult<SalesSummaryInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: SalesSummaryInput = {};

  if (obj.dateRange !== undefined) {
    if (typeof obj.dateRange !== "string" || !(DATE_RANGE_VALUES as readonly string[]).includes(obj.dateRange)) {
      return { ok: false, error: `dateRange must be one of ${DATE_RANGE_VALUES.join(", ")}` };
    }
    result.dateRange = obj.dateRange as SalesSummaryDateRange;
  }

  if (obj.cashierName !== undefined) {
    if (typeof obj.cashierName !== "string" || obj.cashierName.trim().length === 0) {
      return { ok: false, error: "cashierName must be a non-empty string when provided" };
    }
    if (obj.cashierName.length > 200) return { ok: false, error: "cashierName must be 200 characters or fewer" };
    result.cashierName = obj.cashierName.trim();
  }

  if (obj.minTotal !== undefined) {
    if (typeof obj.minTotal !== "number" || !Number.isFinite(obj.minTotal) || obj.minTotal < 0) {
      return { ok: false, error: "minTotal must be a non-negative number" };
    }
    result.minTotal = obj.minTotal;
  }

  if (obj.maxTotal !== undefined) {
    if (typeof obj.maxTotal !== "number" || !Number.isFinite(obj.maxTotal) || obj.maxTotal < 0) {
      return { ok: false, error: "maxTotal must be a non-negative number" };
    }
    result.maxTotal = obj.maxTotal;
  }

  if (result.minTotal !== undefined && result.maxTotal !== undefined && result.minTotal > result.maxTotal) {
    return { ok: false, error: "minTotal must not be greater than maxTotal" };
  }

  return { ok: true, value: result };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type RawEmployeeRow = { id: string; name: string };
export type RawSaleRow = { id: string; cashier_id: string | null; total: number; created_at: string };
export type RawPaymentRow = { sale_id: string; payment_method: string; amount: number };
export type RawSaleItemProductRow = { sale_id: string; product_id: string; product_name: string; quantity: number; line_total: number };

export type SalesSummaryRawData = {
  employees: RawEmployeeRow[];
  /** Already server-filtered: business_id, status='completed', dateRange, cashier (if resolved), min/maxTotal. */
  sales: RawSaleRow[];
  /** Payments for the candidate sales, payment_type != 'refund' only (actual sale payments). */
  payments: RawPaymentRow[];
  /** sale_items joined to products.name for the candidate sales. */
  saleItemProducts: RawSaleItemProductRow[];
};

/** Pure aggregation - no I/O, fully unit-testable. */
export function computeSalesSummary(raw: SalesSummaryRawData): SalesSummaryOutput {
  const cashierNameById = new Map(raw.employees.map((e) => [e.id, e.name]));

  const paymentsBySale = new Map<string, RawPaymentRow[]>();
  for (const p of raw.payments) {
    const list = paymentsBySale.get(p.sale_id) ?? [];
    list.push(p);
    paymentsBySale.set(p.sale_id, list);
  }

  const sortedSales = [...raw.sales].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const sales: SalesSummarySaleRow[] = sortedSales.slice(0, SALES_LIST_CAP).map((s) => ({
    sale_id: s.id,
    cashier_name: s.cashier_id ? cashierNameById.get(s.cashier_id) ?? "Unknown" : null,
    total: s.total,
    created_at: s.created_at,
    payment_methods: Array.from(new Set((paymentsBySale.get(s.id) ?? []).map((p) => p.payment_method))),
  }));

  const count = raw.sales.length;
  const revenue = round2(raw.sales.reduce((sum, s) => sum + s.total, 0));
  const avg_sale = count > 0 ? round2(revenue / count) : 0;
  const largest_sale = raw.sales.reduce((max, s) => Math.max(max, s.total), 0);

  let cash_total = 0;
  let card_total = 0;
  let other_total = 0;
  for (const p of raw.payments) {
    if (p.payment_method === "cash") cash_total += p.amount;
    else if (p.payment_method === "card") card_total += p.amount;
    else other_total += p.amount;
  }

  const byCashierMap = new Map<string, { sale_count: number; revenue: number }>();
  for (const s of raw.sales) {
    const name = s.cashier_id ? cashierNameById.get(s.cashier_id) ?? "Unknown" : "Unassigned";
    const entry = byCashierMap.get(name) ?? { sale_count: 0, revenue: 0 };
    entry.sale_count += 1;
    entry.revenue = round2(entry.revenue + s.total);
    byCashierMap.set(name, entry);
  }
  const by_cashier = [...byCashierMap.entries()].map(([cashier_name, v]) => ({ cashier_name, ...v })).sort((a, b) => b.revenue - a.revenue);

  const productMap = new Map<string, { product_name: string; qty_sold: number; revenue: number }>();
  for (const si of raw.saleItemProducts) {
    const entry = productMap.get(si.product_id) ?? { product_name: si.product_name, qty_sold: 0, revenue: 0 };
    entry.qty_sold += si.quantity;
    entry.revenue = round2(entry.revenue + si.line_total);
    productMap.set(si.product_id, entry);
  }
  const top_products = [...productMap.entries()]
    .map(([product_id, v]) => ({ product_id, ...v }))
    .sort((a, b) => b.qty_sold - a.qty_sold)
    .slice(0, 15);

  return {
    sales,
    totals: { count, revenue, avg_sale, largest_sale, cash_total: round2(cash_total), card_total: round2(card_total), other_total: round2(other_total) },
    by_cashier,
    top_products,
  };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getSalesSummary(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string, filter: SalesSummaryInput) => Promise<SalesSummaryRawData>
): Promise<ValidationResult<SalesSummaryOutput>> {
  const validated = validateSalesSummaryInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId, validated.value);
  return { ok: true, value: computeSalesSummary(raw) };
}

/** Shared by every sales-domain tool in this file set - not exported, each tool file keeps its own copy rather than cross-importing from src/. */
function rangeStartFor(dateRange: SalesSummaryDateRange): string | null {
  if (dateRange === "all") return null;
  const now = new Date();
  if (dateRange === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const days = dateRange === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function extractProductName(products: { name: string } | { name: string }[] | null): string | null {
  if (!products) return null;
  if (Array.isArray(products)) return products[0]?.name ?? null;
  return products.name ?? null;
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter on every query in addition to RLS - defense in depth,
 * matching every other tool executor in this registry. Status/date-range/
 * amount/cashier filters are all applied as real query predicates.
 */
export async function fetchSalesSummaryRawData(supabase: SupabaseClient, businessId: string, filter: SalesSummaryInput): Promise<SalesSummaryRawData> {
  const employeesRes = await supabase.from("employees").select("id, name").eq("business_id", businessId);
  if (employeesRes.error) throw employeesRes.error;
  const employees = (employeesRes.data ?? []) as RawEmployeeRow[];

  let cashierIdFilter: string[] | null = null;
  if (filter.cashierName) {
    const needle = filter.cashierName.toLowerCase();
    cashierIdFilter = employees.filter((e) => e.name.toLowerCase().includes(needle)).map((e) => e.id);
    if (cashierIdFilter.length === 0) return { employees, sales: [], payments: [], saleItemProducts: [] };
  }

  let query = supabase.from("sales").select("id, cashier_id, total, created_at").eq("business_id", businessId).eq("status", "completed");

  const rangeStart = rangeStartFor(filter.dateRange ?? "today");
  if (rangeStart) query = query.gte("created_at", rangeStart);
  if (filter.minTotal !== undefined) query = query.gte("total", filter.minTotal);
  if (filter.maxTotal !== undefined) query = query.lte("total", filter.maxTotal);
  if (cashierIdFilter) query = query.in("cashier_id", cashierIdFilter);

  const salesRes = await query;
  if (salesRes.error) throw salesRes.error;
  const sales = (salesRes.data ?? []) as RawSaleRow[];

  if (sales.length === 0) return { employees, sales: [], payments: [], saleItemProducts: [] };

  const saleIds = sales.map((s) => s.id);

  const paymentsRes = await supabase.from("payments").select("sale_id, payment_method, amount, payment_type").eq("business_id", businessId).in("sale_id", saleIds).neq("payment_type", "refund");
  if (paymentsRes.error) throw paymentsRes.error;
  const payments = ((paymentsRes.data ?? []) as { sale_id: string; payment_method: string; amount: number }[]).map((p) => ({ sale_id: p.sale_id, payment_method: p.payment_method, amount: p.amount }));

  const itemsRes = await supabase.from("sale_items").select("sale_id, product_id, quantity, line_total, products(name)").in("sale_id", saleIds);
  if (itemsRes.error) throw itemsRes.error;
  const saleItemProducts: RawSaleItemProductRow[] = ((itemsRes.data ?? []) as { sale_id: string; product_id: string; quantity: number; line_total: number; products: { name: string } | { name: string }[] | null }[])
    .map((row) => ({ sale_id: row.sale_id, product_id: row.product_id, product_name: extractProductName(row.products), quantity: row.quantity, line_total: row.line_total }))
    .filter((r): r is RawSaleItemProductRow => r.product_name !== null);

  return { employees, sales, payments, saleItemProducts };
}
