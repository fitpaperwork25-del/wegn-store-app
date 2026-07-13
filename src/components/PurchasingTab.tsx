import React from "react";
import type { Supplier } from "../lib/purchasing/types";
import type { ProductStock } from "../lib/product/types";

type PurchasingTabProps = {
  visible: boolean;
  suppliers: Supplier[];
  products: ProductStock[];

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
};

export function PurchasingTab({
  visible,
  suppliers,
  products,
  reorderSuppliers, setReorderSuppliers,
  reorderFilter, setReorderFilter,
  reorderSelected, setReorderSelected,
  reorderQtys, setReorderQtys,
  aiReorderRecs,
  collapsedSuppliers, setCollapsedSuppliers,
  bulkSupplierId, setBulkSupplierId,
  onBulkAssignSupplier,
  onBatchReorderPO,
}: PurchasingTabProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Purchasing</h2>
        <p className="page-subtitle">Manage suppliers, purchase orders, receiving, and reorder planning</p>
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

      </div>
  );
}
