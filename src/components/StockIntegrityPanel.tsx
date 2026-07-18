import React from "react";
import type { InventoryBatch, StockCountLine, StockCountRecord, StockCountItemDetail } from "../lib/inventory/types";
import type { ProductStock } from "../lib/product/types";

type StockIntegrityPanelProps = {
  visible: boolean;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  products: ProductStock[];

  // Expiration Tracking / Batches
  onLoadBatches: () => void;
  isLoadingBatches: boolean;
  batches: InventoryBatch[];
  writeOffBatchId: string | null;
  setWriteOffBatchId: (v: string | null) => void;
  writeOffQty: string;
  setWriteOffQty: (v: string) => void;
  isWritingOffBatch: boolean;
  onWriteOffBatch: (batch: InventoryBatch, qtyToWriteOff: number) => void;

  // Adjust Inventory
  canAdjustInventory: boolean;
  onAdjust: (e: React.FormEvent) => void;
  adjustProductId: string;
  setAdjustProductId: (v: string) => void;
  adjustType: string;
  setAdjustType: (v: string) => void;
  adjustQuantity: string;
  setAdjustQuantity: (v: string) => void;
  adjustReason: string;
  setAdjustReason: (v: string) => void;
  adjustNotes: string;
  setAdjustNotes: (v: string) => void;

  // Stock Take / Inventory Count
  stockCountActive: boolean;
  onStartCount: () => void;
  stockCountLines: StockCountLine[];
  setStockCountLines: React.Dispatch<React.SetStateAction<StockCountLine[]>>;
  onConfirmCount: () => void;
  stockCountLoading: boolean;
  setStockCountActive: (v: boolean) => void;
  stockCountHistoryOpen: boolean | null;
  setStockCountHistoryOpen: (v: boolean) => void;
  stockCounts: StockCountRecord[];
  expandedCountId: string | null;
  setExpandedCountId: (v: string | null) => void;
  countItemsMap: Record<string, StockCountItemDetail[]>;
  onLoadCountItems: (countId: string) => void;
};

