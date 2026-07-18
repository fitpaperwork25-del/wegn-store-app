import type { Sale, SaleItemRecord, EodPayment, ReturnItemSummary } from "./types";
import type { ProductStock } from "../product/types";
import type { Employee, DrawerSession, DrawerPaidOut } from "../staff/types";
import type { LoyaltyTransaction } from "../customers/types";

/**
 * Pure, stateless Sales-domain helpers — the single authoritative source
 * for "what counts as a reportable sale" and "what is net revenue" used
 * across every reporting surface (Dashboard, End-of-Day Summary, Reports,
 * Cash Drawer, Customer Summary, Customer Insights). Before this module,
 * six-plus call sites each reimplemented these rules independently and
 * drifted apart (REPORT-001/002/004/005/006) - see the reporting bug-fix
 * investigation. Take plain data (sales, sale items, payments, products)
 * and return derived values — no Supabase, React state, or other
 * domain's data touched here.
 */

/** A sale counts toward reporting once it's 'completed', and STAYS
 * counted even if it's later fully refunded ('returned') - a return is a
 * separate business event from the sale itself, and must not make the
 * sale disappear from a day's/period's activity. 'voided' (never a
 * legitimate completed transaction) and 'open' (still an in-progress
 * cart) are excluded everywhere. */
export const REPORTABLE_SALE_STATUSES = ["completed", "returned"] as const;

export function isReportableSaleStatus(status: string): boolean {
  return (REPORTABLE_SALE_STATUSES as readonly string[]).includes(status);
}

/** Gross sale totals for the given sales, minus refund payments recorded
 * against any of them. A fully-refunded sale nets to $0 rather than
 * either vanishing (if the caller excluded 'returned' sales) or being
 * counted at its full original value (if refunds are never netted). This
 * is the one net-revenue rule shared by every reporting surface. */
export function computeNetRevenue(
  sales: Pick<Sale, "id" | "total">[],
  payments: Pick<EodPayment, "sale_id" | "amount" | "payment_type">[]
): number {
  const saleIds = new Set(sales.map((s) => s.id));
  const gross = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const refunds = payments
    .filter((p) => p.payment_type === "refund" && saleIds.has(p.sale_id))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  return gross - refunds;
}

/**
 * Explicit, timezone-aware business-day boundary check. "Business day" is
 * always the BROWSER'S LOCAL calendar day (never UTC) — every sale/
 * payment/loyalty timestamp from Supabase is a real timestamptz, and
 * `new Date(isoTimestamp)` converts it to local time automatically before
 * `.getFullYear()/getMonth()/getDate()` read out local calendar
 * components. `daysAgo` shifts the reference day backward (0 = today,
 * 1 = yesterday). `referenceNow` defaults to the real current time but is
 * exposed as an explicit parameter specifically so exact moments —
 * including near-midnight boundaries — are directly testable without
 * mocking the global Date constructor (see salesHelpers.test.ts).
 */
export function isSameBusinessDay(isoTimestamp: string, daysAgo: number, referenceNow: Date = new Date()): boolean {
  const target = new Date(referenceNow);
  target.setDate(referenceNow.getDate() - daysAgo);
  const d = new Date(isoTimestamp);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth() === target.getMonth() &&
    d.getDate() === target.getDate()
  );
}

export type SalesDateRange = "today" | "7d" | "30d" | "all";

/** The one "today/7d/30d/all" range-matching rule, shared by every date-range
 * selector in the app (Reports Sales Analytics, Sales History, Profit
 * Report) - previously each of these hand-rolled its own copy of this exact
 * boundary math. "today" defers to isSameBusinessDay (local calendar day);
 * "7d"/"30d" are rolling windows back from referenceNow; "all" matches
 * everything. */
export function isWithinSalesDateRange(isoTimestamp: string, range: SalesDateRange, referenceNow: Date = new Date()): boolean {
  if (range === "all") return true;
  if (range === "today") return isSameBusinessDay(isoTimestamp, 0, referenceNow);
  const days = range === "7d" ? 7 : 30;
  const rangeStart = new Date(referenceNow.getTime() - days * 24 * 60 * 60 * 1000);
  return new Date(isoTimestamp) >= rangeStart;
}

export type SalesTodaySummary = {
  revenueToday: number;
  txnCount: number;
  avgSale: number;
  yesterdaySalesCount: number;
  yesterdayRevenue: number;
  yesterdayProfit: number | null;
  yesterdayCash: number;
  topYesterdayId: string | null;
  topYesterdayName: string;
  topYesterdayQty: number;
};

/** Today's and yesterday's sales performance, for the Dashboard's "Today's
 * Operations" and "Yesterday's Summary" cards. */
