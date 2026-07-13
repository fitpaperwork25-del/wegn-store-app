import React from "react";
import type { Supplier, PurchaseOrder, POItem } from "../App";
import type { ProductStock } from "../lib/product/types";
import { buildProductNameMap } from "../lib/product/productHelpers";

type PurchasingTabProps = {
  visible: boolean;

  // Suppliers
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
  supplierStatement: { session_id: string; invoice_number: string; invoice_date: string | null; invoice_total: number; paid: number }[];
  getPrefQty: (productId: string) => number | null;
  savePrefQty: (productId: string, qty: number) => void;
  onCreateCatalogPO: (supplierId: string) => void;

  // Smart Purchase Planning / Reorder
  reorderSuppliers: Record<string, string>;
  setReorderSuppliers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  reorderFilter: "all" | "missing" | "ready";
  setReorderFilter: (v: "all" | "missing" | "ready") => void;
  reorderSelected: Set<string>;
  setReorderSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  reorderQtys: Record<string, string>;
  setReorderQtys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  aiReorderRecs: Record<string, { qty: number; sold7: number; sold30: number; hasData: boolean }>;
  collapsedSuppliers: Set<string>;
  setCollapsedSuppliers: React.Dispatch<React.SetStateAction<Set<string>>>;
  bulkSupplierId: string;
  setBulkSupplierId: (v: string) => void;
  onBulkAssignSupplier: () => void;
  onBatchReorderPO: (overrideSelected?: Set<string>) => void;

  // Create PO / PO List / Detail / Receive
  poSupplierId: string;
  setPoSupplierId: (v: string) => void;
  poNotes: string;
  setPoNotes: (v: string) => void;
  onCreatePO: (e: React.FormEvent) => void;
  poListOpen: boolean | null;
  setPoListOpen: (v: boolean | null) => void;
  purchaseOrders: PurchaseOrder[];
  poStatusFilter: "all" | "draft" | "ordered" | "partially_received" | "received" | "cancelled";
  setPoStatusFilter: (v: "all" | "draft" | "ordered" | "partially_received" | "received" | "cancelled") => void;
  showAllPOs: boolean;
  setShowAllPOs: (v: boolean) => void;
  selectedPoId: string;
  poMoreOpen: string | null;
  setPoMoreOpen: (v: string | null) => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onMarkOrdered: (po: PurchaseOrder) => void;
  receivingPoId: string;
  onOpenReceive: (po: PurchaseOrder) => void;
  onDeletePO: (po: PurchaseOrder) => void;
  onPrintPO: (po: PurchaseOrder) => void;
  onEmailPO: (po: PurchaseOrder) => void;
  setSignPoId: (v: string | null) => void;
  setSignRole: (v: "manager" | "supplier") => void;
  onCancelPO: (po: PurchaseOrder) => void;
  poItems: POItem[];
  itemProductId: string;
  setItemProductId: (v: string) => void;
  itemQuantity: string;
  setItemQuantity: (v: string) => void;
  itemUnitCost: string;
  setItemUnitCost: (v: string) => void;
  onAddPOItem: (e: React.FormEvent) => void;
  onRemovePOItem: (itemId: string) => void;
  receivingItems: POItem[];
  receiveQtys: Record<string, string>;
  setReceiveQtys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receiveDamagedQtys: Record<string, string>;
  setReceiveDamagedQtys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receiveExpiredQtys: Record<string, string>;
  setReceiveExpiredQtys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receiveRejectedQtys: Record<string, string>;
  setReceiveRejectedQtys: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receiveUnitCosts: Record<string, string>;
  setReceiveUnitCosts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  receiveLineNotes: Record<string, string>;
  setReceiveLineNotes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onConfirmReceive: () => void;
  isConfirmingReceive: boolean;
};

