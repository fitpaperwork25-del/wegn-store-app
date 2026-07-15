import React from "react";
import type { Supplier, PurchaseOrder, POItem } from "../lib/purchasing/types";
import type { ProductStock } from "../lib/product/types";
import { buildProductNameMap } from "../lib/product/productHelpers";
import { getPoItemReceiptStatus } from "../lib/purchasing/purchasingHelpers";

type PurchaseOrderLifecyclePanelProps = {
  visible: boolean;
  suppliers: Supplier[];
  products: ProductStock[];
  poSupplierId: string;
  setPoSupplierId: (v: string) => void;
  poNotes: string;
  setPoNotes: (v: string) => void;
  onCreatePO: (e: React.FormEvent) => void;
  poListOpen: boolean | null;
  setPoListOpen: (v: boolean | null) => void;
  purchaseOrders: PurchaseOrder[];
  /** Every PO's line items, keyed by purchase_order_id - the same memo
   *  App.tsx already computes for SupplierManagementPanel. Used to tell an
   *  Ordered PO with zero items (still editable) apart from one with items
   *  (locked to Receive/Cancel only) without a per-row database query. */
  poItemsByPoId: Map<string, POItem[]>;
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

export function PurchaseOrderLifecyclePanel({
  visible,
  suppliers,
  products,
  poSupplierId, setPoSupplierId,
  poNotes, setPoNotes,
  onCreatePO,
  poListOpen, setPoListOpen,
  purchaseOrders,
  poItemsByPoId,
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
}: PurchaseOrderLifecyclePanelProps) {
  return (
    <div style={{ display: visible ? '' : 'none' }}>

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
                    const itemCount = (poItemsByPoId.get(po.id) ?? []).length;
                    // An Ordered PO with no items yet is still correctable (Edit
                    // + Cancel); once it has any items, editing locks and only
                    // Receive/Cancel remain. Partially Received never gets
                    // Cancel - inventory has already moved.
                    const canEditItems = isDraft || (isOrdered && itemCount === 0);
                    const canCancel = isDraft || isOrdered;
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
                              {isSelected ? "Close" : canEditItems ? "View/Edit" : "View"}
                            </button>
                          )}
                          {/* Primary: Mark Ordered (draft only) */}
                          {isDraft && (
                            <button onClick={() => onMarkOrdered(po)} style={{ padding: "4px 10px", marginRight: "4px", fontSize: "13px", cursor: "pointer", background: "#dbeafe", color: "#1e40af", border: "1px solid #93c5fd", borderRadius: "4px" }}>
                              Mark Ordered
                            </button>
                          )}
                          {/* Primary: Receive (ordered-with-items/partial only - an
                              Ordered PO with zero items has nothing to receive yet;
                              it gets Edit + Cancel instead, not a dead-end button) */}
                          {((isOrdered && itemCount > 0) || isPartiallyReceived) && (
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
                                  {canCancel && (
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

                            {canEditItems && (
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
                                  {!canEditItems && <th>Received</th>}
                                  {!canEditItems && <th>Remaining</th>}
                                  <th>Unit Cost</th>
                                  <th>Line Total</th>
                                  {canEditItems && <th></th>}
                                  {!canEditItems && poItems.some(i => i.receive_notes) && <th>Notes</th>}
                                </tr>
                              </thead>
                              <tbody>
                                {poItems.length === 0 ? (
                                  <tr>
                                    <td colSpan={canEditItems ? 5 : (poItems.some(i => i.receive_notes) ? 7 : 6)}>No items yet</td>
                                  </tr>
                                ) : (
                                  poItems.map((item) => {
                                    const { received: rcvd, remaining: rem } = getPoItemReceiptStatus(item);
                                    return (
                                      <tr key={item.id}>
                                        <td>{productItemMap[item.product_id] ?? "Unknown"}</td>
                                        <td>{item.quantity}</td>
                                        {!canEditItems && <td>{rcvd}</td>}
                                        {!canEditItems && (
                                          <td style={{ fontWeight: rem > 0 ? "bold" : "normal", color: rem > 0 ? "#b45309" : "#15803d" }}>
                                            {rem}
                                          </td>
                                        )}
                                        <td>${Number(item.unit_cost).toFixed(2)}</td>
                                        <td>${Number(item.line_total).toFixed(2)}</td>
                                        {canEditItems && (
                                          <td>
                                            <button
                                              onClick={() => onRemovePOItem(item.id)}
                                              style={{ padding: "2px 8px", background: "#fee2e2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                              ×
                                            </button>
                                          </td>
                                        )}
                                        {!canEditItems && poItems.some(i => i.receive_notes) && (
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