export function getSalesTodaySummary(
  sales: Sale[],
  saleItems: SaleItemRecord[],
  allPayments: EodPayment[],
  products: ProductStock[],
  productIdMap: Record<string, ProductStock>,
  referenceNow: Date = new Date()
): SalesTodaySummary {
  const todaySales = sales.filter(
    (s) => isReportableSaleStatus(s.status) && isSameBusinessDay(s.created_at, 0, referenceNow)
  );
  const revenueToday = computeNetRevenue(todaySales, allPayments);
  const txnCount = todaySales.length;
  const avgSale = txnCount > 0 ? revenueToday / txnCount : 0;

  // Same reportable-sale + net-revenue rule as "today" above (previously
  // "completed"-only here, so a yesterday sale that was later fully
  // refunded silently vanished from Yesterday's Summary instead of netting
  // to reflect its refund - the same class of bug REPORT-001 fixed
  // elsewhere).
  const yesterdaySales = sales.filter(
    (s) => isReportableSaleStatus(s.status) && isSameBusinessDay(s.created_at, 1, referenceNow)
  );
  const yesterdaySaleIds = new Set(yesterdaySales.map((s) => s.id));
  const yesterdayRevenue = computeNetRevenue(yesterdaySales, allPayments);
  const yesterdayItems = saleItems.filter((si) => yesterdaySaleIds.has(si.sale_id));
  const productCostMap = Object.fromEntries(products.map((p) => [p.product_id, p.average_cost ?? 0]));
  const yesterdayCOGS = yesterdayItems.reduce((sum, si) => sum + si.quantity * (productCostMap[si.product_id] ?? 0), 0);
  const yesterdayProfit = (yesterdayItems.length > 0 && yesterdayCOGS > 0) ? yesterdayRevenue - yesterdayCOGS : null;
  const yesterdayCashIn = allPayments
    .filter((p) => yesterdaySaleIds.has(p.sale_id) && p.payment_method === "cash" && p.payment_type !== "refund")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const yesterdayCashRefunds = allPayments
    .filter((p) => yesterdaySaleIds.has(p.sale_id) && p.payment_method === "cash" && p.payment_type === "refund")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const yesterdayCash = yesterdayCashIn - yesterdayCashRefunds;
  const qtyBySku: Record<string, number> = {};
  for (const si of yesterdayItems) qtyBySku[si.product_id] = (qtyBySku[si.product_id] ?? 0) + si.quantity;
  const topYesterdayId = Object.entries(qtyBySku).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topYesterdayName = topYesterdayId ? (productIdMap[topYesterdayId]?.product_name ?? "—") : "—";
  const topYesterdayQty = topYesterdayId ? qtyBySku[topYesterdayId] : 0;

  return {
    revenueToday, txnCount, avgSale,
    yesterdaySalesCount: yesterdaySales.length, yesterdayRevenue, yesterdayProfit, yesterdayCash,
    topYesterdayId, topYesterdayName, topYesterdayQty,
  };
}

export type EndOfDaySummaryInput = {
  sales: Sale[];
  saleItems: SaleItemRecord[];
  payments: EodPayment[];
  allReturnItems: ReturnItemSummary[];
  products: ProductStock[];
  loyaltyTransactions: LoyaltyTransaction[];
  employees: Employee[];
  drawerSession: DrawerSession | null;
  drawerPaidOuts: DrawerPaidOut[];
  referenceNow?: Date;
};

export type EndOfDaySummary = {
  todaySales: Sale[];
  todayPayments: EodPayment[];
  transactions: number;
  grossRevenue: number;
  avgSale: number;
  itemsSold: number;
  discountsTotal: number;
  voidedToday: number;
  returnedToday: number;
  returnedUnits: number;
  returnedValue: number;
  cashTotal: number;
  cardTotal: number;
  otherTotal: number;
  loyaltyEarned: number;
  loyaltyRedeemed: number;
  topProducts: { name: string; units: number; revenue: number }[];
  cashierBreakdown: { name: string; count: number; revenue: number }[];
  drawerReconciliation: {
    openingFloat: number;
    cashSales: number;
    paidOuts: number;
    expectedCash: number;
  } | null;
};

/**
 * End-of-Day Summary — the authoritative calculation for the Cash Drawer
 * tab's EOD panel. Replaces two previously-independent, drifted
 * implementations (App.tsx's handleToggleEod fetch-filter and
 * CashDrawerReportPanel's own inline recomputation), both of which
 * excluded 'returned'-status sales entirely (REPORT-001) and matched
 * refund payments to the drawer session by the ORIGINAL SALE's date
 * rather than the refund PAYMENT's own date (REPORT-004) — so a refund
 * processed today against an older or now-'returned' sale was invisible
 * to both the running cash total and the EOD summary, even though cash
 * physically left the drawer today.
 */
