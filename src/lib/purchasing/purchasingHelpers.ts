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

export type SupplierInvoiceStatus = "outstanding" | "partial" | "paid";

/**
 * Supplier Accounts Payable Phase 1. Same formula the existing Supplier
 * Statement already computed inline for receiving_session-sourced rows -
 * centralized here so supplier_invoices-sourced rows use the identical rule
 * rather than a second, potentially-drifting copy.
 */
export function getSupplierInvoiceStatus(invoiceTotal: number, paid: number): SupplierInvoiceStatus {
  const remaining = Math.round((invoiceTotal - paid) * 100) / 100;
  if (remaining <= 0) return "paid";
  if (paid > 0) return "partial";
  return "outstanding";
}

export type RunningBalanceEntry = { paymentId: string; amount: number; balanceAfter: number };

/** Payment History's running-balance column: original amount minus each
 * payment in order, rounded to cents after every step so display never
 * shows floating-point drift. */
export function computePaymentRunningBalance(
  originalAmount: number,
  payments: { id: string; amount: number }[]
): RunningBalanceEntry[] {
  let balance = originalAmount;
  return payments.map((p) => {
    balance = Math.round((balance - p.amount) * 100) / 100;
    return { paymentId: p.id, amount: p.amount, balanceAfter: balance };
  });
}
