import { test } from "node:test";
import assert from "node:assert/strict";
import { getSalesTodaySummary, isSameBusinessDay, computeNetRevenue, computeEndOfDaySummary, isWithinSalesDateRange } from "./salesHelpers.ts";
import type { Sale, SaleItemRecord, EodPayment, ReturnItemSummary } from "./types.ts";
import type { ProductStock } from "../product/types.ts";
import type { Employee, DrawerSession, DrawerPaidOut } from "../staff/types.ts";
import type { LoyaltyTransaction } from "../customers/types.ts";

// getSalesTodaySummary compares created_at against `new Date()` internally,
// so fixtures must be built relative to the actual current time, not
// hardcoded dates, to stay correct regardless of when the suite runs.
function todayAt(hour: number): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function yesterdayAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: "s1",
    cashier_id: null,
    customer_id: null,
    subtotal: 10,
    tax: 0,
    discount_amount: 0,
    total: 10,
    status: "completed",
    created_at: todayAt(10),
    ...overrides,
  };
}

function makeSaleItem(overrides: Partial<SaleItemRecord> = {}): SaleItemRecord {
  return {
    sale_id: "s1",
    product_id: "p1",
    quantity: 1,
    unit_price: 10,
    line_total: 10,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<ProductStock> = {}): ProductStock {
  return {
    inventory_id: "inv1",
    business_id: "biz1",
    product_id: "p1",
    product_name: "Test Product",
    sku: null,
    barcode: null,
    selling_price: 10,
    quantity_on_hand: 100,
    reorder_level: 10,
    status: "active",
    average_cost: 4,
    cost_price: null,
    estimated_overhead_pct: 0,
    target_margin_percent: null,
    minimum_margin_percent: null,
    supplier_id: null,
    category_id: null,
    ...overrides,
  };
}

test("getSalesTodaySummary sums only today's completed sales for revenue/txnCount/avgSale", () => {
  const sales = [
    makeSale({ id: "s1", total: 30, created_at: todayAt(9) }),
    makeSale({ id: "s2", total: 20, created_at: todayAt(15) }),
    makeSale({ id: "s3", total: 999, status: "open", created_at: todayAt(10) }), // not completed
    makeSale({ id: "s4", total: 999, created_at: yesterdayAt(10) }), // yesterday
  ];
  const summary = getSalesTodaySummary(sales, [], [], [], {});
  assert.equal(summary.revenueToday, 50);
  assert.equal(summary.txnCount, 2);
  assert.equal(summary.avgSale, 25);
});

test("getSalesTodaySummary avgSale is 0 when there are no sales today", () => {
  const summary = getSalesTodaySummary([], [], [], [], {});
  assert.equal(summary.avgSale, 0);
  assert.equal(summary.txnCount, 0);
});

test("getSalesTodaySummary keeps a fully-returned sale in today's txnCount but nets its revenue to $0", () => {
  const sales = [
    makeSale({ id: "s1", total: 10, status: "returned", created_at: todayAt(9) }),
  ];
  const payments: EodPayment[] = [
    { sale_id: "s1", payment_method: "cash", amount: 10, payment_type: "refund", created_at: todayAt(9) },
  ];
  const summary = getSalesTodaySummary(sales, [], payments, [], {});
  assert.equal(summary.revenueToday, 0);
  assert.equal(summary.txnCount, 1);
  assert.equal(summary.avgSale, 0);
});

test("getSalesTodaySummary nets a partial return against today's revenue without excluding the sale", () => {
  const sales = [
    makeSale({ id: "s1", total: 30, status: "completed", created_at: todayAt(9) }),
  ];
  const payments: EodPayment[] = [
    { sale_id: "s1", payment_method: "cash", amount: 10, payment_type: "refund", created_at: todayAt(9) },
  ];
  const summary = getSalesTodaySummary(sales, [], payments, [], {});
  assert.equal(summary.revenueToday, 20);
  assert.equal(summary.txnCount, 1);
});

test("getSalesTodaySummary still excludes voided sales from today's activity", () => {
  const sales = [
    makeSale({ id: "s1", total: 999, status: "voided", created_at: todayAt(9) }),
  ];
  const summary = getSalesTodaySummary(sales, [], [], [], {});
  assert.equal(summary.revenueToday, 0);
  assert.equal(summary.txnCount, 0);
});

test("getSalesTodaySummary computes yesterday's revenue, count, and profit from COGS", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const saleItems = [makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 5 })];
  const products = [makeProduct({ product_id: "p1", average_cost: 4 })];
  const productIdMap = { p1: products[0] };
  const summary = getSalesTodaySummary(sales, saleItems, [], products, productIdMap);
  assert.equal(summary.yesterdaySalesCount, 1);
  assert.equal(summary.yesterdayRevenue, 100);
  // COGS = 5 * 4 = 20; profit = 100 - 20 = 80
  assert.equal(summary.yesterdayProfit, 80);
});

