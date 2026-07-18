import { test } from "node:test";
import assert from "node:assert/strict";
import { getCustomersDashboardSummary, computeLoyaltyReturnReversal } from "./customersHelpers.ts";
import type { Customer, LoyaltyTransaction } from "./types.ts";

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: "c1",
    name: "Test Customer",
    phone: "555-0100",
    email: null,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeLoyalty(overrides: Partial<LoyaltyTransaction> = {}): LoyaltyTransaction {
  return {
    id: "lt1",
    customer_id: "c1",
    sale_id: null,
    points: 0,
    type: "earn",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

test("getCustomersDashboardSummary counts only active customers", () => {
  const customers = [
    makeCustomer({ id: "c1", status: "active" }),
    makeCustomer({ id: "c2", status: "inactive" }),
    makeCustomer({ id: "c3", status: "active" }),
  ];
  const summary = getCustomersDashboardSummary(customers, []);
  assert.equal(summary.activeCustomerCount, 2);
});

test("getCustomersDashboardSummary sums loyalty points across earn and redeem", () => {
  const loyaltyTransactions = [
    makeLoyalty({ points: 100, type: "earn" }),
    makeLoyalty({ points: -30, type: "redeem" }),
    makeLoyalty({ points: 20, type: "earn" }),
  ];
  const summary = getCustomersDashboardSummary([], loyaltyTransactions);
  assert.equal(summary.pointsOutstanding, 90);
});

test("getCustomersDashboardSummary clamps pointsOutstanding to 0, never negative", () => {
  const loyaltyTransactions = [
    makeLoyalty({ points: 10, type: "earn" }),
    makeLoyalty({ points: -50, type: "redeem" }),
  ];
  const summary = getCustomersDashboardSummary([], loyaltyTransactions);
  assert.equal(summary.pointsOutstanding, 0);
});

test("getCustomersDashboardSummary returns zeroes for empty input", () => {
  const summary = getCustomersDashboardSummary([], []);
  assert.deepEqual(summary, { activeCustomerCount: 0, pointsOutstanding: 0 });
});

// ---------------------------------------------------------------------
// computeLoyaltyReturnReversal — Product Owner decision: a partial return
// reverses only the points tied to what was actually returned, never the
// full amount ever earned on the sale.
// ---------------------------------------------------------------------

test("computeLoyaltyReturnReversal reverses the proportional share for a partial return", () => {
  const loyaltyTransactions = [makeLoyalty({ sale_id: "s1", type: "earn", points: 30 })];
  // Returning 1/3 of the sale's raw subtotal (30 of 90)
  const points = computeLoyaltyReturnReversal({
    saleId: "s1",
    customerId: "c1",
    saleSubtotal: 90,
    returnedSubtotal: 30,
    isFullyReturned: false,
    loyaltyTransactions,
  });
  assert.equal(points, 10);
});

test("computeLoyaltyReturnReversal reverses whatever remains once the sale is fully returned, not just the last event's share", () => {
  const loyaltyTransactions = [
    makeLoyalty({ sale_id: "s1", type: "earn", points: 30 }),
    // A prior partial return already reversed 10
    makeLoyalty({ sale_id: "s1", type: "earn", points: -10 }),
  ];
  const points = computeLoyaltyReturnReversal({
    saleId: "s1",
    customerId: "c1",
    saleSubtotal: 90,
    returnedSubtotal: 60, // this event's share alone would floor to 20, but 20 remain total
    isFullyReturned: true,
    loyaltyTransactions,
  });
  assert.equal(points, 20);
});

test("computeLoyaltyReturnReversal accumulates correctly across two separate partial returns that together fully return the sale", () => {
  const loyaltyTransactions = [makeLoyalty({ sale_id: "s1", type: "earn", points: 30 })];
  const first = computeLoyaltyReturnReversal({
    saleId: "s1", customerId: "c1", saleSubtotal: 90, returnedSubtotal: 30, isFullyReturned: false, loyaltyTransactions,
  });
  assert.equal(first, 10);

  const afterFirst = [...loyaltyTransactions, makeLoyalty({ sale_id: "s1", type: "earn", points: -first })];
  const second = computeLoyaltyReturnReversal({
    saleId: "s1", customerId: "c1", saleSubtotal: 90, returnedSubtotal: 60, isFullyReturned: true, loyaltyTransactions: afterFirst,
  });
  assert.equal(second, 20);
  assert.equal(first + second, 30);
});

test("computeLoyaltyReturnReversal returns 0 when the sale has no customer", () => {
  const loyaltyTransactions = [makeLoyalty({ sale_id: "s1", type: "earn", points: 30 })];
  const points = computeLoyaltyReturnReversal({
    saleId: "s1", customerId: null, saleSubtotal: 90, returnedSubtotal: 90, isFullyReturned: true, loyaltyTransactions,
  });
  assert.equal(points, 0);
});

test("computeLoyaltyReturnReversal returns 0 when no points were ever earned on the sale", () => {
  const points = computeLoyaltyReturnReversal({
    saleId: "s1", customerId: "c1", saleSubtotal: 90, returnedSubtotal: 90, isFullyReturned: true, loyaltyTransactions: [],
  });
  assert.equal(points, 0);
});

test("computeLoyaltyReturnReversal a full return in one event still zeroes out exactly like before", () => {
  const loyaltyTransactions = [makeLoyalty({ sale_id: "s1", type: "earn", points: 14 })];
  const points = computeLoyaltyReturnReversal({
    saleId: "s1", customerId: "c1", saleSubtotal: 90, returnedSubtotal: 90, isFullyReturned: true, loyaltyTransactions,
  });
  assert.equal(points, 14);
});
