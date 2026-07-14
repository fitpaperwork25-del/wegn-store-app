import type { Sale, SaleItemRecord } from "../sales/types";
import type { ProductStock } from "../product/types";
import type { InventoryBatch } from "../inventory/types";

/**
 * Pure, stateless helpers for the Wegn AI Executive Briefing. Same
 * convention as every other lib/*Helpers.ts module in this codebase - no
 * Supabase, no React state, no AI/model calls. The briefing is a plain
 * summary of data the user can already see elsewhere in the app (Dashboard,
 * Reports, Inventory), computed client-side from state App.tsx already
 * loads - it does not go through the Copilot orchestrator or the tool
 * registry, so it carries none of that path's latency and needs none of
 * its audit logging. Only the "Ask Wegn AI" chat below the briefing uses
 * the AI tool-calling flow.
 */

function isToday(dateString: string): boolean {
  const d = new Date(dateString);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

/**
 * Today's completed-sales profit: revenue (sum of each sale's total) minus
 * COGS (sum of quantity * average_cost across today's line items) - the
 * exact same method salesHelpers.ts already uses for yesterdayProfit, kept
 * consistent rather than reinvented. Returns null (not a misleading number)
 * when there's nothing to compute from or cost data isn't configured for
 * any of today's items, matching yesterdayProfit's own safeguard.
 */
export function getTodaysProfitEstimate(
  sales: Sale[],
  saleItems: SaleItemRecord[],
  productIdMap: Record<string, ProductStock>
): number | null {
  const todaySales = sales.filter((s) => s.status === "completed" && isToday(s.created_at));
  const todaySaleIds = new Set(todaySales.map((s) => s.id));
  const revenueToday = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const todayItems = saleItems.filter((si) => todaySaleIds.has(si.sale_id));
  const todayCOGS = todayItems.reduce((sum, si) => sum + si.quantity * (productIdMap[si.product_id]?.average_cost ?? 0), 0);
  return (todayItems.length > 0 && todayCOGS > 0) ? revenueToday - todayCOGS : null;
}

export type PriorityAlert = {
  id: string;
  text: string;
  severity: "high" | "medium";
};

const EXPIRING_SOON_DAYS = 14;
const EXPIRING_URGENT_DAYS = 3;

/**
 * Top N priority alerts, most severe first. Built only from data already
 * loaded at the top level of App.tsx (low-stock products, inventory
 * batches) - deliberately does not include a "supplier payment overdue"
 * category, since this app's data model has no due-date/overdue concept
 * anywhere (supplier statements track invoice totals and payments, not
 * due dates) - inventing an overdue heuristic here would risk showing
 * store owners incorrect financial information, which is worse than
 * showing fewer, accurate alerts.
 */
export function getPriorityAlerts(
  lowStockProducts: ProductStock[],
  batches: InventoryBatch[],
  maxAlerts = 5
): PriorityAlert[] {
  const alerts: PriorityAlert[] = [];

  for (const p of lowStockProducts) {
    const outOfStock = p.quantity_on_hand === 0;
    alerts.push({
      id: `low-stock-${p.product_id}`,
      text: outOfStock
        ? `${p.product_name} is out of stock`
        : `${p.product_name} is below reorder level (${p.quantity_on_hand} left)`,
      severity: outOfStock ? "high" : "medium",
    });
  }

  const now = Date.now();
  const expiringByProduct = new Map<string, { name: string; minDays: number }>();
  for (const b of batches) {
    if (b.status !== "active" || b.quantity_remaining <= 0 || !b.expiration_date) continue;
    const daysUntil = Math.floor((new Date(b.expiration_date).getTime() - now) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0 || daysUntil > EXPIRING_SOON_DAYS) continue;
    const existing = expiringByProduct.get(b.product_id);
    const name = b.product_name ?? "A product";
    if (!existing || daysUntil < existing.minDays) {
      expiringByProduct.set(b.product_id, { name, minDays: daysUntil });
    }
  }
  for (const [productId, info] of expiringByProduct) {
    alerts.push({
      id: `expiring-${productId}`,
      text: info.minDays === 0 ? `${info.name} expires today` : `${info.name} expires in ${info.minDays} day${info.minDays === 1 ? "" : "s"}`,
      severity: info.minDays <= EXPIRING_URGENT_DAYS ? "high" : "medium",
    });
  }

  const severityRank: Record<PriorityAlert["severity"], number> = { high: 0, medium: 1 };
  alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return alerts.slice(0, maxAlerts);
}

/**
 * Best-effort greeting name. Staff sessions have a real name
 * (employees.name); the owner's session only has an email address today -
 * this app's signup flow never captures a name. Falling back to the
 * email's local part is a deliberate, disclosed compromise, not a claim
 * that it's accurate - see the implementation report for the product
 * decision this surfaces (capturing a real name at signup).
 */
export function deriveGreetingName(staffName: string | null, email: string): string {
  if (staffName) {
    const first = staffName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  const localPart = (email.split("@")[0] ?? "").trim();
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  const firstWord = cleaned.split(/\s+/)[0];
  if (!firstWord) return "there";
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
}