test("getSalesTodaySummary keeps a fully-returned yesterday sale in yesterdaySalesCount but nets its revenue to $0", () => {
  const sales = [makeSale({ id: "y1", total: 100, status: "returned", created_at: yesterdayAt(10) })];
  const payments: EodPayment[] = [
    { sale_id: "y1", payment_method: "cash", amount: 100, payment_type: "refund", created_at: yesterdayAt(10) },
  ];
  const summary = getSalesTodaySummary(sales, [], payments, [], {});
  assert.equal(summary.yesterdaySalesCount, 1);
  assert.equal(summary.yesterdayRevenue, 0);
});

test("getSalesTodaySummary yesterdayProfit is null when there's no cost data", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const saleItems = [makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 5 })];
  const products = [makeProduct({ product_id: "p1", average_cost: 0 })];
  const summary = getSalesTodaySummary(sales, saleItems, [], products, { p1: products[0] });
  assert.equal(summary.yesterdayProfit, null);
});

test("getSalesTodaySummary yesterdayProfit is null when there are no items", () => {
  const sales = [makeSale({ id: "y1", total: 100, created_at: yesterdayAt(10) })];
  const summary = getSalesTodaySummary(sales, [], [], [], {});
  assert.equal(summary.yesterdayProfit, null);
});

test("getSalesTodaySummary nets yesterday's cash refunds out of yesterday's cash total, excluding other methods", () => {
  const sales = [makeSale({ id: "y1", created_at: yesterdayAt(10) })];
  const payments: EodPayment[] = [
    { sale_id: "y1", payment_method: "cash", amount: 40, payment_type: "sale", created_at: yesterdayAt(10) },
    { sale_id: "y1", payment_method: "cash", amount: 15, payment_type: "refund", created_at: yesterdayAt(10) },
    { sale_id: "y1", payment_method: "card", amount: 25, payment_type: "sale", created_at: yesterdayAt(10) },
  ];
  const summary = getSalesTodaySummary(sales, [], payments, [], {});
  assert.equal(summary.yesterdayCash, 25);
});

test("getSalesTodaySummary identifies yesterday's top-selling product by quantity", () => {
  const sales = [makeSale({ id: "y1", created_at: yesterdayAt(10) })];
  const saleItems = [
    makeSaleItem({ sale_id: "y1", product_id: "p1", quantity: 3 }),
    makeSaleItem({ sale_id: "y1", product_id: "p2", quantity: 7 }),
  ];
  const products = [
    makeProduct({ product_id: "p1", product_name: "Cola" }),
    makeProduct({ product_id: "p2", product_name: "Chips" }),
  ];
  const productIdMap = Object.fromEntries(products.map(p => [p.product_id, p]));
  const summary = getSalesTodaySummary(sales, saleItems, [], products, productIdMap);
  assert.equal(summary.topYesterdayId, "p2");
  assert.equal(summary.topYesterdayName, "Chips");
  assert.equal(summary.topYesterdayQty, 7);
});

test("getSalesTodaySummary reports no top product when yesterday had no sales", () => {
  const summary = getSalesTodaySummary([], [], [], [], {});
  assert.equal(summary.topYesterdayId, null);
  assert.equal(summary.topYesterdayName, "—");
  assert.equal(summary.topYesterdayQty, 0);
});

// ---------------------------------------------------------------------
// isSameBusinessDay — REPORT-003 (Yesterday's Summary displays today's
// data). All cases below pin `referenceNow` explicitly so they are exact
// and reproducible regardless of when the suite runs, including the
// near-midnight boundaries where a naive implementation is most likely to
// misclassify a timestamp.
// ---------------------------------------------------------------------

test("isSameBusinessDay: a timestamp at local midnight is 'today', not 'yesterday'", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0); // June 15, 2026, noon local
  const midnightToday = new Date(2026, 5, 15, 0, 0, 0).toISOString();
  assert.equal(isSameBusinessDay(midnightToday, 0, referenceNow), true);
  assert.equal(isSameBusinessDay(midnightToday, 1, referenceNow), false);
});

