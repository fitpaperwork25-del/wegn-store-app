import type { ProductResolutionRequest, ProductStock, Category, Supplier } from "../App";

type ProductResolutionDialogProps = {
  request: ProductResolutionRequest | null;
  mode: "link" | "create" | null;
  setMode: (m: "link" | "create" | null) => void;
  linkId: string;
  setLinkId: (v: string) => void;
  newName: string;
  setNewName: (v: string) => void;
  newCost: string;
  setNewCost: (v: string) => void;
  newSelling: string;
  setNewSelling: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  supplierId: string;
  setSupplierId: (v: string) => void;
  isSaving: boolean;
  products: ProductStock[];
  categories: Category[];
  suppliers: Supplier[];
  onLink: () => void;
  onCreate: () => void;
  onClose: () => void;
};

export function ProductResolutionDialog({
  request,
  mode,
  setMode,
  linkId,
  setLinkId,
  newName,
  setNewName,
  newCost,
  setNewCost,
  newSelling,
  setNewSelling,
  categoryId,
  setCategoryId,
  supplierId,
  setSupplierId,
  isSaving,
  products,
  categories,
  suppliers,
  onLink,
  onCreate,
  onClose,
}: ProductResolutionDialogProps) {
  if (!request) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1200 }} onClick={(e) => { if (e.target === e.currentTarget) { request.onSkipped(); onClose(); } }} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1201, background: "#fff", borderRadius: "12px", width: "480px", maxWidth: "95vw", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 20px 0", flexShrink: 0, borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>Product Not Found</div>
          <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
            {request.barcode
              ? <span>Barcode <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: "4px", fontFamily: "monospace" }}>{request.barcode}</code> is not linked to any product.</span>
              : <span>No product matched <strong>"{request.description}"</strong> from the invoice.</span>}
          </div>
        </div>
        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "14px 20px 20px" }}>
          {!mode && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button type="button" onClick={() => setMode("link")} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "8px", textAlign: "left" }}>🔗 Link to Existing Product</button>
              <button type="button" onClick={() => { setMode("create"); setNewName(request.description ?? ""); setNewCost(request.suggestedCost != null ? String(request.suggestedCost) : ""); }} style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer", background: "#15803d", color: "#fff", border: "none", borderRadius: "8px", textAlign: "left" }}>➕ Create New Product</button>
              <button type="button" onClick={() => { request.onSkipped(); onClose(); }} style={{ padding: "12px 16px", fontSize: "14px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#64748b", textAlign: "left" }}>✕ Skip — do not add this item</button>
            </div>
          )}
          {mode === "link" && (
            <div>
              <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>Select the product to link{request.barcode ? " this barcode to" : " to this invoice line"}:</div>
              <select value={linkId} onChange={e => setLinkId(e.target.value)} style={{ width: "100%", padding: "9px 12px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "8px", marginBottom: "12px" }}>
                <option value="">Select product...</option>
                {products.filter(p => p.status === "active").map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
              </select>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={onLink} disabled={!linkId || isSaving} style={{ flex: 1, padding: "9px", fontSize: "13px", fontWeight: 600, cursor: linkId && !isSaving ? "pointer" : "not-allowed", background: linkId ? "#1d4ed8" : "#e2e8f0", color: linkId ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px", opacity: isSaving ? 0.6 : 1 }}>{isSaving ? "Linking..." : "Link & Continue"}</button>
                <button type="button" onClick={() => setMode(null)} style={{ padding: "9px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#475569" }}>Back</button>
              </div>
            </div>
          )}
          {mode === "create" && (
            <div>
              {/* Invoice context — pre-filled info shown as reference */}
              {request.suggestedQuantity != null && (
                <div style={{ padding: "8px 10px", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", fontSize: "12px", color: "#15803d", marginBottom: "10px" }}>
                  📦 From invoice: <strong>{request.suggestedQuantity} units</strong> @ <strong>${request.suggestedCost?.toFixed(2)}</strong> each — will be added to receiving session
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Product Name *</label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                </div>
                {request.barcode && (
                  <div style={{ fontSize: "12px", color: "#64748b", background: "#fef9c3", padding: "5px 8px", borderRadius: "5px" }}>🏷 Barcode <code style={{ padding: "1px 4px" }}>{request.barcode}</code> will be linked to this product.</div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Cost Price ($)</label>
                    <input type="number" step="0.01" min="0" value={newCost} onChange={e => setNewCost(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Selling Price ($) *</label>
                    <input type="number" step="0.01" min="0" value={newSelling} onChange={e => setNewSelling(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Category</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    <option value="">Uncategorized</option>
                    {categories.filter(c => c.status === "active").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "3px" }}>Supplier</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px" }}>
                    <option value="">No supplier</option>
                    {suppliers.filter(s => s.status === "active").map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={onCreate} disabled={!newName.trim() || !newSelling || isSaving} style={{ flex: 1, padding: "9px", fontSize: "13px", fontWeight: 600, cursor: newName.trim() && newSelling && !isSaving ? "pointer" : "not-allowed", background: newName.trim() && newSelling ? "#15803d" : "#e2e8f0", color: newName.trim() && newSelling ? "#fff" : "#94a3b8", border: "none", borderRadius: "6px", opacity: isSaving ? 0.6 : 1 }}>{isSaving ? "Creating..." : "Create & Continue"}</button>
                <button type="button" onClick={() => setMode(null)} style={{ padding: "9px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#475569" }}>Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