export function computeEndOfDaySummary(input: EndOfDaySummaryInput): EndOfDaySummary {
  const referenceNow = input.referenceNow ?? new Date();
  const { sales, saleItems, payments, allReturnItems, products, loyaltyTransactions, employees, drawerSession, drawerPaidOuts } = input;

  const isToday = (d: string) => isSameBusinessDay(d, 0, referenceNow);

  const todaySales = sales.filter((s) => isReportableSaleStatus(s.status) && isToday(s.created_at));
  const todaySaleIds = new Set(todaySales.map((s) => s.id));
  const voidedToday = sales.filter((s) => s.status === "voided" && isToday(s.created_at)).length;
  const returnedToday = sales.filter((s) => s.status === "returned" && isToday(s.created_at)).length;

  const grossRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgSale = todaySales.length > 0 ? grossRevenue / todaySales.length : 0;
  const discountsTotal = todaySales.reduce((sum, s) => sum + Number(s.discount_amount), 0);

  const todayItems = saleItems.filter((si) => todaySaleIds.has(si.sale_id));
  const itemsSold = todayItems.reduce((sum, i) => sum + i.quantity, 0);

  // Payments relevant to today: sale payments for sales that happened
  // today, PLUS refund payments whose own created_at is today — a refund
  // can be processed today against a sale from an earlier day/session,
  // and cash still left the drawer today regardless of when the original
  // sale happened (REPORT-004's core fix).
  const todaySalePayments = payments.filter((p) => p.payment_type !== "refund" && todaySaleIds.has(p.sale_id));
  const todayRefundPayments = payments.filter((p) => p.payment_type === "refund" && isToday(p.created_at));
  const todayPayments = [...todaySalePayments, ...todayRefundPayments];

  function netByMethod(method: "cash" | "card" | "other"): number {
    const matches = (p: EodPayment) =>
      method === "other" ? p.payment_method !== "cash" && p.payment_method !== "card" : p.payment_method === method;
    const inAmt = todaySalePayments.filter(matches).reduce((sum, p) => sum + Number(p.amount), 0);
    const outAmt = todayRefundPayments.filter(matches).reduce((sum, p) => sum + Number(p.amount), 0);
    return inAmt - outAmt;
  }
  const cashTotal = netByMethod("cash");
  const cardTotal = netByMethod("card");
  const otherTotal = netByMethod("other");

  const todayReturns = allReturnItems.filter((ri) => todaySaleIds.has(ri.sale_id));
  const returnedUnits = todayReturns.reduce((sum, ri) => sum + ri.quantity_returned, 0);
  const returnedValue = todayReturns.reduce((sum, ri) => {
    const si = saleItems.find((s) => s.sale_id === ri.sale_id && s.product_id === ri.product_id);
    return sum + (si ? ri.quantity_returned * si.unit_price : 0);
  }, 0);

  const todayLoyalty = loyaltyTransactions.filter((lt) => isToday(lt.created_at));
  const loyaltyEarned = todayLoyalty.filter((lt) => lt.type === "earn" && lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
  const loyaltyRedeemed = todayLoyalty.filter((lt) => lt.type === "redeem").reduce((sum, lt) => sum + Math.abs(lt.points), 0);

  const productNameMap = Object.fromEntries(products.map((p) => [p.product_id, p.product_name]));
  const productTotals: Record<string, { units: number; revenue: number }> = {};
  for (const item of todayItems) {
    if (!productTotals[item.product_id]) productTotals[item.product_id] = { units: 0, revenue: 0 };
    productTotals[item.product_id].units += item.quantity;
    productTotals[item.product_id].revenue += Number(item.line_total);
  }
  const topProducts = Object.entries(productTotals)
    .map(([pid, v]) => ({ name: productNameMap[pid] ?? pid.slice(0, 8), ...v }))
    .sort((a, b) => b.units - a.units);

  const cashierMap = Object.fromEntries(employees.map((e) => [e.id, e.name]));
  const byEmployee: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const s of todaySales) {
    const key = s.cashier_id ?? "__none__";
    if (!byEmployee[key]) byEmployee[key] = { name: s.cashier_id ? (cashierMap[s.cashier_id] ?? s.cashier_id.slice(0, 8)) : "No cashier", count: 0, revenue: 0 };
    byEmployee[key].count++;
    byEmployee[key].revenue += Number(s.total);
  }
  const cashierBreakdown = Object.values(byEmployee).sort((a, b) => b.revenue - a.revenue);

  const drawerReconciliation = drawerSession
    ? (() => {
        const openingFloat = Number(drawerSession.opening_float);
        const paidOuts = drawerPaidOuts.reduce((sum, p) => sum + Number(p.amount), 0);
        return { openingFloat, cashSales: cashTotal, paidOuts, expectedCash: openingFloat + cashTotal - paidOuts };
      })()
    : null;

  return {
    todaySales, todayPayments, transactions: todaySales.length, grossRevenue, avgSale, itemsSold, discountsTotal,
    voidedToday, returnedToday, returnedUnits, returnedValue, cashTotal, cardTotal, otherTotal,
    loyaltyEarned, loyaltyRedeemed, topProducts, cashierBreakdown, drawerReconciliation,
  };
}
