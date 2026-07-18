import React from "react";
import type { ProductStock } from "../lib/product/types";
import type { Employee } from "../lib/staff/types";
import type { Sale, SaleItemRecord, ReturnLineItem } from "../lib/sales/types";

type SalesHistoryPanelProps = {
  visible: boolean;

  salesHistoryOpen: boolean;
  setSalesHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  salesDateRange: 'today' | '7d' | '30d' | 'all';
  setSalesDateRange: React.Dispatch<React.SetStateAction<'today' | '7d' | '30d' | 'all'>>;
  salesSearchQuery: string;
  setSalesSearchQuery: React.Dispatch<React.SetStateAction<string>>;

  employees: Employee[];
  salesCashierFilter: string;
  setSalesCashierFilter: React.Dispatch<React.SetStateAction<string>>;

  filteredSalesHistory: Sale[];
  employeeMap: Record<string, Employee>;
  saleItemsBySaleId: Record<string, SaleItemRecord[]>;
  productIdMap: Record<string, ProductStock>;

  onPrintReceipt: (sale: Sale) => Promise<void>;
  canVoidSales: boolean;
  onVoidSale: (saleId: string) => Promise<void>;
  voidingId: string;
  onOpenReturn: (sale: Sale) => Promise<void>;

  returningSaleId: string | null;
  returnLines: ReturnLineItem[];
  setReturnLines: React.Dispatch<React.SetStateAction<ReturnLineItem[]>>;
  returnReasonDropdown: string;
  setReturnReasonDropdown: React.Dispatch<React.SetStateAction<string>>;
  returnReason: string;
  setReturnReason: React.Dispatch<React.SetStateAction<string>>;
  returnNotes: string;
  setReturnNotes: React.Dispatch<React.SetStateAction<string>>;
  onConfirmReturn: () => Promise<void>;
  returnLoading: boolean;
  setReturningSaleId: React.Dispatch<React.SetStateAction<string | null>>;
};