test("isSameBusinessDay: a timestamp one second before local midnight is still 'yesterday', not 'today'", () => {
  const referenceNow = new Date(2026, 5, 15, 0, 0, 5); // just after midnight, June 15
  const justBeforeMidnight = new Date(2026, 5, 14, 23, 59, 59).toISOString();
  assert.equal(isSameBusinessDay(justBeforeMidnight, 1, referenceNow), true);
  assert.equal(isSameBusinessDay(justBeforeMidnight, 0, referenceNow), false);
});

test("isSameBusinessDay: 'now' itself one second before midnight still resolves 'today' correctly", () => {
  const referenceNow = new Date(2026, 5, 15, 23, 59, 59);
  const sameMoment = referenceNow.toISOString();
  assert.equal(isSameBusinessDay(sameMoment, 0, referenceNow), true);
});

test("isSameBusinessDay: correctly rolls back across a month boundary", () => {
  const referenceNow = new Date(2026, 6, 1, 9, 0, 0); // July 1, 2026
  const lastDayOfJune = new Date(2026, 5, 30, 22, 0, 0).toISOString();
  assert.equal(isSameBusinessDay(lastDayOfJune, 1, referenceNow), true);
});

test("isSameBusinessDay: correctly rolls back across a year boundary", () => {
  const referenceNow = new Date(2027, 0, 1, 9, 0, 0); // Jan 1, 2027
  const newYearsEve = new Date(2026, 11, 31, 22, 0, 0).toISOString();
  assert.equal(isSameBusinessDay(newYearsEve, 1, referenceNow), true);
});

test("isSameBusinessDay: two days ago is never mistaken for yesterday", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0);
  const twoDaysAgo = new Date(2026, 5, 13, 12, 0, 0).toISOString();
  assert.equal(isSameBusinessDay(twoDaysAgo, 1, referenceNow), false);
});

// ---------------------------------------------------------------------
// isWithinSalesDateRange — the one range-matching rule shared by Reports
// Sales Analytics, Sales History, and Profit Report (previously each had
// its own hand-rolled copy of this exact boundary math).
// ---------------------------------------------------------------------

test("isWithinSalesDateRange: 'today' matches only the local business day", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0);
  const earlierToday = new Date(2026, 5, 15, 0, 0, 1).toISOString();
  const yesterday = new Date(2026, 5, 14, 23, 59, 59).toISOString();
  assert.equal(isWithinSalesDateRange(earlierToday, "today", referenceNow), true);
  assert.equal(isWithinSalesDateRange(yesterday, "today", referenceNow), false);
});

test("isWithinSalesDateRange: '7d' includes exactly 7 rolling days back, excludes the 8th", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0);
  const sixDaysAgo = new Date(referenceNow.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const eightDaysAgo = new Date(referenceNow.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isWithinSalesDateRange(sixDaysAgo, "7d", referenceNow), true);
  assert.equal(isWithinSalesDateRange(eightDaysAgo, "7d", referenceNow), false);
});

test("isWithinSalesDateRange: '30d' includes exactly 30 rolling days back, excludes the 31st", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0);
  const twentyNineDaysAgo = new Date(referenceNow.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyOneDaysAgo = new Date(referenceNow.getTime() - 31 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isWithinSalesDateRange(twentyNineDaysAgo, "30d", referenceNow), true);
  assert.equal(isWithinSalesDateRange(thirtyOneDaysAgo, "30d", referenceNow), false);
});

test("isWithinSalesDateRange: 'all' matches any timestamp, including far in the past", () => {
  const referenceNow = new Date(2026, 5, 15, 12, 0, 0);
  const longAgo = new Date(2020, 0, 1).toISOString();
  assert.equal(isWithinSalesDateRange(longAgo, "all", referenceNow), true);
});

// ---------------------------------------------------------------------
// getSalesTodaySummary with an explicit referenceNow — proves the
// Dashboard's yesterday/today split holds up exactly at a midnight
// boundary, not just "sometime today vs sometime yesterday".
// ---------------------------------------------------------------------

