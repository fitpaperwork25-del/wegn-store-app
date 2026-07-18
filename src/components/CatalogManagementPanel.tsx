import React from "react";
import type { Supplier } from "../lib/purchasing/types";
import type { ProductStock, Category } from "../lib/product/types";
import { getTotalInventoryValue } from "../lib/product/productHelpers";

type CatalogManagementPanelProps = {
  visible: boolean;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  products: ProductStock[];
  suppliers: Supplier[];
  categories: Category[];
  categoryMap: Record<string, Category>;
  lowStockProducts: ProductStock[];

  // Add Product
  canAddProducts: boolean;
  onAddProduct: (e: React.FormEvent) => void;
  newName: string;
  setNewName: (v: string) => void;
  newSku: string;
  setNewSku: (v: string) => void;
  newBarcode: string;
  setNewBarcode: (v: string) => void;
  setBarcodeAutoFill: (v: string) => void;
  onBarcodeLookup: () => void;
  newCostPrice: string;
  setNewCostPrice: (v: string) => void;
  newSellingPrice: string;
  setNewSellingPrice: (v: string) => void;
  newReorderLevel: string;
  setNewReorderLevel: (v: string) => void;
  newProductCategory: string;
  setNewProductCategory: (v: string) => void;
  newOverhead: string;
  setNewOverhead: (v: string) => void;
  newTargetMargin: string;
  setNewTargetMargin: (v: string) => void;
  newMinMargin: string;
  setNewMinMargin: (v: string) => void;
  /** Single user-facing toggle; persisted as products.tracking_mode "expiration_batch"/"none" (src/lib/inventory/trackingCapture.ts). */
  newTrackExpiration: boolean;
  setNewTrackExpiration: (v: boolean) => void;
  newInitialStock: string;
  setNewInitialStock: (v: string) => void;
  barcodeAutoFill: string;

  // Categories
  canManageCategories: boolean;
  onAddCategory: (e: React.FormEvent) => void;
  newCatName: string;
  setNewCatName: (v: string) => void;
  newCatDesc: string;
  setNewCatDesc: (v: string) => void;
  editingCatId: string | null;
  setEditingCatId: (v: string | null) => void;
  onEditCategory: (e: React.FormEvent) => void;
  editCatName: string;
  setEditCatName: (v: string) => void;
  editCatDesc: string;
  setEditCatDesc: (v: string) => void;
  onToggleCategoryStatus: (cat: Category) => void;
  onDeleteCategory: (cat: Category) => void;

  // Products & Stock table
  productsTableOpen: boolean;
  setProductsTableOpen: React.Dispatch<React.SetStateAction<boolean>>;
  productSearchRef: React.RefObject<HTMLInputElement | null>;
  productSearch: string;
  setProductSearch: (v: string) => void;
  categoryChips: { key: string; label: string; count: number }[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  filteredProducts: ProductStock[];
  editingProductId: string | null;
  setEditingProductId: (v: string | null) => void;
  canEditProducts: boolean;
  setEditProdName: (v: string) => void;
  setEditProdSku: (v: string) => void;
  setEditProdBarcode: (v: string) => void;
  setEditProdPrice: (v: string) => void;
  setEditProdReorder: (v: string) => void;
  setEditProdOverhead: (v: string) => void;
  setEditProdTargetMargin: (v: string) => void;
  setEditProdMinMargin: (v: string) => void;
  setEditProdCategory: (v: string) => void;
  setEditProdTrackExpiration: (v: boolean) => void;
  canDeactivateProducts: boolean;
  onToggleProductStatus: (product: ProductStock) => void;
  onEditProduct: (e: React.FormEvent, productId: string) => void;
  onPrintBarcodeLabel: (product: ProductStock) => void;
  /** Row-level "···" Actions menu, keyed by product_id. Houses Edit / Print
   *  Barcode / Deactivate today; structured so Reprint Barcode, Generate
   *  Barcode, and Archive can be added as menu items later. */
  productActionsOpenId: string | null;
  setProductActionsOpenId: (v: string | null) => void;
  editProdName: string;
  editProdSku: string;
  editProdBarcode: string;
  editProdPrice: string;
  editProdReorder: string;
  editProdCategory: string;
  editProdOverhead: string;
  editProdTargetMargin: string;
  editProdMinMargin: string;
  editProdTrackExpiration: boolean;
};

export function CatalogManagementPanel({
  visible, currencySymbol, products, suppliers, categories, categoryMap, lowStockProducts,
  canAddProducts, onAddProduct, newName, setNewName, newSku, setNewSku, newBarcode, setNewBarcode,
  setBarcodeAutoFill, onBarcodeLookup, newCostPrice, setNewCostPrice, newSellingPrice, setNewSellingPrice,
  newReorderLevel, setNewReorderLevel, newProductCategory, setNewProductCategory, newOverhead, setNewOverhead,
  newTargetMargin, setNewTargetMargin, newMinMargin, setNewMinMargin,
  newTrackExpiration, setNewTrackExpiration,
  newInitialStock, setNewInitialStock, barcodeAutoFill,
  canManageCategories, onAddCategory, newCatName, setNewCatName, newCatDesc, setNewCatDesc,
  editingCatId, setEditingCatId, onEditCategory, editCatName, setEditCatName, editCatDesc, setEditCatDesc,
  onToggleCategoryStatus, onDeleteCategory,
  productsTableOpen, setProductsTableOpen, productSearchRef, productSearch, setProductSearch, categoryChips,
  categoryFilter, setCategoryFilter, filteredProducts, editingProductId, setEditingProductId, canEditProducts,
  setEditProdName, setEditProdSku, setEditProdBarcode, setEditProdPrice, setEditProdReorder,
  setEditProdOverhead, setEditProdTargetMargin, setEditProdMinMargin, setEditProdCategory, setEditProdTrackExpiration,
  canDeactivateProducts, onToggleProductStatus, onEditProduct, onPrintBarcodeLabel,
  productActionsOpenId, setProductActionsOpenId,
  editProdName, editProdSku, editProdBarcode, editProdPrice, editProdReorder, editProdCategory,
  editProdOverhead, editProdTargetMargin, editProdMinMargin, editProdTrackExpiration,
}: CatalogManagementPanelProps) {
  return (
    <div style={{ display: visible ? '' : 'none' }}>

      {canAddProducts && <div className="section-card">
        <h3 className="section-card-title">Add Product</h3>
        <form
          onSubmit={onAddProduct}
          style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}
        >
          <input
            type="text"
            placeholder="Product Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ flex: "2 1 200px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="SKU"
            value={newSku}
            onChange={(e) => setNewSku(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Barcode"
            value={newBarcode}
            onChange={(e) => { setNewBarcode(e.target.value); setBarcodeAutoFill(""); }}
            onBlur={onBarcodeLookup}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onBarcodeLookup(); } }}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Cost Price"
            value={newCostPrice}
            onChange={(e) => setNewCostPrice(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Selling Price *"
            value={newSellingPrice}
            onChange={(e) => setNewSellingPrice(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <input
            type="number"
            placeholder="Reorder Level"
            value={newReorderLevel}
            onChange={(e) => setNewReorderLevel(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <select
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.target.value)}
            style={{ flex: "1 1 140px", padding: "8px" }}
          >
            <option value="">No Category</option>
            {categories.filter(c => c.status === "active").map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="number" min="0" placeholder="Overhead %" value={newOverhead} onChange={(e) => setNewOverhead(e.target.value)} step="0.1" style={{ flex: "1 1 100px", padding: "8px" }} />
          <input type="number" min="0" placeholder="Target Margin %" value={newTargetMargin} onChange={(e) => setNewTargetMargin(e.target.value)} step="0.1" style={{ flex: "1 1 110px", padding: "8px" }} />
          <input type="number" min="0" placeholder="Min Margin %" value={newMinMargin} onChange={(e) => setNewMinMargin(e.target.value)} step="0.1" style={{ flex: "1 1 110px", padding: "8px" }} />
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", flex: "1 1 180px" }}>
            <input type="checkbox" checked={newTrackExpiration} onChange={(e) => setNewTrackExpiration(e.target.checked)} />
            Track Expiration / Batch
          </label>
          <input
            type="number"
            min="0"
            placeholder="Initial Stock *"
            value={newInitialStock}
            onChange={(e) => setNewInitialStock(e.target.value)}
            style={{ flex: "1 1 120px", padding: "8px" }}
          />
          <button type="submit" className="pos-add-btn">
            Add Product
          </button>
        </form>
        {barcodeAutoFill && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px", padding: "8px 14px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "6px", fontSize: "13px" }}>
            <span style={{ color: "#1d4ed8" }}>{barcodeAutoFill}</span>
            <button onClick={() => setBarcodeAutoFill("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: "15px", color: "#64748b" }}>✕</button>
          </div>
        )}
      </div>}

      <h2 style={{ marginTop: "40px" }}>Products & Stock</h2>

      {/* ── Inventory Summary Cards ── */}
      {(() => {
        const totalProducts = products.length;
        const lowStockItems = lowStockProducts.length;
        const inventoryValue = getTotalInventoryValue(products);
        const activeSupplierCount = suppliers.filter(s => s.status === 'active').length;
        return (
          <div className="dash-card-row" style={{ marginBottom: "24px" }}>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#eff6ff", color: "#1d4ed8" }}>&#x1F4E6;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Total Products</div>
                <div className="dash-card-value">{totalProducts}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: lowStockItems > 0 ? "#fef2f2" : "#f0fdf4", color: lowStockItems > 0 ? "#dc2626" : "#16a34a" }}>&#x26A0;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Low Stock Items</div>
                <div className="dash-card-value" style={lowStockItems > 0 ? { color: "#dc2626" } : undefined}>{lowStockItems}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}>$</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Inventory Value</div>
                <div className="dash-card-value">{currencySymbol}{inventoryValue.toFixed(2)}</div>
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-icon" style={{ background: "#faf5ff", color: "#7c3aed" }}>&#x1F465;</div>
              <div className="dash-card-body">
                <div className="dash-card-label">Active Suppliers</div>
                <div className="dash-card-value">{activeSupplierCount}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Categories ── */}
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "8px" }}>Categories</h3>
        {canManageCategories && <form onSubmit={onAddCategory} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
          <input type="text" placeholder="Category name *" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required style={{ flex: "2 1 160px", padding: "7px" }} />
          <input type="text" placeholder="Description" value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} style={{ flex: "2 1 200px", padding: "7px" }} />
          <button type="submit" style={{ padding: "7px 16px" }}>Add Category</button>
        </form>}
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {categories.map(cat => {
              const count = products.filter(p => p.category_id === cat.id).length;
              const isEditing = editingCatId === cat.id;
              return isEditing ? (
                <form key={cat.id} onSubmit={onEditCategory} style={{ display: "flex", gap: "6px", alignItems: "center", border: "1px solid #93c5fd", borderRadius: "6px", padding: "4px 8px", background: "#eff6ff" }}>
                  <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} required style={{ width: "120px", padding: "4px", fontSize: "13px" }} />
                  <input type="text" value={editCatDesc} onChange={(e) => setEditCatDesc(e.target.value)} placeholder="Desc" style={{ width: "120px", padding: "4px", fontSize: "13px" }} />
                  <button type="submit" style={{ padding: "2px 8px", fontSize: "12px" }}>Save</button>
                  <button type="button" onClick={() => setEditingCatId(null)} style={{ padding: "2px 8px", fontSize: "12px" }}>Cancel</button>
                </form>
              ) : (
                <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: "6px", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "4px 10px", background: cat.status === "inactive" ? "#f5f5f5" : "#fff", fontSize: "13px", opacity: cat.status === "inactive" ? 0.7 : 1 }}>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                  {cat.description && <span style={{ color: "#94a3b8", fontSize: "11px" }} title={cat.description}>— {cat.description.length > 20 ? cat.description.slice(0, 20) + "…" : cat.description}</span>}
                  <span style={{ color: "#94a3b8", fontSize: "11px" }}>({count})</span>
                  {cat.status === "inactive" && <span style={{ color: "#b45309", fontSize: "10px", fontWeight: 600 }}>INACTIVE</span>}
                  {canManageCategories && <button onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); setEditCatDesc(cat.description ?? ""); }} style={{ padding: "1px 6px", fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #ccc", borderRadius: "3px" }}>Edit</button>}
                  {canManageCategories && <button onClick={() => onToggleCategoryStatus(cat)} style={{ padding: "1px 6px", fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #ccc", borderRadius: "3px", color: cat.status === "active" ? "#b45309" : "#15803d" }}>{cat.status === "active" ? "Deactivate" : "Activate"}</button>}
                  {canManageCategories && count === 0 && <button onClick={() => onDeleteCategory(cat)} style={{ padding: "1px 6px", fontSize: "11px", cursor: "pointer", background: "none", border: "1px solid #fca5a5", borderRadius: "3px", color: "#dc2626" }}>Del</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        onClick={() => setProductsTableOpen(o => !o)}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{productsTableOpen ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Products & Stock</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({products.length} products)</span>
      </button>
      {productsTableOpen && <>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          ref={productSearchRef}
          type="text"
          placeholder="Search by product, SKU, or barcode…"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
        />
        <button
          type="button"
          onClick={() => productSearchRef.current?.focus()}
          style={{ padding: "8px 14px", border: "1px solid #d1d5db", borderRadius: "6px", background: "#f9fafb", cursor: "pointer", fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap" }}
        >Scan</button>
      </div>
      {/* ── Category Filter ── */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {categoryChips.map(chip => {
            const active = categoryFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setCategoryFilter(chip.key)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px",
                  border: active ? "2px solid #1d4ed8" : "1px solid #d1d5db",
                  background: active ? "#dbeafe" : "#f9fafb",
                  color: active ? "#1d4ed8" : "#374151",
                  fontWeight: active ? 600 : 400,
                }}
              >{chip.label} ({chip.count})</button>
            );
          })}
        </div>
      )}

      {/* ── Desktop table / Mobile cards ── */}
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Product</th>
              <th style={{ textAlign: "left" }}>Category</th>
              <th style={{ textAlign: "left" }}>SKU</th>
              <th style={{ textAlign: "right" }}>Price</th>
              <th style={{ textAlign: "right" }}>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {(() => {
              if (filteredProducts.length === 0) return (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>No products match your search.</td></tr>
              );
              return filteredProducts.map((product) => {
              const isLowStock = product.status === 'active' && product.reorder_level !== null && product.quantity_on_hand < product.reorder_level;
              const isOutOfStock = product.status === 'active' && product.quantity_on_hand === 0;
              const inactive = product.status !== "active";
              const isEditing = editingProductId === product.product_id;
              const actionsOpen = productActionsOpenId === product.product_id;
              return (
                <React.Fragment key={product.product_id}>
                  <tr className={inactive ? "inv-row-inactive" : ""}>
                    <td data-label="Product" style={{ fontWeight: 500 }}>{product.product_name}</td>
                    <td data-label="Category" style={{ fontSize: "13px", color: "#64748b" }}>{(product.category_id ? categoryMap[product.category_id]?.name : null) ?? "—"}</td>
                    <td data-label="SKU" style={{ color: "#64748b", fontFamily: "var(--mono)", fontSize: "13px" }}>{product.sku ?? "—"}</td>
                    <td data-label="Price" style={{ textAlign: "right", fontWeight: 500 }}>{currencySymbol}{product.selling_price.toFixed(2)}</td>
                    <td data-label="Stock" style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: 500 }}>{product.quantity_on_hand}</span>
                      {!inactive && isOutOfStock && (
                        <span className="inv-badge inv-badge-danger" style={{ marginLeft: "8px" }}>Out of Stock</span>
                      )}
                      {!inactive && isLowStock && !isOutOfStock && (
                        <span className="inv-badge inv-badge-warning" style={{ marginLeft: "8px" }}>Low Stock</span>
                      )}
                    </td>
                    <td data-label="Status" style={{ textAlign: "center" }}>
                      <span className={`inv-badge ${inactive ? "inv-badge-muted" : "inv-badge-success"}`}>{product.status}</span>
                    </td>
                    <td data-label="Actions" style={{ whiteSpace: "nowrap" }}>
                      <span style={{ position: "relative", display: "inline-block" }}>
                        <button
                          type="button"
                          onClick={() => setProductActionsOpenId(actionsOpen ? null : product.product_id)}
                          style={{ padding: "4px 8px", fontSize: "13px", cursor: "pointer", background: actionsOpen ? "#e5e7eb" : undefined }}
                        >···</button>
                        {actionsOpen && (
                          <div style={{ position: "absolute", right: 0, top: "100%", zIndex: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: "160px", padding: "4px 0" }}>
                            {canEditProducts && (
                              <button
                                onClick={() => {
                                  setProductActionsOpenId(null);
                                  if (isEditing) { setEditingProductId(null); return; }
                                  setEditingProductId(product.product_id);
                                  setEditProdName(product.product_name);
                                  setEditProdSku(product.sku ?? "");
                                  setEditProdBarcode(product.barcode ?? "");
                                  setEditProdPrice(product.selling_price.toString());
                                  setEditProdReorder(product.reorder_level?.toString() ?? "");
                                  setEditProdOverhead(product.estimated_overhead_pct?.toString() ?? "0");
                                  setEditProdTargetMargin(product.target_margin_percent?.toString() ?? "");
                                  setEditProdMinMargin(product.minimum_margin_percent?.toString() ?? "");
                                  setEditProdCategory(product.category_id ?? "");
                                  setEditProdTrackExpiration(product.tracking_mode === "expiration_batch");
                                }}
                                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px" }}
                              >{isEditing ? "Cancel Edit" : "Edit"}</button>
                            )}
                            <button
                              onClick={() => { onPrintBarcodeLabel(product); setProductActionsOpenId(null); }}
                              disabled={!product.barcode}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: product.barcode ? "pointer" : "not-allowed", fontSize: "13px", opacity: product.barcode ? 1 : 0.5 }}
                            >Print Barcode</button>
                            {/* Reserved for future actions: Reprint Barcode, Generate Barcode, Archive.
                                Not implemented yet - structure only. */}
                            {canDeactivateProducts && (
                              <button
                                onClick={() => { onToggleProductStatus(product); setProductActionsOpenId(null); }}
                                style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 14px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: inactive ? "#15803d" : "#dc2626" }}
                              >{inactive ? "Activate" : "Deactivate"}</button>
                            )}
                          </div>
                        )}
                      </span>
                    </td>
                  </tr>
                  {canEditProducts && isEditing && (
                    <tr className="inv-edit-row">
                      <td colSpan={7} style={{ background: "#f9fafb", padding: "16px" }}>
                        <form onSubmit={(e) => onEditProduct(e, product.product_id)} style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                          <strong style={{ width: "100%", marginBottom: "4px" }}>Edit Product — {product.product_name}</strong>
                          <input
                            type="text"
                            placeholder="Product name *"
                            value={editProdName}
                            onChange={(e) => setEditProdName(e.target.value)}
                            required
                            style={{ flex: "2 1 160px", padding: "7px" }}
                          />
                          <input
                            type="text"
                            placeholder="SKU"
                            value={editProdSku}
                            onChange={(e) => setEditProdSku(e.target.value)}
                            style={{ flex: "1 1 100px", padding: "7px" }}
                          />
                          <input
                            type="text"
                            placeholder="Barcode"
                            value={editProdBarcode}
                            onChange={(e) => setEditProdBarcode(e.target.value)}
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <input
                            type="number"
                            placeholder="Selling price *"
                            value={editProdPrice}
                            onChange={(e) => setEditProdPrice(e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <input
                            type="number"
                            placeholder="Reorder level"
                            value={editProdReorder}
                            onChange={(e) => setEditProdReorder(e.target.value)}
                            min="0"
                            style={{ flex: "1 1 110px", padding: "7px" }}
                          />
                          <select
                            value={editProdCategory}
                            onChange={(e) => setEditProdCategory(e.target.value)}
                            style={{ flex: "1 1 140px", padding: "7px" }}
                          >
                            <option value="">No Category</option>
                            {categories.filter(c => c.status === "active").map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <div style={{ width: "100%", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                            <input type="number" placeholder="Overhead %" value={editProdOverhead} onChange={(e) => setEditProdOverhead(e.target.value)} min="0" step="0.1" style={{ flex: "1 1 100px", padding: "7px" }} />
                            <input type="number" placeholder="Target Margin %" value={editProdTargetMargin} onChange={(e) => setEditProdTargetMargin(e.target.value)} min="0" step="0.1" style={{ flex: "1 1 110px", padding: "7px" }} />
                            <input type="number" placeholder="Min Margin %" value={editProdMinMargin} onChange={(e) => setEditProdMinMargin(e.target.value)} min="0" step="0.1" style={{ flex: "1 1 110px", padding: "7px" }} />
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", flex: "1 1 180px" }}>
                              <input type="checkbox" checked={editProdTrackExpiration} onChange={(e) => setEditProdTrackExpiration(e.target.checked)} />
                              Track Expiration / Batch
                            </label>
                          </div>
                          {(() => {
                            const avgCost = product.average_cost;
                            const oh = Number(editProdOverhead) || 0;
                            const tm = Number(editProdTargetMargin) || 0;
                            const mm = Number(editProdMinMargin) || 0;
                            const breakEven = avgCost * (1 + oh / 100);
                            const minSafe = mm > 0 ? breakEven * (1 + mm / 100) : null;
                            const target = tm > 0 ? breakEven * (1 + tm / 100) : null;
                            return (
                              <div style={{ width: "100%", display: "flex", gap: "16px", flexWrap: "wrap", fontSize: "13px", color: "#64748b", padding: "4px 0" }}>
                                <span>Avg Cost: <strong style={{ color: "#0f172a" }}>{currencySymbol}{avgCost.toFixed(2)}</strong></span>
                                <span>Break-even: <strong style={{ color: "#64748b" }}>{currencySymbol}{breakEven.toFixed(2)}</strong></span>
                                {minSafe !== null && <span>Min Safe: <strong style={{ color: "#b45309" }}>{currencySymbol}{minSafe.toFixed(2)}</strong></span>}
                                {target !== null && <span>Target: <strong style={{ color: "#15803d" }}>{currencySymbol}{target.toFixed(2)}</strong></span>}
                                <span>Listed: <strong style={{ color: "#1d4ed8" }}>{currencySymbol}{product.selling_price.toFixed(2)}</strong></span>
                              </div>
                            );
                          })()}
                          <button type="submit" style={{ padding: "7px 16px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
                          <button type="button" onClick={() => setEditingProductId(null)} style={{ padding: "7px 14px", cursor: "pointer" }}>Cancel</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            });
            })()}
          </tbody>
        </table>
      </div>

      </>}
    </div>
  );
}
