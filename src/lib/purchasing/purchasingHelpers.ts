import type { PurchaseOrder } from "./types";

/**
 * Pure, stateless Purchasing-domain helpers for the Dashboard summary.
 * Take a plain purchase-order list and return derived values — no Supabase,
 * React state, or other domain's data touched here.
 */

export type PurchasingDashboardSummary = {
  openPoCount: number;
  receivablePOs: PurchaseOrder[];
};

/** Open and receivable purchase-order counts, for the Dashboard's "Receive
 * Today" card and "Open Purchase Orders" business-status card. */
export function getPurchasingDashboardSummary(purchaseOrders: PurchaseOrder[]): PurchasingDashboardSummary {
  const openPoCount = purchaseOrders.filter(po =>
    po.status === 'draft' || po.status === 'ordered' || po.status === 'partially_received'
  ).length;
  const receivablePOs = purchaseOrders.filter(po => po.status === 'ordered' || po.status === 'partially_received');
  return { openPoCount, receivablePOs };
}

export type PoItemReceiptStatus = { received: number; remaining: number };

/**
 * Received/Remaining figures for a single PO line item, used by the PO
 * detail view. quantity_received defaults to 0 (never null in the display),
 * matching how every PO-item loader in App.tsx already normalizes it.
 */
export function getPoItemReceiptStatus(item: { quantity: number; quantity_received: number | null }): PoItemReceiptStatus {
  const received = item.quantity_received ?? 0;
  return { received, remaining: item.quantity - received };
}
