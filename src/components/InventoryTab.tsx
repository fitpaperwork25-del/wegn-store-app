import React from "react";
import type { Supplier } from "../lib/purchasing/types";
import type { Transaction, BulkRow, SessionItem, SessionHistoryItem, SessionPayment } from "../lib/inventory/types";
import type { ProductStock, ProductResolutionRequest } from "../lib/product/types";

type ActiveReceivingSession = {
  id: string;
  business_id: string;
  supplier_id: string | null;
  received_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  invoice_number?: string | null;
  supplier_name?: string | null;
} | null;

type SessionHistoryEntry = {
  id: string;
  status: string;
  supplier_id: string | null;
  supplier_name: string | null;
  created_at: string;
  received_date: string;
  notes: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  invoice_total: number;
  freight_cost: number;
  additional_cost: number;
  invoice_status: string;
  calculated_total: number;
  variance_amount: number;
  approved_by: string | null;
  approved_at: string | null;
  approval_note: string | null;
};

type RapidReceiveItem = { product_id: string; product_name: string; barcode: string; quantity: number };
type RapidReceiveException = { barcode: string; reason: string };

type InventoryTabProps = {
  visible: boolean;
  activeTab: string;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  products: ProductStock[];
  suppliers: Supplier[];
  supplierMap: Record<string, Supplier>;

  // Receiving Sessions
  activeReceivingSession: ActiveReceivingSession;
  newSessionSupplierId: string;
  setNewSessionSupplierId: (v: string) => void;
  newSessionNotes: string;
  setNewSessionNotes: (v: string) => void;
  onStartReceivingSession: () => void;
  isStartingSession: boolean;
  setSmartReceiveSimpleOpen: (v: boolean) => void;
  sessionScanRef: React.RefObject<HTMLInputElement | null>;
  sessionScanInput: string;
  setSessionScanInput: (v: string) => void;
  onSessionScan: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  lastScannedProduct: { name: string; qty: number } | null;
  sessionItems: SessionItem[];
  setSessionItems: React.Dispatch<React.SetStateAction<SessionItem[]>>;
  highlightedProductId: string | null;
  onSessionItemCostChange: (itemId: string, newCost: number) => void;
  onSessionItemQty: (itemId: string, delta: number) => void;
  onSessionItemRemove: (itemId: string) => void;
  sessionItemBatch: Record<string, { batch_number: string; lot_number: string; manufactured_date: string; expiration_date: string }>;
  setSessionItemBatch: React.Dispatch<React.SetStateAction<Record<string, { batch_number: string; lot_number: string; manufactured_date: string; expiration_date: string }>>>;
  productResolution: ProductResolutionRequest | null;
  onPostReceivingSession: () => void;
  isPostingSession: boolean;
  onCancelReceivingSession: () => void;

  // Receiving Session History
  sessionHistory: SessionHistoryEntry[];
  historyExpanded: boolean;
  setHistoryExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  sessionHistoryItems: Record<string, SessionHistoryItem[]>;
  expandedHistorySessionId: string | null;
  setExpandedHistorySessionId: (v: string | null) => void;
  invoicePanelSessionId: string | null;
  setInvoicePanelSessionId: (v: string | null) => void;
  onLoadSessionHistoryItems: (sessionId: string) => Promise<SessionHistoryItem[] | undefined>;
  noLinkAcknowledgedSessions: Set<string>;
  setNoLinkAcknowledgedSessions: React.Dispatch<React.SetStateAction<Set<string>>>;
  resolvingSupplierSessionId: string | null;
  setResolvingSupplierSessionId: (v: string | null) => void;
  resolveMode: "pick" | "create" | "nolinkconfirm";
  setResolveMode: (v: "pick" | "create" | "nolinkconfirm") => void;
  resolveSupplierPickId: string;
  setResolveSupplierPickId: (v: string) => void;
  sessionPayments: Record<string, SessionPayment[]>;
  paymentPanelSessionId: string | null;
  setPaymentPanelSessionId: (v: string | null) => void;
  editPaymentDate: string;
  setEditPaymentDate: (v: string) => void;
  editPaymentAmount: string;
  setEditPaymentAmount: (v: string) => void;
  editPaymentMethod: string;
  setEditPaymentMethod: (v: string) => void;
  editPaymentReference: string;
  setEditPaymentReference: (v: string) => void;
  editPaymentNotes: string;
  setEditPaymentNotes: (v: string) => void;
  onLoadSessionPayments: (sessionId: string) => void;
  onSavePayment: (sessionId: string, supplierId: string, remaining: number) => void;
  isSavingPayment: boolean;
  resolveNewSupplierName: string;
  setResolveNewSupplierName: (v: string) => void;
  onLinkSessionSupplier: (sessionId: string, supplierId: string) => void;
  onCreateAndLinkSupplier: (sessionId: string, name: string) => void;
  isResolvingSupplier: boolean;
  editInvoiceNumber: string;
  setEditInvoiceNumber: (v: string) => void;
  editInvoiceDate: string;
  setEditInvoiceDate: (v: string) => void;
  editInvoiceTotal: string;
  setEditInvoiceTotal: (v: string) => void;
  editFreightCost: string;
  setEditFreightCost: (v: string) => void;
  editAdditionalCost: string;
  setEditAdditionalCost: (v: string) => void;
  onSaveInvoice: (sessionId: string) => void;
  isSavingInvoice: boolean;
  historyHasMore: boolean;
  onLoadMoreHistory: () => void;
  isLoadingMoreHistory: boolean;

  // Rapid Receive
  rapidReceiveInput: string;
  setRapidReceiveInput: (v: string) => void;
  onRapidReceiveScan: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  rapidReceiveItems: RapidReceiveItem[];
  setRapidReceiveItems: React.Dispatch<React.SetStateAction<RapidReceiveItem[]>>;
  rapidReceiveExceptions: RapidReceiveException[];
  setRapidReceiveExceptions: React.Dispatch<React.SetStateAction<RapidReceiveException[]>>;
  onPostRapidReceive: () => void;
  isPostingRapidReceive: boolean;

  // Receive Inventory (simple form)
  onReceive: (e: React.FormEvent) => void;
  selectedProductId: string;
  setSelectedProductId: (v: string) => void;
  receiveQuantity: string;
  setReceiveQuantity: (v: string) => void;

  // Bulk Import
  canBulkImport: boolean;
  onDownloadCsvTemplate: () => void;
  onCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  bulkPreview: BulkRow[];
  bulkImporting: boolean;
  onBulkImport: () => void;
  bulkResults: { imported: number; skipped: number; failed: number } | null;

  // Inventory Summary Cards / Needs Ordering Today
  lowStockProducts: ProductStock[];
  needsOrderingSelected: Set<string>;
  setNeedsOrderingSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  needsOrderingQtys: Record<string, number>;
  setNeedsOrderingQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onCreatePOFromNeedsOrdering: () => void;
  /** Role-permissions revision: this section creates purchase orders, so it
   *  is owner+manager only, same rule as PurchaseOrderLifecyclePanel's
   *  Create PO form. */
  canManagePurchaseOrders: boolean;
  /** Role-permissions revision: creating a supplier record (Smart Receive's
   *  inline "Create Supplier" and the receiving-session "Create new" link
   *  flow) is owner+manager only, same rule as Supplier Management. */
  canManageSuppliers: boolean;

  // Transaction History
  txHistoryOpen: boolean;
  setTxHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  txDateRange: 'today' | '7d' | '30d' | 'all';
  transactions: Transaction[];
  setTxDateRange: (v: 'today' | '7d' | '30d' | 'all') => void;
  movementFilter: string;
  setMovementFilter: (v: string) => void;
};