test("getSalesTodaySummary: a sale one second before midnight stays in yesterday's summary, not today's", () => {
  const referenceNow = new Date(2026, 5, 15, 0, 0, 10); // 10 seconds into June 15
  const sales = [
    makeSale({ id: "s1", total: 50, created_at: new Date(2026, 5, 14, 23, 59, 59).toISOString() }),
  ];
  const summary = getSalesTodaySummary(sales, [], [], [], {}, referenceNow);
  assert.equal(summary.txnCount, 0);
  assert.equal(summary.revenueToday, 0);
  assert.equal(summary.yesterdaySalesCount, 1);
  assert.equal(summary.yesterdayRevenue, 50);
});

test("getSalesTodaySummary: a sale one second after midnight is today's, not yesterday's", () => {
  const referenceNow = new Date(2026, 5, 15, 0, 0, 10);
  const sales = [
    makeSale({ id: "s1", total: 50, created_at: new Date(2026, 5, 15, 0, 0, 1).toISOString() }),
  ];
  const summary = getSalesTodaySummary(sales, [], [], [], {}, referenceNow);
  assert.equal(summary.txnCount, 1);
  assert.equal(summary.revenueToday, 50);
  assert.equal(summary.yesterdaySalesCount, 0);
});

// ---------------------------------------------------------------------
// computeNetRevenue
// ---------------------------------------------------------------------

test("computeNetRevenue: sums gross totals when there are no refunds", () => {
  const sales = [makeSale({ id: "s1", total: 30 }), makeSale({ id: "s2", total: 20 })];
  assert.equal(computeNetRevenue(sales, []), 50);
});

test("computeNetRevenue: subtracts refund payments matched to the given sales", () => {
  const sales = [makeSale({ id: "s1", total: 100 })];
  const payments: EodPayment[] = [
    { sale_id: "s1", payment_method: "cash", amount: 30, payment_type: "refund", created_at: todayAt(10) },
  ];
  assert.equal(computeNetRevenue(sales, payments), 70);
});

test("computeNetRevenue: ignores refunds for sales not in the given list", () => {
  const sales = [makeSale({ id: "s1", total: 100 })];
  const payments: EodPayment[] = [
    { sale_id: "s-not-included", payment_method: "cash", amount: 30, payment_type: "refund", created_at: todayAt(10) },
  ];
  assert.equal(computeNetRevenue(sales, payments), 100);
});

// ---------------------------------------------------------------------
// computeEndOfDaySummary — REPORT-001 (EOD excludes valid completed
// sales / shows 0 when a returned sale is present) and REPORT-004 (cash
// drawer reconciliation ignores refunds against out-of-scope sales).
// ---------------------------------------------------------------------

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return { id: "e1", business_id: "biz1", name: "Cashier One", employee_code: "C1", role: "cashier", status: "active", pin: "1234", created_at: todayAt(8), ...overrides };
}
function makeDrawerSession(overrides: Partial<DrawerSession> = {}): DrawerSession {
  return { id: "d1", business_id: "biz1", cashier_id: "e1", status: "open", opening_float: 50, opened_at: todayAt(8), closed_at: null, closing_count: null, expected_cash: null, over_short: null, notes: null, created_at: todayAt(8), ...overrides };
}
function makePaidOut(overrides: Partial<DrawerPaidOut> = {}): DrawerPaidOut {
  return { id: "po1", drawer_session_id: "d1", amount: 5, reason: "safe drop", created_at: todayAt(11), ...overrides };
}
function makeLoyaltyTx(overrides: Partial<LoyaltyTransaction> = {}): LoyaltyTransaction {
  return { id: "lt1", customer_id: "c1", sale_id: "s1", points: 10, type: "earn", created_at: todayAt(10), ...overrides };
}
function baseEodInput(overrides: Partial<Parameters<typeof computeEndOfDaySummary>[0]> = {}) {
  return {
    sales: [] as Sale[],
    saleItems: [] as SaleItemRecord[],
    payments: [] as EodPayment[],
    allReturnItems: [] as ReturnItemSummary[],
    products: [] as ProductStock[],
    loyaltyTransactions: [] as LoyaltyTransaction[],
    employees: [] as Employee[],
    drawerSession: null as DrawerSession | null,
    drawerPaidOuts: [] as DrawerPaidOut[],
    ...overrides,
  };
}

test("computeEndOfDaySummary: a fully-returned sale stays counted (REPORT-001) instead of zeroing the day", () => {
  const sales = [makeSale({ id: "s1", total: 40, status: "returned", created_at: todayAt(9) })];
  const summary = computeEndOfDaySummary(baseEodInput({ sales }));
  assert.equal(summary.transactions, 1);
  assert.equal(summary.grossRevenue, 40);
});

