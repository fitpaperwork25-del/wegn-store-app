import React from "react";
import type { ProductStock } from "../lib/product/types";
import type { Employee, DrawerSession } from "../lib/staff/types";
import type { CartItem } from "../lib/sales/types";
import type { LoyaltyTransaction } from "../lib/customers/types";

type POSCheckoutPanelProps = {
  visible: boolean;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;

  // Cash drawer
  drawerSession: DrawerSession | null;
  employees: Employee[];
  onOpenDrawer: (e: React.FormEvent) => Promise<void>;
  openingFloat: string;
  setOpeningFloat: React.Dispatch<React.SetStateAction<string>>;
  drawerLoading: boolean;
  onCloseDrawer: (e: React.FormEvent) => Promise<void>;
  posDrawerCloseOpen: boolean;
  setPosDrawerCloseOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closingCount: string;
  setClosingCount: React.Dispatch<React.SetStateAction<string>>;

  // Barcode scan / unmatched barcode resolution
  barcodeInput: string;
  setBarcodeInput: React.Dispatch<React.SetStateAction<string>>;
  onBarcodeSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  unmatchedBarcode: string;
  setUnmatchedBarcode: React.Dispatch<React.SetStateAction<string>>;
  linkBarcodeProductId: string;
  setLinkBarcodeProductId: React.Dispatch<React.SetStateAction<string>>;
  products: ProductStock[];
  linkBarcodeMode: boolean;
  setLinkBarcodeMode: React.Dispatch<React.SetStateAction<boolean>>;
  setBarcodeAutoFill: React.Dispatch<React.SetStateAction<string>>;
  setNewBarcode: React.Dispatch<React.SetStateAction<string>>;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  onLinkBarcode: () => Promise<void>;

  // Add to cart
  cartProductId: string;
  setCartProductId: React.Dispatch<React.SetStateAction<string>>;
  cartQty: string;
  setCartQty: React.Dispatch<React.SetStateAction<string>>;
  onAddToCart: (e: React.FormEvent) => void;

  // Cashier
  activeCashierId: string | null;
  setActiveCashierId: React.Dispatch<React.SetStateAction<string | null>>;
  activeCashierName: string;
  setActiveCashierName: React.Dispatch<React.SetStateAction<string>>;

  // Customer lookup
  posCustomerPhone: string;
  setPosCustomerPhone: React.Dispatch<React.SetStateAction<string>>;
  setPosCustomerId: React.Dispatch<React.SetStateAction<string | null>>;
  setPosCustomerName: React.Dispatch<React.SetStateAction<string>>;
  onLookupCustomer: () => void;
  posCustomerName: string;
  posCustomerLoyaltyBalance: number;

  // Cart / negotiation
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  negotiatingProductId: string | null;
  setNegotiatingProductId: React.Dispatch<React.SetStateAction<string | null>>;
  negotiatePrice: string;
  setNegotiatePrice: React.Dispatch<React.SetStateAction<string>>;
  negotiateReason: string;
  setNegotiateReason: React.Dispatch<React.SetStateAction<string>>;
  sellingPolicy: "fixed_pricing" | "negotiated_pricing" | "negotiated_with_approval";
  onRemoveFromCart: (productId: string) => void;

  // Discount / redeem / payment / checkout
  posDiscountType: "percent" | "fixed";
  setPosDiscountType: React.Dispatch<React.SetStateAction<"percent" | "fixed">>;
  posDiscountValue: string;
  setPosDiscountValue: React.Dispatch<React.SetStateAction<string>>;
  posCustomerId: string | null;
  posRedeemPoints: string;
  setPosRedeemPoints: React.Dispatch<React.SetStateAction<string>>;
  loyaltyTransactions: LoyaltyTransaction[];
  businessTaxRate: number;
  paymentMethod: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<string>>;
  paymentRef: string;
  setPaymentRef: React.Dispatch<React.SetStateAction<string>>;
  amountTendered: string;
  setAmountTendered: React.Dispatch<React.SetStateAction<string>>;
  isCompletingSale: boolean;
  onCompleteSale: () => Promise<void>;
};

