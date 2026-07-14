import React from "react";
import type { ProductStock } from "../lib/product/types";
import type { Employee, DrawerSession, DrawerPaidOut } from "../lib/staff/types";
import type { Sale, SaleItemRecord, EodItem, EodPayment } from "../lib/sales/types";
import type { LoyaltyTransaction } from "../lib/customers/types";

type CashDrawerReportPanelProps = {
  visible: boolean;

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

  // End-of-Day summary
  onToggleEod: () => Promise<void>;
  showEod: boolean;
  sales: Sale[];
  eodItems: EodItem[];
  eodPayments: EodPayment[];
  allReturnItems: { sale_id: string; product_id: string; quantity_returned: number }[];
  products: ProductStock[];
  loyaltyTransactions: LoyaltyTransaction[];
  employees: Employee[];
  saleItems: SaleItemRecord[];
};

export function CashDrawerReportPanel({
  visible,
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
  sales,
  eodItems,
  eodPayments,
  allReturnItems,
  products,
  loyaltyTransactions,
  employees,
  saleItems,
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
              placeholder="Opening float ($)"
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

          {/* Session summary cards */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            {[
              { label: "Opening Float", value: `$${Number(drawerSession.opening_float).toFixed(2)}` },
              { label: "Cash Sales", value: `$${drawerCashSales.toFixed(2)}` },
              { label: "Paid Outs", value: `−$${drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0).toFixed(2)}` },
              { label: "Expected Cash", value: `$${(Number(drawerSession.opening_float) + drawerCashSales - drawerPaidOuts.reduce((s, p) => s + Number(p.amount), 0)).toFixed(2)}`, bold: true },
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
                      <td>${Number(po.amount).toFixed(2)}</td>
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
              placeholder="Counted cash ($)"
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
                <span style={{ fontWeight: "bold", color: os >= 0 ? "#15803d" : "#dc2626" }}>
                  {os >= 0 ? `Over $${os.toFixed(2)}` : `Short $${Math.abs(os).toFixed(2)}`}
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
        const today = new Date();
        const isToday = (d: string) => {
          const dt = new Date(d);
          return dt.getFullYear() === today.getFullYear() && dt.getMonth() === today.getMonth() && dt.getDate() === today.getDate();
        };
        const todaySales = sales.filter((s) => s.status === "completed" && isToday(s.created_at));
        const voidedToday = sales.filter((s) => s.status === "voided" && isToday(s.created_at)).length;
        const returnedToday = sales.filter((s) => s.status === "returned" && isToday(s.created_at)).length;
        const grossRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
        const avgSale = todaySales.length > 0 ? grossRevenue / todaySales.length : 0;
        const itemsSold = eodItems.reduce((sum, i) => sum + i.quantity, 0);
        const discountsTotal = todaySales.reduce((sum, s) => sum + Number(s.discount_amount), 0);
        const eodSalePayments = eodPayments.filter(p => p.payment_type !== 'refund');
        const eodRefundPayments = eodPayments.filter(p => p.payment_type === 'refund');
        const cashTotal = eodSalePayments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method === "cash").reduce((sum, p) => sum + Number(p.amount), 0);
        const cardTotal = eodSalePayments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method === "card").reduce((sum, p) => sum + Number(p.amount), 0);
        const otherTotal = eodSalePayments.filter(p => p.payment_method !== "cash" && p.payment_method !== "card").reduce((sum, p) => sum + Number(p.amount), 0) - eodRefundPayments.filter(p => p.payment_method !== "cash" && p.payment_method !== "card").reduce((sum, p) => sum + Number(p.amount), 0);

        const allTodaySaleIds = new Set(sales.filter(s => isToday(s.created_at) && (s.status === "completed" || s.status === "returned")).map(s => s.id));
        const todayReturns = allReturnItems.filter(ri => allTodaySaleIds.has(ri.sale_id));
        const returnedUnits = todayReturns.reduce((sum, ri) => sum + ri.quantity_returned, 0);
        const productNameMap = Object.fromEntries(products.map(p => [p.product_id, p.product_name]));
        const returnedValue = todayReturns.reduce((sum, ri) => {
          const si = saleItems.find(s => s.sale_id === ri.sale_id && s.product_id === ri.product_id);
          return sum + (si ? ri.quantity_returned * si.unit_price : 0);
        }, 0);

        const todayLoyalty = loyaltyTransactions.filter(lt => isToday(lt.created_at));
        const loyaltyEarned = todayLoyalty.filter(lt => lt.type === "earn" && lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
        const loyaltyRedeemed = todayLoyalty.filter(lt => lt.type === "redeem").reduce((sum, lt) => sum + Math.abs(lt.points), 0);

        const productTotals: Record<string, { units: number; revenue: number }> = {};
        for (const item of eodItems) {
          if (!productTotals[item.product_id]) productTotals[item.product_id] = { units: 0, revenue: 0 };
          productTotals[item.product_id].units += item.quantity;
          productTotals[item.product_id].revenue += Number(item.line_total);
        }
        const topProducts = Object.entries(productTotals)
          .map(([pid, v]) => ({ name: productNameMap[pid] ?? pid.slice(0, 8), ...v }))
          .sort((a, b) => b.units - a.units);

        const latestSession = drawerSession ?? (() => {
          const closed = sales.length > 0 ? null : null;
          return closed;
        })();
        const sessionPaidOuts = drawerPaidOuts.reduce((sum, p) => sum + Number(p.amount), 0);
        const openingFloat = latestSession ? Number(latestSession.opening_float) : 0;
        const expectedCash = openingFloat + cashTotal - sessionPaidOuts;

        return (
          <div style={{ border: "1px solid #333", borderRadius: "8px", padding: "24px", marginBottom: "32px" }}>
            <h3 style={{ margin: "0 0 20px" }}>
              End-of-Day Summary — {today.toLocaleDateString()}
            </h3>

            {/* Sales KPI Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Transactions", value: String(todaySales.length) },
                { label: "Gross Revenue", value: `$${grossRevenue.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Avg Sale", value: `$${avgSale.toFixed(2)}` },
                { label: "Items Sold", value: String(itemsSold) },
                { label: "Discounts", value: `−$${discountsTotal.toFixed(2)}`, color: discountsTotal > 0 ? "#b45309" : "#888" },
                { label: "Returns", value: `${returnedUnits} items (−$${returnedValue.toFixed(2)})`, color: returnedUnits > 0 ? "#dc2626" : "#888" },
              ].map((card) => (
                <div key={card.label} style={{ padding: "12px 18px", border: "1px solid #e5e7eb", borderRadius: "8px", minWidth: "120px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: (card as any).color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            {/* Payment & Loyalty Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Cash Sales", value: `$${cashTotal.toFixed(2)}`, color: "#15803d" },
                { label: "Card Sales", value: `$${cardTotal.toFixed(2)}`, color: "#1d4ed8" },
                ...(otherTotal > 0 ? [{ label: "Other Payments", value: `$${otherTotal.toFixed(2)}`, color: "#6b7280" }] : []),
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
            {latestSession && (
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", marginBottom: "24px", background: "#f8fafc" }}>
                <h4 style={{ margin: "0 0 12px" }}>Drawer Reconciliation {latestSession.status === "closed" ? "(Closed)" : "(Open)"}</h4>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {[
                    { label: "Opening Float", value: `$${openingFloat.toFixed(2)}` },
                    { label: "Cash Sales", value: `+$${cashTotal.toFixed(2)}`, color: "#15803d" },
                    { label: "Paid Outs", value: `−$${sessionPaidOuts.toFixed(2)}`, color: sessionPaidOuts > 0 ? "#dc2626" : "#888" },
                    { label: "Expected Cash", value: `$${expectedCash.toFixed(2)}`, color: "#1d4ed8" },
                    ...(latestSession.status === "closed" ? [
                      { label: "Actual Cash", value: `$${Number(latestSession.closing_count ?? 0).toFixed(2)}` },
                      { label: "Over/Short", value: (() => {
                        const os = Number(latestSession.over_short ?? 0);
                        return os >= 0 ? `+$${os.toFixed(2)}` : `−$${Math.abs(os).toFixed(2)}`;
                      })(), color: Number(latestSession.over_short ?? 0) >= 0 ? "#15803d" : "#dc2626" },
                    ] : []),
                  ].map((card) => (
                    <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "10px 14px", minWidth: "110px", flex: 1, background: "#fff" }}>
                      <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                      <div style={{ fontSize: "20px", fontWeight: "bold", color: (card as any).color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
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
                        <td>${p.revenue.toFixed(2)}</td>
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
                      const method = eodPayments.find((p) => p.sale_id === s.id && p.payment_type !== 'refund')?.payment_method ?? "—";
                      const disc = Number(s.discount_amount);
                      return (
                        <tr key={s.id}>
                          <td>{new Date(s.created_at).toLocaleTimeString()}</td>
                          <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                          <td>${Number(s.total).toFixed(2)}</td>
                          <td style={{ color: disc > 0 ? "#b45309" : "#ccc" }}>{disc > 0 ? `−$${disc.toFixed(2)}` : "—"}</td>
                          <td>{method}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {employees.length > 0 && (() => {
              const cashierMap = Object.fromEntries(employees.map(e => [e.id, e.name]));
              const byEmployee: Record<string, { name: string; count: number; revenue: number }> = {};
              for (const s of todaySales) {
                const key = s.cashier_id ?? "__none__";
                if (!byEmployee[key]) byEmployee[key] = { name: s.cashier_id ? (cashierMap[s.cashier_id] ?? s.cashier_id.slice(0, 8)) : "No cashier", count: 0, revenue: 0 };
                byEmployee[key].count++;
                byEmployee[key].revenue += Number(s.total);
              }
              const rows = Object.values(byEmployee).sort((a, b) => b.revenue - a.revenue);
              if (rows.length === 0) return null;
              return (
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
                        {rows.map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td style={{ textAlign: "center" }}>{r.count}</td>
                            <td>${r.revenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {(voidedToday > 0 || returnedToday > 0) && (
              <p style={{ color: "#999", fontSize: "13px", margin: 0 }}>
                {voidedToday > 0 && `${voidedToday} voided sale(s)`}
                {voidedToday > 0 && returnedToday > 0 && ", "}
                {returnedToday > 0 && `${returnedToday} returned sale(s)`}
                {" "}excluded from revenue totals.
              </p>
            )}
          </div>
        );
      })()}

      </div>
  );
}