export function InventoryTab(props: InventoryTabProps) {
  const {
    visible, activeTab, currencySymbol, products, suppliers, supplierMap,
    activeReceivingSession, newSessionSupplierId, setNewSessionSupplierId, newSessionNotes, setNewSessionNotes,
    onStartReceivingSession, isStartingSession, setSmartReceiveSimpleOpen, sessionScanRef, sessionScanInput, setSessionScanInput,
    onSessionScan, lastScannedProduct, sessionItems, setSessionItems, highlightedProductId,
    onSessionItemCostChange, onSessionItemQty, onSessionItemRemove, sessionItemBatch, setSessionItemBatch,
    productResolution, onPostReceivingSession, isPostingSession, onCancelReceivingSession,
    sessionHistory, historyExpanded, setHistoryExpanded, sessionHistoryItems, expandedHistorySessionId, setExpandedHistorySessionId,
    invoicePanelSessionId, setInvoicePanelSessionId, onLoadSessionHistoryItems, noLinkAcknowledgedSessions, setNoLinkAcknowledgedSessions,
    resolvingSupplierSessionId, setResolvingSupplierSessionId, resolveMode, setResolveMode, resolveSupplierPickId, setResolveSupplierPickId,
    sessionPayments, paymentPanelSessionId, setPaymentPanelSessionId, editPaymentDate, setEditPaymentDate, editPaymentAmount, setEditPaymentAmount,
    editPaymentMethod, setEditPaymentMethod, editPaymentReference, setEditPaymentReference, editPaymentNotes, setEditPaymentNotes,
    onLoadSessionPayments, onSavePayment, isSavingPayment, resolveNewSupplierName, setResolveNewSupplierName,
    onLinkSessionSupplier, onCreateAndLinkSupplier, isResolvingSupplier,
    editInvoiceNumber, setEditInvoiceNumber, editInvoiceDate, setEditInvoiceDate, editInvoiceTotal, setEditInvoiceTotal,
    editFreightCost, setEditFreightCost, editAdditionalCost, setEditAdditionalCost, onSaveInvoice, isSavingInvoice,
    historyHasMore, onLoadMoreHistory, isLoadingMoreHistory,
    rapidReceiveInput, setRapidReceiveInput, onRapidReceiveScan, rapidReceiveItems, setRapidReceiveItems,
    rapidReceiveExceptions, setRapidReceiveExceptions, onPostRapidReceive, isPostingRapidReceive,
    onReceive, selectedProductId, setSelectedProductId, receiveQuantity, setReceiveQuantity,
    canBulkImport, onDownloadCsvTemplate, onCsvUpload, bulkPreview, bulkImporting, onBulkImport, bulkResults,
    lowStockProducts, needsOrderingSelected, setNeedsOrderingSelected, needsOrderingQtys, setNeedsOrderingQtys,
    onCreatePOFromNeedsOrdering, canManagePurchaseOrders, canManageSuppliers,
    txHistoryOpen, setTxHistoryOpen, txDateRange, transactions, setTxDateRange, movementFilter, setMovementFilter,
  } = props;

  return (
    <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Inventory</h2>
        <p className="page-subtitle">Manage products, stock levels, reorder points, and product status</p>
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Receiving Sessions</h3>
        {!activeReceivingSession ? (
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 12px" }}>Start a session to scan and receive inventory. Sessions persist across page reloads.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end", marginBottom: "12px" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Supplier (optional)</label>
                <select
                  value={newSessionSupplierId}
                  onChange={(e) => setNewSessionSupplierId(e.target.value)}
                  style={{ width: "100%", padding: "8px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                >
                  <option value="">No supplier</option>
                  {suppliers.filter(s => s.status === "active").map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Notes (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly restock, Truck #42"
                  value={newSessionNotes}
                  onChange={(e) => setNewSessionNotes(e.target.value)}
                  style={{ width: "100%", padding: "8px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                onClick={onStartReceivingSession}
                disabled={isStartingSession}
                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", opacity: isStartingSession ? 0.6 : 1 }}
              >{isStartingSession ? "Starting..." : "Start Receiving Session"}</button>
              <button
                onClick={() => setSmartReceiveSimpleOpen(true)}
                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px" }}
              >📷 Smart Receive</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ padding: "12px 16px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: activeReceivingSession.status === 'draft' ? "#15803d" : "#dc2626" }}>
                  {activeReceivingSession.status === 'draft' ? 'Active Draft Session' : `Receiving Session — ${activeReceivingSession.status.charAt(0).toUpperCase() + activeReceivingSession.status.slice(1)}`}
                </span>
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "monospace" }}>{activeReceivingSession.id.slice(0, 8)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: "13px", color: "#334155" }}>
                <span style={{ color: "#64748b" }}>Status:</span><span style={{ fontWeight: 500 }}>{activeReceivingSession.status}</span>
                <span style={{ color: "#64748b" }}>Supplier:</span>
                <span>
                  {activeReceivingSession.supplier_id
                    ? (supplierMap[activeReceivingSession.supplier_id!]?.name ?? "Unknown")
                    : activeReceivingSession.supplier_name
                      ? <>{activeReceivingSession.supplier_name} <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "8px", background: "#fef3c7", color: "#92400e" }}>unlinked</span></>
                      : "None"}
                </span>
                {activeReceivingSession.notes && <><span style={{ color: "#64748b" }}>Notes:</span><span>{activeReceivingSession.notes}</span></>}
                <span style={{ color: "#64748b" }}>Started:</span><span>{new Date(activeReceivingSession.created_at).toLocaleString()}</span>
              </div>
            </div>
            <input
              ref={sessionScanRef}
              type="text"
              autoFocus
              placeholder="Scan barcode and press Enter"
              value={sessionScanInput}
              onChange={(e) => setSessionScanInput(e.target.value)}
              onKeyDown={onSessionScan}
              style={{ width: "100%", padding: "10px 14px", fontSize: "15px", border: "2px solid #86efac", borderRadius: "8px", marginBottom: "12px", boxSizing: "border-box", outline: "none" }}
            />

            {lastScannedProduct && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", marginBottom: "10px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", fontSize: "13px", color: "#15803d", animation: "fadeIn 0.15s ease-out" }}>
                <span style={{ fontWeight: 600 }}>Last scanned:</span> {lastScannedProduct.name} (+1)
              </div>
            )}

            {sessionItems.length > 0 && (
              <div style={{ marginBottom: "12px" }}>
                <div style={{ overflowX: "auto" }}>
                <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ textAlign: "left" }}>Product</th>
                      <th style={{ textAlign: "left" }}>Barcode</th>
                      <th style={{ textAlign: "right" }}>Unit Cost</th>
                      <th style={{ textAlign: "right" }}>Qty</th>
                      <th style={{ textAlign: "right" }}>Total Cost</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionItems.map(item => {
                      const prod = products.find(p => p.product_id === item.product_id);
                      const isHighlighted = highlightedProductId === item.product_id;
                      const lineTotal = item.unit_cost * item.quantity_received;
                      return (
                      <React.Fragment key={item.id}>
                      <tr style={{ background: isHighlighted ? "#dcfce7" : undefined, transition: "background 0.3s ease-out" }}>
                        <td>{prod?.product_name ?? item.product_id.slice(0, 8)}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{prod?.barcode ?? "—"}</td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={item.unit_cost}
                            key={`cost-${item.id}`}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setSessionItems(prev => prev.map(i => i.id === item.id ? { ...i, unit_cost: val } : i));
                            }}
                            onBlur={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              onSessionItemCostChange(item.id, val);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ width: "80px", padding: "4px 6px", fontSize: "13px", textAlign: "right", border: "1px solid #cbd5e1", borderRadius: "4px" }}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <button onClick={() => onSessionItemQty(item.id, -1)} style={{ width: "24px", height: "24px", fontSize: "14px", cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "4px", background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>-</button>
                            <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600 }}>{item.quantity_received}</span>
                            <button onClick={() => onSessionItemQty(item.id, 1)} style={{ width: "24px", height: "24px", fontSize: "14px", cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "4px", background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 500 }}>{currencySymbol}{lineTotal.toFixed(2)}</td>
                        <td style={{ textAlign: "center" }}>
                          <button onClick={() => onSessionItemRemove(item.id)} title="Remove" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: 500, cursor: "pointer", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                            Remove
                          </button>
                        </td>
                      </tr>
                      <tr style={{ background: isHighlighted ? "#dcfce7" : "#fafafa" }}>
                        <td colSpan={6} style={{ padding: "4px 8px 8px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px" }}>
                            <input type="text" placeholder="Batch #" value={sessionItemBatch[item.id]?.batch_number ?? ""} onChange={e => setSessionItemBatch(prev => ({ ...prev, [item.id]: { batch_number: e.target.value, lot_number: prev[item.id]?.lot_number ?? "", manufactured_date: prev[item.id]?.manufactured_date ?? "", expiration_date: prev[item.id]?.expiration_date ?? "" } }))} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                            <input type="text" placeholder="Lot #" value={sessionItemBatch[item.id]?.lot_number ?? ""} onChange={e => setSessionItemBatch(prev => ({ ...prev, [item.id]: { batch_number: prev[item.id]?.batch_number ?? "", lot_number: e.target.value, manufactured_date: prev[item.id]?.manufactured_date ?? "", expiration_date: prev[item.id]?.expiration_date ?? "" } }))} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                            <input type="date" title="Manufactured date" value={sessionItemBatch[item.id]?.manufactured_date ?? ""} onChange={e => setSessionItemBatch(prev => ({ ...prev, [item.id]: { batch_number: prev[item.id]?.batch_number ?? "", lot_number: prev[item.id]?.lot_number ?? "", manufactured_date: e.target.value, expiration_date: prev[item.id]?.expiration_date ?? "" } }))} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                            <input type="date" title="Expiry date" value={sessionItemBatch[item.id]?.expiration_date ?? ""} onChange={e => setSessionItemBatch(prev => ({ ...prev, [item.id]: { batch_number: prev[item.id]?.batch_number ?? "", lot_number: prev[item.id]?.lot_number ?? "", manufactured_date: prev[item.id]?.manufactured_date ?? "", expiration_date: e.target.value } }))} style={{ padding: "3px 7px", fontSize: "11px", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#475569" }} />
                          </div>
                        </td>
                      </tr>
                      </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                </div>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "13px", marginTop: "10px", padding: "10px 14px", background: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>Products: <span style={{ color: "#1d4ed8" }}>{sessionItems.length}</span></span>
                  <span style={{ fontWeight: 600, color: "#334155" }}>Units: <span style={{ color: "#1d4ed8" }}>{sessionItems.reduce((s, i) => s + i.quantity_received, 0)}</span></span>
                  <span style={{ fontWeight: 600, color: "#334155", marginLeft: "auto" }}>Estimated Value: <span style={{ color: "#15803d" }}>{currencySymbol}{sessionItems.reduce((s, i) => s + i.unit_cost * i.quantity_received, 0).toFixed(2)}</span></span>
                </div>
              </div>
            )}

            {/* Unknown barcode indicator — the unified dialog handles resolution */}
            {productResolution?.barcode && (
              <div style={{ marginBottom: "12px", padding: "8px 12px", background: "#fff7ed", border: "1px solid #fb923c", borderRadius: "6px", fontSize: "12px", color: "#9a3412" }}>
                ⚠ Barcode not found: <code style={{ background: "#fed7aa", padding: "1px 4px", borderRadius: "3px" }}>{productResolution.barcode}</code> — resolve in the dialog below
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <button
                onClick={onPostReceivingSession}
                disabled={sessionItems.length === 0 || isPostingSession}
                style={{ padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: sessionItems.length === 0 || isPostingSession ? "not-allowed" : "pointer", background: sessionItems.length === 0 ? "#e2e8f0" : "#15803d", color: sessionItems.length === 0 ? "#94a3b8" : "#fff", border: "none", borderRadius: "6px", opacity: isPostingSession ? 0.6 : 1 }}
              >{isPostingSession ? "Posting..." : `Post Receiving (${sessionItems.length} items)`}</button>
              <button
                onClick={onCancelReceivingSession}
                disabled={isPostingSession}
                style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px" }}
              >Cancel Session</button>
            </div>
          </div>
        )}
      </div>

      {sessionHistory.length > 0 && (
      <div className="section-card">
        <h3
          className="section-card-title"
          onClick={() => setHistoryExpanded(prev => !prev)}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          {historyExpanded ? "▼" : "▶"} Receiving Session History ({sessionHistory.length} shown)
        </h3>
        {historyExpanded && (<>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sessionHistory.map(session => {
            const supplier = session.supplier_id ? (supplierMap[session.supplier_id] ?? null) : null;
            const supplierLabel = session.supplier_id
              ? (supplier?.name ?? "Unknown supplier")
              : session.supplier_name
                ? <>{session.supplier_name} <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 5px", borderRadius: "8px", background: "#fef3c7", color: "#92400e" }}>Unlinked</span></>
                : "No supplier";
            const items = sessionHistoryItems[session.id];
            const isExpanded = expandedHistorySessionId === session.id;
            const isInvoiceOpen = invoicePanelSessionId === session.id;
            const totalProducts = items?.length ?? null;
            const totalUnits = items ? items.reduce((s, i) => s + Number(i.quantity_received), 0) : null;
            const totalValue = items ? items.reduce((s, i) => s + (i.total_cost != null ? Number(i.total_cost) : Number(i.unit_cost) * Number(i.quantity_received)), 0) : null;
            const statusColor = session.status === "completed" ? "#15803d" : "#6b7280";
            const statusBg = session.status === "completed" ? "#dcfce7" : "#f1f5f9";
            const invoiceResolved = session.invoice_status === "matched" || session.invoice_status === "variance";
            const hasInvoice = !!session.invoice_number || invoiceResolved;
            const invoiceBadgeColor = hasInvoice ? "#15803d" : "#b45309";
            const invoiceBadgeBg = hasInvoice ? "#dcfce7" : "#fffbeb";
            const invoiceBadgeLabel = session.invoice_number
              ? session.invoice_number
              : invoiceResolved
                ? `Invoice: ${session.invoice_status}`
                : "Invoice: pending";
            return (
            <div key={session.id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", background: "#f8fafc", cursor: "pointer", flexWrap: "wrap" }}
                onClick={async (e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  if (isExpanded) { setExpandedHistorySessionId(null); return; }
                  setExpandedHistorySessionId(session.id);
                  await onLoadSessionHistoryItems(session.id);
                }}
              >
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#64748b" }}>{session.id.slice(0, 8)}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: statusBg, color: statusColor }}>{session.status}</span>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: invoiceBadgeBg, color: invoiceBadgeColor }}>{invoiceBadgeLabel}</span>
                <span style={{ fontSize: "12px", color: "#334155" }}>{supplierLabel}</span>
                {session.notes && <span style={{ fontSize: "12px", color: "#64748b", fontStyle: "italic" }}>{session.notes}</span>}
                <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>{new Date(session.created_at).toLocaleDateString()}</span>
                {totalProducts != null && <span style={{ fontSize: "12px", color: "#334155" }}>{totalProducts} products · {totalUnits} units</span>}
                {totalValue != null && <span style={{ fontSize: "12px", fontWeight: 600, color: "#15803d" }}>{currencySymbol}{totalValue.toFixed(2)}</span>}
                {session.status === "completed" && (
                  <button
                    onClick={async () => {
                      if (isInvoiceOpen) { setInvoicePanelSessionId(null); return; }
                      setInvoicePanelSessionId(session.id);
                      setEditInvoiceNumber(session.invoice_number ?? "");
                      setEditInvoiceDate(session.invoice_date ?? "");
                      setEditFreightCost(session.freight_cost > 0 ? String(session.freight_cost) : "");
                      setEditAdditionalCost(session.additional_cost > 0 ? String(session.additional_cost) : "");
                      const resolvedItems = await onLoadSessionHistoryItems(session.id);
                      if (session.invoice_total > 0) {
                        setEditInvoiceTotal(String(session.invoice_total));
                      } else {
                        const calcTotal = (resolvedItems ?? []).reduce(
                          (s, i) => s + (i.total_cost != null ? Number(i.total_cost) : Number(i.unit_cost) * Number(i.quantity_received)),
                          0
                        );
                        setEditInvoiceTotal(calcTotal > 0 ? String(Math.round(calcTotal * 100) / 100) : "");
                      }
                    }}
                    style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: isInvoiceOpen ? "#1d4ed8" : "none", color: isInvoiceOpen ? "#fff" : "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "5px" }}
                  >{isInvoiceOpen ? "Close Invoice" : "Invoice"}</button>
                )}
                {!session.supplier_id && session.supplier_name && !noLinkAcknowledgedSessions.has(session.id) && (
                  <button
                    onClick={() => { const isOpen = resolvingSupplierSessionId === session.id; setResolvingSupplierSessionId(isOpen ? null : session.id); setResolveMode("pick"); setResolveSupplierPickId(""); }}
                    style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: resolvingSupplierSessionId === session.id ? "#7c3aed" : "none", color: resolvingSupplierSessionId === session.id ? "#fff" : "#7c3aed", border: "1px solid #a78bfa", borderRadius: "5px" }}
                  >{resolvingSupplierSessionId === session.id ? "Close" : "🔗 Link Supplier"}</button>
                )}
                {session.status === "completed" && session.approved_by && session.invoice_total > 0 && session.supplier_id && (() => {
                  const paid = (sessionPayments[session.id] ?? []).reduce((s, p) => s + Number(p.amount), 0);
                  const remaining = Math.round((session.invoice_total - paid) * 100) / 100;
                  const isPaymentOpen = paymentPanelSessionId === session.id;
                  if (remaining <= 0) {
                    return <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px", background: "#dcfce7", color: "#15803d" }}>Paid</span>;
                  }
                  return (
                    <button
                      onClick={async () => {
                        if (isPaymentOpen) { setPaymentPanelSessionId(null); return; }
                        setPaymentPanelSessionId(session.id);
                        setEditPaymentDate(new Date().toISOString().slice(0, 10));
                        setEditPaymentAmount(String(remaining));
                        setEditPaymentMethod("cash");
                        setEditPaymentReference("");
                        setEditPaymentNotes("");
                        await onLoadSessionPayments(session.id);
                      }}
                      style={{ padding: "3px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: isPaymentOpen ? "#15803d" : "none", color: isPaymentOpen ? "#fff" : "#15803d", border: "1px solid #86efac", borderRadius: "5px" }}
                    >{isPaymentOpen ? "Close Payment" : "Record Payment"}</button>
                  );
                })()}
                {session.status === "completed" && (session.invoice_status === "matched" || session.invoice_status === "variance") && session.invoice_total > 0 && !session.supplier_id && !(session.supplier_name && !noLinkAcknowledgedSessions.has(session.id)) && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#92400e" }}>
                    Link a supplier to record payment.
                    <button
                      onClick={() => { const isOpen = resolvingSupplierSessionId === session.id; setResolvingSupplierSessionId(isOpen ? null : session.id); setResolveMode("pick"); setResolveSupplierPickId(""); }}
                      style={{ padding: "2px 8px", fontSize: "11px", fontWeight: 600, cursor: "pointer", background: resolvingSupplierSessionId === session.id ? "#7c3aed" : "none", color: resolvingSupplierSessionId === session.id ? "#fff" : "#7c3aed", border: "1px solid #a78bfa", borderRadius: "5px" }}
                    >{resolvingSupplierSessionId === session.id ? "Close" : "🔗 Link Supplier"}</button>
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#1d4ed8" }}>{isExpanded ? "▲ Hide" : "▼ Details"}</span>
              </div>
              {paymentPanelSessionId === session.id && (() => {
                const paid = (sessionPayments[session.id] ?? []).reduce((s, p) => s + Number(p.amount), 0);
                const remaining = Math.round((session.invoice_total - paid) * 100) / 100;
                return (
                <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0", background: "#f0fdf4" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "6px", color: "#0f172a" }}>Record Payment</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>
                    Invoice total: <strong>{currencySymbol}{Number(session.invoice_total).toFixed(2)}</strong> &nbsp;·&nbsp;
                    Paid: <strong>{currencySymbol}{paid.toFixed(2)}</strong> &nbsp;·&nbsp;
                    Remaining: <strong style={{ color: "#dc2626" }}>{currencySymbol}{remaining.toFixed(2)}</strong>
                  </div>
                  {(sessionPayments[session.id] ?? []).length > 0 && (
                    <div style={{ marginBottom: "10px" }}>
                      {(sessionPayments[session.id] ?? []).map(p => (
                        <div key={p.id} style={{ fontSize: "12px", color: "#64748b", padding: "2px 0" }}>
                          {p.payment_date} · <strong>{currencySymbol}{Number(p.amount).toFixed(2)}</strong> · {p.payment_method}{p.reference ? ` · ${p.reference}` : ""}
                        </div>
                      ))}
                    </div>
                  )}
                  {remaining <= 0 ? (
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>Invoice fully paid.</div>
                  ) : (
                  <><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Payment Date</label>
                      <input type="date" value={editPaymentDate} onChange={(e) => setEditPaymentDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Amount ($)</label>
                      <input type="number" step="0.01" min="0" max={remaining} value={editPaymentAmount} onChange={(e) => setEditPaymentAmount(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Payment Method</label>
                      <select value={editPaymentMethod} onChange={(e) => setEditPaymentMethod(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="cash">Cash</option>
                        <option value="check">Check</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Reference</label>
                      <input type="text" placeholder="Check #, wire ref, etc." value={editPaymentReference} onChange={(e) => setEditPaymentReference(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Notes</label>
                      <input type="text" placeholder="Optional" value={editPaymentNotes} onChange={(e) => setEditPaymentNotes(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <button
                    onClick={() => onSavePayment(session.id, session.supplier_id ?? "", remaining)}
                    disabled={isSavingPayment || !session.supplier_id}
                    style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", opacity: isSavingPayment ? 0.6 : 1 }}
                  >{isSavingPayment ? "Saving..." : "Save Payment"}</button></>
                  )}
                </div>
                );
              })()}
              {resolvingSupplierSessionId === session.id && (
                <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0", background: "#faf5ff" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px", color: "#0f172a" }}>🔗 Link Supplier</div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                    AI detected: <strong>{session.supplier_name}</strong> — link to a supplier to enable payment recording.
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <button onClick={() => setResolveMode("pick")} style={{ padding: "5px 12px", fontSize: "12px", fontWeight: resolveMode === "pick" ? 700 : 400, cursor: "pointer", background: resolveMode === "pick" ? "#7c3aed" : "none", color: resolveMode === "pick" ? "#fff" : "#7c3aed", border: "1px solid #7c3aed", borderRadius: "5px" }}>Match existing</button>
                    {/* Role-permissions revision: creating a supplier record is owner+manager only. */}
                    {canManageSuppliers && (
                      <button onClick={() => { setResolveMode("create"); setResolveNewSupplierName(session.supplier_name ?? ""); }} style={{ padding: "5px 12px", fontSize: "12px", fontWeight: resolveMode === "create" ? 700 : 400, cursor: "pointer", background: resolveMode === "create" ? "#7c3aed" : "none", color: resolveMode === "create" ? "#fff" : "#7c3aed", border: "1px solid #7c3aed", borderRadius: "5px" }}>Create new</button>
                    )}
                    <button onClick={() => setResolveMode("nolinkconfirm")} style={{ padding: "5px 12px", fontSize: "12px", fontWeight: resolveMode === "nolinkconfirm" ? 700 : 400, cursor: "pointer", background: resolveMode === "nolinkconfirm" ? "#64748b" : "none", color: resolveMode === "nolinkconfirm" ? "#fff" : "#64748b", border: "1px solid #94a3b8", borderRadius: "5px" }}>Continue without linking</button>
                  </div>
                  {resolveMode === "pick" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <select value={resolveSupplierPickId} onChange={e => setResolveSupplierPickId(e.target.value)} style={{ flex: 1, padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                        <option value="">— Select supplier —</option>
                        {suppliers.filter(s => s.status === "active").map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button onClick={() => { if (resolveSupplierPickId) void onLinkSessionSupplier(session.id, resolveSupplierPickId); }} disabled={!resolveSupplierPickId || isResolvingSupplier} style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: resolveSupplierPickId ? "pointer" : "not-allowed", background: resolveSupplierPickId ? "#7c3aed" : "#e2e8f0", color: resolveSupplierPickId ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px", opacity: isResolvingSupplier ? 0.6 : 1 }}>{isResolvingSupplier ? "Linking..." : "Link"}</button>
                    </div>
                  )}
                  {resolveMode === "create" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="text" value={resolveNewSupplierName} onChange={e => setResolveNewSupplierName(e.target.value)} placeholder="Supplier name" style={{ flex: 1, padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                      <button onClick={() => { if (resolveNewSupplierName.trim()) void onCreateAndLinkSupplier(session.id, resolveNewSupplierName); }} disabled={!resolveNewSupplierName.trim() || isResolvingSupplier} style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: resolveNewSupplierName.trim() ? "pointer" : "not-allowed", background: resolveNewSupplierName.trim() ? "#7c3aed" : "#e2e8f0", color: resolveNewSupplierName.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px", opacity: isResolvingSupplier ? 0.6 : 1 }}>{isResolvingSupplier ? "Creating..." : "Create & Link"}</button>
                    </div>
                  )}
                  {resolveMode === "nolinkconfirm" && (
                    <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "6px", padding: "12px 14px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>⚠ Owner / Manager Confirmation</div>
                      <div style={{ fontSize: "12px", color: "#78350f", marginBottom: "10px", lineHeight: 1.6 }}>
                        Proceeding without a linked supplier disables payment recording for this session. Confirm only if you intend to track this payment outside the system.
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => { setNoLinkAcknowledgedSessions(prev => new Set([...prev, session.id])); setResolvingSupplierSessionId(null); setResolveMode("pick"); }} style={{ padding: "7px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#92400e", color: "#fff", border: "none", borderRadius: "6px" }}>Confirm — Proceed Without Supplier</button>
                        <button onClick={() => setResolveMode("pick")} style={{ padding: "7px 14px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569" }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isInvoiceOpen && (
                <div style={{ padding: "14px 16px", borderTop: "1px solid #e2e8f0", background: "#fafbff" }}>
                  <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "10px", color: "#0f172a" }}>Supplier Invoice</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Invoice Number</label>
                      <input type="text" value={editInvoiceNumber} onChange={(e) => setEditInvoiceNumber(e.target.value)} placeholder="e.g. INV-20260625" style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Invoice Date</label>
                      <input type="date" value={editInvoiceDate} onChange={(e) => setEditInvoiceDate(e.target.value)} style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Invoice Total ($)</label>
                      <input type="number" step="0.01" min="0" value={editInvoiceTotal} onChange={(e) => setEditInvoiceTotal(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Freight ($)</label>
                      <input type="number" step="0.01" min="0" value={editFreightCost} onChange={(e) => setEditFreightCost(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Additional Costs ($)</label>
                      <input type="number" step="0.01" min="0" value={editAdditionalCost} onChange={(e) => setEditAdditionalCost(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "7px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                    </div>
                  </div>
                  {(() => {
                    const previewItems = sessionHistoryItems[session.id] ?? [];
                    const previewFreight = parseFloat(editFreightCost) || 0;
                    const previewAdditional = parseFloat(editAdditionalCost) || 0;
                    const previewInvoiceTotal = parseFloat(editInvoiceTotal) || 0;
                    const previewItemsTotal = previewItems.reduce((s, i) => s + (i.total_cost != null ? Number(i.total_cost) : Number(i.unit_cost) * Number(i.quantity_received)), 0);
                    const previewCalcTotal = previewItemsTotal + previewFreight + previewAdditional;
                    const previewVariance = Math.round((previewInvoiceTotal - previewCalcTotal) * 100) / 100;
                    const previewMatched = Math.abs(previewVariance) <= 0.01;
                    const summaryColor = previewMatched ? "#15803d" : "#dc2626";
                    const summaryBg = previewMatched ? "#f0fdf4" : "#fef2f2";
                    const summaryBorder = previewMatched ? "#86efac" : "#fecaca";
                    return (
                    <div style={{ margin: "12px 0", padding: "12px 14px", background: summaryBg, border: `1px solid ${summaryBorder}`, borderRadius: "8px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>Reconciliation Preview</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "4px 16px", fontSize: "12px" }}>
                        <span style={{ color: "#64748b" }}>Received items</span><span style={{ textAlign: "right" }}>{currencySymbol}{previewItemsTotal.toFixed(2)}</span>
                        <span style={{ color: "#64748b" }}>Freight</span><span style={{ textAlign: "right" }}>+{currencySymbol}{previewFreight.toFixed(2)}</span>
                        <span style={{ color: "#64748b" }}>Additional costs</span><span style={{ textAlign: "right" }}>+{currencySymbol}{previewAdditional.toFixed(2)}</span>
                        <span style={{ color: "#334155", fontWeight: 600, borderTop: "1px solid #e2e8f0", paddingTop: "4px" }}>Calculated total</span><span style={{ textAlign: "right", fontWeight: 600, borderTop: "1px solid #e2e8f0", paddingTop: "4px" }}>{currencySymbol}{previewCalcTotal.toFixed(2)}</span>
                        <span style={{ color: "#334155", fontWeight: 600 }}>Invoice total</span><span style={{ textAlign: "right", fontWeight: 600 }}>{currencySymbol}{previewInvoiceTotal.toFixed(2)}</span>
                        <span style={{ color: summaryColor, fontWeight: 700 }}>Variance</span><span style={{ textAlign: "right", fontWeight: 700, color: summaryColor }}>{previewVariance >= 0 ? "+" : ""}{previewVariance.toFixed(2)}</span>
                      </div>
                      <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: previewMatched ? "#dcfce7" : "#fef2f2", border: `1px solid ${summaryBorder}`, borderRadius: "12px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: summaryColor }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: summaryColor }}>{previewMatched ? "Matched" : "Variance"}</span>
                      </div>
                    </div>
                    );
                  })()}
                  {(() => {
                    const previewMatched = Math.abs((parseFloat(editInvoiceTotal) || 0) - ((sessionHistoryItems[session.id] ?? []).reduce((s, i) => s + (i.total_cost != null ? Number(i.total_cost) : Number(i.unit_cost) * Number(i.quantity_received)), 0) + (parseFloat(editFreightCost) || 0) + (parseFloat(editAdditionalCost) || 0))) <= 0.01;
                    return previewMatched ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", marginBottom: "12px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px" }}>
                        <span style={{ fontSize: "16px" }}>🟢</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#15803d" }}>Automatically Approved</span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>Invoice will be approved on save</span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", marginBottom: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                        <span style={{ fontSize: "16px" }}>🔴</span>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#dc2626" }}>Approval Required</span>
                        <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>Variance must be resolved before approval</span>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => onSaveInvoice(session.id)}
                    disabled={isSavingInvoice}
                    style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", opacity: isSavingInvoice ? 0.6 : 1 }}
                  >{isSavingInvoice ? "Saving..." : "Save Invoice"}</button>
                </div>
              )}
              {isExpanded && (
                <div style={{ padding: "12px 14px", borderTop: "1px solid #e2e8f0" }}>
                  {session.invoice_number && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                      Invoice: <strong>{session.invoice_number}</strong>
                      {session.invoice_date && <> · {session.invoice_date}</>}
                      {session.invoice_total > 0 && <> · Total: <strong>{currencySymbol}{Number(session.invoice_total).toFixed(2)}</strong></>}
                    </div>
                  )}
                  {!items ? (
                    <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
                  ) : items.length === 0 ? (
                    <p style={{ fontSize: "13px", color: "#64748b" }}>No items in this session.</p>
                  ) : (
                    <table border={1} cellPadding={7} style={{ width: "100%", fontSize: "12px" }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th style={{ textAlign: "left" }}>Product</th>
                          <th style={{ textAlign: "left" }}>Barcode</th>
                          <th style={{ textAlign: "right" }}>Unit Cost</th>
                          <th style={{ textAlign: "right" }}>Qty</th>
                          <th style={{ textAlign: "right" }}>Total Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const prod = products.find(p => p.product_id === item.product_id);
                          const lineTotal = item.total_cost != null ? Number(item.total_cost) : Number(item.unit_cost) * Number(item.quantity_received);
                          return (
                          <tr key={item.id}>
                            <td>{prod?.product_name ?? item.product_id.slice(0, 8)}</td>
                            <td style={{ fontFamily: "monospace" }}>{prod?.barcode ?? "—"}</td>
                            <td style={{ textAlign: "right" }}>{currencySymbol}{Number(item.unit_cost).toFixed(2)}</td>
                            <td style={{ textAlign: "right" }}>{item.quantity_received}</td>
                            <td style={{ textAlign: "right", fontWeight: 500 }}>{currencySymbol}{lineTotal.toFixed(2)}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f8fafc", fontWeight: 600 }}>
                          <td colSpan={3} style={{ textAlign: "right" }}>Total</td>
                          <td style={{ textAlign: "right" }}>{items.reduce((s, i) => s + Number(i.quantity_received), 0)}</td>
                          <td style={{ textAlign: "right" }}>{currencySymbol}{totalValue!.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>
        {historyHasMore && (
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <button
              onClick={onLoadMoreHistory}
              disabled={isLoadingMoreHistory}
              style={{ padding: "7px 22px", fontSize: "13px", fontWeight: 600, cursor: isLoadingMoreHistory ? "not-allowed" : "pointer", background: "none", color: "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "6px", opacity: isLoadingMoreHistory ? 0.6 : 1 }}
            >{isLoadingMoreHistory ? "Loading..." : "Load More"}</button>
          </div>
        )}
        </>)}
      </div>
      )}

      <div className="section-card">
        <h3 className="section-card-title">Rapid Receive</h3>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 10px" }}>Scan barcodes to build a receiving list, then post all at once.</p>
        <input
          type="text"
          autoFocus={activeTab === "inventory"}
          placeholder="Scan barcode and press Enter"
          value={rapidReceiveInput}
          onChange={(e) => setRapidReceiveInput(e.target.value)}
          onKeyDown={onRapidReceiveScan}
          style={{ width: "100%", padding: "10px 14px", fontSize: "15px", border: "2px solid #93c5fd", borderRadius: "8px", marginBottom: "12px", boxSizing: "border-box", outline: "none" }}
        />

        {rapidReceiveItems.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
              Scanned Items ({rapidReceiveItems.reduce((s, i) => s + i.quantity, 0)} total)
            </div>
            <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ textAlign: "left" }}>Product</th>
                  <th style={{ textAlign: "left" }}>Barcode</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapidReceiveItems.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{item.barcode}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <button
                          onClick={() => setRapidReceiveItems(prev => prev.map(i => i.product_id === item.product_id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))}
                          style={{ width: "24px", height: "24px", fontSize: "14px", cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "4px", background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >-</button>
                        <span style={{ minWidth: "24px", textAlign: "center", fontWeight: 600 }}>{item.quantity}</span>
                        <button
                          onClick={() => setRapidReceiveItems(prev => prev.map(i => i.product_id === item.product_id ? { ...i, quantity: i.quantity + 1 } : i))}
                          style={{ width: "24px", height: "24px", fontSize: "14px", cursor: "pointer", border: "1px solid #cbd5e1", borderRadius: "4px", background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setRapidReceiveItems(prev => prev.filter(i => i.product_id !== item.product_id))}
                        title="Remove"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", fontSize: "11px", fontWeight: 500, cursor: "pointer", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "4px" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rapidReceiveExceptions.length > 0 && (
          <div style={{ marginBottom: "12px", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", marginBottom: "4px" }}>Exceptions ({rapidReceiveExceptions.length})</div>
            {rapidReceiveExceptions.map((ex, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px", color: "#92400e", padding: "2px 0" }}>
                <span><code style={{ background: "#fef3c7", padding: "1px 4px", borderRadius: "3px" }}>{ex.barcode}</code> — {ex.reason}</span>
                <button
                  onClick={() => setRapidReceiveExceptions(prev => prev.filter((_, j) => j !== i))}
                  style={{ padding: "2px 6px", fontSize: "10px", cursor: "pointer", background: "none", border: "1px solid #fde68a", borderRadius: "3px", color: "#92400e" }}
                >Dismiss</button>
              </div>
            ))}
          </div>
        )}

        {rapidReceiveItems.length > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onPostRapidReceive}
              disabled={isPostingRapidReceive}
              style={{ flex: 1, padding: "10px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "6px", opacity: isPostingRapidReceive ? 0.6 : 1 }}
            >{isPostingRapidReceive ? "Posting..." : `Post Receiving (${rapidReceiveItems.reduce((s, i) => s + i.quantity, 0)} items)`}</button>
            <button
              onClick={() => { setRapidReceiveItems([]); setRapidReceiveExceptions([]); }}
              style={{ padding: "10px 16px", fontSize: "14px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px" }}
            >Clear All</button>
          </div>
        )}
      </div>

      <div className="section-card">
        <h3 className="section-card-title">Receive Inventory</h3>
        <form
          onSubmit={onReceive}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            style={{ flex: "1 1 200px", padding: "8px" }}
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Quantity"
            value={receiveQuantity}
            onChange={(e) => setReceiveQuantity(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Receive
          </button>
          <button
            type="button"
            onClick={() => setSmartReceiveSimpleOpen(true)}
            style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "6px" }}
          >⭐ Smart Receive</button>
        </form>
      </div>

      {canBulkImport && <div className="section-card">
        <h3 className="section-card-title">Bulk Import Products</h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={onDownloadCsvTemplate} style={{ padding: "8px 16px" }}>
            Download CSV Template
          </button>
          <input
            type="file"
            accept=".csv"
            onChange={onCsvUpload}
            style={{ padding: "4px" }}
          />
        </div>

        {bulkPreview.length > 0 && (
          <>
            <div style={{ overflowX: "auto", marginTop: "16px", marginBottom: "12px" }}>
              <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Selling Price</th>
                    <th>SKU</th>
                    <th>Barcode</th>
                    <th>Cost Price</th>
                    <th>Reorder Level</th>
                    <th>Initial Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.map((row, i) => {
                    const statusColor: Record<BulkRow['status'], string> = {
                      valid: '#15803d',
                      missing_name: '#b91c1c',
                      missing_price: '#b91c1c',
                      invalid_price: '#b91c1c',
                      duplicate_barcode: '#92400e',
                    };
                    const statusLabel: Record<BulkRow['status'], string> = {
                      valid: '✓ Valid',
                      missing_name: '✗ Missing name',
                      missing_price: '✗ Missing price',
                      invalid_price: '✗ Invalid price',
                      duplicate_barcode: '⚠ Duplicate barcode',
                    };
                    return (
                      <tr key={i} style={{ background: row.status === 'valid' ? undefined : '#fff7f7' }}>
                        <td style={{ color: statusColor[row.status], fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                          {statusLabel[row.status]}
                        </td>
                        <td>{row.name || '—'}</td>
                        <td>{row.selling_price || '—'}</td>
                        <td>{row.sku || '—'}</td>
                        <td>{row.barcode || '—'}</td>
                        <td>{row.cost_price || '—'}</td>
                        <td>{row.reorder_level || '—'}</td>
                        <td>{row.initial_stock || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#666" }}>
                {bulkPreview.filter(r => r.status === 'valid').length} valid &nbsp;·&nbsp;
                {bulkPreview.filter(r => r.status !== 'valid').length} will be skipped
              </span>
              <button
                onClick={onBulkImport}
                disabled={bulkImporting || bulkPreview.filter(r => r.status === 'valid').length === 0}
                style={{
                  padding: "8px 24px",
                  background: bulkPreview.filter(r => r.status === 'valid').length === 0 ? '#ccc' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: bulkPreview.filter(r => r.status === 'valid').length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {bulkImporting ? 'Importing…' : 'Import Products'}
              </button>
            </div>
          </>
        )}

        {bulkResults && (
          <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", display: "flex", gap: "32px" }}>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Imported</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#15803d" }}>{bulkResults.imported}</div></div>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Skipped</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#92400e" }}>{bulkResults.skipped}</div></div>
            <div><span style={{ fontSize: "13px", color: "#666" }}>Failed</span><div style={{ fontSize: "24px", fontWeight: "bold", color: "#b91c1c" }}>{bulkResults.failed}</div></div>
          </div>
        )}
      </div>}

      {/* ── Needs Ordering Today (creates purchase orders - owner+manager only) ── */}
      {(() => {
        if (!canManagePurchaseOrders || lowStockProducts.length === 0) return null;

        const allIds = lowStockProducts.map(p => p.product_id);
        const allSelected = allIds.length > 0 && allIds.every(id => needsOrderingSelected.has(id));
        const selectedCount = allIds.filter(id => needsOrderingSelected.has(id)).length;

        const toggleAll = () => {
          if (allSelected) {
            setNeedsOrderingSelected(new Set());
          } else {
            setNeedsOrderingSelected(new Set(allIds));
          }
        };

        const toggleOne = (id: string) => {
          setNeedsOrderingSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });
        };

        const getSuggestedQty = (p: typeof lowStockProducts[0]) =>
          needsOrderingQtys[p.product_id] ?? Math.max(1, (p.reorder_level ?? 0) - p.quantity_on_hand);

        const getEstimatedCost = (p: typeof lowStockProducts[0]) =>
          getSuggestedQty(p) * (p.cost_price ?? p.average_cost ?? 0);

        return (
          <div style={{ marginBottom: "24px", border: "1px solid #fecaca", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {/* Header */}
            <div style={{ padding: "12px 16px", background: "#fef2f2", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #fecaca" }}>
              <strong style={{ color: "#b91c1c", fontSize: "15px" }}>🔴 Needs Ordering Today ({lowStockProducts.length})</strong>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: "13px", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fff7f7", borderBottom: "1px solid #fecaca" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", width: "36px" }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        style={{ cursor: "pointer", width: "15px", height: "15px" }}
                      />
                    </th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Product</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Current Stock</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Reorder Level</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", width: "110px" }}>Suggested Order</th>
                    <th style={{ padding: "8px 10px", textAlign: "left" }}>Supplier</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Estimated Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => {
                    const isSelected = needsOrderingSelected.has(p.product_id);
                    const suggestedQty = getSuggestedQty(p);
                    const estimatedCost = getEstimatedCost(p);
                    const supplierName = (p.supplier_id ? supplierMap[p.supplier_id]?.name : null) ?? "No supplier";
                    return (
                      <tr
                        key={p.product_id}
                        style={{ borderBottom: "1px solid #f3f4f6", background: isSelected ? "#fff7f7" : "#fff", cursor: "pointer" }}
                        onClick={() => toggleOne(p.product_id)}
                      >
                        <td style={{ padding: "8px 10px", textAlign: "center" }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(p.product_id)}
                            style={{ cursor: "pointer", width: "15px", height: "15px" }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#0f172a" }}>{p.product_name}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: p.quantity_on_hand === 0 ? "#dc2626" : "#b45309" }}>{p.quantity_on_hand}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", color: "#64748b" }}>{p.reorder_level}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right" }} onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            min={1}
                            value={suggestedQty}
                            onChange={e => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setNeedsOrderingQtys(prev => ({ ...prev, [p.product_id]: val }));
                            }}
                            style={{ width: "72px", padding: "4px 6px", fontSize: "13px", border: "1px solid #e2e8f0", borderRadius: "4px", textAlign: "right" }}
                          />
                        </td>
                        <td style={{ padding: "8px 10px", color: p.supplier_id ? "#0f172a" : "#94a3b8", fontStyle: p.supplier_id ? "normal" : "italic" }}>{supplierName}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "#15803d" }}>
                          {estimatedCost > 0 ? `${currencySymbol}${estimatedCost.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>
                Selected: <strong style={{ color: "#0f172a" }}>{selectedCount}</strong> product{selectedCount !== 1 ? "s" : ""}
              </span>
              <button
                onClick={onCreatePOFromNeedsOrdering}
                disabled={selectedCount === 0}
                style={{
                  padding: "9px 22px",
                  fontSize: "14px",
                  fontWeight: 700,
                  borderRadius: "7px",
                  border: "none",
                  cursor: selectedCount === 0 ? "not-allowed" : "pointer",
                  background: selectedCount === 0 ? "#e2e8f0" : "#1d4ed8",
                  color: selectedCount === 0 ? "#94a3b8" : "#fff",
                  transition: "background 0.15s",
                }}
              >
                Create Purchase Order
              </button>
            </div>
          </div>
        );
      })()}

      <button
        onClick={() => setTxHistoryOpen(o => !o)}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{txHistoryOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Transaction History</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>
          ({txDateRange === 'today' ? 'Today' : txDateRange === '7d' ? 'Last 7 Days' : txDateRange === '30d' ? 'Last 30 Days' : 'All Time'} — {transactions.length} records)
        </span>
      </button>
      {txHistoryOpen && <>
      <div style={{ marginBottom: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {([['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['all', 'All Time']] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTxDateRange(key as typeof txDateRange)}
            style={{
              padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
              background: txDateRange === key ? "#1d4ed8" : "#fff",
              color: txDateRange === key ? "#fff" : "#333",
              border: txDateRange === key ? "1px solid #1d4ed8" : "1px solid #ccc",
              fontWeight: txDateRange === key ? "bold" : "normal",
            }}
          >{label}</button>
        ))}
      </div>
      <div style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {["all", "sale", "receiving", "return", "void", "damaged", "expired", "lost", "correction"].map((f) => (
          <button
            key={f}
            onClick={() => setMovementFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: "4px", border: "1px solid #ccc", cursor: "pointer",
              backgroundColor: movementFilter === f ? "#333" : "#fff",
              color: movementFilter === f ? "#fff" : "#333",
              fontWeight: movementFilter === f ? "bold" : "normal",
            }}
          >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>
      {(() => {
        const filtered = movementFilter === "all"
          ? transactions
          : transactions.filter(tx => tx.transaction_type === movementFilter);
        return (
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Change</th>
                  <th>Before</th>
                  <th>After</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}>No transactions</td></tr>
                ) : (
                  filtered.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.created_at).toLocaleString()}</td>
                      <td>{tx.products?.name}</td>
                      <td>{tx.transaction_type}</td>
                      <td style={{ color: tx.quantity_change < 0 ? "red" : "green", fontWeight: "bold" }}>
                        {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                      </td>
                      <td>{tx.quantity_before}</td>
                      <td>{tx.quantity_after}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );
      })()}
      </>}

    </div>
  );
}