export function POSCheckoutPanel({
  visible,
  currencySymbol,
  drawerSession,
  employees,
  onOpenDrawer,
  openingFloat,
  setOpeningFloat,
  drawerLoading,
  onCloseDrawer,
  posDrawerCloseOpen,
  setPosDrawerCloseOpen,
  closingCount,
  setClosingCount,
  barcodeInput,
  setBarcodeInput,
  onBarcodeSubmit,
  unmatchedBarcode,
  setUnmatchedBarcode,
  linkBarcodeProductId,
  setLinkBarcodeProductId,
  products,
  linkBarcodeMode,
  setLinkBarcodeMode,
  setBarcodeAutoFill,
  setNewBarcode,
  setActiveTab,
  onLinkBarcode,
  cartProductId,
  setCartProductId,
  cartQty,
  setCartQty,
  onAddToCart,
  activeCashierId,
  setActiveCashierId,
  activeCashierName,
  setActiveCashierName,
  posCustomerPhone,
  setPosCustomerPhone,
  setPosCustomerId,
  setPosCustomerName,
  onLookupCustomer,
  posCustomerName,
  posCustomerLoyaltyBalance,
  cart,
  setCart,
  negotiatingProductId,
  setNegotiatingProductId,
  negotiatePrice,
  setNegotiatePrice,
  negotiateReason,
  setNegotiateReason,
  sellingPolicy,
  onRemoveFromCart,
  posDiscountType,
  setPosDiscountType,
  posDiscountValue,
  setPosDiscountValue,
  posCustomerId,
  posRedeemPoints,
  setPosRedeemPoints,
  loyaltyTransactions,
  businessTaxRate,
  paymentMethod,
  setPaymentMethod,
  paymentRef,
  setPaymentRef,
  amountTendered,
  setAmountTendered,
  isCompletingSale,
  onCompleteSale,
}: POSCheckoutPanelProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Point of Sale</h2>
        <p className="page-subtitle">Scan items, process sales, manage returns and receipts</p>
      </div>

      {/* Drawer status bar — always visible */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderRadius: "8px", marginBottom: "16px", flexWrap: "wrap", gap: "8px",
        background: drawerSession ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${drawerSession ? "#bbf7d0" : "#fecaca"}`,
      }}>
        {!drawerSession ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#dc2626", display: "inline-block", flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: "#dc2626", fontSize: "14px" }}>Drawer Closed</span>
            </div>
            <form onSubmit={onOpenDrawer} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="number" min="0" step="0.01" placeholder={`Opening float (${currencySymbol})`}
                value={openingFloat} onChange={(e) => setOpeningFloat(e.target.value)}
                style={{ padding: "6px 10px", width: "150px", fontSize: "13px", border: "1px solid #fca5a5", borderRadius: "6px" }}
              />
              <button type="submit" disabled={drawerLoading || !openingFloat}
                style={{ padding: "6px 16px", fontWeight: 600, fontSize: "13px", background: drawerLoading || !openingFloat ? "#fca5a5" : "#dc2626", color: "#fff", border: "none", borderRadius: "6px", cursor: drawerLoading || !openingFloat ? "not-allowed" : "pointer" }}
              >
                {drawerLoading ? "Opening…" : "Open Drawer"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#16a34a", display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "#15803d", fontSize: "14px" }}>Drawer Open</span>
              </div>
              {drawerSession.cashier_id && (
                <span style={{ fontSize: "13px", color: "#374151" }}>
                  Cashier: <strong>{employees.find(e => e.id === drawerSession.cashier_id)?.name ?? "Unknown"}</strong>
                </span>
              )}
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Opened: <strong>{new Date(drawerSession.opened_at as string).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>
              </span>
              <span style={{ fontSize: "13px", color: "#374151" }}>
                Float: <strong>{currencySymbol}{Number(drawerSession.opening_float).toFixed(2)}</strong>
              </span>
            </div>
            {!posDrawerCloseOpen ? (
              <button onClick={() => setPosDrawerCloseOpen(true)}
                style={{ padding: "6px 14px", fontSize: "13px", fontWeight: 600, background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
              >
                Close Drawer
              </button>
            ) : (
              <form onSubmit={onCloseDrawer} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="number" min="0" step="0.01" placeholder={`Counted cash (${currencySymbol})`}
                  value={closingCount} onChange={(e) => setClosingCount(e.target.value)}
                  style={{ padding: "6px 10px", width: "150px", fontSize: "13px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                />
                <button type="submit" disabled={drawerLoading || !closingCount}
                  style={{ padding: "6px 14px", fontWeight: 600, fontSize: "13px", background: drawerLoading || !closingCount ? "#9ca3af" : "#15803d", color: "#fff", border: "none", borderRadius: "6px", cursor: drawerLoading || !closingCount ? "not-allowed" : "pointer" }}
                >
                  {drawerLoading ? "Closing…" : "Confirm Close"}
                </button>
                <button type="button" onClick={() => { setPosDrawerCloseOpen(false); setClosingCount(""); }}
                  style={{ padding: "6px 12px", fontSize: "13px", background: "none", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", color: "#374151" }}
                >
                  Cancel
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div className="pos-card">
      <input
        type="text"
        autoFocus
        placeholder="Scan barcode or type and press Enter"
        value={barcodeInput}
        onChange={(e) => setBarcodeInput(e.target.value)}
        onKeyDown={onBarcodeSubmit}
        className="pos-barcode-input"
      />

      {unmatchedBarcode && (() => {
        const selectedProduct = linkBarcodeProductId ? products.find(p => p.product_id === linkBarcodeProductId) : null;
        return (
        <div style={{ padding: "12px 16px", marginBottom: "12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: linkBarcodeMode ? "12px" : "0" }}>
            <span style={{ fontSize: "14px", color: "#92400e" }}>Scanner worked. Barcode not found in catalog: <strong>{unmatchedBarcode}</strong></span>
            <button onClick={() => { setUnmatchedBarcode(""); setLinkBarcodeMode(false); setLinkBarcodeProductId(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#6b7280" }}>✕</button>
          </div>
          {!linkBarcodeMode ? (
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={() => { setBarcodeAutoFill(unmatchedBarcode); setNewBarcode(unmatchedBarcode); setUnmatchedBarcode(""); setActiveTab("inventory"); }}
                style={{ padding: "6px 16px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >Add New Product</button>
              <button
                onClick={() => setLinkBarcodeMode(true)}
                style={{ padding: "6px 16px", background: "#fff", color: "#1d4ed8", border: "1px solid #1d4ed8", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >Link to Existing Product</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <select value={linkBarcodeProductId} onChange={(e) => setLinkBarcodeProductId(e.target.value)} style={{ padding: "8px", flex: "1 1 200px", fontSize: "13px" }}>
                  <option value="">Select product...</option>
                  {products.map(p => (
                    <option key={p.product_id} value={p.product_id}>{p.product_name}{p.sku ? ` — ${p.sku}` : ""}{p.barcode ? ` — barcode: ${p.barcode}` : ""}</option>
                  ))}
                </select>
                <button onClick={onLinkBarcode} disabled={!linkBarcodeProductId} style={{ padding: "6px 16px", background: linkBarcodeProductId ? "#1d4ed8" : "#ccc", color: "#fff", border: "none", borderRadius: "6px", cursor: linkBarcodeProductId ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "13px" }}>Save</button>
                <button onClick={() => { setLinkBarcodeMode(false); setLinkBarcodeProductId(""); }} style={{ padding: "6px 16px", background: "#fff", border: "1px solid #ccc", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>Cancel</button>
              </div>
              {selectedProduct?.barcode && (
                <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", fontSize: "13px", color: "#b91c1c" }}>
                  This product already has barcode: <strong>{selectedProduct.barcode}</strong>. Linking will replace it with: <strong>{unmatchedBarcode}</strong>.
                </div>
              )}
            </div>
          )}
        </div>
        );
      })()}

      <form
        onSubmit={onAddToCart}
        style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "16px" }}
      >
        <select
          value={cartProductId}
          onChange={(e) => setCartProductId(e.target.value)}
          style={{ flex: "2 1 200px", padding: "8px" }}
        >
          <option value="">Select product...</option>
          {products.filter((p) => p.quantity_on_hand > 0 && p.status === "active").map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_name} — {currencySymbol}{p.selling_price.toFixed(2)} (stock: {p.quantity_on_hand})
            </option>
          ))}
        </select>
        <input
          type="number"
          min="1"
          placeholder="Qty"
          value={cartQty}
          onChange={(e) => setCartQty(e.target.value)}
          style={{ flex: "0 1 80px", padding: "8px" }}
        />
        <button type="submit" className="pos-add-btn" style={{ flex: "0 1 120px" }}>
          Add to Cart
        </button>
      </form>

      {employees.filter(e => e.status === "active").length > 0 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
          <select
            value={activeCashierId ?? ""}
            onChange={(e) => {
              const emp = employees.find(em => em.id === e.target.value);
              setActiveCashierId(emp ? emp.id : null);
              setActiveCashierName(emp ? emp.name : "");
            }}
            style={{ padding: "8px", flex: "1 1 200px", borderColor: !activeCashierId ? "#dc2626" : "#ccc" }}
          >
            <option value="">— Select cashier —</option>
            {employees.filter(e => e.status === "active").map(e => (
              <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
            ))}
          </select>
          {activeCashierName && (
            <span style={{ color: "#1d4ed8", fontWeight: "bold" }}>Cashier: {activeCashierName}</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Customer name or phone"
          value={posCustomerPhone}
          onChange={(e) => { setPosCustomerPhone(e.target.value); setPosCustomerId(null); setPosCustomerName(""); }}
          style={{ padding: "8px", width: "220px" }}
        />
        <button type="button" onClick={onLookupCustomer} style={{ padding: "8px 14px" }}>
          Lookup
        </button>
        {posCustomerName && (
          <span style={{ color: "#15803d", fontWeight: "bold" }}>
            {posCustomerName}
            {` — ${posCustomerLoyaltyBalance} pts`}
          </span>
        )}
      </div>
      </div>

      {cart.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ overflowX: "auto", marginBottom: "12px" }}>
            <table border={1} cellPadding={10} style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Line Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const product = products.find(p => p.product_id === item.product_id);
                  const isNegotiating = negotiatingProductId === item.product_id;
                  const wasNegotiated = item.unit_price !== item.original_unit_price;
                  const avgCost = product?.average_cost ?? 0;
                  const hasCost = avgCost > 0;
                  const overheadPct = product?.estimated_overhead_pct ?? 0;
                  const breakEven = avgCost * (1 + overheadPct / 100);
                  const minMarginPct = product?.minimum_margin_percent;
                  const targetMarginPct = product?.target_margin_percent;
                  const minSafe = minMarginPct != null ? breakEven * (1 + minMarginPct / 100) : breakEven;
                  const targetPrice = targetMarginPct != null ? breakEven * (1 + targetMarginPct / 100) : item.original_unit_price;
                  return (
                  <React.Fragment key={item.product_id}>
                  <tr>
                    <td>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {currencySymbol}{item.unit_price.toFixed(2)}
                      {wasNegotiated && (() => {
                        const diff = item.unit_price - item.original_unit_price;
                        const diffColor = diff < 0 ? "#dc2626" : diff > 0 ? "#15803d" : "#64748b";
                        const diffLabel = diff < 0 ? `-${currencySymbol}${Math.abs(diff).toFixed(2)}` : diff > 0 ? `+${currencySymbol}${diff.toFixed(2)}` : `${currencySymbol}0.00`;
                        return (
                        <div style={{ fontSize: "11px", color: "#64748b" }}>
                          <span style={{ textDecoration: "line-through" }}>{currencySymbol}{item.original_unit_price.toFixed(2)}</span>
                          {" "}
                          <span style={{ color: diffColor }}>{diffLabel}</span>
                        </div>
                        );
                      })()}
                    </td>
                    <td>{currencySymbol}{item.line_total.toFixed(2)}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {sellingPolicy !== "fixed_pricing" && (
                        <button
                          onClick={() => {
                            if (isNegotiating) { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }
                            else { setNegotiatingProductId(item.product_id); setNegotiatePrice(String(item.unit_price)); setNegotiateReason(item.negotiation_reason ?? ""); }
                          }}
                          title="Negotiate price"
                          style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: isNegotiating ? "#1d4ed8" : wasNegotiated ? "#dbeafe" : "none", color: isNegotiating ? "#fff" : "#1d4ed8", border: "1px solid #93c5fd", borderRadius: "6px", transition: "background 0.15s" }}
                          onMouseEnter={(e) => { if (!isNegotiating) e.currentTarget.style.background = "#eff6ff"; }}
                          onMouseLeave={(e) => { if (!isNegotiating) e.currentTarget.style.background = wasNegotiated ? "#dbeafe" : "none"; }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          {wasNegotiated ? "Edit Negotiation" : "Negotiate"}
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveFromCart(item.product_id)}
                        title="Remove from cart"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: 500, cursor: "pointer", background: "none", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: "6px", transition: "background 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        Remove
                      </button>
                      </div>
                    </td>
                  </tr>
                  {isNegotiating && (() => {
                    const np = Number(negotiatePrice) || 0;
                    const expectedProfit = hasCost ? np - breakEven : null;
                    const marginPct = hasCost && np > 0 ? ((np - breakEven) / np) * 100 : null;
                    const statusColor = !hasCost ? "#64748b" : np >= targetPrice ? "#15803d" : np >= minSafe ? "#b45309" : np >= breakEven ? "#ea580c" : "#dc2626";
                    const statusBg = !hasCost ? "#f8fafc" : np >= targetPrice ? "#f0fdf4" : np >= minSafe ? "#fffbeb" : np >= breakEven ? "#fff7ed" : "#fef2f2";
                    const statusBorder = !hasCost ? "#e2e8f0" : np >= targetPrice ? "#86efac" : np >= minSafe ? "#fde68a" : np >= breakEven ? "#fdba74" : "#fecaca";
                    const statusLabel = !hasCost ? "No cost data" : np >= targetPrice ? "Target Achieved" : np >= minSafe ? "Safe Margin" : np >= breakEven ? "Low Margin" : "Below Cost";
                    return (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, border: "none" }}>
                        <div style={{ padding: "16px 20px", background: "#fff", borderTop: "2px solid #e2e8f0", borderBottom: "2px solid #e2e8f0" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a" }}>Pricing Coach — {item.product_name}</div>
                            <button
                              onClick={() => { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }}
                              style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#64748b" }}
                            >Close</button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                            <div>
                              <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>Negotiated Unit Price</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={negotiatePrice}
                                onChange={(e) => setNegotiatePrice(e.target.value)}
                                autoFocus
                                style={{ width: "100%", padding: "12px 14px", fontSize: "20px", fontWeight: 700, border: `2px solid ${statusBorder}`, borderRadius: "8px", background: statusBg, color: statusColor, outline: "none", boxSizing: "border-box" }}
                              />
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", padding: "8px 12px", background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: "6px" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
                                <span style={{ fontSize: "13px", fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                                {hasCost && expectedProfit != null && marginPct != null && (
                                  <span style={{ fontSize: "12px", color: "#64748b", marginLeft: "auto" }}>
                                    Profit {currencySymbol}{expectedProfit.toFixed(2)} &middot; Margin {marginPct.toFixed(1)}%
                                  </span>
                                )}
                              </div>

                              <div style={{ marginTop: "12px" }}>
                                <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block", marginBottom: "4px" }}>Reason</label>
                                <select
                                  value={["Bulk discount", "Loyal customer", "Price match", "Damaged packaging", "Clearance"].includes(negotiateReason) ? negotiateReason : negotiateReason ? "__custom__" : ""}
                                  onChange={(e) => { if (e.target.value === "__custom__") { setNegotiateReason(""); } else { setNegotiateReason(e.target.value); } }}
                                  style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", marginBottom: "4px", background: "#fff" }}
                                >
                                  <option value="">Select a reason...</option>
                                  <option value="Bulk discount">Bulk discount</option>
                                  <option value="Loyal customer">Loyal customer</option>
                                  <option value="Price match">Price match</option>
                                  <option value="Damaged packaging">Damaged packaging</option>
                                  <option value="Clearance">Clearance</option>
                                  <option value="__custom__">Other (type below)</option>
                                </select>
                                {!["Bulk discount", "Loyal customer", "Price match", "Damaged packaging", "Clearance", ""].includes(negotiateReason) && (
                                  <input
                                    type="text"
                                    placeholder="Enter custom reason"
                                    value={negotiateReason}
                                    onChange={(e) => setNegotiateReason(e.target.value)}
                                    style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "6px", boxSizing: "border-box" }}
                                  />
                                )}
                              </div>
                            </div>

                            <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Price Reference</div>
                              {!hasCost && (
                                <div style={{ padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "6px", marginBottom: "8px", fontSize: "12px", color: "#92400e" }}>
                                  Cost price not configured. Pricing guidance is unavailable.
                                </div>
                              )}
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 16px", fontSize: "13px", color: "#475569" }}>
                                <div>Listed price</div><div style={{ textAlign: "right", fontWeight: 600, color: "#0f172a" }}>{currencySymbol}{item.original_unit_price.toFixed(2)}</div>
                                <div>Average cost</div><div style={{ textAlign: "right", fontWeight: 600 }}>{hasCost ? `${currencySymbol}${avgCost.toFixed(2)}` : "Not set"}</div>
                                <div>Overhead</div><div style={{ textAlign: "right", fontWeight: 600 }}>{overheadPct}%</div>
                                {hasCost && <>
                                  <div>Break-even</div><div style={{ textAlign: "right", fontWeight: 600 }}>{currencySymbol}{breakEven.toFixed(2)}</div>
                                  <div>Minimum safe</div><div style={{ textAlign: "right", fontWeight: 600 }}>{currencySymbol}{minSafe.toFixed(2)}</div>
                                  <div>Target price</div><div style={{ textAlign: "right", fontWeight: 600 }}>{currencySymbol}{targetPrice.toFixed(2)}</div>
                                </>}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => {
                                const price = Math.max(0, Number(negotiatePrice) || 0);
                                const reason = negotiateReason.trim() || null;
                                const isNeg = price !== item.original_unit_price;
                                setCart(cart.map(c => c.product_id === item.product_id ? {
                                  ...c,
                                  unit_price: price,
                                  line_total: c.quantity * price,
                                  negotiation_reason: isNeg ? reason : null,
                                  negotiated_by: isNeg ? (activeCashierId || null) : null,
                                } : c));
                                setNegotiatingProductId(null);
                                setNegotiatePrice("");
                                setNegotiateReason("");
                              }}
                              style={{ flex: 1, padding: "10px 16px", fontSize: "13px", fontWeight: 600, cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px" }}
                            >Apply Price</button>
                            <button
                              onClick={() => {
                                setCart(cart.map(c => c.product_id === item.product_id ? {
                                  ...c,
                                  unit_price: c.original_unit_price,
                                  line_total: c.quantity * c.original_unit_price,
                                  negotiation_reason: null,
                                  negotiated_by: null,
                                } : c));
                                setNegotiatingProductId(null);
                                setNegotiatePrice("");
                                setNegotiateReason("");
                              }}
                              style={{ padding: "10px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            >Reset to Listed</button>
                            <button
                              onClick={() => { setNegotiatingProductId(null); setNegotiatePrice(""); setNegotiateReason(""); }}
                              style={{ padding: "10px 16px", fontSize: "13px", cursor: "pointer", background: "none", border: "1px solid #cbd5e1", borderRadius: "6px" }}
                            >Cancel</button>
                          </div>
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
                {(() => {
                  const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
                  const discountVal = Math.max(0, Number(posDiscountValue) || 0);
                  const rawDiscountAmt = posDiscountType === "percent"
                    ? subtotal * (discountVal / 100)
                    : discountVal;
                  const discountAmt = rawDiscountAmt > subtotal ? 0 : rawDiscountAmt;
                  const tfDiscountedSubtotal = subtotal - discountAmt;
                  const tfTaxAmt = Math.round(tfDiscountedSubtotal * (businessTaxRate / 100) * 100) / 100;
                  const tfCustBal = posCustomerId
                    ? loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0)
                    : 0;
                  const tfRedeemPts = posCustomerId
                    ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), tfCustBal)
                    : 0;
                  const redeemDollar = tfRedeemPts / 100;
                  const finalTotal = Math.max(0, tfDiscountedSubtotal + tfTaxAmt - redeemDollar);
                  return (
                    <>
                      <tr>
                        <td colSpan={3} style={{ textAlign: "right" }}>Subtotal</td>
                        <td>{currencySymbol}{subtotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                      {discountAmt > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#16a34a" }}>Discount</td>
                          <td style={{ color: "#16a34a" }}>−{currencySymbol}{discountAmt.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      {tfTaxAmt > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#b45309" }}>Tax ({businessTaxRate}%)</td>
                          <td style={{ color: "#b45309" }}>{currencySymbol}{tfTaxAmt.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      {tfRedeemPts > 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "right", color: "#7c3aed" }}>Points ({tfRedeemPts} pts)</td>
                          <td style={{ color: "#7c3aed" }}>−{currencySymbol}{redeemDollar.toFixed(2)}</td>
                          <td></td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3} style={{ fontWeight: "bold", textAlign: "right" }}>Total</td>
                        <td style={{ fontWeight: "bold" }}>{currencySymbol}{finalTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </>
                  );
                })()}
              </tfoot>
            </table>
          </div>

          {/* Discount controls */}
          {(() => {
            const dSubtotal = cart.reduce((s, c) => s + c.line_total, 0);
            const dVal = Math.max(0, Number(posDiscountValue) || 0);
            const dAmt = posDiscountType === "percent" ? dSubtotal * (dVal / 100) : dVal;
            const discountExceeds = posDiscountValue !== "" && dAmt > dSubtotal;
            return (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px" }}>Discount:</span>
                <select
                  value={posDiscountType}
                  onChange={(e) => { setPosDiscountType(e.target.value as "percent" | "fixed"); setPosDiscountValue(""); }}
                  style={{ padding: "6px 8px", fontSize: "13px" }}
                >
                  <option value="percent">% Off</option>
                  <option value="fixed">$ Off</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step={posDiscountType === "percent" ? "1" : "0.01"}
                  max={posDiscountType === "percent" ? "100" : undefined}
                  placeholder={posDiscountType === "percent" ? "e.g. 10" : "e.g. 2.00"}
                  value={posDiscountValue}
                  onChange={(e) => setPosDiscountValue(e.target.value)}
                  style={{ width: "110px", padding: "6px 8px", fontSize: "13px", borderColor: discountExceeds ? "#dc2626" : undefined }}
                />
                {discountExceeds && (
                  <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: "bold" }}>Discount exceeds sale amount.</span>
                )}
                {posDiscountValue && (
                  <button onClick={() => setPosDiscountValue("")} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            );
          })()}

          {/* Redeem loyalty points */}
          {posCustomerId && (() => {
            const custBal = posCustomerLoyaltyBalance;
            const rawRedeem = Math.max(0, Math.floor(Number(posRedeemPoints) || 0));
            const redeemExceeds = posRedeemPoints !== "" && rawRedeem > custBal;
            const redeemVal = Math.min(rawRedeem, custBal);
            return (
              <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: "bold", fontSize: "13px", color: "#7c3aed" }}>Redeem Points:</span>
                <span style={{ fontSize: "12px", color: "#888" }}>{custBal} available · 100 pts = $1.00</span>
                <input
                  type="number"
                  min="0"
                  max={custBal}
                  step="1"
                  placeholder="e.g. 100"
                  value={posRedeemPoints}
                  onChange={(e) => setPosRedeemPoints(e.target.value)}
                  style={{ width: "100px", padding: "6px 8px", fontSize: "13px", borderColor: redeemExceeds ? "#dc2626" : undefined }}
                />
                {redeemExceeds && (
                  <span style={{ fontSize: "13px", color: "#dc2626", fontWeight: "bold" }}>Exceeds available points ({custBal})</span>
                )}
                {!redeemExceeds && redeemVal > 0 && (
                  <span style={{ fontSize: "13px", color: "#7c3aed" }}>= −{currencySymbol}{(redeemVal / 100).toFixed(2)}</span>
                )}
                {posRedeemPoints && (
                  <button onClick={() => setPosRedeemPoints("")} style={{ padding: "4px 10px", fontSize: "12px", cursor: "pointer" }}>
                    Clear
                  </button>
                )}
              </div>
            );
          })()}

          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontWeight: "bold" }}>Payment:</span>
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPaymentRef(""); }}
              style={{ padding: "8px", fontSize: "14px" }}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="telebirr">Telebirr</option>
              <option value="cbe_birr">CBE Birr</option>
              <option value="chapa">Chapa</option>
              <option value="mtn_mobile">MTN Mobile Money</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="other">Other (specify)</option>
            </select>
            {paymentMethod !== "cash" && paymentMethod !== "card" && (
              <input
                type="text"
                placeholder={paymentMethod === "other" ? "Specify payment method *" : "Reference / phone (optional)"}
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required={paymentMethod === "other"}
                style={{ width: "200px", padding: "8px" }}
              />
            )}
            {paymentMethod === "cash" && (() => {
              const subtotal = cart.reduce((s, c) => s + c.line_total, 0);
              const discountVal = Math.max(0, Number(posDiscountValue) || 0);
              const rawDiscountAmt = posDiscountType === "percent"
                ? subtotal * (discountVal / 100)
                : discountVal;
              const discountAmt = rawDiscountAmt > subtotal ? 0 : rawDiscountAmt;
              const cashDiscountedSubtotal = subtotal - discountAmt;
              const cashTaxAmt = Math.round(cashDiscountedSubtotal * (businessTaxRate / 100) * 100) / 100;
              const cashCustBal = posCustomerLoyaltyBalance;
              const cashRedeemPts = posCustomerId
                ? Math.min(Math.max(0, Math.floor(Number(posRedeemPoints) || 0)), cashCustBal)
                : 0;
              const finalTotal = Math.max(0, cashDiscountedSubtotal + cashTaxAmt - cashRedeemPts / 100);
              return (
                <>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount tendered"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    style={{ width: "150px", padding: "8px" }}
                  />
                  {Number(amountTendered) >= finalTotal && amountTendered !== "" && (
                    <span style={{ fontWeight: "bold", color: "#15803d" }}>
                      Change: {currencySymbol}{(Number(amountTendered) - finalTotal).toFixed(2)}
                    </span>
                  )}
                </>
              );
            })()}
            {(() => {
              const btnSubtotal = cart.reduce((s, c) => s + c.line_total, 0);
              const btnDVal = Math.max(0, Number(posDiscountValue) || 0);
              const btnDAmt = posDiscountType === "percent" ? btnSubtotal * (btnDVal / 100) : btnDVal;
              const discountInvalid = posDiscountValue !== "" && btnDAmt > btnSubtotal;
              const redeemInvalid = posCustomerId && posRedeemPoints !== "" &&
                Math.max(0, Math.floor(Number(posRedeemPoints) || 0)) >
                loyaltyTransactions.filter(lt => lt.customer_id === posCustomerId).reduce((s, lt) => s + lt.points, 0);
              const blocked = cart.length === 0 || isCompletingSale || !!redeemInvalid || discountInvalid;
              return (
                <button
                  onClick={onCompleteSale}
                  disabled={blocked}
                  style={{
                    padding: "10px 28px",
                    background: blocked ? "#94a3b8" : "#1d4ed8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    cursor: blocked ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    fontSize: "15px",
                  }}
                >
                  Complete Sale
                </button>
              );
            })()}
          </div>
        </div>
      )}

      </div>
  );
}
