import React from "react";
import type { DrawerSession, DrawerPaidOut } from "../lib/staff/types";
import type { EndOfDaySummary } from "../lib/sales/salesHelpers";

type CashDrawerReportPanelProps = {
  visible: boolean;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;

  // Cash drawer
  drawerSession: DrawerSession | null;
  onOpenDrawer: (e: React.FormEvent) => Promise<void>;
  openingFloat: string;
  setOpeningFloat: React.Dispatch<React.SetStateAction<string>>;
  drawerLoading: boolean;
  drawerCashSales: number;
  drawerPaidOuts: DrawerPaidOut[];
  onPaidOut: (e: React.FormEvent) => Promise<void>;
  paidOutAmount: string;
  setPaidOutAmount: React.Dispatch<React.SetStateAction<string>>;
  paidOutReason: string;
  setPaidOutReason: React.Dispatch<React.SetStateAction<string>>;
  onCloseDrawer: (e: React.FormEvent) => Promise<void>;
  closingCount: string;
  setClosingCount: React.Dispatch<React.SetStateAction<string>>;

  // End-of-Day summary — one precomputed, authoritative result (see
  // computeEndOfDaySummary in lib/sales/salesHelpers.ts). This component
  // used to recompute "today's sales" itself from raw sales/payments,
  // independently of - and inconsistently with - App.tsx's own
  // handleToggleEod fetch (REPORT-001/REPORT-004). It now only renders.
  onToggleEod: () => Promise<void>;
  showEod: boolean;
  eodSummary: EndOfDaySummary;
};

