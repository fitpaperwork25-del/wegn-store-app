import React from "react";
import type { Sale } from "../lib/sales/types";
import type { Employee, DrawerSession } from "../lib/staff/types";
import type { SalesTodaySummary } from "../lib/sales/salesHelpers";
import type { PurchasingDashboardSummary } from "../lib/purchasing/purchasingHelpers";
import type { CustomersDashboardSummary } from "../lib/customers/customersHelpers";
import type { InventoryDashboardSummary } from "../lib/inventory/inventoryHelpers";

type DashboardProps = {
  visible: boolean;
  salesSummary: SalesTodaySummary;
  purchasingSummary: PurchasingDashboardSummary;
  customersSummary: CustomersDashboardSummary;
  inventorySummary: InventoryDashboardSummary;
  lowStockCount: number;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  recentSales: Sale[];
  /** Cashier's own recent sales - filtered from the full sales array in
   *  App.tsx, not sliced from the store-wide `recentSales` above. */
  myRecentSales: Sale[];
  drawerSession: DrawerSession | null;
  employeeMap: Record<string, Employee>;
  /** Role-permissions revision: Cashier gets a reduced dashboard (POS/
   *  Customers shortcuts, own drawer status, own recent sales only) - no
   *  purchasing/inventory shortcuts, no store-wide revenue/EOD/financial
   *  KPIs. viewerId identifies "own" for drawer/sales filtering. */
  viewerRole: string;
  viewerId: string | null;
  onGoToReorderCenter: () => void;
  onOpenPurchasing: () => void;
  onViewInventory: () => void;
  onViewEodReport: () => void;
  onGoToPOS: () => void;
  onGoToCustomers: () => void;
};

