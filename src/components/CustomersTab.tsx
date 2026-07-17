import React from "react";
import type { Customer, LoyaltyTransaction } from "../lib/customers/types";
import type { Sale, SaleItemRecord, EodPayment, ReturnItemSummary } from "../lib/sales/types";
import type { ProductStock } from "../lib/product/types";
import { buildProductNameMap } from "../lib/product/productHelpers";
import { isReportableSaleStatus, computeNetRevenue } from "../lib/sales/salesHelpers";

type CustomersTabProps = {
  visible: boolean;
  customers: Customer[];
  sales: Sale[];
  saleItems: SaleItemRecord[];
  allPayments: EodPayment[];
  allReturnItems: ReturnItemSummary[];
  products: ProductStock[];
  loyaltyTransactions: LoyaltyTransaction[];
  newCusName: string;
  setNewCusName: (v: string) => void;
  newCusPhone: string;
  setNewCusPhone: (v: string) => void;
  newCusEmail: string;
  setNewCusEmail: (v: string) => void;
  onAddCustomer: (e: React.FormEvent) => void;
  customerListOpen: boolean | null;
  setCustomerListOpen: (v: boolean | null) => void;
  expandedCustomerId: string | null;
  setExpandedCustomerId: (v: string | null) => void;
  editingCustomerId: string | null;
  setEditingCustomerId: (v: string | null) => void;
  editCusName: string;
  setEditCusName: (v: string) => void;
  editCusPhone: string;
  setEditCusPhone: (v: string) => void;
  editCusEmail: string;
  setEditCusEmail: (v: string) => void;
  onEditCustomer: (e: React.FormEvent, customerId: string) => void;
  onToggleCustomerStatus: (customer: Customer) => void;
  onPrintReceipt: (sale: Sale) => void;
  /** Edit/Deactivate customer stay owner+manager only. */
  canManageCustomers: boolean;
  /** Add Customer is a normal checkout need - Cashier gets this too. */
  canAddCustomers: boolean;
};