export function PurchasingTab({
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
  reorderSuppliers, setReorderSuppliers,
  reorderFilter, setReorderFilter,
  reorderSelected, setReorderSelected,
  reorderQtys, setReorderQtys,
  aiReorderRecs,
  collapsedSuppliers, setCollapsedSuppliers,
  bulkSupplierId, setBulkSupplierId,
  onBulkAssignSupplier,
  onBatchReorderPO,
  poSupplierId, setPoSupplierId,
  poNotes, setPoNotes,
  onCreatePO,
  poListOpen, setPoListOpen,
  purchaseOrders,
  poStatusFilter, setPoStatusFilter,
  showAllPOs, setShowAllPOs,
  selectedPoId,
  poMoreOpen, setPoMoreOpen,
  onSelectPO,
  onMarkOrdered,
  receivingPoId,
  onOpenReceive,
  onDeletePO,
  onPrintPO,
  onEmailPO,
  setSignPoId,
  setSignRole,
  onCancelPO,
  poItems,
  itemProductId, setItemProductId,
  itemQuantity, setItemQuantity,
  itemUnitCost, setItemUnitCost,
  onAddPOItem,
  onRemovePOItem,
  receivingItems,
  receiveQtys, setReceiveQtys,
  receiveDamagedQtys, setReceiveDamagedQtys,
  receiveExpiredQtys, setReceiveExpiredQtys,
  receiveRejectedQtys, setReceiveRejectedQtys,
  receiveUnitCosts, setReceiveUnitCosts,
  receiveLineNotes, setReceiveLineNotes,
  onConfirmReceive,
  isConfirmingReceive,
}: PurchasingTabProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Purchasing</h2>
        <p className="page-subtitle">Manage suppliers, purchase orders, receiving, and reorder planning</p>
      </div>

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
                      <tr>
                        <td colSpan={8} style={{ padding: "0", borderTop: "2px solid #e2e8f0" }}>
                          <div style={{ padding: "16px 20px", background: "#f8fafc" }}>
                            <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px", color: "#0f172a" }}>Supplier Statement — {s.name}</div>
                            {isLoadingStatement ? (
                              <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
                            ) : supplierStatement.length === 0 ? (
                              <p style={{ fontSize: "13px", color: "#64748b" }}>No invoiced receiving sessions found for this supplier.</p>
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
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {supplierStatement.map(row => {
                                      const remaining = Math.round((row.invoice_total - row.paid) * 100) / 100;
                                      const paidStatus = remaining <= 0 ? "paid" : row.paid > 0 ? "partial" : "outstanding";
                                      const statusBg = paidStatus === "paid" ? "#dcfce7" : paidStatus === "partial" ? "#fef9c3" : "#fef2f2";
                                      const statusColor = paidStatus === "paid" ? "#15803d" : paidStatus === "partial" ? "#a16207" : "#dc2626";
                                      const statusLabel = paidStatus === "paid" ? "Paid" : paidStatus === "partial" ? "Partially Paid" : "Outstanding";
                                      return (
                                      <tr key={row.session_id}>
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
                                      </tr>
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
                                    </tr>
                                  </tfoot>
                                </table>
                              </>
                              );
                            })()}
                          </div>
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

      <h2 style={{ marginTop: "40px" }}>Smart Purchase Planning</h2>

      {(() => {
        const lowStock = products.filter((p) => p.reorder_level !== null && p.quantity_on_hand < p.reorder_level && p.status === "active");
        if (lowStock.length === 0) {
          return <p style={{ color: "#16a34a" }}>All products are sufficiently stocked.</p>;
        }
        const missingSup = lowStock.filter(p => !p.supplier_id && !reorderSuppliers[p.product_id]);
        const readyToOrder = lowStock.filter(p => p.supplier_id || reorderSuppliers[p.product_id]);
        const filtered = reorderFilter === "missing" ? missingSup : reorderFilter === "ready" ? readyToOrder : lowStock;
        const selectedCount = lowStock.filter(p => reorderSelected.has(p.product_id)).length;
        const estValue = lowStock.filter(p => reorderSelected.has(p.product_id)).reduce((sum, p) => {
          const qty = Math.max(0, Number(reorderQtys[p.product_id] ?? ((p.reorder_level ?? 0) - p.quantity_on_hand)));
          return sum + qty * (p.average_cost || 0);
        }, 0);
        const involvedSuppliers = new Set(lowStock.map(p => reorderSuppliers[p.product_id] || p.supplier_id).filter(Boolean));
        const aiApplyCount = reorderFilter !== "missing"
          ? Array.from(reorderSelected).filter(pid => aiReorderRecs[pid]?.hasData).length
          : 0;

        const grouped: Record<string, typeof lowStock> = {};
        for (const p of filtered) {
          const sid = reorderSuppliers[p.product_id] || p.supplier_id || "__unassigned__";
          if (!grouped[sid]) grouped[sid] = [];
          grouped[sid].push(p);
        }
        const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s.name]));

        return (
          <>
          {/* Summary cards */}
          <div className="dash-card-row" style={{ marginBottom: "16px" }}>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#fef2f2", color: "#dc2626" }}>!</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Need Reorder</div>
                <div className="dash-card-value">{lowStock.length}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>S</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Suppliers Involved</div>
                <div className="dash-card-value">{involvedSuppliers.size}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>&#x2713;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Selected</div>
                <div className="dash-card-value">{selectedCount}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>$</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Est. PO Value</div>
                <div className="dash-card-value">${estValue.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Missing supplier alert */}
          {missingSup.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", marginBottom: "12px" }}>
              <div style={{ fontSize: "14px", color: "#92400e" }}>
                <strong>{missingSup.length}</strong> product{missingSup.length !== 1 ? "s" : ""} need supplier assignment
              </div>
              <button
                onClick={() => setReorderFilter("missing")}
                style={{ padding: "5px 14px", fontSize: "13px", cursor: "pointer", borderRadius: "5px", border: "1px solid #f59e0b", background: "#fef3c7", color: "#92400e", fontWeight: 600 }}
              >Review Missing Suppliers</button>
            </div>
          )}

          {/* Filter chips */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
            {([
              { key: "all" as const, label: "All", count: lowStock.length },
              { key: "missing" as const, label: "Missing Supplier", count: missingSup.length },
              { key: "ready" as const, label: "Ready to Reorder", count: readyToOrder.length },
            ]).map(chip => {
              const active = reorderFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => { setReorderFilter(chip.key); setReorderSelected(new Set()); }}
                  style={{
                    padding: "6px 16px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                    border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                    background: active ? "#dbeafe" : "#f9fafb",
                    color: active ? "#1d4ed8" : "#374151",
                    fontWeight: active ? 600 : 400,
                  }}
                >{chip.label} ({chip.count})</button>
              );
            })}
            {selectedCount > 0 && (
              <span style={{ fontSize: "13px", color: "#64748b", marginLeft: "8px" }}>{selectedCount} selected</span>
            )}
          </div>

          {/* Bulk actions */}
          {selectedCount > 0 && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              <button
                onClick={() => setReorderSelected(new Set())}
                style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "5px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "13px" }}
              >Clear Selection</button>
              <select
                value={bulkSupplierId}
                onChange={(e) => setBulkSupplierId(e.target.value)}
                style={{ padding: "6px 8px", fontSize: "13px", borderRadius: "5px", border: "1px solid #d1d5db" }}
              >
                <option value="">Assign supplier…</option>
                {suppliers.filter(s => s.status === "active").map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {bulkSupplierId && (
                <button
                  onClick={onBulkAssignSupplier}
                  style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "5px", border: "none", background: "#15803d", color: "#fff", fontWeight: 600, fontSize: "13px" }}
                >Assign to Selected ({selectedCount})</button>
              )}
              {aiApplyCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const updates: Record<string, string> = {};
                    for (const pid of Array.from(reorderSelected)) {
                      const r = aiReorderRecs[pid];
                      if (r?.hasData) updates[pid] = String(r.qty);
                    }
                    setReorderQtys(prev => ({ ...prev, ...updates }));
                  }}
                  style={{ padding: "6px 14px", cursor: "pointer", borderRadius: "5px", border: "1px solid #7c3aed", background: "#faf5ff", color: "#7c3aed", fontWeight: 600, fontSize: "13px" }}
                >✦ Apply AI Qty ({aiApplyCount})</button>
              )}
              {reorderFilter !== "missing" && (
                <button
                  onClick={() => onBatchReorderPO()}
                  style={{ padding: "8px 22px", cursor: "pointer", borderRadius: "6px", border: "none", background: "#15803d", color: "#fff", fontWeight: 700, fontSize: "14px" }}
                >Create Draft PO ({selectedCount})</button>
              )}
            </div>
          )}

          {/* Grouped by supplier */}
          {Object.entries(grouped)
            .sort(([aSid, aItems], [bSid, bItems]) => {
              if (aSid === "__unassigned__") return 1;
              if (bSid === "__unassigned__") return -1;
              const aVal = aItems.reduce((s, p) => s + Math.max(0, Number(reorderQtys[p.product_id] ?? ((p.reorder_level ?? 0) - p.quantity_on_hand))) * (p.average_cost || 0), 0);
              const bVal = bItems.reduce((s, p) => s + Math.max(0, Number(reorderQtys[p.product_id] ?? ((p.reorder_level ?? 0) - p.quantity_on_hand))) * (p.average_cost || 0), 0);
              return bVal - aVal;
            })
            .map(([sid, items]) => {
            const supName2 = sid === "__unassigned__" ? "No Supplier Assigned" : (supplierMap[sid] ?? "Unknown");
            const isCollapsed = collapsedSuppliers.has(sid);
            const groupValue = items.reduce((sum, p) => {
              const qty = Math.max(0, Number(reorderQtys[p.product_id] ?? ((p.reorder_level ?? 0) - p.quantity_on_hand)));
              return sum + qty * (p.average_cost || 0);
            }, 0);
            const groupSelected = items.filter(p => reorderSelected.has(p.product_id)).length;
            const allGroupSelected = items.every(p => reorderSelected.has(p.product_id));
            const groupAiCount = items.filter(p => aiReorderRecs[p.product_id]?.hasData).length;
            return (
              <div key={sid} style={{ marginBottom: "16px", border: "1px solid #e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                <div
                  onClick={() => setCollapsedSuppliers(prev => { const n = new Set(prev); if (n.has(sid)) n.delete(sid); else n.add(sid); return n; })}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", background: "#f8fafc", cursor: "pointer", userSelect: "none" }}
                >
                  <span style={{ fontSize: "14px", color: "#64748b" }}>{isCollapsed ? "▸" : "▾"}</span>
                  <strong style={{ fontSize: "15px", color: sid === "__unassigned__" ? "#b45309" : "#0f172a" }}>{supName2}</strong>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>{items.length} product{items.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Est. ${groupValue.toFixed(2)}</span>
                  {groupSelected > 0 && <span style={{ fontSize: "12px", color: "#1d4ed8", fontWeight: 600 }}>{groupSelected} selected</span>}
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
                    {sid !== "__unassigned__" && (
                      <>
                        {groupAiCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updates: Record<string, string> = {};
                              for (const p of items) { const r = aiReorderRecs[p.product_id]; if (r?.hasData) updates[p.product_id] = String(r.qty); }
                              setReorderQtys(prev => ({ ...prev, ...updates }));
                            }}
                            style={{ fontSize: "12px", padding: "3px 10px", cursor: "pointer", borderRadius: "4px", border: "1px solid #7c3aed", background: "#faf5ff", color: "#7c3aed", fontWeight: 600 }}
                          >✦ AI Qty</button>
                        )}
                        <button
                          type="button"
                          onClick={() => onBatchReorderPO(new Set(items.map(p => p.product_id)))}
                          style={{ fontSize: "12px", padding: "3px 10px", cursor: "pointer", borderRadius: "4px", border: "none", background: "#15803d", color: "#fff", fontWeight: 700 }}
                        >Create PO →</button>
                      </>
                    )}
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => {
                        setReorderSelected(prev => {
                          const next = new Set(prev);
                          if (allGroupSelected) { items.forEach(p => next.delete(p.product_id)); } else { items.forEach(p => next.add(p.product_id)); }
                          return next;
                        });
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                </div>
                {!isCollapsed && (
                  <table border={0} cellPadding={8} style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                        <th style={{ width: "36px", padding: "6px 8px" }}></th>
                        <th style={{ textAlign: "left", padding: "6px 8px" }}>Product</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Stock</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Reorder</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Shortage</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", color: "#7c3aed" }} title="Units sold in last 7 days (completed sales)">7d Sales</th>
                        <th style={{ textAlign: "right", padding: "6px 8px", color: "#7c3aed" }} title="AI-recommended order quantity based on 7/30-day sales velocity">AI Rec.</th>
                        <th style={{ padding: "6px 8px" }}>Supplier</th>
                        <th style={{ textAlign: "right", padding: "6px 8px" }}>Order Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p, i) => {
                        const checked = reorderSelected.has(p.product_id);
                        const savedSupplier = p.supplier_id || "";
                        return (
                          <tr key={p.product_id} style={{ borderBottom: "1px solid #f1f5f9", background: checked ? "#eff6ff" : i % 2 === 0 ? "#fff" : "#fafafa" }}>
                            <td style={{ padding: "6px 8px" }}>
                              <input type="checkbox" checked={checked} onChange={() => { setReorderSelected(prev => { const n = new Set(prev); if (n.has(p.product_id)) n.delete(p.product_id); else n.add(p.product_id); return n; }); }} style={{ cursor: "pointer" }} />
                            </td>
                            <td style={{ padding: "6px 8px" }}>{p.product_name}{p.quantity_on_hand === 0 && <span style={{ marginLeft: 4, fontSize: 10, color: "#dc2626", fontWeight: 700, background: "#fee2e2", borderRadius: 3, padding: "1px 4px" }}>OUT</span>}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.quantity_on_hand}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>{p.reorder_level}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: "#dc2626", fontWeight: 600 }}>{(p.reorder_level ?? 0) - p.quantity_on_hand}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", color: "#64748b", fontSize: "12px" }}>
                              {(() => { const r = aiReorderRecs[p.product_id]; return r ? (r.sold7 > 0 ? r.sold7 : <span style={{ color: "#cbd5e1" }}>0</span>) : <span style={{ color: "#cbd5e1" }}>—</span>; })()}
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>
                              {(() => {
                                const r = aiReorderRecs[p.product_id];
                                if (!r?.hasData) return <span style={{ color: "#cbd5e1", fontSize: "11px" }}>—</span>;
                                return (
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                    <span style={{ color: "#7c3aed", fontWeight: 600, fontSize: "13px" }}>{r.qty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setReorderQtys(prev => ({ ...prev, [p.product_id]: String(r.qty) }))}
                                      title="Apply AI recommendation to Order Qty"
                                      style={{ fontSize: "10px", cursor: "pointer", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "3px", padding: "1px 5px", lineHeight: 1.4 }}
                                    >↑</button>
                                  </span>
                                );
                              })()}
                            </td>
                            <td style={{ padding: "6px 8px" }}>
                              <select
                                value={reorderSuppliers[p.product_id] ?? savedSupplier}
                                onChange={(e) => setReorderSuppliers((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                                style={{ padding: "3px", width: "100%", fontSize: "12px" }}
                              >
                                <option value="">Select…</option>
                                {suppliers.filter(s => s.status === "active").map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: "6px 8px", textAlign: "right" }}>
                              <input
                                type="number" min="1"
                                value={reorderQtys[p.product_id] ?? String(Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand))}
                                onChange={(e) => setReorderQtys((prev) => ({ ...prev, [p.product_id]: e.target.value }))}
                                style={{ width: "60px", padding: "3px", textAlign: "right" }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
          </>
        );
      })()}

      <h2 style={{ marginTop: "40px" }}>Create Purchase Order</h2>

      <form
        onSubmit={onCreatePO}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <select
          value={poSupplierId}
          onChange={(e) => setPoSupplierId(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        >
          <option value="">Select supplier...</option>
          {suppliers.filter(s => s.status === "active").map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Notes"
          value={poNotes}
          onChange={(e) => setPoNotes(e.target.value)}
          style={{ flex: "3 1 240px", padding: "8px" }}
        />

        <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
          Create PO
        </button>
      </form>

      <button
        onClick={() => setPoListOpen(!(poListOpen ?? (purchaseOrders.length < 10)))}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(poListOpen ?? (purchaseOrders.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Purchase Orders</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({purchaseOrders.length} orders)</span>
      </button>
      <div style={{ display: (poListOpen ?? (purchaseOrders.length < 10)) ? '' : 'none' }}>
      {(() => {
        const counts = {
          all: purchaseOrders.length,
          draft: purchaseOrders.filter(po => po.status === "draft").length,
          ordered: purchaseOrders.filter(po => po.status === "ordered").length,
          partially_received: purchaseOrders.filter(po => po.status === "partially_received").length,
          received: purchaseOrders.filter(po => po.status === "received").length,
          cancelled: purchaseOrders.filter(po => po.status === "cancelled").length,
        };
        const chips: { key: typeof poStatusFilter; label: string }[] = [
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "ordered", label: "Awaiting Delivery" },
          { key: "partially_received", label: "Partial" },
          { key: "received", label: "Received" },
          { key: "cancelled", label: "Cancelled" },
        ];
        const filteredPOs = poStatusFilter === "all"
          ? purchaseOrders
          : purchaseOrders.filter(po => po.status === poStatusFilter);
        const visiblePOs = showAllPOs ? filteredPOs : filteredPOs.slice(0, 50);
        const supplierMap = Object.fromEntries(
          suppliers.map((supplier) => [supplier.id, supplier.name])
        );
        const productItemMap = buildProductNameMap(products);
        return (
          <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {chips.map(chip => {
              const active = poStatusFilter === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => { setPoStatusFilter(chip.key); setShowAllPOs(false); }}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                    background: active ? "#dbeafe" : "#f9fafb",
                    color: active ? "#1d4ed8" : "#374151",
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  {chip.label} ({counts[chip.key]})
                </button>
              );
            })}
          </div>
          <div style={{ marginBottom: "40px" }}>
            {filteredPOs.length > 50 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#64748b" }}>
                <span>Showing {visiblePOs.length} of {filteredPOs.length} purchase orders</span>
                {!showAllPOs && (
                  <button onClick={() => setShowAllPOs(true)} style={{ fontSize: "13px", color: "#1d4ed8", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                    Show All
                  </button>
                )}
              </div>
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ textAlign: "left", padding: "8px" }}>PO Number</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Supplier</th>
                  <th style={{ padding: "8px" }}>Status</th>
                  <th style={{ textAlign: "right", padding: "8px" }}>Subtotal</th>
                  <th style={{ textAlign: "left", padding: "8px" }}>Created</th>
                  <th style={{ padding: "8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "16px", color: "#94a3b8" }}>{poStatusFilter === "all" ? "No purchase orders found" : `No ${poStatusFilter} purchase orders`}</td>
                  </tr>
                ) : (
                  visiblePOs.map((po) => {
                    const isDraft = po.status === "draft";
                    const isOrdered = po.status === "ordered";
                    const isPartiallyReceived = po.status === "partially_received";
                    const isCancelled = po.status === "cancelled";
                    const isReceived = po.status === "received";
                    const isSelected = selectedPoId === po.id;
                    const badgeBg = isDraft ? "#fef3c7" : isOrdered ? "#dbeafe" : isPartiallyReceived ? "#fef9c3" : isCancelled ? "#e5e7eb" : "#dcfce7";
                    const badgeColor = isDraft ? "#92400e" : isOrdered ? "#1e40af" : isPartiallyReceived ? "#a16207" : isCancelled ? "#6b7280" : "#15803d";
                    const badgeLabel = isDraft ? "Draft" : isOrdered ? "Awaiting" : isPartiallyReceived ? "Partial" : isCancelled ? "Cancelled" : "Received";
                    const isDraftPO = isDraft;
                    const moreOpen = poMoreOpen === po.id;
                    const hasSecondary = isDraft || isOrdered || isPartiallyReceived;
                    return (
                      <React.Fragment key={po.id}>
                      <tr style={{ borderBottom: "1px solid #f1f5f9", backgroundColor: isCancelled ? "#f9fafb" : isSelected ? "#f0f4ff" : "inherit", color: isCancelled ? "#9ca3af" : "inherit" }}>
                        <td style={{ padding: "8px", fontWeight: 500 }}>{po.po_number}</td>
                        <td style={{ padding: "8px" }}>{supplierMap[po.supplier_id] ?? "Unknown"}</td>
                        <td style={{ padding: "8px", textAlign: "center" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "12px", background: badgeBg, color: badgeColor, display: "inline-block" }}>{badgeLabel}</span>
                        </td>
                        <td style={{ padding: "8px", textAlign: "right", fontWeight: 500 }}>${Number(po.subtotal ?? 0).toFixed(2)}</td>
                        <td style={{ padding: "8px", fontSize: "13px", color: "#64748b" }}>{new Date(po.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {/* Primary: View */}
                          {isCancelled && (
                            <button onClick={() => onSelectPO(po)} style={{ padding: "4px 10px", fontSize: "13px", cursor: "pointer" }}>
                              {isSelected ? "Close" : "View"}
                            </button>
                          )}
                          {!isCancelled && (
                            <button onClick={() => onSelectPO(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer" }}>
                              {isSelected ? "Close" : isDraft ? "View/Edit" : "View"}
                            </button>
                          )}
                          {/* Primary: Mark Ordered (draft only) */}
                          {isDraft && (
                            <button onClick={() => onMarkOrdered(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: "4px" }}>
                              Mark Ordered
                            </button>
                          )}
                          {/* Primary: Receive (ordered/partial) */}
                          {(isOrdered || isPartiallyReceived) && (
                            <button onClick={() => onOpenReceive(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: receivingPoId === po.id ? "#d1fae5" : "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "4px" }}>
                              {receivingPoId === po.id ? "Cancel" : isPartiallyReceived ? "Receive More" : "Receive"}
                            </button>
                          )}
                          {/* Primary: Receive (draft — less prominent) */}
                          {isDraft && (
                            <button onClick={() => onOpenReceive(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: receivingPoId === po.id ? "#d1fae5" : undefined }}>
                              {receivingPoId === po.id ? "Cancel" : "Receive"}
                            </button>
                          )}
                          {/* Primary: Delete (draft only) */}
                          {isDraft && (
                            <button onClick={() => onDeletePO(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px" }}>
                              Delete
                            </button>
                          )}
                          {/* More menu */}
                          {(hasSecondary || isReceived) && (
                            <span style={{ position: "relative", display: "inline-block" }}>
                              <button onClick={() => setPoMoreOpen(moreOpen ? null : po.id)} style={{ padding: "4px 8px", fontSize: "13px", cursor: "pointer", background: moreOpen ? "#e5e7eb" : undefined }}>
                                ···
                              </button>
                              {moreOpen && (
                                <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "140px", padding: "4px 0" }}>
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { onPrintPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px" }}>Print PO</button>
                                  )}
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { onEmailPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#1d4ed8" }}>Email PO</button>
                                  )}
                                  {(isDraft || isOrdered || isPartiallyReceived) && (
                                    <button onClick={() => { setSignPoId(po.id); setSignRole("manager"); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#15803d" }}>Sign PO</button>
                                  )}
                                  {isDraft && (
                                    <button onClick={() => { onCancelPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#dc2626" }}>Cancel PO</button>
                                  )}
                                  {isReceived && (
                                    <button onClick={() => { onPrintPO(po); setPoMoreOpen(null); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px" }}>Print PO</button>
                                  )}
                                </div>
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                      {isSelected && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f9fafb", padding: "16px", border: "1px solid #c7d2fe" }}>
                            <strong style={{ display: "block", marginBottom: "12px", color: "#1d4ed8" }}>
                              PO Detail — {po.po_number}
                              <span style={{
                                marginLeft: "12px", fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                                background: isDraftPO ? "#fef3c7" : po.status === "cancelled" ? "#e5e7eb" : isPartiallyReceived ? "#fef9c3" : "#dcfce7",
                                color: isDraftPO ? "#92400e" : po.status === "cancelled" ? "#6b7280" : isPartiallyReceived ? "#a16207" : "#15803d",
                              }}>{po.status === "partially_received" ? "partial" : po.status}</span>
                            </strong>

                            {isDraftPO && (
                              <form
                                onSubmit={onAddPOItem}
                                style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" }}
                              >
                                <select
                                  value={itemProductId}
                                  onChange={(e) => setItemProductId(e.target.value)}
                                  style={{ flex: "2 1 200px", padding: "8px" }}
                                >
                                  <option value="">Select product...</option>
                                  {products.map((p) => (
                                    <option key={p.product_id} value={p.product_id}>
                                      {p.product_name}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="Quantity"
                                  value={itemQuantity}
                                  onChange={(e) => setItemQuantity(e.target.value)}
                                  style={{ flex: "1 1 120px", padding: "8px" }}
                                />
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder="Unit Cost"
                                  value={itemUnitCost}
                                  onChange={(e) => setItemUnitCost(e.target.value)}
                                  style={{ flex: "1 1 120px", padding: "8px" }}
                                />
                                <button type="submit" style={{ flex: "1 1 120px", padding: "8px" }}>
                                  Add Item
                                </button>
                              </form>
                            )}

                            <table border={1} cellPadding={10} style={{ width: "100%" }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Ordered</th>
                                  {!isDraftPO && <th>Received</th>}
                                  {!isDraftPO && <th>Remaining</th>}
                                  <th>Unit Cost</th>
                                  <th>Line Total</th>
                                  {isDraftPO && <th></th>}
                                  {!isDraftPO && poItems.some(i => i.receive_notes) && <th>Notes</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {poItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={isDraftPO ? 5 : (poItems.some(i => i.receive_notes) ? 7 : 6)}>No items yet</td>
                                  </tr>
                                ) : (
                                  poItems.map((item) => {
                                    const rcvd = item.quantity_received ?? 0;
                                    const rem = item.quantity - rcvd;
                                    return (
                                      <tr key={item.id}>
                                        <td>{productItemMap[item.product_id] ?? "Unknown"}</td>
                                        <td>{item.quantity}</td>
                                        {!isDraftPO && <td>{rcvd}</td>}
                                        {!isDraftPO && (
                                          <td style={{ fontWeight: rem > 0 ? "bold" : "normal", color: rem > 0 ? "#b45309" : "#15803d" }}>
                                            {rem}
                                          </td>
                                        )}
                                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                                        <td>${Number(item.line_total).toFixed(2)}</td>
                                        {isDraftPO && (
                                          <td>
                                            <button
                                              onClick={() => onRemovePOItem(item.id)}
                                              style={{ padding: "2px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                              ×
                                            </button>
                                          </td>
                                        )}
                                        {!isDraftPO && poItems.some(i => i.receive_notes) && (
                                          <td style={{ color: "#6b7280", fontSize: "12px" }}>{item.receive_notes ?? ""}</td>
                                        )}
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>

                            {poItems.length > 0 && (
                              <p style={{ textAlign: "right", fontWeight: "bold", marginTop: "8px" }}>
                                Subtotal: ${poItems.reduce((sum, i) => sum + Number(i.line_total), 0).toFixed(2)}
                              </p>
                            )}
                          </td>
                        </tr>
                      )}
                      {receivingPoId === po.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#f0fdf4", padding: "16px", border: "2px solid #16a34a" }}>
                            <strong style={{ display: "block", marginBottom: "12px", color: "#15803d" }}>
                              Receive Inventory — {po.po_number}
                            </strong>

                            <table border={1} cellPadding={10} style={{ width: "100%", marginBottom: "16px" }}>
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>Ordered</th>
                                  <th>Received</th>
                                  <th>Remaining</th>
                                  <th>Receive Qty</th>
                                  <th style={{ color: "#dc2626" }}>Damaged</th>
                                  <th style={{ color: "#d97706" }}>Expired</th>
                                  <th style={{ color: "#6b7280" }}>Rejected</th>
                                  <th>Unit Cost</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {receivingItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={10}>No line items on this PO</td>
                                  </tr>
                                ) : (
                                  receivingItems.map((item) => {
                                    const alreadyReceived = item.quantity_received ?? 0;
                                    const remaining = item.quantity - alreadyReceived;
                                    return (
                                      <tr key={item.id} style={{ background: remaining <= 0 ? "#f0fdf4" : undefined }}>
                                        <td>{productItemMap[item.product_id] ?? "Unknown"}</td>
                                        <td>{item.quantity}</td>
                                        <td>{alreadyReceived}</td>
                                        <td style={{ fontWeight: remaining > 0 ? "bold" : "normal", color: remaining > 0 ? "#b45309" : "#15803d" }}>
                                          {remaining}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              max={remaining}
                                              value={receiveQtys[item.id] ?? ""}
                                              onChange={(e) =>
                                                setReceiveQtys((prev) => ({ ...prev, [item.id]: e.target.value }))
                                              }
                                              style={{ width: "80px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span style={{ color: "#15803d", fontWeight: "bold" }}>Done</span>
                                          )}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              value={receiveDamagedQtys[item.id] ?? "0"}
                                              onChange={(e) => setReceiveDamagedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                              style={{ width: "60px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span style={{ color: "#94a3b8" }}>—</span>
                                          )}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              value={receiveExpiredQtys[item.id] ?? "0"}
                                              onChange={(e) => setReceiveExpiredQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                              style={{ width: "60px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span style={{ color: "#94a3b8" }}>—</span>
                                          )}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              value={receiveRejectedQtys[item.id] ?? "0"}
                                              onChange={(e) => setReceiveRejectedQtys((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                              style={{ width: "60px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span style={{ color: "#94a3b8" }}>—</span>
                                          )}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.01"
                                              value={receiveUnitCosts[item.id] ?? String(item.unit_cost)}
                                              onChange={(e) => setReceiveUnitCosts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                              style={{ width: "80px", padding: "4px" }}
                                            />
                                          ) : (
                                            <span>${Number(item.unit_cost).toFixed(2)}</span>
                                          )}
                                        </td>
                                        <td>
                                          {remaining > 0 ? (
                                            <input
                                              type="text"
                                              placeholder="Optional note…"
                                              value={receiveLineNotes[item.id] ?? ""}
                                              onChange={(e) => setReceiveLineNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                                              style={{ width: "160px", padding: "4px" }}
                                            />
                                          ) : (
                                            item.receive_notes ? <span style={{ color: "#6b7280", fontSize: "12px" }}>{item.receive_notes}</span> : <span style={{ color: "#94a3b8" }}>—</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>

                            <button
                              onClick={onConfirmReceive}
                              disabled={receivingItems.length === 0 || isConfirmingReceive}
                              style={{ padding: "10px 24px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                            >
                              {isConfirmingReceive ? "Processing…" : "Confirm Receive"}
                            </button>
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
          </>
        );
      })()}
      </div>

      </div>
  );
}