export function SalesHistoryPanel({
  visible,
  salesHistoryOpen,
  setSalesHistoryOpen,
  salesDateRange,
  setSalesDateRange,
  salesSearchQuery,
  setSalesSearchQuery,
  employees,
  salesCashierFilter,
  setSalesCashierFilter,
  filteredSalesHistory,
  employeeMap,
  saleItemsBySaleId,
  productIdMap,
  onPrintReceipt,
  canVoidSales,
  onVoidSale,
  voidingId,
  onOpenReturn,
  returningSaleId,
  returnLines,
  setReturnLines,
  returnReasonDropdown,
  setReturnReasonDropdown,
  returnReason,
  setReturnReason,
  returnNotes,
  setReturnNotes,
  onConfirmReturn,
  returnLoading,
  setReturningSaleId,
}: SalesHistoryPanelProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <button
        onClick={() => setSalesHistoryOpen(o => !o)}
        style={{ marginTop: "32px", marginBottom: "8px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{salesHistoryOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Sales History</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>
          ({salesDateRange === 'today' ? 'Today' : salesDateRange === '7d' ? 'Last 7 Days' : salesDateRange === '30d' ? 'Last 30 Days' : 'All Time'} — {filteredSalesHistory.length} sales)
        </span>
      </button>
      {salesHistoryOpen && <>
      <input
        type="text"
        placeholder="Search receipt, product, barcode, or customer..."
        value={salesSearchQuery}
        onChange={e => setSalesSearchQuery(e.target.value)}
        style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "10px", boxSizing: "border-box" }}
      />
      <div style={{ marginBottom: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {([['today', 'Today'], ['7d', 'Last 7 Days'], ['30d', 'Last 30 Days'], ['all', 'All Time']] as [string, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSalesDateRange(key as typeof salesDateRange)}
            style={{
              padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px",
              background: salesDateRange === key ? "#1d4ed8" : "#fff",
              color: salesDateRange === key ? "#fff" : "#333",
              border: salesDateRange === key ? "1px solid #1d4ed8" : "1px solid #ccc",
              fontWeight: salesDateRange === key ? "bold" : "normal",
            }}
          >{label}</button>
        ))}
      </div>

      {employees.length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <label style={{ fontSize: "14px", color: "#555" }}>Filter by cashier:</label>
          <select
            value={salesCashierFilter}
            onChange={(e) => setSalesCashierFilter(e.target.value)}
            style={{ padding: "6px 10px" }}
          >
            <option value="all">All cashiers</option>
            <option value="none">No cashier</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ overflowX: "auto", marginBottom: "40px" }}>
        <table border={0} cellPadding={0} className="sh-table">
          <thead>
            <tr>
              <th>Sale ID</th>
              <th>Products</th>
              <th>Total</th>
              <th>Tax</th>
              <th>Status</th>
              <th>Cashier</th>
              <th>Created At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredSalesHistory.length === 0 ? (
              <tr><td colSpan={8}>No sales yet</td></tr>
            ) : (
              filteredSalesHistory.map((s) => {
                const cashierName = s.cashier_id ? (employeeMap[s.cashier_id]?.name ?? s.cashier_id.slice(0, 8)) : "—";
                const rowClass = s.status === "voided" ? "sh-row-voided" : s.status === "returned" ? "sh-row-returned" : "";
                const lineItems = saleItemsBySaleId[s.id] ?? [];
                const productNames = lineItems.map(si => productIdMap[si.product_id]?.product_name ?? "—");
                const productsLabel = productNames.length === 0 ? "—"
                  : productNames.length === 1 ? productNames[0]
                  : `${productNames[0]} (+${productNames.length - 1} more)`;
                return (
                  <React.Fragment key={s.id}>
                    <tr className={rowClass}>
                      <td style={{ fontFamily: "monospace" }}>{s.id.slice(0, 8)}…</td>
                      <td style={{ fontSize: "12px", color: "#475569", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={productNames.join(", ")}>{productsLabel}</td>
                      <td>${Number(s.total).toFixed(2)}</td>
                      <td>${Number(s.tax).toFixed(2)}</td>
                      <td><span className={`status-pill sp-${s.status}`}>{s.status}</span></td>
                      <td>{cashierName}</td>
                      <td>{new Date(s.created_at).toLocaleString()}</td>
                      <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button onClick={() => onPrintReceipt(s)} className="sh-btn sh-btn-print">Print</button>
                        {s.status === "completed" && canVoidSales && (
                          <button
                            onClick={() => onVoidSale(s.id)}
                            disabled={voidingId === s.id}
                            className="sh-btn sh-btn-void"
                          >Void</button>
                        )}
                        {(s.status === "completed" || s.status === "returned") && (
                          <button
                            onClick={() => onOpenReturn(s)}
                            className="sh-btn sh-btn-return"
                          >Return</button>
                        )}
                      </td>
                    </tr>
                    {returningSaleId === s.id && (
                      <tr key={`${s.id}-return`}>
                        <td colSpan={8} style={{ background: "#faf5ff", padding: "16px", border: "1px solid #c4b5fd" }}>
                          <strong style={{ color: "#7c3aed" }}>Process Return — Sale {s.id.slice(0, 8)}</strong>
                          {returnLines.length === 0 ? (
                            <p style={{ margin: "8px 0 0", color: "#888" }}>All items from this sale have already been returned.</p>
                          ) : (
                            <>
                              <table border={1} cellPadding={8} style={{ width: "100%", marginTop: "10px", fontSize: "13px" }}>
                                <thead>
                                  <tr><th>Product</th><th>Original Qty</th><th>Already Returned</th><th>Available</th><th>Return Qty</th></tr>
                                </thead>
                                <tbody>
                                  {returnLines.map(line => (
                                    <tr key={line.product_id}>
                                      <td>{line.product_name}</td>
                                      <td>{line.original_qty}</td>
                                      <td>{line.already_returned}</td>
                                      <td>{line.available_qty}</td>
                                      <td>
                                        <input
                                          type="number"
                                          min={0}
                                          max={line.available_qty}
                                          value={line.return_qty}
                                          onChange={(e) => {
                                            const val = Math.min(Math.max(0, Number(e.target.value)), line.available_qty);
                                            setReturnLines(prev => prev.map(l => l.product_id === line.product_id ? { ...l, return_qty: val } : l));
                                          }}
                                          style={{ width: "60px", padding: "4px" }}
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginTop: "10px", flexWrap: "wrap" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: "1 1 200px" }}>
                                  <select
                                    value={returnReasonDropdown}
                                    onChange={(e) => setReturnReasonDropdown(e.target.value)}
                                    style={{ padding: "7px", fontSize: "13px" }}
                                    required
                                  >
                                    <option value="">Select reason *</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Expired">Expired</option>
                                    <option value="Customer changed mind">Customer changed mind</option>
                                    <option value="Wrong item sold">Wrong item sold</option>
                                    <option value="Pricing issue">Pricing issue</option>
                                    <option value="Other">Other</option>
                                  </select>
                                  {returnReasonDropdown === "Other" && (
                                    <input
                                      type="text"
                                      placeholder="Specify reason"
                                      value={returnReason}
                                      onChange={(e) => setReturnReason(e.target.value)}
                                      style={{ padding: "7px" }}
                                    />
                                  )}
                                  <input
                                    type="text"
                                    placeholder="Notes (optional)"
                                    value={returnNotes}
                                    onChange={(e) => setReturnNotes(e.target.value)}
                                    style={{ padding: "7px" }}
                                  />
                                </div>
                                <button
                                  onClick={onConfirmReturn}
                                  disabled={returnLoading || returnLines.every(l => l.return_qty === 0)}
                                  style={{
                                    padding: "7px 20px",
                                    background: returnLines.every(l => l.return_qty === 0) ? "#ccc" : "#7c3aed",
                                    color: "#fff", border: "none", borderRadius: "5px",
                                    cursor: returnLines.every(l => l.return_qty === 0) ? "not-allowed" : "pointer",
                                    fontWeight: "bold",
                                  }}
                                >{returnLoading ? "Processing…" : "Confirm Return"}</button>
                                <button onClick={() => { setReturningSaleId(null); setReturnLines([]); }} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                              </div>
                            </>
                          )}
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
      </>}

      </div>
  );
}
