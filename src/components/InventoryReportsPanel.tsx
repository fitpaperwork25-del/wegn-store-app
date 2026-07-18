import React from "react";
import type { PurchaseOrder, Supplier } from "../lib/purchasing/types";
import type { Sale, SaleItemRecord, ReturnRecord, ReturnItemSummary } from "../lib/sales/types";
import type { Customer } from "../lib/customers/types";
import type { Employee } from "../lib/staff/types";
import type { ProductStock } from "../lib/product/types";
import { getTotalInventoryValue } from "../lib/product/productHelpers";
import { isReportableSaleStatus, isWithinSalesDateRange } from "../lib/sales/salesHelpers";

type InventoryReportsPanelProps = {
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  products: ProductStock[];
  lowStockProducts: ProductStock[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  sales: Sale[];
  saleItems: SaleItemRecord[];
  allReturnItems: ReturnItemSummary[];
  returnHistory: ReturnRecord[];
  customerMap: Record<string, Customer>;
  employeeMap: Record<string, Employee>;
  productIdMap: Record<string, ProductStock>;
  analyticsRange: 'today' | '7d' | '30d' | 'all';
  setAnalyticsRange: (v: 'today' | '7d' | '30d' | 'all') => void;

  invValuationOpen: boolean | null;
  setInvValuationOpen: (v: boolean | null) => void;
  lowStockReportOpen: boolean | null;
  setLowStockReportOpen: (v: boolean | null) => void;
  poReportOpen: boolean;
  setPoReportOpen: React.Dispatch<React.SetStateAction<boolean>>;
  returnHistoryOpen: boolean;
  setReturnHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  expandedReturnSaleId: string | null;
  setExpandedReturnSaleId: (v: string | null) => void;
};

export function InventoryReportsPanel({
  currencySymbol,
  products, lowStockProducts, purchaseOrders, suppliers, sales, saleItems,
  allReturnItems, returnHistory, customerMap, employeeMap, productIdMap,
  analyticsRange, setAnalyticsRange,
  invValuationOpen, setInvValuationOpen,
  lowStockReportOpen, setLowStockReportOpen,
  poReportOpen, setPoReportOpen,
  returnHistoryOpen, setReturnHistoryOpen,
  expandedReturnSaleId, setExpandedReturnSaleId,
}: InventoryReportsPanelProps) {
  return (
    <>
      <h2 style={{ marginTop: "40px" }}>Inventory Reports</h2>

      {/* 1. Inventory Valuation Report */}
      <button
        onClick={() => setInvValuationOpen(!(invValuationOpen ?? (products.length < 10)))}
        style={{ marginTop: "24px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(invValuationOpen ?? (products.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Inventory Valuation</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({products.length} products)</span>
      </button>
      <div style={{ display: (invValuationOpen ?? (products.length < 10)) ? '' : 'none', overflowX: "auto" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Stock</th>
              <th>Avg Cost</th>
              <th>Inventory Value</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={4}>No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_name}</td>
                  <td>{p.quantity_on_hand}</td>
                  <td>{currencySymbol}{p.average_cost.toFixed(2)}</td>
                  <td>{currencySymbol}{(p.quantity_on_hand * p.average_cost).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total Inventory Value</td>
              <td style={{ fontWeight: "bold" }}>
                {currencySymbol}{getTotalInventoryValue(products).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 2. Low Stock Report */}
      <button
        onClick={() => setLowStockReportOpen(!(lowStockReportOpen ?? (lowStockProducts.length < 10)))}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(lowStockReportOpen ?? (lowStockProducts.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Low Stock Report</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({lowStockProducts.length} items)</span>
      </button>
      <div style={{ display: (lowStockReportOpen ?? (lowStockProducts.length < 10)) ? '' : 'none' }}>
      {(() => {
        const lowStock = lowStockProducts;
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan={4}>No low stock items</td></tr>
                ) : (
                  lowStock.map((p) => (
                    <tr key={p.product_id} style={{ backgroundColor: "#ffe5e5" }}>
                      <td>{p.product_name}</td>
                      <td>{p.quantity_on_hand}</td>
                      <td>{p.reorder_level}</td>
                      <td style={{ color: "red", fontWeight: "bold" }}>
                        {(p.reorder_level ?? 0) - p.quantity_on_hand}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}
      </div>

      {/* Transaction History / Product Movement is owned by the Inventory tab
          (see InventoryTab.tsx) — previously duplicated here with shared
          txHistoryOpen/txDateRange/movementFilter state; removed to avoid two
          independently-rendered copies of the same panel. */}

      {/* 4. Purchase Order Report */}
      <button
        onClick={() => setPoReportOpen(o => !o)}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{poReportOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Purchase Order Report</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({purchaseOrders.length} orders)</span>
      </button>
      {poReportOpen && (() => {
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));
        const totalPO = purchaseOrders.reduce((sum, po) => sum + po.subtotal, 0);
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.length === 0 ? (
                  <tr><td colSpan={5}>No purchase orders found</td></tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id}>
                      <td>{po.po_number}</td>
                      <td>{supplierMap[po.supplier_id] ?? po.supplier_id}</td>
                      <td>{po.status}</td>
                      <td>{currencySymbol}{po.subtotal.toFixed(2)}</td>
                      <td>{new Date(po.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total PO Value</td>
                  <td style={{ fontWeight: "bold" }}>{currencySymbol}{totalPO.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        );
      })()}

      {/* 5. Profit Reporting */}
      <h3 style={{ marginTop: "32px", marginBottom: "8px" }}>Profit Report</h3>
      {(() => {
        const now = new Date();
        // Reportable-sale + date-range rules now reuse the same shared
        // helpers as Sales Analytics/Dashboard/EOD instead of a hand-rolled
        // copy, so this block can't silently drift from what "Today"/"Last
        // 7 Days"/etc. mean everywhere else. "Net Sales (Pre-Tax)" below
        // stays a deliberately distinct, pre-tax P&L waterfall (Gross Sales
        // − Discounts − Returns) rather than the tax-inclusive,
        // payment-netted computeNetRevenue used for "Revenue" elsewhere -
        // COGS/Gross Profit/Gross Margin are intentionally computed against
        // this pre-tax figure and untouched by the reconciliation below.
        // "Tax Collected" + "Total Collected (Including Tax)" make that
        // relationship explicit instead of leaving Sales Analytics' Revenue
        // and this panel's own total silently differing by the tax amount.
        const eligibleSales = sales.filter(s =>
          isReportableSaleStatus(s.status) && isWithinSalesDateRange(s.created_at, analyticsRange, now)
        );
        const eligibleSaleIds = new Set(eligibleSales.map(s => s.id));

        const periodItems = saleItems.filter(si => eligibleSaleIds.has(si.sale_id));

        const returnMap: Record<string, number> = {};
        for (const ri of allReturnItems) {
          if (!eligibleSaleIds.has(ri.sale_id)) continue;
          const key = `${ri.sale_id}::${ri.product_id}`;
          returnMap[key] = (returnMap[key] ?? 0) + ri.quantity_returned;
        }

        const productMap = Object.fromEntries(products.map(p => [p.product_id, p]));

        let grossSales = 0;
        let totalDiscounts = 0;
        let totalReturns = 0;
        let totalCogs = 0;

        const byProduct: Record<string, { name: string; soldUnits: number; returnedUnits: number; grossRev: number; returnedRev: number; cogs: number }> = {};

        for (const si of periodItems) {
          const product = productMap[si.product_id];
          const avgCost = product?.average_cost ?? 0;
          const unitPrice = si.unit_price;
          const returnKey = `${si.sale_id}::${si.product_id}`;
          const returnedQty = returnMap[returnKey] ?? 0;
          const netQty = si.quantity - returnedQty;
          const returnedRev = returnedQty * unitPrice;

          grossSales += si.line_total;
          totalReturns += returnedRev;
          totalCogs += netQty * avgCost;

          if (!byProduct[si.product_id]) {
            byProduct[si.product_id] = { name: product?.product_name ?? si.product_id, soldUnits: 0, returnedUnits: 0, grossRev: 0, returnedRev: 0, cogs: 0 };
          }
          byProduct[si.product_id].soldUnits += si.quantity;
          byProduct[si.product_id].returnedUnits += returnedQty;
          byProduct[si.product_id].grossRev += si.line_total;
          byProduct[si.product_id].returnedRev += returnedRev;
          byProduct[si.product_id].cogs += netQty * avgCost;
        }

        let taxCollected = 0;
        for (const s of eligibleSales) {
          totalDiscounts += Number(s.discount_amount);
          taxCollected += Number(s.tax);
        }

        const netSales = grossSales - totalDiscounts - totalReturns;
        const grossProfit = netSales - totalCogs;
        const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
        // Reconciles against Sales Analytics' Revenue for the same range -
        // see the reporting-tax-inclusivity investigation this fix closes.
        const totalCollected = netSales + taxCollected;

        const productRows = Object.entries(byProduct).map(([pid, row]) => {
          const netRev = row.grossRev - row.returnedRev;
          const gp = netRev - row.cogs;
          const margin = netRev > 0 ? (gp / netRev) * 100 : 0;
          return { pid, ...row, netRev, gp, margin };
        });
        const topProfit = [...productRows].sort((a, b) => b.gp - a.gp).slice(0, 10);
        const lowestMargin = [...productRows].filter(r => r.netRev > 0).sort((a, b) => a.margin - b.margin).slice(0, 10);

        const rangeLabel = analyticsRange === 'today' ? 'Today' : analyticsRange === '7d' ? 'Last 7 Days' : analyticsRange === '30d' ? 'Last 30 Days' : 'All Time';

        return (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {(['today', '7d', '30d', 'all'] as const).map(r => {
                const label = r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time';
                const active = analyticsRange === r;
                return (
                  <button
                    key={r}
                    onClick={() => setAnalyticsRange(r)}
                    style={{
                      padding: "7px 18px", cursor: "pointer", borderRadius: "6px", fontWeight: active ? "bold" : "normal",
                      background: active ? "#1d4ed8" : "#fff", color: active ? "#fff" : "#333",
                      border: active ? "1px solid #1d4ed8" : "1px solid #ccc",
                    }}
                  >{label}</button>
                );
              })}
            </div>

            {/* P&L Summary Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "28px" }}>
              {[
                { label: "Gross Sales", value: `${currencySymbol}${grossSales.toFixed(2)}`, color: "#1d4ed8" },
                { label: "Discounts", value: `−${currencySymbol}${totalDiscounts.toFixed(2)}`, color: totalDiscounts > 0 ? "#b45309" : "#888" },
                { label: "Returns", value: `−${currencySymbol}${totalReturns.toFixed(2)}`, color: totalReturns > 0 ? "#dc2626" : "#888" },
                { label: "Net Sales (Pre-Tax)", value: `${currencySymbol}${netSales.toFixed(2)}`, color: "#0f172a" },
                { label: "COGS", value: `${currencySymbol}${totalCogs.toFixed(2)}`, color: "#6b7280" },
                { label: "Gross Profit", value: `${currencySymbol}${grossProfit.toFixed(2)}`, color: grossProfit >= 0 ? "#15803d" : "#dc2626" },
                { label: "Gross Margin", value: `${grossMargin.toFixed(1)}%`, color: grossMargin >= 20 ? "#15803d" : grossMargin >= 0 ? "#b45309" : "#dc2626" },
                { label: "Tax Collected", value: `${currencySymbol}${taxCollected.toFixed(2)}`, color: "#6b7280" },
                { label: "Total Collected (Including Tax)", value: `${currencySymbol}${totalCollected.toFixed(2)}`, color: "#0f172a" },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px 18px", minWidth: "130px", flex: 1 }}>
                  <div style={{ fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "bold", color: card.color, marginTop: "4px" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
              {/* Top Profit Products */}
              <div style={{ flex: 1, minWidth: "320px" }}>
                <h4 style={{ marginBottom: "8px" }}>Top Profit Products — {rangeLabel}</h4>
                {topProfit.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No sales data for this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                      <thead>
                        <tr><th>#</th><th>Product</th><th>Net Units</th><th>Net Revenue</th><th>COGS</th><th>Profit</th><th>Margin</th></tr>
                      </thead>
                      <tbody>
                        {topProfit.map((row, i) => (
                          <tr key={row.pid}>
                            <td>{i + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.soldUnits - row.returnedUnits}</td>
                            <td>{currencySymbol}{row.netRev.toFixed(2)}</td>
                            <td>{currencySymbol}{row.cogs.toFixed(2)}</td>
                            <td style={{ color: row.gp >= 0 ? "#15803d" : "#dc2626", fontWeight: "bold" }}>{currencySymbol}{row.gp.toFixed(2)}</td>
                            <td>{row.margin.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                          <td colSpan={3}>Top 10 Total</td>
                          <td>{currencySymbol}{topProfit.reduce((s, r) => s + r.netRev, 0).toFixed(2)}</td>
                          <td>{currencySymbol}{topProfit.reduce((s, r) => s + r.cogs, 0).toFixed(2)}</td>
                          <td style={{ color: "#15803d" }}>{currencySymbol}{topProfit.reduce((s, r) => s + r.gp, 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Lowest Margin Products */}
              <div style={{ flex: 1, minWidth: "320px" }}>
                <h4 style={{ marginBottom: "8px" }}>Lowest Margin Products — {rangeLabel}</h4>
                {lowestMargin.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>No sales data for this period.</p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                      <thead>
                        <tr><th>#</th><th>Product</th><th>Net Units</th><th>Net Revenue</th><th>COGS</th><th>Profit</th><th>Margin</th></tr>
                      </thead>
                      <tbody>
                        {lowestMargin.map((row, i) => (
                          <tr key={row.pid} style={{ background: row.margin < 20 ? "#fef2f2" : undefined }}>
                            <td>{i + 1}</td>
                            <td>{row.name}</td>
                            <td>{row.soldUnits - row.returnedUnits}</td>
                            <td>{currencySymbol}{row.netRev.toFixed(2)}</td>
                            <td>{currencySymbol}{row.cogs.toFixed(2)}</td>
                            <td style={{ color: row.gp >= 0 ? "#15803d" : "#dc2626", fontWeight: "bold" }}>{currencySymbol}{row.gp.toFixed(2)}</td>
                            <td style={{ color: row.margin < 20 ? "#dc2626" : "#b45309", fontWeight: "bold" }}>{row.margin.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* Return History */}
      <button
        onClick={() => setReturnHistoryOpen(o => !o)}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{returnHistoryOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Return History</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({new Set(returnHistory.map(r => r.return_number || r.id)).size} returns)</span>
      </button>
      {returnHistoryOpen && (() => {
        const grouped: Record<string, ReturnRecord[]> = {};
        for (const r of returnHistory) {
          const key = r.return_number || r.id;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(r);
        }
        const groups = Object.entries(grouped).sort((a, b) => {
          const da = new Date(a[1][0].created_at).getTime();
          const db = new Date(b[1][0].created_at).getTime();
          return db - da;
        });
        return groups.length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>No returns recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ textAlign: "left" }}>Return #</th>
                  <th style={{ textAlign: "left" }}>Sale</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Processed By</th>
                  <th>Reason</th>
                  <th style={{ textAlign: "right" }}>Refund Value</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(([key, items]) => {
                  const first = items[0];
                  const sale = sales.find(s => s.id === first.sale_id);
                  const custName = sale?.customer_id ? (customerMap[sale.customer_id]?.name ?? "—") : "—";
                  const empName = first.processed_by ? (employeeMap[first.processed_by]?.name ?? "—") : "Owner";
                  const refundValue = items.reduce((sum, r) => {
                    const si = saleItems.find(s => s.sale_id === r.sale_id && s.product_id === r.product_id);
                    return sum + (si ? r.quantity_returned * si.unit_price : 0);
                  }, 0);
                  const isExpanded = expandedReturnSaleId === key;
                  return (
                    <React.Fragment key={key}>
                      <tr
                        style={{ cursor: "pointer", background: isExpanded ? "#faf5ff" : "inherit" }}
                        onClick={() => setExpandedReturnSaleId(isExpanded ? null : key)}
                      >
                        <td style={{ fontFamily: "monospace", fontWeight: "bold", color: "#7c3aed" }}>{first.return_number || "—"}</td>
                        <td style={{ fontFamily: "monospace", color: "#475569" }}>{first.sale_id.slice(0, 8)}…</td>
                        <td>{new Date(first.created_at).toLocaleString()}</td>
                        <td>{custName}</td>
                        <td>{empName}</td>
                        <td>{first.return_reason || first.reason || "—"}</td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>{currencySymbol}{refundValue.toFixed(2)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} style={{ background: "#faf5ff", padding: "12px" }}>
                            {first.notes && <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#64748b" }}><strong>Notes:</strong> {first.notes}</p>}
                            <table border={1} cellPadding={6} style={{ width: "100%", fontSize: "12px" }}>
                              <thead>
                                <tr style={{ background: "#e5e7eb" }}>
                                  <th style={{ textAlign: "left" }}>Product</th>
                                  <th>Qty Returned</th>
                                  <th style={{ textAlign: "right" }}>Unit Price</th>
                                  <th style={{ textAlign: "right" }}>Refund</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map(r => {
                                  const si = saleItems.find(s => s.sale_id === r.sale_id && s.product_id === r.product_id);
                                  const unitPrice = si?.unit_price ?? 0;
                                  return (
                                    <tr key={r.id}>
                                      <td>{productIdMap[r.product_id]?.product_name ?? r.product_id.slice(0, 8)}</td>
                                      <td style={{ textAlign: "center" }}>{r.quantity_returned}</td>
                                      <td style={{ textAlign: "right" }}>{currencySymbol}{unitPrice.toFixed(2)}</td>
                                      <td style={{ textAlign: "right" }}>{currencySymbol}{(r.quantity_returned * unitPrice).toFixed(2)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}
    </>
  );
}
