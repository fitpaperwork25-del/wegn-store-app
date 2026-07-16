import type { Sale, SaleItemRecord, EodPayment } from "./types";
import type { ProductStock } from "../product/types";

/**
 * Pure, stateless Sales-domain helpers for the Dashboard summary.
 * Take plain data (sales, sale items, payments, products) and return derived
 * values — no Supabase, React state, or other domain's data touched here.
 */

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
  productIdMap: Record<string, ProductStock>
): SalesTodaySummary {
  const today = new Date();
  // "Today's activity" is every sale that occurred today, whether it's
  // still completed or has since been fully returned - a return is a
  // separate business event from the sale itself, and must not make the
  // sale disappear from the day's activity. Voided sales (never a
  // legitimate completed transaction) remain excluded, matching every
  // other sales-status filter in the app (Analytics, Sales History, etc.).
  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at);
    return (s.status === 'completed' || s.status === 'returned') &&
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  });
  const todaySaleIds = new Set(todaySales.map(s => s.id));
  // Net revenue, consistent with how cash/card/other totals are already
  // computed elsewhere (App.tsx's analyticsData): gross sale totals minus
  // any refund payments recorded against those sales, whether the return
  // was partial or full. A fully-returned sale nets to $0 rather than
  // vanishing from the total.
  const todayGrossRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const todayRefunds = allPayments
    .filter(p => p.payment_type === 'refund' && todaySaleIds.has(p.sale_id))
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const revenueToday = todayGrossRevenue - todayRefunds;
  const txnCount = todaySales.length;
  const avgSale = txnCount > 0 ? revenueToday / txnCount : 0;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = (d: string) => {
    const dt = new Date(d);
    return dt.getFullYear() === yesterday.getFullYear() &&
      dt.getMonth() === yesterday.getMonth() &&
      dt.getDate() === yesterday.getDate();
  };
  const yesterdaySales = sales.filter(s => s.status === 'completed' && isYesterday(s.created_at));
  const yesterdaySaleIds = new Set(yesterdaySales.map(s => s.id));
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const yesterdayItems = saleItems.filter(si => yesterdaySaleIds.has(si.sale_id));
  const productCostMap = Object.fromEntries(products.map(p => [p.product_id, p.average_cost ?? 0]));
  const yesterdayCOGS = yesterdayItems.reduce((sum, si) => sum + si.quantity * (productCostMap[si.product_id] ?? 0), 0);
  const yesterdayProfit = (yesterdayItems.length > 0 && yesterdayCOGS > 0) ? yesterdayRevenue - yesterdayCOGS : null;
  const yesterdayCash = allPayments
    .filter(p => yesterdaySaleIds.has(p.sale_id) && p.payment_method === 'cash' && p.payment_type !== 'refund')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const qtyBySku: Record<string, number> = {};
  for (const si of yesterdayItems) qtyBySku[si.product_id] = (qtyBySku[si.product_id] ?? 0) + si.quantity;
  const topYesterdayId = Object.entries(qtyBySku).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topYesterdayName = topYesterdayId ? (productIdMap[topYesterdayId]?.product_name ?? '—') : '—';
  const topYesterdayQty = topYesterdayId ? qtyBySku[topYesterdayId] : 0;

  return {
    revenueToday, txnCount, avgSale,
    yesterdaySalesCount: yesterdaySales.length, yesterdayRevenue, yesterdayProfit, yesterdayCash,
    topYesterdayId, topYesterdayName, topYesterdayQty,
  };
}