export function StockIntegrityPanel({
  visible, currencySymbol, products,
  onLoadBatches, isLoadingBatches, batches, writeOffBatchId, setWriteOffBatchId, writeOffQty, setWriteOffQty,
  isWritingOffBatch, onWriteOffBatch,
  canAdjustInventory, onAdjust, adjustProductId, setAdjustProductId, adjustType, setAdjustType,
  adjustQuantity, setAdjustQuantity, adjustReason, setAdjustReason, adjustNotes, setAdjustNotes,
  stockCountActive, onStartCount, stockCountLines, setStockCountLines, onConfirmCount, stockCountLoading,
  setStockCountActive, stockCountHistoryOpen, setStockCountHistoryOpen, stockCounts, expandedCountId, setExpandedCountId,
  countItemsMap, onLoadCountItems,
}: StockIntegrityPanelProps) {
  return (
    <div style={{ display: visible ? '' : 'none' }}>

      <div className="section-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h3 className="section-card-title" style={{ margin: 0 }}>Expiration Tracking</h3>
          <button onClick={onLoadBatches} style={{ padding: "6px 14px", fontSize: "12px", cursor: "pointer", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#475569" }}>
            {isLoadingBatches ? "Loading..." : "Refresh"}
          </button>
        </div>
        {(() => {
          const today = new Date(); today.setHours(0,0,0,0);
          const in7 = new Date(today); in7.setDate(in7.getDate() + 7);
          const in30 = new Date(today); in30.setDate(in30.getDate() + 30);
          const activeBatches = batches.filter(b => b.status === "active");
          const expired = activeBatches.filter(b => b.expiration_date && new Date(b.expiration_date) < today);
          const exp7 = activeBatches.filter(b => b.expiration_date && new Date(b.expiration_date) >= today && new Date(b.expiration_date) <= in7);
          const exp30 = activeBatches.filter(b => b.expiration_date && new Date(b.expiration_date) > in7 && new Date(b.expiration_date) <= in30);
          return (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                <div style={{ padding: "12px", background: expired.length > 0 ? "#fef2f2" : "#f8fafc", border: `1px solid ${expired.length > 0 ? "#fca5a5" : "#e2e8f0"}`, borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: expired.length > 0 ? "#dc2626" : "#94a3b8" }}>{expired.length}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Expired</div>
                </div>
                <div style={{ padding: "12px", background: exp7.length > 0 ? "#fff7ed" : "#f8fafc", border: `1px solid ${exp7.length > 0 ? "#fdba74" : "#e2e8f0"}`, borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: exp7.length > 0 ? "#ea580c" : "#94a3b8" }}>{exp7.length}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Expires ≤ 7 days</div>
                </div>
                <div style={{ padding: "12px", background: exp30.length > 0 ? "#fffbeb" : "#f8fafc", border: `1px solid ${exp30.length > 0 ? "#fde68a" : "#e2e8f0"}`, borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: exp30.length > 0 ? "#ca8a04" : "#94a3b8" }}>{exp30.length}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>Expires ≤ 30 days</div>
                </div>
              </div>
              {activeBatches.length === 0 && !isLoadingBatches ? (
                <div style={{ textAlign: "center", padding: "24px", color: "#94a3b8", fontSize: "13px" }}>No active batches. Add Batch # / Lot # / Expiry date when receiving inventory.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {activeBatches.map(batch => {
                    const isExpiredBatch = !!(batch.expiration_date && new Date(batch.expiration_date) < today);
                    const isNear7 = !!(batch.expiration_date && !isExpiredBatch && new Date(batch.expiration_date) <= in7);
                    const isNear30 = !!(batch.expiration_date && !isExpiredBatch && !isNear7 && new Date(batch.expiration_date) <= in30);
                    const borderColor = isExpiredBatch ? "#fca5a5" : isNear7 ? "#fdba74" : isNear30 ? "#fde68a" : "#e2e8f0";
                    const bgColor = isExpiredBatch ? "#fef2f2" : isNear7 ? "#fff7ed" : isNear30 ? "#fffbeb" : "#f8fafc";
                    return (
                      <div key={batch.id} style={{ padding: "10px 14px", background: bgColor, border: `1px solid ${borderColor}`, borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "120px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{batch.product_name}</div>
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>
                            {batch.expiration_date ? `Exp: ${batch.expiration_date}` : "No expiry"}
                            {batch.lot_number ? ` · Lot: ${batch.lot_number}` : ""}
                            {batch.batch_number ? ` · Batch: ${batch.batch_number}` : ""}
                            {batch.supplier_name ? ` · ${batch.supplier_name}` : ""}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", fontSize: "13px", color: "#334155", minWidth: "60px" }}>
                          <div style={{ fontWeight: 600 }}>{batch.quantity_remaining} left</div>
                          <div style={{ fontSize: "10px", color: "#94a3b8" }}>of {batch.quantity_received} recv</div>
                        </div>
                        {isExpiredBatch && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", background: "#fca5a5", color: "#7f1d1d", borderRadius: "4px" }}>EXPIRED</span>}
                        {isNear7 && <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 7px", background: "#fdba74", color: "#7c2d12", borderRadius: "4px" }}>EXPIRING SOON</span>}
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {writeOffBatchId === batch.id ? (
                            <>
                              <input type="number" min="0.01" max={batch.quantity_remaining} step="0.01" value={writeOffQty} onChange={e => setWriteOffQty(e.target.value)} placeholder="Qty" style={{ width: "64px", padding: "4px 7px", fontSize: "12px", border: "1px solid #e2e8f0", borderRadius: "4px" }} />
                              <button onClick={() => { const q = parseFloat(writeOffQty); if (q > 0) onWriteOffBatch(batch, q); }} disabled={isWritingOffBatch || !writeOffQty} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer", background: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 600 }}>{isWritingOffBatch ? "..." : "Confirm"}</button>
                              <button onClick={() => { setWriteOffBatchId(null); setWriteOffQty(""); }} style={{ padding: "4px 8px", fontSize: "12px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "4px", color: "#64748b" }}>Cancel</button>
                            </>
                          ) : (
                            <button onClick={() => { setWriteOffBatchId(batch.id); setWriteOffQty(String(batch.quantity_remaining)); }} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#64748b", whiteSpace: "nowrap" }}>Write off</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {canAdjustInventory && <div className="section-card">
        <h3 className="section-card-title">Adjust Inventory</h3>
        <form
          onSubmit={onAdjust}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <select
            value={adjustProductId}
            onChange={(e) => setAdjustProductId(e.target.value)}
            style={{ flex: "1 1 200px", padding: "8px" }}
          >
            <option value="">Select product...</option>
            {products.map((product) => (
              <option key={product.product_id} value={product.product_id}>
                {product.product_name} (stock: {product.quantity_on_hand})
              </option>
            ))}
          </select>
          <select
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value)}
            style={{ flex: "1 1 160px", padding: "8px" }}
          >
            <option value="damaged">Damaged (−)</option>
            <option value="expired">Expired (−)</option>
            <option value="lost">Lost (−)</option>
            <option value="found">Found / Extra (+)</option>
            <option value="correction">Correction (±)</option>
          </select>
          <input
            type="number"
            placeholder={adjustType === "correction" ? "Qty (±)" : "Quantity"}
            value={adjustQuantity}
            onChange={(e) => setAdjustQuantity(e.target.value)}
            style={{ flex: "1 1 100px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Reason (optional)"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            style={{ flex: "1 1 160px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Notes (optional)"
            value={adjustNotes}
            onChange={(e) => setAdjustNotes(e.target.value)}
            style={{ flex: "1 1 160px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Adjust
          </button>
        </form>
        {adjustProductId && (() => {
          const p = products.find(pr => pr.product_id === adjustProductId);
          return p ? (
            <div style={{ marginTop: "8px", fontSize: "13px", color: "#64748b" }}>
              Current stock: <strong>{p.quantity_on_hand}</strong> &nbsp;|&nbsp; Avg cost: <strong>{currencySymbol}{p.average_cost.toFixed(2)}</strong>
            </div>
          ) : null;
        })()}
      </div>}

      {/* Stock Take / Inventory Count */}
      <h2 style={{ marginTop: "40px" }}>Stock Take / Inventory Count</h2>
      {!stockCountActive ? (
        <div style={{ marginBottom: "24px" }}>
          <p style={{ color: "#555", marginBottom: "12px", fontSize: "14px" }}>
            Count all products on the shelf and correct any discrepancies between
            the system quantity and the physical count.
          </p>
          <button
            onClick={onStartCount}
            disabled={products.length === 0}
            style={{ padding: "9px 22px", fontWeight: "bold", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px" }}
          >
            Start Stock Count ({products.length} products)
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
            <strong>Active Count — {stockCountLines.length} products</strong>
            <span style={{ fontSize: "13px", color: "#666" }}>
              Variances: {stockCountLines.filter(l => l.counted_qty !== l.system_qty).length}
            </span>
            <button
              onClick={() => { setStockCountActive(false); setStockCountLines([]); }}
              style={{ padding: "5px 14px", cursor: "pointer", marginLeft: "auto" }}
            >
              Cancel
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f3f4f6" }}>
                  <th style={{ textAlign: "left" }}>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>System Qty</th>
                  <th>Counted Qty</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {stockCountLines.map((line, idx) => {
                  const variance = line.counted_qty - line.system_qty;
                  return (
                    <tr key={line.product_id} style={{ background: variance !== 0 ? "#fefce8" : "inherit" }}>
                      <td>{line.product_name}</td>
                      <td style={{ color: "#888" }}>{line.sku ?? "—"}</td>
                      <td style={{ color: "#888" }}>{line.barcode ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>{line.system_qty}</td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="number"
                          min={0}
                          value={line.counted_qty}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setStockCountLines(prev => prev.map((l, i) => i === idx ? { ...l, counted_qty: val } : l));
                          }}
                          style={{ width: "70px", padding: "4px 6px", textAlign: "center" }}
                        />
                      </td>
                      <td style={{
                        textAlign: "center",
                        fontWeight: variance !== 0 ? "bold" : "normal",
                        color: variance > 0 ? "#16a34a" : variance < 0 ? "#dc2626" : "#888",
                      }}>
                        {variance > 0 ? `+${variance}` : variance}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "14px", flexWrap: "wrap" }}>
            <button
              onClick={onConfirmCount}
              disabled={stockCountLoading}
              style={{
                padding: "9px 24px", fontWeight: "bold", cursor: stockCountLoading ? "not-allowed" : "pointer",
                background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px",
              }}
            >
              {stockCountLoading ? "Saving…" : `Confirm Count (${stockCountLines.filter(l => l.counted_qty !== l.system_qty).length} variance(s))`}
            </button>
            <button
              onClick={() => { setStockCountActive(false); setStockCountLines([]); }}
              style={{ padding: "9px 18px", cursor: "pointer", borderRadius: "6px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Past Stock Counts */}
      <button
        onClick={() => setStockCountHistoryOpen(!(stockCountHistoryOpen ?? (stockCounts.length < 10)))}
        style={{ marginTop: "32px", marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(stockCountHistoryOpen ?? (stockCounts.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Past Stock Counts</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({stockCounts.length} counts)</span>
      </button>
      <div style={{ display: (stockCountHistoryOpen ?? (stockCounts.length < 10)) ? '' : 'none' }}>
      {stockCounts.length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px", marginBottom: "24px" }}>No stock counts recorded yet.</p>
      ) : (
        <div style={{ overflowX: "auto", marginBottom: "32px" }}>
          <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                <th style={{ textAlign: "left" }}>Date</th>
                <th style={{ textAlign: "left" }}>Notes</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Items Counted</th>
                <th style={{ textAlign: "center" }}>Variances</th>
              </tr>
            </thead>
            <tbody>
              {stockCounts.map((sc) => {
                const isExpanded = expandedCountId === sc.id;
                const items = countItemsMap[sc.id] ?? [];
                return (
                  <React.Fragment key={sc.id}>
                    <tr
                      style={{ cursor: "pointer", background: isExpanded ? "#eff6ff" : "inherit" }}
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCountId(null);
                        } else {
                          setExpandedCountId(sc.id);
                          onLoadCountItems(sc.id);
                        }
                      }}
                    >
                      <td>{new Date(sc.completed_at as string).toLocaleString()}</td>
                      <td style={{ color: "#555" }}>{sc.notes ?? "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{
                          fontSize: "12px", fontWeight: "bold", padding: "2px 8px", borderRadius: "12px",
                          background: "#dcfce7", color: "#15803d",
                        }}>{sc.status}</span>
                      </td>
                      <td style={{ textAlign: "center", color: "#555" }}>
                        {countItemsMap[sc.id] ? countItemsMap[sc.id].length : "—"}
                      </td>
                      <td style={{ textAlign: "center", color: "#555" }}>
                        {countItemsMap[sc.id]
                          ? countItemsMap[sc.id].filter(i => i.variance !== 0).length
                          : "—"}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ background: "#f9fafb", padding: "16px" }}>
                          {items.length === 0 ? (
                            <span style={{ color: "#888", fontSize: "13px" }}>Loading…</span>
                          ) : (
                            <table border={1} cellPadding={6} style={{ width: "100%", fontSize: "12px" }}>
                              <thead>
                                <tr style={{ background: "#e5e7eb" }}>
                                  <th style={{ textAlign: "left" }}>Product</th>
                                  <th style={{ textAlign: "left" }}>SKU</th>
                                  <th style={{ textAlign: "center" }}>System Qty</th>
                                  <th style={{ textAlign: "center" }}>Counted Qty</th>
                                  <th style={{ textAlign: "center" }}>Variance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.products?.name ?? "—"}</td>
                                    <td style={{ color: "#888" }}>{item.products?.sku ?? "—"}</td>
                                    <td style={{ textAlign: "center" }}>{item.system_qty}</td>
                                    <td style={{ textAlign: "center" }}>{item.counted_qty}</td>
                                    <td style={{
                                      textAlign: "center",
                                      fontWeight: item.variance !== 0 ? "bold" : "normal",
                                      color: item.variance > 0 ? "#16a34a" : item.variance < 0 ? "#dc2626" : "#9ca3af",
                                    }}>
                                      {item.variance > 0 ? `+${item.variance}` : item.variance}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}
