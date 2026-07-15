import { test } from "node:test";
import assert from "node:assert/strict";
import { getCustomersDashboardSummary } from "./customersHelpers.ts";
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
