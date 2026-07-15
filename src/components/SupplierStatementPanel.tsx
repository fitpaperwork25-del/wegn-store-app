import React from "react";
import type { SupplierStatementRow } from "../lib/purchasing/types";
import type { SessionPayment } from "../lib/inventory/types";
import { getSupplierInvoiceStatus, computePaymentRunningBalance } from "../lib/purchasing/purchasingHelpers";

/**
 * Renders a single supplier's invoice/payment statement, expanded inline
 * within the Supplier list row that triggered it (see
 * SupplierManagementPanel.tsx). supplierStatement merges two sources (see
 * the SupplierStatementRow doc comment in lib/purchasing/types.ts):
 * receiving_sessions-backed rows (source: "receiving_session", Inventory-
 * owned, read-only here exactly as before) and, as of Supplier Accounts
 * Payable Phase 1, supplier_invoices rows auto-created on Purchase Order
 * receipt (source: "purchase_order") — only the latter get the new Record
 * Payment / Payment History actions, so existing behavior for the former is
 * completely unchanged.
 */
type SupplierStatementPanelProps = {
  supplierId: string;
  supplierName: string;
  isLoadingStatement: boolean;
  supplierStatement: SupplierStatementRow[];
  paymentPanelInvoiceId: string | null;
  setPaymentPanelInvoiceId: (v: string | null) => void;
  invoicePayments: Record<string, SessionPayment[]>;
  onLoadInvoicePayments: (invoiceId: string) => void;
  invPaymentDate: string;
  setInvPaymentDate: (v: string) => void;
  invPaymentAmount: string;
  setInvPaymentAmount: (v: string) => void;
  invPaymentMethod: string;
  setInvPaymentMethod: (v: string) => void;
  invPaymentReference: string;
  setInvPaymentReference: (v: string) => void;
  invPaymentNotes: string;
  setInvPaymentNotes: (v: string) => void;
  onSaveInvoicePayment: (invoiceId: string, supplierId: string, remaining: number) => void;
  isSavingInvoicePayment: boolean;
};