export function CashDrawerReportPanel({
  visible,
  currencySymbol,
  drawerSession,
  onOpenDrawer,
  openingFloat,
  setOpeningFloat,
  drawerLoading,
  drawerCashSales,
  drawerPaidOuts,
  onPaidOut,
  paidOutAmount,
  setPaidOutAmount,
  paidOutReason,
  setPaidOutReason,
  onCloseDrawer,
  closingCount,
  setClosingCount,
  onToggleEod,
  showEod,
  eodSummary,
}: CashDrawerReportPanelProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      {/* Cash Drawer Management */}
      <h2 style={{ marginTop: "40px" }}>Cash Drawer</h2>

      {!drawerSession ? (
        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "12px" }}>No drawer is currently open.</p>
          <form onSubmit={onOpenDrawer} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Opening float (${currencySymbol})`}
              value={openingFloat}
              onChange={(e) => setOpeningFloat(e.target.value)}
              style={{ padding: "8px", width: "180px" }}
              required
            />
            <button
              type="submit"
              disabled={drawerLoading || !openingFloat}
              style={{ padding: "8px 22px", fontWeight: "bold", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
            >
              Open Drawer
            </button>
          </form>
        </div>
      ) : (
        <div style={{ border: "1px solid #16a34a", borderRadius: "8px", padding: "20px", marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
            <strong style={{ color: "#15803d", fontSize: "16px" }}>Drawer Open</strong>
            <span style={{ fontSize: "13px", color: "#888" }}>Opened: {new Date(drawerSession.opened_at as string).toLocaleString()}</span>
          </div>
          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 12px" }}>
            Reflects activity since this drawer was opened — may span more than one business day.
          </p>

          {/* Session summary cards */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            {[
              { label: "Opening Float", value: `${currencySymbol}${Number(drawerSession.opening_float).toFixed(2)}` },
              { label: "Cash Sales (Since Opened)", value: `${currencySymbol}${drawerCashSales.toFixed(2)}` },
              { label: "Paid Outs", value: `−${currencySymbol}${drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}` },
              { label: "Expected Cash (Since Opened)", value: `${currencySymbol}${(Number(drawerSession.opening_float) + drawerCashSales - drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0)).toFixed(2)}`, bold: true },
            ].map(card => (
              <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "12px 16px", minWidth: "140px" }}>
                <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                <div style={{ fontSize: "20px", fontWeight: card.bold ? "bold" : "normal" }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Paid out form */}
          <h4 style={{ margin: "0 0 8px" }}>Record Paid Out</h4>
          <form onSubmit={onPaidOut} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              value={paidOutAmount}
              onChange={(e) => setPaidOutAmount(e.target.value)}
              style={{ padding: "7px", width: "120px" }}
              required
            />
            <input
              type="text"
              placeholder="Reason (e.g. safe drop)"
              value={paidOutReason}
              onChange={(e) => setPaidOutReason(e.target.value)}
              style={{ padding: "7px", flex: "1 1 180px" }}
            />
            <button
              type="submit"
              disabled={drawerLoading || !paidOutAmount}
              style={{ padding: "7px 18px", cursor: "pointer", borderRadius: "5px" }}
            >
              Record Paid Out
            </button>
          </form>

          {/* Paid outs log */}
          {drawerPaidOuts.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "13px" }}>Paid Outs This Session</strong>
              <table border={1} cellPadding={6} style={{ width: "100%", marginTop: "6px", fontSize: "13px" }}>
                <thead><tr><th>Time</th><th>Amount</th><th>Reason</th></tr></thead>
                <tbody>
                  {drawerPaidOuts.map(po => (
                    <tr key={po.id}>
                      <td>{new Date(po.created_at).toLocaleTimeString()}</td>
                      <td>{currencySymbol}{Number(po.amount).toFixed(2)}</td>
                      <td>{po.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Close drawer form */}
          <h4 style={{ margin: "0 0 8px" }}>Close Drawer</h4>
          <form onSubmit={onCloseDrawer} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={`Counted cash (${currencySymbol})`}
              value={closingCount}
              onChange={(e) => setClosingCount(e.target.value)}
              style={{ padding: "7px", width: "160px" }}
              required
            />
            {closingCount && (() => {
              const counted = Number(closingCount);
              const totalPo = drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0);
              const expected = Number(drawerSession.opening_float) + drawerCashSales - totalPo;
              const os = counted - expected;
              return (
                <span style={{ fontWeight: "bold", color: os >= 0 ? "#15803d" : "#dc2626" }} title="Based on cash sales since this drawer was opened">
                  {os >= 0 ? `Over ${currencySymbol}${os.toFixed(2)}` : `Short ${currencySymbol}${Math.abs(os).toFixed(2)}`} (Since Opened)
                </span>
              );
            })()}
            <button
              type="submit"
              disabled={drawerLoading || !closingCount}
              style={{ padding: "7px 18px", fontWeight: "bold", background: "#b91c1c", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
              {drawerLoading ? "Closing…" : "Close Drawer"}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={onToggleEod}
        style={{ marginBottom: "24px", padding: "9px 22px", cursor: "pointer", fontWeight: "bold", background: showEod ? "#333" : "#fff", color: showEod ? "#fff" : "#333", border: "1px solid #333", borderRadius: "6px" }}
      >
        {showEod ? "Hide Summary" : "End-of-Day Summary"}
      </button>

      {showEod && (() => {
        const {
          todaySales, todayPayments, transactions, grossRevenue, avgSale, itemsSold, discountsTotal,
          voidedToday, returnedToday, returnedUnits, returnedValue, cashTotal, cardTotal, otherTotal,
          loyaltyEarned, loyaltyRedeemed, topProducts, cashierBreakdown, drawerReconciliation,
        } = eodSummary;

        return (
          <div style={{ border: "1px solid #333", borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 20px" }}>
              End-of-Day Summary — {new Date().toLocaleDateString()}
            </h3>

            {/* Sales KPI Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {([
                { label: "Transactions", value: String(transactions) },
                { label: "Gross Revenue", value: `${currencySymbol}${grossRevenue.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Avg Sale", value: `${currencySymbol}${avgSale.toFixed(2)}` },
                { label: "Items Sold", value: String(itemsSold) },
                { label: "Discounts", value: `−${currencySymbol}${discountsTotal.toFixed(2)}`, color: discountsTotal > 0 ? "#b45309" : "#888" },
                { label: "Returns", value: `${returnedUnits} items (−${currencySymbol}${returnedValue.toFixed(2)})`, color: returnedUnits > 0 ? "#dc2626" : "#888" },
              ] as { label: string; value: string; color?: string }[]).map((card) => (
                <div key={card.label} style={{ padding: "12px 18px", border: "1px solid #e5e7eb", borderRadius: "8px", minWidth: "120px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: card.color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment & Loyalty Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Cash Sales", value: `${currencySymbol}${cashTotal.toFixed(2)}`, color: "#15803d" },
                { label: "Card Sales", value: `${currencySymbol}${cardTotal.toFixed(2)}`, color: "#1d4ed8" },
                ...(otherTotal > 0 ? [{ label: "Other Payments", value: `${currencySymbol}${otherTotal.toFixed(2)}`, color: "#6b7280" }] : []),
                { label: "Loyalty Earned", value: `+${loyaltyEarned} pts`, color: loyaltyEarned > 0 ? "#15803d" : "#888" },
                { label: "Loyalty Redeemed", value: `${loyaltyRedeemed} pts`, color: loyaltyRedeemed > 0 ? "#7c3aed" : "#888" },
              ].map((card) => (
                <div key={card.label} style={{ padding: "12px 18px", border: "1px solid #e5e7eb", borderRadius: "8px", minWidth: "120px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: card.color, marginTop: "2px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Drawer Reconciliation */}
            {drawerReconciliation && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "24px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 4px" }}>Drawer Reconciliation (Today) {drawerSession?.status === "closed" ? "(Closed)" : "(Open)"}</h4>
                <p style={{ fontSize: "12px", color: "#888", margin: "0 0 12px" }}>
                  Reflects today's business day only — may differ from the Live Cash Drawer figures above if the current session started on a different day.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {([
                    { label: "Opening Float", value: `${currencySymbol}${drawerReconciliation.openingFloat.toFixed(2)}` },
                    { label: "Cash Sales (Today)", value: `+${currencySymbol}${drawerReconciliation.cashSales.toFixed(2)}`, color: "#15803d" },
                    { label: "Paid Outs", value: `−${currencySymbol}${drawerReconciliation.paidOuts.toFixed(2)}`, color: drawerReconciliation.paidOuts > 0 ? "#dc2626" : "#888" },
                    { label: "Expected Cash (Today)", value: `${currencySymbol}${drawerReconciliation.expectedCash.toFixed(2)}`, color: "#1d4ed8" },
                    ...(drawerSession?.status === "closed" ? [
                      { label: "Actual Cash", value: `${currencySymbol}${Number(drawerSession.closing_count ?? 0).toFixed(2)}` },
                      { label: "Over/Short", value: (() => {
                        const os = Number(drawerSession.over_short ?? 0);
                        return os >= 0 ? `+${currencySymbol}${os.toFixed(2)}` : `−${currencySymbol}${Math.abs(os).toFixed(2)}`;
                      })(), color: Number(drawerSession.over_short ?? 0) >= 0 ? "#15803d" : "#dc2626" },
                    ] : []),
                  ] as { label: string; value: string; color?: string }[]).map((card) => (
                    <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 14px", minWidth: "110px", flex: 1, background: "#fff" }}>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: card.color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h4 style={{ margin: "0 0 8px" }}>Top Products Today</h4>
            <div style={{ overflowX: "auto", marginBottom: "20px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%" }}>
                <thead>
                  <tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={3}>No items sold today</td></tr>
                  ) : (
                    topProducts.map((p, i) => (
                      <tr key={i}>
                        <td>{p.name}</td>
                        <td>{p.units}</td>
                        <td>{currencySymbol}{p.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <h4 style={{ margin: "0 0 8px" }}>Sales Breakdown</h4>
            <div style={{ overflowX: "auto", marginBottom: "12px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%" }}>
                <thead>
                  <tr><th>Time</th><th>Sale ID</th><th>Total</th><th>Discount</th><th>Payment</th></tr>
                </thead>
                <tbody>
                  {todaySales.length === 0 ? (
                    <tr><td colSpan={5}>No sales today</td></tr>
                  ) : (
                    todaySales.map((s) => {
                      const method = todayPayments.find((p) => p.sale_id === s.id && p.payment_type !== 'refund')?.payment_method ?? "—";
                      const disc = Number(s.discount_amount);
                      return (
                        <tr key={s.id}>
                          <td>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                          <td>{currencySymbol}{Number(s.total).toFixed(2)}</td>
                          <td style={{ color: disc > 0 ? "#b45309" : "#ccc" }}>{disc > 0 ? `−${currencySymbol}${disc.toFixed(2)}` : "—"}</td>
                          <td>{method}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {cashierBreakdown.length > 0 && (
              <>
                <h4 style={{ margin: "0 0 8px" }}>Cashier Breakdown</h4>
                <div style={{ overflowX: "auto", marginBottom: "20px" }}>
                  <table border={1} cellPadding={8} style={{ width: "100%" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6" }}>
                        <th style={{ textAlign: "left" }}>Cashier</th>
                        <th>Sales</th>
                        <th>Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cashierBreakdown.map((r, i) => (
                        <tr key={i}>
                          <td>{r.name}</td>
                          <td style={{ textAlign: "center" }}>{r.count}</td>
                          <td>{currencySymbol}{r.revenue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {voidedToday > 0 && (
              <p style={{ color: "#999", fontSize: "13px", margin: returnedToday > 0 ? "0 0 4px" : 0 }}>
                {voidedToday} voided sale(s) excluded from revenue totals.
              </p>
            )}
            {returnedToday > 0 && (
              <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
                {returnedToday} fully-returned sale(s) included above, netted to reflect their refunds.
              </p>
            )}
          </div>
        );
      })()}

      </div>
  );
}
