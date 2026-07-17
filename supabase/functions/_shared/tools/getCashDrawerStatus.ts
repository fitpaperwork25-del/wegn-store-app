import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_cash_drawer_status - Cash Drawer read-only lookup.
 *
 * Only one drawer session is ever open per business at a time
 * (loadDrawerSession() in App.tsx: .eq('status','open').limit(1)) - this
 * tool mirrors that exactly, plus drawerCashSales' cash-sales-since-open
 * formula and handleCloseDrawer's expected-cash formula (App.tsx),
 * including the REPORT-004 fix: cash IN is scoped to reportable sales
 * (completed or fully-returned - see isReportableSaleStatus in
 * src/lib/sales/salesHelpers.ts) since the session opened, but cash
 * refunds are matched by the REFUND PAYMENT's own created_at, not the
 * underlying sale's - a refund processed during this session removes
 * cash from the drawer today even if the original sale (and its
 * resulting 'returned' status) is from an earlier session. It
 * deliberately never reports an over/short figure for an open drawer -
 * that requires a physical cash count that hasn't happened yet. Only a
 * closed session (already counted) has a real over/short, and this tool
 * doesn't surface historical closed sessions at all - no existing query
 * in this app lists them, and adding one would be new business logic,
 * not a reuse of what exists.
 */

export type GetCashDrawerStatusInput = Record<string, never>;

export type PaidOutRow = { amount: number; reason: string; created_at: string };

export type CashDrawerSessionStatus = {
  opened_at: string;
  cashier_name: string | null;
  opening_float: number;
  cash_sales_since_open: number;
  total_paid_outs: number;
  paid_outs: PaidOutRow[];
  expected_cash_now: number;
};