export function CustomersTab({
  visible,
  customers,
  sales,
  saleItems,
  allPayments,
  allReturnItems,
  products,
  loyaltyTransactions,
  newCusName,
  setNewCusName,
  newCusPhone,
  setNewCusPhone,
  newCusEmail,
  setNewCusEmail,
  onAddCustomer,
  customerListOpen,
  setCustomerListOpen,
  expandedCustomerId,
  setExpandedCustomerId,
  editingCustomerId,
  setEditingCustomerId,
  editCusName,
  setEditCusName,
  editCusPhone,
  setEditCusPhone,
  editCusEmail,
  setEditCusEmail,
  onEditCustomer,
  onToggleCustomerStatus,
  onPrintReceipt,
  canManageCustomers,
  canAddCustomers,
}: CustomersTabProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Customers</h2>
        <p className="page-subtitle">Manage customer profiles, purchase history, and loyalty points</p>
      </div>

      {canAddCustomers && (
        <>
          <h3 style={{ marginBottom: "8px" }}>Add Customer</h3>
          <form
            onSubmit={onAddCustomer}
            style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "24px" }}
          >
            <input
              type="text"
              placeholder="Name *"
              value={newCusName}
              onChange={(e) => setNewCusName(e.target.value)}
              style={{ flex: "1 1 150px", padding: "8px" }}
            />
            <input
              type="text"
              placeholder="Phone *"
              value={newCusPhone}
              onChange={(e) => setNewCusPhone(e.target.value)}
              style={{ flex: "1 1 140px", padding: "8px" }}
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={newCusEmail}
              onChange={(e) => setNewCusEmail(e.target.value)}
              style={{ flex: "1 1 180px", padding: "8px" }}
            />
            <button type="submit" style={{ padding: "8px 20px" }}>Add Customer</button>
          </form>
        </>
      )}

      {/* Customer Insights */}
      <h3 style={{ marginTop: "24px", marginBottom: "8px" }}>Customer Insights</h3>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>Based on most recent 20 sales</p>
      {(() => {
        // Reporting bug-fix (REPORT-006): this used to filter status ===
        // "completed" only, diverging from the customer row-level Visits/
        // Spent AND from Purchase History - both now unified to the same
        // isReportableSaleStatus rule (see the other two custSales below).
        const completedSales = sales.filter(s => isReportableSaleStatus(s.status));
        const totalVisits = completedSales.length;
        const storeAvg = totalVisits > 0
          ? completedSales.reduce((sum, s) => sum + Number(s.total), 0) / totalVisits
          : 0;
        const repeatCount = customers.filter(c =>
          completedSales.filter(s => s.customer_id === c.id).length >= 2
        ).length;

        const productMap = buildProductNameMap(products);

        const top5 = customers
          .map(c => {
            const custSales = completedSales.filter(s => s.customer_id === c.id);
            const totalSpend = custSales.reduce((sum, s) => sum + Number(s.total), 0);
            const visits = custSales.length;
            const avgPerVisit = visits > 0 ? totalSpend / visits : 0;
            const custSaleIds = new Set(custSales.map(s => s.id));
            const itemQtys: Record<string, number> = {};
            saleItems
              .filter(si => custSaleIds.has(si.sale_id))
              .forEach(si => { itemQtys[si.product_id] = (itemQtys[si.product_id] ?? 0) + si.quantity; });
            const favProductId = Object.entries(itemQtys).sort((a, b) => b[1] - a[1])[0]?.[0];
            const favProduct = favProductId ? (productMap[favProductId] ?? "—") : "—";
            return { id: c.id, name: c.name, visits, totalSpend, avgPerVisit, favProduct };
          })
          .filter(r => r.totalSpend > 0)
          .sort((a, b) => b.totalSpend - a.totalSpend)
          .slice(0, 5);

        return (
          <>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { label: "Total Customers", value: customers.length },
                { label: "Store Avg Spend / Visit", value: `$${storeAvg.toFixed(2)}` },
                { label: "Repeat Customers", value: repeatCount },
                { label: "Total Points Outstanding", value: loyaltyTransactions.reduce((s, lt) => s + lt.points, 0) },
              ].map(card => (
                <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "16px", minWidth: "160px", flex: 1 }}>
                  <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>{card.value}</div>
                </div>
              ))}
            </div>

            <h4 style={{ marginBottom: "8px" }}>Top 5 Customers by Spend</h4>
            <div style={{ overflowX: "auto", marginBottom: "24px" }}>
              <table border={1} cellPadding={10} style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Visits</th>
                    <th>Total Spend</th>
                    <th>Avg / Visit</th>
                    <th>Favorite Product</th>
                  </tr>
                </thead>
                <tbody>
                  {top5.length === 0 ? (
                    <tr><td colSpan={6}>No customer sales data yet</td></tr>
                  ) : (
                    top5.map((row, i) => (
                      <tr key={row.id}>
                        <td>{i + 1}</td>
                        <td>{row.name}</td>
                        <td>{row.visits}</td>
                        <td>${row.totalSpend.toFixed(2)}</td>
                        <td>${row.avgPerVisit.toFixed(2)}</td>
                        <td>{row.favProduct}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}

      <button
        onClick={() => setCustomerListOpen(!(customerListOpen ?? (customers.length < 10)))}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(customerListOpen ?? (customers.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Customers</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({customers.length} customers)</span>
      </button>
      <p style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Click a row to see purchase history</p>
      <div style={{ display: (customerListOpen ?? (customers.length < 10)) ? '' : 'none' }}>
      {(() => {
        const rows = customers.map((c) => {
          // Reporting bug-fix (REPORT-005): previously status === "completed"
          // only, so a customer whose one purchase was later fully refunded
          // (status -> "returned") showed Visits = 0 / Spent = $0 here while
          // still appearing in Purchase History/Returns/Points below - now
          // unified to the same isReportableSaleStatus rule used everywhere
          // else, and netted for refunds like every other revenue figure.
          const custSales = sales.filter(s => s.customer_id === c.id && isReportableSaleStatus(s.status));
          const totalSpend = computeNetRevenue(custSales, allPayments);
          const lastVisit = custSales.length > 0
            ? new Date(Math.max(...custSales.map(s => new Date(s.created_at).getTime())))
            : null;
          const pointsBalance = loyaltyTransactions
            .filter(lt => lt.customer_id === c.id)
            .reduce((sum, lt) => sum + lt.points, 0);
          return { ...c, visitCount: custSales.length, totalSpend, lastVisit, pointsBalance };
        });
        return (
          <div style={{ overflowX: "auto", marginBottom: "40px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Visits</th>
                  <th>Total Spend</th>
                  <th>Last Visit</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={9}>No customers yet</td></tr>
                ) : (
                  rows.map((row) => {
                    const isExpanded = expandedCustomerId === row.id;
                    const isEditing = editingCustomerId === row.id;
                    const inactive = row.status !== "active";
                    // Reporting bug-fix (REPORT-005): previously s.status
                    // !== 'open' (included voided sales, which never
                    // actually completed) - now the same isReportableSaleStatus
                    // rule as row.visitCount/row.totalSpend above, so Purchase
                    // History always reconciles with the Visits/Spent figures
                    // shown for the same customer.
                    const custSales = sales.filter(s => s.customer_id === row.id && isReportableSaleStatus(s.status));
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          onClick={() => { if (!isEditing) setExpandedCustomerId(isExpanded ? null : row.id); }}
                          style={{
                            cursor: isEditing ? "default" : "pointer",
                            background: isExpanded ? "#f0f4ff" : inactive ? "#f5f5f5" : undefined,
                            color: inactive ? "#999" : undefined,
                          }}
                        >
                          <td>{isExpanded ? "▾" : "▸"} {row.name}</td>
                          <td>{row.phone}</td>
                          <td>{row.email ?? "—"}</td>
                          <td>
                            <span style={{
                              fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                              background: inactive ? "#e5e7eb" : "#dcfce7",
                              color: inactive ? "#6b7280" : "#15803d",
                            }}>{row.status}</span>
                          </td>
                          <td>{row.visitCount}</td>
                          <td>${row.totalSpend.toFixed(2)}</td>
                          <td>{row.lastVisit ? row.lastVisit.toLocaleDateString() : "—"}</td>
                          <td style={{ color: row.pointsBalance > 0 ? "#7c3aed" : "#888", fontWeight: row.pointsBalance > 0 ? "bold" : "normal" }}>{row.pointsBalance}</td>
                          <td style={{ whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            {canManageCustomers && (
                              <>
                                <button
                                  onClick={() => {
                                    if (isEditing) { setEditingCustomerId(null); return; }
                                    setEditingCustomerId(row.id);
                                    setEditCusName(row.name);
                                    setEditCusPhone(row.phone);
                                    setEditCusEmail(row.email ?? "");
                                  }}
                                  style={{ marginRight: "6px", padding: "3px 10px", cursor: "pointer" }}
                                >{isEditing ? "Cancel" : "Edit"}</button>
                                <button
                                  onClick={() => onToggleCustomerStatus(row)}
                                  style={{ padding: "3px 10px", cursor: "pointer" }}
                                >{inactive ? "Activate" : "Deactivate"}</button>
                              </>
                            )}
                          </td>
                        </tr>
                        {canManageCustomers && isEditing && (
                          <tr>
                            <td colSpan={9} style={{ background: "#f9fafb", padding: "16px" }}>
                              <form onSubmit={(e) => onEditCustomer(e, row.id)} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                                <strong style={{ width: "100%", marginBottom: "4px" }}>Edit Customer — {row.name}</strong>
                                <input type="text" placeholder="Name *" value={editCusName} onChange={(e) => setEditCusName(e.target.value)} required style={{ flex: "2 1 160px", padding: "7px" }} />
                                <input type="text" placeholder="Phone *" value={editCusPhone} onChange={(e) => setEditCusPhone(e.target.value)} required style={{ flex: "1 1 130px", padding: "7px" }} />
                                <input type="email" placeholder="Email" value={editCusEmail} onChange={(e) => setEditCusEmail(e.target.value)} style={{ flex: "1 1 180px", padding: "7px" }} />
                                <button type="submit" style={{ padding: "7px 16px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
                                <button type="button" onClick={() => setEditingCustomerId(null)} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                              </form>
                            </td>
                          </tr>
                        )}
                        {isExpanded && !isEditing && (
                          <tr>
                            <td colSpan={9} style={{ background: "#f8f9ff", padding: "16px" }}>
                              {(() => {
                                const custLoyalty = loyaltyTransactions.filter(lt => lt.customer_id === row.id);
                                const lifetimeEarned = custLoyalty.filter(lt => lt.type === 'earn' && lt.points > 0).reduce((s, lt) => s + lt.points, 0);
                                const lifetimeRedeemed = custLoyalty.filter(lt => lt.type === 'redeem').reduce((s, lt) => s + Math.abs(lt.points), 0);
                                const custReturns = allReturnItems.filter(ri => custSales.some(s => s.id === ri.sale_id));
                                const totalReturned = custReturns.reduce((s, ri) => s + ri.quantity_returned, 0);
                                const avgSpend = row.visitCount > 0 ? row.totalSpend / row.visitCount : 0;
                                const productNameMap = buildProductNameMap(products);

                                return (
                                  <>
                                    {/* Customer Summary */}
                                    <strong style={{ display: "block", marginBottom: "12px" }}>Customer Summary — {row.name}</strong>
                                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
                                      {[
                                        { label: "Total Visits", value: String(row.visitCount) },
                                        { label: "Total Spent", value: `$${row.totalSpend.toFixed(2)}` },
                                        { label: "Avg per Visit", value: `$${avgSpend.toFixed(2)}` },
                                        { label: "Last Purchase", value: row.lastVisit ? row.lastVisit.toLocaleDateString() : "—" },
                                        { label: "Points Balance", value: String(row.pointsBalance), color: row.pointsBalance > 0 ? "#7c3aed" : "#888" },
                                        { label: "Items Returned", value: String(totalReturned), color: totalReturned > 0 ? "#dc2626" : "#888" },
                                        { label: "Lifetime Earned", value: `+${lifetimeEarned} pts`, color: "#15803d" },
                                        { label: "Lifetime Redeemed", value: `${lifetimeRedeemed} pts`, color: lifetimeRedeemed > 0 ? "#dc2626" : "#888" },
                                      ].map(card => (
                                        <div key={card.label} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px 14px", minWidth: "110px", flex: 1, background: "#fff" }}>
                                          <div style={{ fontSize: "10px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{card.label}</div>
                                          <div style={{ fontSize: "18px", fontWeight: "bold", color: card.color ?? "#0f172a", marginTop: "2px" }}>{card.value}</div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Purchase History */}
                                    <strong style={{ display: "block", marginBottom: "8px" }}>Purchase History</strong>
                                    {custSales.length === 0 ? (
                                      <p style={{ margin: "0 0 16px", color: "#888" }}>No sales recorded for this customer.</p>
                                    ) : (
                                      custSales.map(s => {
                                        const items = saleItems.filter(si => si.sale_id === s.id);
                                        const salePayments = allPayments.filter(p => p.sale_id === s.id && p.payment_type !== 'refund');
                                        const saleReturns = allReturnItems.filter(ri => ri.sale_id === s.id);
                                        const saleLoyalty = custLoyalty.filter(lt => lt.sale_id === s.id);
                                        const earnedPts = saleLoyalty.filter(lt => lt.type === 'earn' && lt.points > 0).reduce((sum, lt) => sum + lt.points, 0);
                                        const redeemedPts = saleLoyalty.filter(lt => lt.type === 'redeem').reduce((sum, lt) => sum + Math.abs(lt.points), 0);
                                        const payMethods = salePayments.map(p => p.payment_method === "other" && p.reference ? p.reference : p.payment_method + (p.payment_method !== "other" && p.reference ? ` (${p.reference})` : "")).join(", ") || "—";
                                        const statusBg = s.status === "completed" ? "#dcfce7" : s.status === "returned" ? "#fef2f2" : s.status === "voided" ? "#e5e7eb" : "#f1f5f9";
                                        const statusColor = s.status === "completed" ? "#15803d" : s.status === "returned" ? "#dc2626" : s.status === "voided" ? "#6b7280" : "#475569";

                                        return (
                                          <div key={s.id} style={{ border: "1px solid #e5e7eb", borderRadius: "6px", marginBottom: "12px", background: "#fff" }}>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                                              <span style={{ fontWeight: "bold", fontSize: "13px" }}>{new Date(s.created_at).toLocaleString()}</span>
                                              <span style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px", background: statusBg, color: statusColor }}>{s.status}</span>
                                              <span style={{ fontSize: "13px" }}>Payment: <strong>{payMethods}</strong></span>
                                              {Number(s.discount_amount) > 0 && (
                                                <span style={{ fontSize: "13px", color: "#b45309" }}>Discount: −${Number(s.discount_amount).toFixed(2)}</span>
                                              )}
                                              {earnedPts > 0 && <span style={{ fontSize: "12px", color: "#15803d", fontWeight: "bold" }}>+{earnedPts} pts earned</span>}
                                              {redeemedPts > 0 && <span style={{ fontSize: "12px", color: "#7c3aed", fontWeight: "bold" }}>−{redeemedPts} pts redeemed</span>}
                                              <span style={{ marginLeft: "auto", fontWeight: "bold", fontSize: "15px" }}>${Number(s.total).toFixed(2)}</span>
                                              <button onClick={() => onPrintReceipt(s)} style={{ padding: "2px 10px", cursor: "pointer", fontSize: "12px" }}>Receipt</button>
                                            </div>
                                            <table cellPadding={6} style={{ width: "100%", fontSize: "13px" }}>
                                              <thead>
                                                <tr style={{ background: "#f9fafb" }}>
                                                  <th style={{ textAlign: "left", padding: "6px 14px" }}>Product</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Qty</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Unit Price</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Line Total</th>
                                                  <th style={{ textAlign: "right", padding: "6px 14px" }}>Returned</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {items.map(si => {
                                                  const retQty = saleReturns.filter(ri => ri.product_id === si.product_id).reduce((s2, ri) => s2 + ri.quantity_returned, 0);
                                                  return (
                                                    <tr key={si.product_id}>
                                                      <td style={{ padding: "4px 14px" }}>{productNameMap[si.product_id] ?? si.product_id.slice(0, 8)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>{si.quantity}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>${si.unit_price.toFixed(2)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px" }}>${si.line_total.toFixed(2)}</td>
                                                      <td style={{ textAlign: "right", padding: "4px 14px", color: retQty > 0 ? "#dc2626" : "#ccc", fontWeight: retQty > 0 ? "bold" : "normal" }}>
                                                        {retQty > 0 ? retQty : "—"}
                                                      </td>
                                                    </tr>
                                                  );
                                                })}
                                              </tbody>
                                            </table>
                                          </div>
                                        );
                                      })
                                    )}

                                    {/* Points History (kept) */}
                                    <strong style={{ display: "block", marginTop: "16px" }}>Points History</strong>
                                    {(() => {
                                      const recentLoyalty = custLoyalty.slice(0, 20);
                                      return recentLoyalty.length === 0 ? (
                                        <p style={{ margin: "8px 0 0", color: "#888" }}>No points history yet.</p>
                                      ) : (
                                        <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "8px", fontSize: "13px" }}>
                                          <thead>
                                            <tr><th>Date</th><th>Type</th><th>Points</th><th>Sale</th></tr>
                                          </thead>
                                          <tbody>
                                            {recentLoyalty.map(lt => (
                                              <tr key={lt.id}>
                                                <td>{new Date(lt.created_at).toLocaleString()}</td>
                                                <td style={{ color: lt.type === 'earn' ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>{lt.type}</td>
                                                <td style={{ color: lt.points > 0 ? '#15803d' : '#dc2626', fontWeight: 'bold' }}>
                                                  {lt.points > 0 ? `+${lt.points}` : lt.points}
                                                </td>
                                                <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{lt.sale_id ? lt.sale_id.slice(0, 8) + '…' : '—'}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      );
                                    })()}
                                  </>
                                );
                              })()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        );
      })()}
      </div>

      </div>
  );
}