test("computeEndOfDaySummary: excludes voided and open sales from transactions/revenue", () => {
  const sales = [
    makeSale({ id: "s1", total: 999, status: "voided", created_at: todayAt(9) }),
    makeSale({ id: "s2", total: 999, status: "open", created_at: todayAt(9) }),
  ];
  const summary = computeEndOfDaySummary(baseEodInput({ sales }));
  assert.equal(summary.transactions, 0);
  assert.equal(summary.grossRevenue, 0);
  assert.equal(summary.voidedToday, 1);
});

test("computeEndOfDaySummary: a cash refund against a sale from an earlier day still reduces today's cash total (REPORT-004)", () => {
  const sales = [makeSale({ id: "s-old", total: 100, status: "returned", created_at: yesterdayAt(9) })];
  const payments: EodPayment[] = [
    { sale_id: "s-old", payment_method: "cash", amount: 100, payment_type: "refund", created_at: todayAt(11) },
  ];
  const summary = computeEndOfDaySummary(baseEodInput({ sales, payments }));
  // The old sale itself isn't part of today's transactions/revenue...
  assert.equal(summary.transactions, 0);
  // ...but the refund payment, dated today, still shows up as cash leaving the drawer today.
  assert.equal(summary.cashTotal, -100);
});

test("computeEndOfDaySummary: drawer reconciliation nets opening float, cash sales, and paid outs", () => {
  const sales = [makeSale({ id: "s1", total: 60, created_at: todayAt(9) })];
  const payments: EodPayment[] = [
    { sale_id: "s1", payment_method: "cash", amount: 60, payment_type: "sale", created_at: todayAt(9) },
  ];
  const drawerSession = makeDrawerSession({ opening_float: 50 });
  const drawerPaidOuts = [makePaidOut({ amount: 10 })];
  const summary = computeEndOfDaySummary(baseEodInput({ sales, payments, drawerSession, drawerPaidOuts }));
  assert.equal(summary.cashTotal, 60);
  assert.deepEqual(summary.drawerReconciliation, { openingFloat: 50, cashSales: 60, paidOuts: 10, expectedCash: 100 });
});

test("computeEndOfDaySummary: drawerReconciliation is null when no drawer session is open", () => {
  const summary = computeEndOfDaySummary(baseEodInput());
  assert.equal(summary.drawerReconciliation, null);
});

test("computeEndOfDaySummary: returned units/value come from today's reportable sales' returns", () => {
  const sales = [makeSale({ id: "s1", total: 40, status: "returned", created_at: todayAt(9) })];
  const saleItems = [makeSaleItem({ sale_id: "s1", product_id: "p1", quantity: 2, unit_price: 20, line_total: 40 })];
  const allReturnItems: ReturnItemSummary[] = [{ sale_id: "s1", product_id: "p1", quantity_returned: 2 }];
  const summary = computeEndOfDaySummary(baseEodInput({ sales, saleItems, allReturnItems }));
  assert.equal(summary.returnedUnits, 2);
  assert.equal(summary.returnedValue, 40);
});

test("computeEndOfDaySummary: cashier breakdown groups today's sales by cashier name", () => {
  const sales = [
    makeSale({ id: "s1", total: 30, cashier_id: "e1", created_at: todayAt(9) }),
    makeSale({ id: "s2", total: 20, cashier_id: "e1", created_at: todayAt(10) }),
  ];
  const employees = [makeEmployee({ id: "e1", name: "Alex" })];
  const summary = computeEndOfDaySummary(baseEodInput({ sales, employees }));
  assert.deepEqual(summary.cashierBreakdown, [{ name: "Alex", count: 2, revenue: 50 }]);
});

test("computeEndOfDaySummary: loyalty earned/redeemed are scoped to today", () => {
  const loyaltyTransactions = [
    makeLoyaltyTx({ type: "earn", points: 15, created_at: todayAt(9) }),
    makeLoyaltyTx({ type: "redeem", points: -5, created_at: todayAt(10) }),
    makeLoyaltyTx({ type: "earn", points: 999, created_at: yesterdayAt(9) }),
  ];
  const summary = computeEndOfDaySummary(baseEodInput({ loyaltyTransactions }));
  assert.equal(summary.loyaltyEarned, 15);
  assert.equal(summary.loyaltyRedeemed, 5);
});
