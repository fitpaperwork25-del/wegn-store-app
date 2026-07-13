import type { Customer, LoyaltyTransaction } from "../../App";

/**
 * Pure, stateless Customers-domain helpers for the Dashboard summary.
 * Take plain customer/loyalty data and return derived values — no Supabase,
 * React state, or other domain's data touched here.
 */

export type CustomersDashboardSummary = {
  activeCustomerCount: number;
  pointsOutstanding: number;
};

/** Active customer count and outstanding loyalty points, for the
 * Dashboard's "Business Status" cards. */
export function getCustomersDashboardSummary(
  customers: Customer[],
  loyaltyTransactions: LoyaltyTransaction[]
): CustomersDashboardSummary {
  const activeCustomerCount = customers.filter(c => c.status === 'active').length;
  const pointsOutstanding = Math.max(0, loyaltyTransactions.reduce((sum, lt) => sum + lt.points, 0));
  return { activeCustomerCount, pointsOutstanding };
}
