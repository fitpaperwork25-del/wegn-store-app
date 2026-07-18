import type { Receipt } from "../lib/sales/types";
import type { ProductStock } from "../lib/product/types";
import { buildProductNameMap } from "../lib/product/productHelpers";

type ReceiptPrintModalProps = {
  receipt: Receipt | null;
  products: ProductStock[];
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  onClose: () => void;
};

export function ReceiptPrintModal({ receipt, products, businessName, businessPhone, businessAddress, currencySymbol, onClose }: ReceiptPrintModalProps) {
  if (!receipt) return null;

  const productMap = buildProductNameMap(products);

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { margin: 0; padding: 0; }
          .app-root > * { display: none !important; }
          #receipt-modal {
            display: block !important;
            position: static !important;
            background: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #receipt-print {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 3mm 2.5mm 4mm 2.5mm !important;
            width: 100% !important;
            max-width: 80mm !important;
            box-sizing: border-box !important;
            font-size: 12pt !important;
            color: #000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #receipt-print * { color: #000 !important; }
          #receipt-actions { display: none !important; }
        }
      `}</style>
      <div
        id="receipt-modal"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          id="receipt-print"
          style={{
            background: "#fff", padding: "32px 28px", width: "320px",
            fontFamily: "monospace", fontSize: "13px", lineHeight: "1.6",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <img src="/logo.png" alt="Wegn-Store" style={{ height: "56px", width: "auto", maxWidth: "160px", objectFit: "contain" }} />
          </div>
          {businessName && (
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "4px" }}>{businessName}</div>
          )}
          {(businessPhone || businessAddress) && (
            <div style={{ textAlign: "center", fontSize: "12px", color: "#555", marginBottom: "4px" }}>
              {businessPhone && <div>{businessPhone}</div>}
              {businessAddress && <div>{businessAddress}</div>}
            </div>
          )}
          <div style={{ textAlign: "center", borderBottom: "1px dashed #333", paddingBottom: "8px", marginBottom: "8px" }}>
            {receipt.sale.status === "voided" && (
              <div style={{ color: "#b91c1c", fontWeight: "bold" }}>** VOIDED **</div>
            )}
            <div>Sale: {receipt.sale.id.slice(0, 8)}</div>
            <div>{new Date(receipt.sale.created_at).toLocaleString()}</div>
          </div>

          {receipt.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ flex: 1 }}>{productMap[item.product_id] ?? item.product_id.slice(0, 8)} x{item.quantity}</span>
              <span>{currencySymbol}{Number(item.line_total).toFixed(2)}</span>
            </div>
          ))}

          <div style={{ borderTop: "1px dashed #333", marginTop: "8px", paddingTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Subtotal</span><span>{currencySymbol}{Number(receipt.sale.subtotal).toFixed(2)}</span>
            </div>
            {Number(receipt.sale.discount_amount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                <span>Discount</span><span>−{currencySymbol}{Number(receipt.sale.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Tax</span><span>{currencySymbol}{Number(receipt.sale.tax).toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "15px", marginTop: "4px" }}>
              <span>TOTAL</span><span>{currencySymbol}{Number(receipt.sale.total).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: "4px" }}>Payment: {receipt.paymentMethod === "other" && receipt.paymentReference ? receipt.paymentReference : receipt.paymentMethod}{receipt.paymentMethod !== "other" && receipt.paymentReference ? ` (Ref: ${receipt.paymentReference})` : ""}</div>
          </div>

          {(receipt.pointsEarned !== undefined || receipt.pointsRedeemed !== undefined) && (
            <div style={{ borderTop: "1px dashed #333", marginTop: "8px", paddingTop: "8px", fontSize: "12px" }}>
              {receipt.pointsRedeemed !== undefined && receipt.pointsRedeemed > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#7c3aed" }}>
                  <span>Points Redeemed</span><span>−{receipt.pointsRedeemed} pts</span>
                </div>
              )}
              {receipt.pointsEarned !== undefined && receipt.pointsEarned > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#15803d" }}>
                  <span>Points Earned</span><span>+{receipt.pointsEarned} pts</span>
                </div>
              )}
            </div>
          )}
          <div style={{ textAlign: "center", borderTop: "1px dashed #333", marginTop: "6px", paddingTop: "6px", paddingBottom: "2mm" }}>
            Thank you!
          </div>
          <div id="receipt-actions" style={{ display: "flex", gap: "8px", marginTop: "16px", justifyContent: "center" }}>
            <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold" }}>
              Print
            </button>
            <button onClick={onClose} style={{ padding: "8px 20px", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
