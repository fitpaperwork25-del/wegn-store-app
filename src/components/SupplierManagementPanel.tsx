import React from "react";
import type { Supplier, PurchaseOrder, POItem, SupplierStatementRow } from "../lib/purchasing/types";
import type { ProductStock } from "../lib/product/types";
import type { SessionPayment } from "../lib/inventory/types";
import { SupplierStatementPanel } from "./SupplierStatementPanel";

type SupplierManagementPanelProps = {
  visible: boolean;
  suppliers: Supplier[];
  supName: string;
  setSupName: (v: string) => void;
  supContact: string;
  setSupContact: (v: string) => void;
  supPhone: string;
  setSupPhone: (v: string) => void;
  supEmail: string;
  setSupEmail: (v: string) => void;
  supNotes: string;
  setSupNotes: (v: string) => void;
  onAddSupplier: (e: React.FormEvent) => void;
  supplierListOpen: boolean | null;
  setSupplierListOpen: (v: boolean | null) => void;
  editingSupplierId: string | null;
  expandedCustomerId: string | null;
  setExpandedCustomerId: (v: string | null) => void;
  supplierPOMap: Record<string, PurchaseOrder[]>;
  products: ProductStock[];
  poItemsByPoId: Map<string, POItem[]>;
  fmtPhone: (p: string) => string;
  onStartEditSupplier: (s: Supplier) => void;
  onCancelEditSupplier: () => void;
  onToggleSupplierStatus: (s: Supplier) => void;
  onDeleteSupplier: (id: string, name: string) => void;
  statementSupplierId: string | null;
  setStatementSupplierId: (v: string | null) => void;
  onLoadSupplierStatement: (supplierId: string) => void;
  editSupName: string;
  setEditSupName: (v: string) => void;
  editSupContact: string;
  setEditSupContact: (v: string) => void;
  editSupPhone: string;
  setEditSupPhone: (v: string) => void;
  editSupEmail: string;
  setEditSupEmail: (v: string) => void;
  editSupNotes: string;
  setEditSupNotes: (v: string) => void;
  onSaveSupplier: () => void;
  isLoadingStatement: boolean;
  supplierStatement: SupplierStatementRow[];
  getPrefQty: (productId: string) => number | null;
  savePrefQty: (productId: string, qty: number) => void;
  onCreateCatalogPO: (supplierId: string) => void;
  // Supplier Accounts Payable Phase 1 - Record Payment / Payment History,
  // scoped to source: "purchase_order" statement rows only.
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

export function SupplierManagementPanel({
  visible,
  suppliers,
  supName, setSupName,
  supContact, setSupContact,
  supPhone, setSupPhone,
  supEmail, setSupEmail,
  supNotes, setSupNotes,
  onAddSupplier,
  supplierListOpen, setSupplierListOpen,
  editingSupplierId,
  expandedCustomerId, setExpandedCustomerId,
  supplierPOMap,
  products,
  poItemsByPoId,
  fmtPhone,
  onStartEditSupplier,
  onCancelEditSupplier,
  onToggleSupplierStatus,
  onDeleteSupplier,
  statementSupplierId, setStatementSupplierId,
  onLoadSupplierStatement,
  editSupName, setEditSupName,
  editSupContact, setEditSupContact,
  editSupPhone, setEditSupPhone,
  editSupEmail, setEditSupEmail,
  editSupNotes, setEditSupNotes,
  onSaveSupplier,
  isLoadingStatement,
  supplierStatement,
  getPrefQty,
  savePrefQty,
  onCreateCatalogPO,
  paymentPanelInvoiceId, setPaymentPanelInvoiceId,
  invoicePayments,
  onLoadInvoicePayments,
  invPaymentDate, setInvPaymentDate,
  invPaymentAmount, setInvPaymentAmount,
  invPaymentMethod, setInvPaymentMethod,
  invPaymentReference, setInvPaymentReference,
  invPaymentNotes, setInvPaymentNotes,
  onSaveInvoicePayment,
  isSavingInvoicePayment,
}: SupplierManagementPanelProps) {
  return (
    <div style={{ display: visible ? '' : 'none' }}>

      <h2 style={{ marginTop: "40px" }}>Suppliers</h2>

      <form
        onSubmit={onAddSupplier}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Supplier Name *"
          value={supName}
          onChange={(e) => setSupName(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Contact Person"
          value={supContact}
          onChange={(e) => setSupContact(e.target.value)}
          style={{ flex: "1 1 160px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Phone"
          value={supPhone}
          onChange={(e) => setSupPhone(e.target.value)}
          style={{ flex: "1 1 130px", padding: "8px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={supEmail}
          onChange={(e) => setSupEmail(e.target.value)}
          style={{ flex: "1 1 180px", padding: "8px" }}
        />
        <input
          type="text"
          placeholder="Notes"
          value={supNotes}
          onChange={(e) => setSupNotes(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        />
        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Add Supplier
        </button>
      </form>

      <button
        onClick={() => setSupplierListOpen(!(supplierListOpen ?? (suppliers.length < 10)))}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(supplierListOpen ?? (suppliers.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Suppliers</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({suppliers.length} suppliers)</span>
      </button>
      <div style={{ display: (supplierListOpen ?? (suppliers.length < 10)) ? '' : 'none', marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
              <th style={{ width: "30px", padding: "10px 8px" }}></th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Supplier</th>
              <th style={{ textAlign: "right", padding: "10px 8px" }}>POs</th>
              <th style={{ textAlign: "right", padding: "10px 8px" }}>Total Spend</th>
              <th style={{ textAlign: "left", padding: "10px 8px" }}>Last Order</th>
              <th style={{ padding: "10px 8px" }}>Performance</th>
              <th style={{ padding: "10px 8px" }}>Status</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: "16px", color: "#64748b" }}>No suppliers found</td></tr>
            ) : (
              suppliers.map((s) => {
                const inactive = s.status !== "active";
                const isEditing = editingSupplierId === s.id;
                const isExpanded = expandedCustomerId === `sup-${s.id}`;
                const pos = supplierPOMap[s.id] ?? [];
                const received = pos.filter(po => po.status === "received");
                const nonCancelled = pos.filter(po => po.status !== "cancelled");
                const totalSpend = nonCancelled.reduce((sum, po) => sum + Number(po.subtotal), 0);
                const receivedRate = pos.length > 0 ? Math.round((received.length / pos.length) * 100) : 0;
                const lastPO = pos.length > 0 ? new Date(Math.max(...pos.map(po => new Date(po.created_at).getTime()))) : null;
                const health = pos.length === 0 ? "none" : receivedRate >= 60 ? "good" : "attention";
                const healthBg = health === "good" ? "#dcfce7" : health === "attention" ? "#fef3c7" : "#f1f5f9";
                const healthColor = health === "good" ? "#15803d" : health === "attention" ? "#92400e" : "#94a3b8";
                const healthLabel = health === "good" ? "Good" : health === "attention" ? "Attention" : "No Activity";
                return (
                  <React.Fragment key={s.id}>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", ...(inactive ? { backgroundColor: "#f9fafb", color: "#94a3b8" } : {}) }}>
                      <td style={{ padding: "10px 8px", cursor: "pointer", textAlign: "center" }} onClick={() => setExpandedCustomerId(isExpanded ? null : `sup-${s.id}`)}>
                        {isExpanded ? "▾" : "▸"}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right" }}>{pos.length}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 500 }}>${totalSpend.toFixed(2)}</td>
                      <td style={{ padding: "10px 8px", fontSize: "13px", color: "#64748b" }}>{lastPO ? lastPO.toLocaleDateString() : "—"}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: healthBg, color: healthColor }}>{healthLabel}</span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: inactive ? "#e5e7eb" : "#dcfce7", color: inactive ? "#6b7280" : "#15803d" }}>{s.status}</span>
                      </td>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>
                        <button onClick={() => isEditing ? onCancelEditSupplier() : onStartEditSupplier(s)} style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer", background: isEditing ? "#f3f4f6" : undefined }}>{isEditing ? "Cancel" : "Edit"}</button>
                        <button onClick={() => onToggleSupplierStatus(s)} style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer", color: inactive ? "#15803d" : "#b45309" }}>{inactive ? "Activate" : "Deactivate"}</button>
                        <button onClick={() => onDeleteSupplier(s.id, s.name)} style={{ padding: "3px 10px", marginRight: "4px", cursor: "pointer", color: "#b91c1c" }}>Delete</button>
                        <button
                          onClick={async () => {
                            if (statementSupplierId === s.id) { setStatementSupplierId(null); return; }
                            setStatementSupplierId(s.id);
                            await onLoadSupplierStatement(s.id);
                          }}
                          style={{ padding: "3px 10px", cursor: "pointer", background: statementSupplierId === s.id ? "#1d4ed8" : "none", color: statementSupplierId === s.id ? "#fff" : "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "4px" }}
                        >Statement</button>
                      </td>
                    </tr>
                    {isExpanded && !isEditing && (() => {
                      const supProducts = products.filter(p => p.supplier_id === s.id);
                      const catalogValue = supProducts.reduce((sum, p) => sum + p.quantity_on_hand * p.average_cost, 0);

                      const poIds = new Set(pos.map(p => p.id));
                      const supPoItems = Array.from(poIds).flatMap(id => poItemsByPoId.get(id) ?? []);
                      const nonCancelledPos = pos.filter(po => po.status !== "cancelled");
                      const totalSpendAll = nonCancelledPos.reduce((sum, po) => sum + Number(po.subtotal), 0);
                      const avgOrderValue = nonCancelledPos.length > 0 ? totalSpendAll / nonCancelledPos.length : 0;
                      const draftCount = pos.filter(po => po.status === "draft").length;
                      const orderedCount = pos.filter(po => po.status === "ordered").length;
                      const partialCount = pos.filter(po => po.status === "partially_received").length;
                      const receivedCount = pos.filter(po => po.status === "received").length;
                      const cancelledCount = pos.filter(po => po.status === "cancelled").length;
                      const totalOrderedQty = supPoItems.reduce((sum, i) => sum + i.quantity, 0);
                      const totalReceivedQty = supPoItems.reduce((sum, i) => sum + (i.quantity_received ?? 0), 0);
                      const totalRemainingQty = totalOrderedQty - totalReceivedQty;

                      return (
                      <tr>
                        <td colSpan={8} style={{ background: "#f8fafc", padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
                          {/* Contact info */}
                          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "12px", fontSize: "13px" }}>
                            <div><span style={{ color: "#94a3b8" }}>Contact:</span> <strong>{s.contact_name || "—"}</strong></div>
                            <div><span style={{ color: "#94a3b8" }}>Phone:</span> <strong>{s.phone ? fmtPhone(s.phone) : "—"}</strong></div>
                            <div><span style={{ color: "#94a3b8" }}>Email:</span> <strong>{s.email || "—"}</strong></div>
                          </div>
                          {/* Performance Metrics */}
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {[
                              { label: "Total Spend", value: `$${totalSpendAll.toFixed(2)}`, color: "#1d4ed8" },
                              { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(2)}` },
                              { label: "Total POs", value: pos.length },
                              { label: "Products Supplied", value: supProducts.length },
                              { label: "Last Order", value: lastPO ? lastPO.toLocaleDateString() : "—" },
                              { label: "Inventory Value", value: `$${catalogValue.toFixed(2)}` },
                            ].map(card => (
                              <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 12px", minWidth: "110px", flex: 1, background: "#fff" }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>{card.label}</div>
                                <div style={{ fontSize: "17px", fontWeight: 700, color: (card as { color?: string }).color ?? "#0f172a" }}>{card.value}</div>
                              </div>
                            ))}
                          </div>
                          {/* Quantity & Status Metrics */}
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
                            {[
                              { label: "Ordered Qty", value: totalOrderedQty },
                              { label: "Received Qty", value: totalReceivedQty, color: "#15803d" },
                              { label: "Remaining Qty", value: totalRemainingQty, color: totalRemainingQty > 0 ? "#b45309" : "#15803d" },
                              { label: "Draft", value: draftCount },
                              { label: "Ordered", value: orderedCount },
                              { label: "Partial", value: partialCount, color: partialCount > 0 ? "#a16207" : undefined },
                              { label: "Received", value: receivedCount, color: "#15803d" },
                              { label: "Cancelled", value: cancelledCount, color: cancelledCount > 0 ? "#6b7280" : undefined },
                            ].map(card => (
                              <div key={card.label} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "6px 10px", minWidth: "80px", background: "#fff" }}>
                                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em" }}>{card.label}</div>
                                <div style={{ fontSize: "16px", fontWeight: 700, color: (card as { color?: string }).color ?? "#0f172a" }}>{card.value}</div>
                              </div>
                            ))}
                          </div>
                          {s.notes && <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}><strong>Notes:</strong> {s.notes}</div>}

                          {/* PO Breakdown Table */}
                          {pos.length > 0 && (
                            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", marginBottom: "16px" }}>
                              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>Purchase Order Breakdown</strong>
                              <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                                      <th style={{ textAlign: "left", padding: "6px 8px" }}>PO Number</th>
                                      <th style={{ padding: "6px 8px" }}>Status</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Ordered</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Received</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Remaining</th>
                                      <th style={{ textAlign: "right", padding: "6px 8px" }}>Subtotal</th>
                                      <th style={{ textAlign: "left", padding: "6px 8px" }}>Date</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {[...pos].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((po, i) => {
                                      const poItemsForPo = poItemsByPoId.get(po.id) ?? [];
                                      const ordQty = poItemsForPo.reduce((sum, item) => sum + item.quantity, 0);
                                      const rcvQty = poItemsForPo.reduce((sum, item) => sum + (item.quantity_received ?? 0), 0);
                                      const remQty = ordQty - rcvQty;
                                      const stBg = po.status === "received" ? "#dcfce7" : po.status === "partially_received" ? "#fef9c3" : po.status === "ordered" ? "#dbeafe" : po.status === "cancelled" ? "#e5e7eb" : "#f1f5f9";
                                      const stColor = po.status === "received" ? "#15803d" : po.status === "partially_received" ? "#a16207" : po.status === "ordered" ? "#1e40af" : po.status === "cancelled" ? "#6b7280" : "#475569";
                                      const stLabel = po.status === "partially_received" ? "partial" : po.status === "ordered" ? "awaiting" : po.status;
                                      return (
                                        <tr key={po.id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa", color: po.status === "cancelled" ? "#9ca3af" : undefined }}>
                                          <td style={{ padding: "6px 8px", fontWeight: 500 }}>{po.po_number}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: stBg, color: stColor }}>{stLabel}</span>
                                          </td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{ordQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>{rcvQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: remQty > 0 ? "bold" : "normal", color: remQty > 0 ? "#b45309" : "#15803d" }}>{remQty}</td>
                                          <td style={{ padding: "6px 8px", textAlign: "right" }}>${Number(po.subtotal).toFixed(2)}</td>
                                          <td style={{ padding: "6px 8px", fontSize: "12px", color: "#64748b" }}>{new Date(po.created_at).toLocaleDateString()}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr style={{ borderTop: "2px solid #e2e8f0", fontWeight: "bold", background: "#f9fafb" }}>
                                      <td style={{ padding: "6px 8px" }}>Total ({pos.length} POs)</td>
                                      <td></td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>{totalOrderedQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>{totalReceivedQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right", color: totalRemainingQty > 0 ? "#b45309" : "#15803d" }}>{totalRemainingQty}</td>
                                      <td style={{ padding: "6px 8px", textAlign: "right" }}>${nonCancelledPos.reduce((sum, po) => sum + Number(po.subtotal), 0).toFixed(2)}</td>
                                      <td></td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Product Catalog */}
                          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <strong style={{ fontSize: "14px" }}>Product Catalog ({supProducts.length})</strong>
                              {supProducts.length > 0 && (
                                <button
                                  onClick={() => onCreateCatalogPO(s.id)}
                                  style={{ padding: "6px 16px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#15803d", color: "#fff", fontWeight: 600, fontSize: "13px" }}
                                >Create PO From Catalog</button>
                              )}
                            </div>
                            {supProducts.length === 0 ? (
                              <div style={{ fontSize: "13px", color: "#94a3b8", padding: "8px 0" }}>No products assigned to this supplier yet. Use the Reorder Center to assign products.</div>
                            ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                  <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f1f5f9" }}>
                                    <th style={{ textAlign: "left", padding: "6px 8px" }}>Product</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Stock</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Reorder Level</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Last Cost</th>
                                    <th style={{ textAlign: "right", padding: "6px 8px" }}>Pref. Order Qty</th>
                                    <th style={{ padding: "6px 8px" }}>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {supProducts.map((p, i) => {
                                    const defaultQty = Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand);
                                    const prefQty = getPrefQty(p.product_id);
                                    const isLow = p.reorder_level !== null && p.quantity_on_hand < p.reorder_level;
                                    return (
                                      <tr key={p.product_id} style={{ borderBottom: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                                        <td style={{ padding: "6px 8px" }}>{p.product_name}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.quantity_on_hand}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.reorder_level}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>${p.average_cost.toFixed(2)}</td>
                                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                                          <input
                                            type="number" min="1"
                                            value={prefQty ?? defaultQty}
                                            onChange={(e) => savePrefQty(p.product_id, Math.max(1, Number(e.target.value) || 1))}
                                            style={{ width: "60px", padding: "3px", textAlign: "right", fontSize: "12px" }}
                                          />
                                        </td>
                                        <td style={{ padding: "6px 8px" }}>
                                          {isLow ? (
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "#fef2f2", color: "#dc2626" }}>Low Stock</span>
                                          ) : (
                                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "10px", background: "#dcfce7", color: "#15803d" }}>OK</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })()}
                    {isEditing && (
                      <tr>
                        <td colSpan={8} style={{ background: "#f0f4ff", padding: "16px", border: "1px solid #c7d2fe" }}>
                          <strong style={{ color: "#3730a3", display: "block", marginBottom: "10px" }}>Edit Supplier — {s.name}</strong>
                          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                            <input type="text" placeholder="Supplier Name *" value={editSupName} onChange={(e) => setEditSupName(e.target.value)} style={{ flex: "2 1 180px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Contact Person" value={editSupContact} onChange={(e) => setEditSupContact(e.target.value)} style={{ flex: "1 1 150px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Phone" value={editSupPhone} onChange={(e) => setEditSupPhone(e.target.value)} style={{ flex: "1 1 120px", padding: "7px 10px" }} />
                            <input type="email" placeholder="Email" value={editSupEmail} onChange={(e) => setEditSupEmail(e.target.value)} style={{ flex: "1 1 170px", padding: "7px 10px" }} />
                            <input type="text" placeholder="Notes" value={editSupNotes} onChange={(e) => setEditSupNotes(e.target.value)} style={{ flex: "2 1 180px", padding: "7px 10px" }} />
                            <button onClick={onSaveSupplier} disabled={!editSupName.trim()} style={{ padding: "7px 18px", cursor: "pointer", fontWeight: "bold", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}>Save</button>
                            <button onClick={onCancelEditSupplier} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {statementSupplierId === s.id && (
                      <SupplierStatementPanel
                        supplierId={s.id}
                        supplierName={s.name}
                        isLoadingStatement={isLoadingStatement}
                        supplierStatement={supplierStatement}
                        paymentPanelInvoiceId={paymentPanelInvoiceId}
                        setPaymentPanelInvoiceId={setPaymentPanelInvoiceId}
                        invoicePayments={invoicePayments}
                        onLoadInvoicePayments={onLoadInvoicePayments}
                        invPaymentDate={invPaymentDate} setInvPaymentDate={setInvPaymentDate}
                        invPaymentAmount={invPaymentAmount} setInvPaymentAmount={setInvPaymentAmount}
                        invPaymentMethod={invPaymentMethod} setInvPaymentMethod={setInvPaymentMethod}
                        invPaymentReference={invPaymentReference} setInvPaymentReference={setInvPaymentReference}
                        invPaymentNotes={invPaymentNotes} setInvPaymentNotes={setInvPaymentNotes}
                        onSaveInvoicePayment={onSaveInvoicePayment}
                        isSavingInvoicePayment={isSavingInvoicePayment}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