export function SupplierStatementPanel({
  supplierId,
  supplierName,
  isLoadingStatement,
  supplierStatement,
  paymentPanelInvoiceId,
  setPaymentPanelInvoiceId,
  invoicePayments,
  onLoadInvoicePayments,
  invPaymentDate, setInvPaymentDate,
  invPaymentAmount, setInvPaymentAmount,
  invPaymentMethod, setInvPaymentMethod,
  invPaymentReference, setInvPaymentReference,
  invPaymentNotes, setInvPaymentNotes,
  onSaveInvoicePayment,
  isSavingInvoicePayment,
}: SupplierStatementPanelProps) {
  return (
    <tr>
      <td colSpan={8} style={{ padding: "0", borderTop: "2px solid #e2e8f0" }}>
        <div style={{ padding: "16px 20px", background: "#f8fafc" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px", color: "#0f172a" }}>Supplier Statement — {supplierName}</div>
          {isLoadingStatement ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
          ) : supplierStatement.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>No invoices found for this supplier.</p>
          ) : (() => {
            const totalInvoiced = supplierStatement.reduce((sum, r) => sum + r.invoice_total, 0);
            const totalPaid = supplierStatement.reduce((sum, r) => sum + r.paid, 0);
            const totalOutstanding = Math.round((totalInvoiced - totalPaid) * 100) / 100;
            return (
            <>
              <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Invoiced</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>${totalInvoiced.toFixed(2)}</div>
                </div>
                <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Paid</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#15803d" }}>${totalPaid.toFixed(2)}</div>
                </div>
                <div style={{ padding: "10px 16px", background: totalOutstanding > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${totalOutstanding > 0 ? "#fecaca" : "#86efac"}`, borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Outstanding</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>${totalOutstanding.toFixed(2)}</div>
                </div>
              </div>
              <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ textAlign: "left" }}>Invoice #</th>
                    <th style={{ textAlign: "left" }}>Invoice Date</th>
                    <th style={{ textAlign: "right" }}>Invoice Total</th>
                    <th style={{ textAlign: "right" }}>Paid</th>
                    <th style={{ textAlign: "right" }}>Remaining</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierStatement.map(row => {
                    const remaining = Math.round((row.invoice_total - row.paid) * 100) / 100;
                    const paidStatus = getSupplierInvoiceStatus(row.invoice_total, row.paid);
                    const statusBg = paidStatus === "paid" ? "#dcfce7" : paidStatus === "partial" ? "#fef9c3" : "#fef2f2";
                    const statusColor = paidStatus === "paid" ? "#15803d" : paidStatus === "partial" ? "#a16207" : "#dc2626";
                    const statusLabel = paidStatus === "paid" ? "Paid" : paidStatus === "partial" ? "Partially Paid" : "Outstanding";
                    const isPoInvoice = row.source === "purchase_order";
                    const isPaymentOpen = paymentPanelInvoiceId === row.session_id;
                    return (
                    <React.Fragment key={row.session_id}>
                    <tr>
                      <td style={{ fontWeight: 600 }}>
                        {row.invoice_number}
                      </td>
                      <td style={{ color: "#64748b" }}>{row.invoice_date ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>${row.invoice_total.toFixed(2)}</td>
                      <td style={{ textAlign: "right", color: "#15803d" }}>${row.paid.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: remaining > 0 ? "#dc2626" : "#15803d" }}>${remaining.toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: statusBg, color: statusColor }}>{statusLabel}</span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {isPoInvoice && (
                          <button
                            onClick={() => {
                              if (isPaymentOpen) { setPaymentPanelInvoiceId(null); return; }
                              setPaymentPanelInvoiceId(row.session_id);
                              onLoadInvoicePayments(row.session_id);
                            }}
                            style={{ padding: "3px 10px", fontSize: "12px", cursor: "pointer", background: isPaymentOpen ? "#1d4ed8" : "none", color: isPaymentOpen ? "#fff" : "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "4px" }}
                          >{isPaymentOpen ? "Close" : remaining > 0 ? "Record Payment" : "Payment History"}</button>
                        )}
                      </td>
                    </tr>
                    {isPoInvoice && isPaymentOpen && (() => {
                      const payments = invoicePayments[row.session_id] ?? [];
                      const runningBalance = computePaymentRunningBalance(row.invoice_total, payments);
                      return (
                      <tr>
                        <td colSpan={7} style={{ padding: "0", background: "#f0fdf4" }}>
                          <div style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "8px", color: "#0f172a" }}>Payment History — {row.invoice_number}</div>
                            {payments.length === 0 ? (
                              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 10px" }}>No payments recorded yet.</p>
                            ) : (
                              <table border={1} cellPadding={6} style={{ width: "100%", fontSize: "12px", marginBottom: "12px", background: "#fff" }}>
                                <thead>
                                  <tr style={{ background: "#f1f5f9" }}>
                                    <th style={{ textAlign: "left" }}>Date</th>
                                    <th style={{ textAlign: "right" }}>Amount</th>
                                    <th style={{ textAlign: "left" }}>Method</th>
                                    <th style={{ textAlign: "left" }}>Reference</th>
                                    <th style={{ textAlign: "left" }}>Notes</th>
                                    <th style={{ textAlign: "right" }}>Balance</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {payments.map((p, i) => (
                                    <tr key={p.id}>
                                      <td>{p.payment_date}</td>
                                      <td style={{ textAlign: "right" }}>${Number(p.amount).toFixed(2)}</td>
                                      <td>{p.payment_method}</td>
                                      <td>{p.reference ?? "—"}</td>
                                      <td>{p.notes ?? "—"}</td>
                                      <td style={{ textAlign: "right", fontWeight: 600 }}>${runningBalance[i].balanceAfter.toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {remaining <= 0 ? (
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>Invoice fully paid.</div>
                            ) : (
                              <>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                                  <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Payment Date</label>
                                    <input type="date" value={invPaymentDate} onChange={(e) => setInvPaymentDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Amount ($)</label>
                                    <input type="number" step="0.01" min="0" max={remaining} value={invPaymentAmount} onChange={(e) => setInvPaymentAmount(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Payment Method</label>
                                    <select value={invPaymentMethod} onChange={(e) => setInvPaymentMethod(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                                      <option value="cash">Cash</option>
                                      <option value="check">Check</option>
                                      <option value="bank_transfer">Bank Transfer</option>
                                      <option value="card">Card</option>
                                      <option value="other">Other</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Reference</label>
                                    <input type="text" placeholder="Check #, wire ref, etc." value={invPaymentReference} onChange={(e) => setInvPaymentReference(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                                  </div>
                                  <div style={{ gridColumn: "1 / -1" }}>
                                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Notes</label>
                                    <input type="text" placeholder="Optional" value={invPaymentNotes} onChange={(e) => setInvPaymentNotes(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                                  </div>
                                </div>
                                <button
                                  onClick={() => onSaveInvoicePayment(row.session_id, supplierId, remaining)}
                                  disabled={isSavingInvoicePayment}
                                  style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", opacity: isSavingInvoicePayment ? 0.6 : 1 }}
                                >{isSavingInvoicePayment ? "Saving..." : "Save Payment"}</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })()}
                    </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                    <td colSpan={2}>Total</td>
                    <td style={{ textAlign: "right" }}>${totalInvoiced.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "#15803d" }}>${totalPaid.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>${totalOutstanding.toFixed(2)}</td>
                    <td />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </>
            );
          })()}
        </div>
      </td>
    </tr>
  );
}
