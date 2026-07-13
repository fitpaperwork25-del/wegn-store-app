import type { ProductStock } from "../product/types";

/**
 * Pure, stateless Inventory-domain helpers for the Dashboard summary.
 * Take a plain low-stock product list and return derived values — no
 * Supabase, React state, or other domain's data touched here.
 */

export type InventoryDashboardSummary = {
  buyTodayCost: number;
  outOfStockCount: number;
};

/** Reorder cost estimate and out-of-stock count for currently low-stock
 * products, for the Dashboard's "Buy Today" and "Inventory Alerts" cards. */
export function getInventoryDashboardSummary(lowStockProducts: ProductStock[]): InventoryDashboardSummary {
  const buyTodayCost = lowStockProducts.reduce((sum, p) => {
    const qty = Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand);
    return sum + qty * (p.cost_price ?? p.average_cost ?? 0);
  }, 0);
  const outOfStockCount = lowStockProducts.filter(p => p.quantity_on_hand === 0).length;
  return { buyTodayCost, outOfStockCount };
}
