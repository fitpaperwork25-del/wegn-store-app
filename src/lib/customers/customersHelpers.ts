import type { Customer, LoyaltyTransaction } from "./types";

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

export type LoyaltyReturnReversalInput = {
  saleId: string;
  customerId: string | null;
  /** The sale's pre-discount subtotal - points were earned as a single
   *  sale-level amount (floor(discountedSubtotal)), and the discount itself
   *  is a single sale-level amount too, so the returned share of this raw
   *  subtotal is assumed uniform across the cart - the same assumption
   *  already used to apportion tax to returned lines in the return flow. */
  saleSubtotal: number;
  /** Σ(return_qty * unit_price) for the lines in *this* return event only. */
  returnedSubtotal: number;
  /** True once this return exhausts every line on the sale. */
  isFullyReturned: boolean;
  loyaltyTransactions: LoyaltyTransaction[];
};

/**
 * Points to reverse for a single return event against a sale, proportional
 * to the returned lines' share of the sale - not an all-or-nothing reversal
 * of everything ever earned on the sale (Product Owner decision: a partial
 * return should only take back the points tied to what was actually
 * returned).
 *
 * Reversals accumulate across multiple partial-return events on the same
 * sale (each call sees prior reversals via `loyaltyTransactions` and only
 * returns the newly-due share). Once a return makes the sale fully
 * returned, this returns whatever remains unreversed instead of the
 * proportional share for just this event, so floored-point rounding across
 * several partial returns can never leave a stray point stranded once
 * every unit has come back.
 */
export function computeLoyaltyReturnReversal(input: LoyaltyReturnReversalInput): number {
  const { saleId, customerId, saleSubtotal, returnedSubtotal, isFullyReturned, loyaltyTransactions } = input;
  if (!customerId) return 0;

  const saleLoyaltyEarn = loyaltyTransactions.filter(lt => lt.sale_id === saleId && lt.type === 'earn');
  const totalEarned = saleLoyaltyEarn.filter(lt => lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
  if (totalEarned <= 0) return 0;

  const alreadyReversed = -saleLoyaltyEarn.filter(lt => lt.points < 0).reduce((sum, lt) => sum + lt.points, 0);
  const remaining = totalEarned - alreadyReversed;
  if (remaining <= 0) return 0;

  if (isFullyReturned) return remaining;
  if (saleSubtotal <= 0) return 0;

  const proportionalShare = Math.floor(totalEarned * (returnedSubtotal / saleSubtotal));
  return Math.min(proportionalShare, remaining);
}