export function Dashboard({
  visible,
  salesSummary,
  purchasingSummary,
  customersSummary,
  inventorySummary,
  lowStockCount,
  currencySymbol,
  recentSales,
  myRecentSales,
  drawerSession,
  employeeMap,
  viewerRole,
  viewerId,
  onGoToReorderCenter,
  onOpenPurchasing,
  onViewInventory,
  onViewEodReport,
  onGoToPOS,
  onGoToCustomers,
}: DashboardProps) {
  const { revenueToday, txnCount, avgSale,
          yesterdaySalesCount, yesterdayRevenue, yesterdayProfit, yesterdayCash,
          topYesterdayId, topYesterdayName, topYesterdayQty } = salesSummary;
  const { openPoCount, receivablePOs } = purchasingSummary;
  const { activeCustomerCount, pointsOutstanding } = customersSummary;
  const { buyTodayCost, outOfStockCount } = inventorySummary;

  const sLabel: React.CSSProperties = { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#94a3b8", marginBottom: "12px" };
  const pCardStyle: React.CSSProperties = { borderRadius: "10px", padding: "16px 18px", background: "#fff", display: "flex", flexDirection: "column", gap: "6px" };
  const pCardBtn: React.CSSProperties = { marginTop: "10px", padding: "7px 0", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "13px", width: "100%" };

  if (viewerRole === "cashier") {
    const myDrawerOpen = !!drawerSession && drawerSession.cashier_id === viewerId;
    const mySales = myRecentSales;
    return (
      <div style={{ display: visible ? '' : 'none' }}>
        <div className="page-header">
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Your shift status and quick actions</p>
        </div>

        <div style={sLabel}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          <div style={{ ...pCardStyle, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>Checkout</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>POS</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Ring up a sale</div>
            <button onClick={onGoToPOS} style={{ ...pCardBtn, background: "#1d4ed8", color: "#fff" }}>Go to POS</button>
          </div>
          <div style={{ ...pCardStyle, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#94a3b8" }}>Customers</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>Lookup</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>Find a customer or loyalty balance</div>
            <button onClick={onGoToCustomers} style={{ ...pCardBtn, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}>Go to Customers</button>
          </div>
          <div style={{ ...pCardStyle, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: myDrawerOpen ? "#16a34a" : "#94a3b8" }}>My Drawer</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: myDrawerOpen ? "#15803d" : "#94a3b8" }}>{myDrawerOpen ? "OPEN" : "CLOSED"}</div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {myDrawerOpen ? `Since ${new Date(drawerSession!.opened_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active session"}
            </div>
          </div>
        </div>

        <div style={sLabel}>My Recent Sales</div>
        {mySales.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>No completed sales yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Sale #</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Total</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {mySales.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475569" }}>{s.id.slice(0, 8)}…</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{currencySymbol}{Number(s.total).toFixed(2)}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Today's store performance and operating status</p>
      </div>

      {/* ── Today's Priorities ── */}
      <div style={{ ...sLabel, marginBottom: "10px" }}>Today's Priorities</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px", marginBottom: "28px" }}>

        {/* 1. Buy Today */}
        <div style={{ ...pCardStyle, border: lowStockCount > 0 ? "1px solid #fca5a5" : "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: lowStockCount > 0 ? "#dc2626" : "#94a3b8" }}>Buy Today</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: lowStockCount > 0 ? "#0f172a" : "#94a3b8" }}>{lowStockCount} item{lowStockCount !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {lowStockCount > 0
              ? (buyTodayCost > 0 ? `Est. ${currencySymbol}${buyTodayCost.toFixed(2)}` : "Cost data unavailable")
              : "All products stocked"}
          </div>
          <button
            onClick={onGoToReorderCenter}
            disabled={lowStockCount === 0}
            style={{ ...pCardBtn, background: lowStockCount > 0 ? "#1d4ed8" : "#e2e8f0", color: lowStockCount > 0 ? "#fff" : "#94a3b8", cursor: lowStockCount > 0 ? "pointer" : "not-allowed" }}
          >Reorder Center</button>
        </div>

        {/* 2. Receive Today */}
        <div style={{ ...pCardStyle, border: receivablePOs.length > 0 ? "1px solid #fed7aa" : "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: receivablePOs.length > 0 ? "#ea580c" : "#94a3b8" }}>Receive Today</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: receivablePOs.length > 0 ? "#0f172a" : "#94a3b8" }}>{receivablePOs.length} PO{receivablePOs.length !== 1 ? "s" : ""}</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>
            {receivablePOs.length > 0 ? "waiting to be received" : "No orders pending"}
          </div>
          <button
            onClick={onOpenPurchasing}
            disabled={receivablePOs.length === 0}
            style={{ ...pCardBtn, background: receivablePOs.length > 0 ? "#ea580c" : "#e2e8f0", color: receivablePOs.length > 0 ? "#fff" : "#94a3b8", cursor: receivablePOs.length > 0 ? "pointer" : "not-allowed" }}
          >Open Purchasing</button>
        </div>

        {/* 3. Inventory Alerts */}
        <div style={{ ...pCardStyle, border: outOfStockCount > 0 ? "1px solid #fca5a5" : lowStockCount > 0 ? "1px solid #fde68a" : "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: outOfStockCount > 0 ? "#dc2626" : lowStockCount > 0 ? "#b45309" : "#94a3b8" }}>Inventory Alerts</div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: outOfStockCount > 0 ? "#dc2626" : "#0f172a" }}>{outOfStockCount} out of stock</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{lowStockCount} total below reorder level</div>
          <button
            onClick={onViewInventory}
            style={{ ...pCardBtn, background: outOfStockCount > 0 ? "#dc2626" : lowStockCount > 0 ? "#b45309" : "#64748b", color: "#fff" }}
          >View Inventory</button>
        </div>

        {/* 4. Yesterday's Summary */}
        <div style={{ ...pCardStyle, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#475569" }}>Yesterday's Summary</div>
          {yesterdaySalesCount === 0 ? (
            <div style={{ fontSize: "13px", color: "#94a3b8", flex: 1 }}>No sales recorded</div>
          ) : (
            <>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a" }}>{currencySymbol}{yesterdayRevenue.toFixed(2)}</div>
              <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.7 }}>
                <div>Profit: <strong>{yesterdayProfit !== null ? `${currencySymbol}${yesterdayProfit.toFixed(2)}` : "—"}</strong></div>
                <div>Cash: <strong>{currencySymbol}{yesterdayCash.toFixed(2)}</strong></div>
                {topYesterdayId && <div>Top: <strong>{topYesterdayName}</strong> ({topYesterdayQty})</div>}
              </div>
            </>
          )}
          <button
            onClick={onViewEodReport}
            style={{ ...pCardBtn, background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0" }}
          >View EOD Report</button>
        </div>

      </div>

      {/* ── Today's Operations ── */}
      <div style={sLabel}>Today's Operations</div>
      <div className="dash-card-row">
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>$</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Revenue Today</div>
            <div className="dash-card-value">{currencySymbol}{revenueToday.toFixed(2)}</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>&#x1D4E1;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Transactions</div>
            <div className="dash-card-value">{txnCount}</div>
            <div className="dash-card-helper">{txnCount === 1 ? "sale" : "sales"} today</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>&#x2197;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Average Sale</div>
            <div className="dash-card-value">{txnCount > 0 ? `${currencySymbol}${avgSale.toFixed(2)}` : "—"}</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: lowStockCount > 0 ? "#fef2f2" : "#f0fdf4", color: lowStockCount > 0 ? "#dc2626" : "#16a34a" }}>&#x26A0;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Low Stock Items</div>
            <div className="dash-card-value" style={lowStockCount > 0 ? { color: "#dc2626" } : undefined}>{lowStockCount}</div>
            <div className="dash-card-helper">{lowStockCount > 0 ? "need reorder" : "all stocked"}</div>
          </div>
        </div>
      </div>

      {/* ── Business Status ── */}
      <div style={sLabel}>Business Status</div>
      <div className="dash-card-row">
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: drawerSession ? "#f0fdf4" : "#f1f5f9", color: drawerSession ? "#16a34a" : "#64748b" }}>&#x1F4B0;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Cash Drawer</div>
            <div className="dash-card-value" style={{ color: drawerSession ? "#15803d" : "#475569" }}>{drawerSession ? "OPEN" : "CLOSED"}</div>
            <div className="dash-card-helper">
              {drawerSession ? `Since ${new Date(drawerSession.opened_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No active session"}
            </div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: openPoCount > 0 ? "#fff7ed" : "#f1f5f9", color: openPoCount > 0 ? "#ea580c" : "#64748b" }}>&#x1F4C4;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Open Purchase Orders</div>
            <div className="dash-card-value">{openPoCount}</div>
            <div className="dash-card-helper">{openPoCount > 0 ? "pending" : "none pending"}</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: "#f0fdfa", color: "#0d9488" }}>&#x1F465;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Active Customers</div>
            <div className="dash-card-value">{activeCustomerCount}</div>
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>&#x2605;</div>
          <div className="dash-card-body">
            <div className="dash-card-label">Loyalty Points</div>
            <div className="dash-card-value">{pointsOutstanding.toLocaleString()}</div>
            <div className="dash-card-helper">outstanding</div>
          </div>
        </div>
      </div>

      {/* ── Recent Sales ── */}
      <div style={sLabel}>Recent Sales</div>
      {recentSales.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0" }}>No completed sales yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Sale #</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Total</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Cashier</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "#475569", fontWeight: 600 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((s, i) => {
                const cashierName = s.cashier_id
                  ? (employeeMap[s.cashier_id]?.name ?? s.cashier_id.slice(0, 8))
                  : "—";
                return (
                  <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#475569" }}>{s.id.slice(0, 8)}…</td>
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0f172a" }}>{currencySymbol}{Number(s.total).toFixed(2)}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{cashierName}</td>
                    <td style={{ padding: "10px 14px", color: "#94a3b8" }}>{new Date(s.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