export type GetCashDrawerStatusOutput = {
  is_open: boolean;
  session: CashDrawerSessionStatus | null;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** No input fields - only one open drawer session can ever exist per business. */
export function validateGetCashDrawerStatusInput(input: unknown): ValidationResult<GetCashDrawerStatusInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  return { ok: true, value: {} };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type RawDrawerSessionRow = { id: string; cashier_id: string | null; opening_float: number; opened_at: string };
export type RawEmployeeRow = { id: string; name: string };
export type RawPaidOutRow = { amount: number; reason: string; created_at: string };
export type RawSaleRow = { id: string; created_at: string };
export type RawPaymentRow = { sale_id: string; amount: number; payment_type: string; created_at: string };

export type CashDrawerStatusRawData = {
  /** null when no drawer session is currently open for this business. */
  session: RawDrawerSessionRow | null;
  employees: RawEmployeeRow[];
  paidOuts: RawPaidOutRow[];
  /** Reportable (completed or fully-returned) sales since the session opened. */
  salesSinceOpen: RawSaleRow[];
  /** Cash sale payments for salesSinceOpen, plus cash refund payments dated since the session opened (regardless of which sale). */
  cashPayments: RawPaymentRow[];
};

/** Pure shape/aggregate - no I/O, fully unit-testable. */
export function computeCashDrawerStatus(raw: CashDrawerStatusRawData): GetCashDrawerStatusOutput {
  if (!raw.session) return { is_open: false, session: null };

  const employeeNameById = new Map(raw.employees.map((e) => [e.id, e.name]));

  // Exact mirror of drawerCashSales in App.tsx (REPORT-004 fix): cash-in
  // is scoped to sales since the drawer opened; cash refunds are counted
  // regardless of which sale they belong to (the caller already scoped
  // the refund payments it fetched by their own created_at, not the
  // underlying sale's - see fetchCashDrawerStatusRawData).
  let cashIn = 0;
  let cashRefunds = 0;
  for (const p of raw.cashPayments) {
    if (p.payment_type === "refund") cashRefunds += p.amount;
    else cashIn += p.amount;
  }
  const cash_sales_since_open = round2(cashIn - cashRefunds);

  const total_paid_outs = round2(raw.paidOuts.reduce((sum, p) => sum + p.amount, 0));

  // Exact mirror of handleCloseDrawer's expectedCash formula.
  const expected_cash_now = round2(raw.session.opening_float + cash_sales_since_open - total_paid_outs);

  return {
    is_open: true,
    session: {
      opened_at: raw.session.opened_at,
      cashier_name: raw.session.cashier_id ? employeeNameById.get(raw.session.cashier_id) ?? "Unknown" : null,
      opening_float: raw.session.opening_float,
      cash_sales_since_open,
      total_paid_outs,
      paid_outs: raw.paidOuts.map((p) => ({ amount: p.amount, reason: p.reason, created_at: p.created_at })),
      expected_cash_now,
    },
  };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getCashDrawerStatus(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string) => Promise<CashDrawerStatusRawData>
): Promise<ValidationResult<GetCashDrawerStatusOutput>> {
  const validated = validateGetCashDrawerStatusInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId);
  return { ok: true, value: computeCashDrawerStatus(raw) };
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter in addition to RLS - defense in depth, matching every
 * other tool executor in this registry.
 */
export async function fetchCashDrawerStatusRawData(supabase: SupabaseClient, businessId: string): Promise<CashDrawerStatusRawData> {
  const sessionRes = await supabase.from("drawer_sessions").select("id, cashier_id, opening_float, opened_at").eq("business_id", businessId).eq("status", "open").limit(1).maybeSingle();
  if (sessionRes.error) throw sessionRes.error;
  const session = (sessionRes.data ?? null) as RawDrawerSessionRow | null;

  if (!session) return { session: null, employees: [], paidOuts: [], salesSinceOpen: [], cashPayments: [] };

  const employeesRes = await supabase.from("employees").select("id, name").eq("business_id", businessId);
  if (employeesRes.error) throw employeesRes.error;
  const employees = (employeesRes.data ?? []) as RawEmployeeRow[];

  const paidOutsRes = await supabase.from("drawer_paid_outs").select("amount, reason, created_at").eq("business_id", businessId).eq("drawer_session_id", session.id);
  if (paidOutsRes.error) throw paidOutsRes.error;
  const paidOuts = (paidOutsRes.data ?? []) as RawPaidOutRow[];

  // REPORT-004/REPORT-001 fix: include 'returned' alongside 'completed' -
  // a fully-refunded sale must stay counted as part of this session's
  // activity, matching src/lib/sales/salesHelpers.ts's shared rule.
  const salesRes = await supabase.from("sales").select("id, created_at").eq("business_id", businessId).in("status", ["completed", "returned"]).gte("created_at", session.opened_at);
  if (salesRes.error) throw salesRes.error;
  const salesSinceOpen = (salesRes.data ?? []) as RawSaleRow[];

  // Cash sale payments for sales in scope, PLUS cash refund payments
  // dated since the session opened regardless of which sale they belong
  // to - a refund can be processed this session against a sale from an
  // earlier session (or one whose status has since flipped to
  // 'returned'), and cash still left the drawer this session either way.
  const saleIds = salesSinceOpen.map((s) => s.id);
  const salePaymentsRes = saleIds.length > 0
    ? await supabase.from("payments").select("sale_id, amount, payment_type, created_at").eq("business_id", businessId).eq("payment_method", "cash").in("sale_id", saleIds).neq("payment_type", "refund")
    : { data: [], error: null };
  if (salePaymentsRes.error) throw salePaymentsRes.error;

  const refundPaymentsRes = await supabase.from("payments").select("sale_id, amount, payment_type, created_at").eq("business_id", businessId).eq("payment_method", "cash").eq("payment_type", "refund").gte("created_at", session.opened_at);
  if (refundPaymentsRes.error) throw refundPaymentsRes.error;

  const cashPayments = [
    ...((salePaymentsRes.data ?? []) as RawPaymentRow[]),
    ...((refundPaymentsRes.data ?? []) as RawPaymentRow[]),
  ];

  return { session, employees, paidOuts, salesSinceOpen, cashPayments };
}
