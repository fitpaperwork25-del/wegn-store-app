import type { PurchaseOrder, POItem, Supplier, PoSignatures } from "../lib/purchasing/types";
import type { ProductStock } from "../lib/product/types";
import { buildProductNameMap } from "../lib/product/productHelpers";

type POPrintModalProps = {
  printPo: { po: PurchaseOrder; items: POItem[]; supplier: Supplier | null } | null;
  products: ProductStock[];
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  fmtPhone: (p: string) => string;
  getPoSignatures: (poId: string) => PoSignatures;
  onClose: () => void;
};

export function POPrintModal({
  printPo,
  products,
  businessName,
  businessAddress,
  businessPhone,
  businessEmail,
  fmtPhone,
  getPoSignatures,
  onClose,
}: POPrintModalProps) {
  if (!printPo) return null;

  const productMap = buildProductNameMap(products);
  const grandTotal = printPo.items.reduce((sum, i) => sum + Number(i.line_total), 0);
  const statusLabel = printPo.po.status === "ordered" ? "Awaiting Delivery" : printPo.po.status === "received" ? "Received" : printPo.po.status === "partially_received" ? "Partially Received" : "Draft";
  const statusBg = printPo.po.status === "ordered" ? "#dbeafe" : printPo.po.status === "received" ? "#dcfce7" : printPo.po.status === "partially_received" ? "#fef9c3" : "#f1f5f9";
  const statusColor = printPo.po.status === "ordered" ? "#1e40af" : printPo.po.status === "received" ? "#15803d" : printPo.po.status === "partially_received" ? "#a16207" : "#475569";
  const sigs = getPoSignatures(printPo.po.id);

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          .app-root > * { display: none !important; }
          #po-print-modal {
            display: block !important;
            position: static !important;
            background: none !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            height: auto !important;
            inset: auto !important;
          }
          #po-print-content {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            font-size: 12pt !important;
          }
          #po-print-content table { page-break-inside: avoid; break-inside: avoid; }
          #po-print-actions { display: none !important; }
        }
      `}</style>
      <div
        id="po-print-modal"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          id="po-print-content"
          style={{
            background: "#fff", padding: "36px 40px", width: "760px", maxHeight: "90vh", overflowY: "auto",
            fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: "14px", lineHeight: "1.4",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)", color: "#1e293b",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "3px solid #0f172a" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <img src="/logo.png" alt="" style={{ height: "72px", width: "auto", maxWidth: "72px", objectFit: "contain", marginTop: "2px" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              <div>
                {businessName && <div style={{ fontWeight: 800, fontSize: "24px", color: "#0f172a", letterSpacing: "-0.01em" }}>{businessName}</div>}
                {businessAddress && <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>{businessAddress}</div>}
                {businessPhone && <div style={{ fontSize: "13px", color: "#475569" }}>{fmtPhone(businessPhone)}</div>}
                {businessEmail && <div style={{ fontSize: "13px", color: "#475569" }}>{businessEmail}</div>}
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: "220px" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.03em" }}>PURCHASE ORDER</div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#334155", marginTop: "2px", fontFamily: "monospace" }}>{printPo.po.po_number}</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>{new Date(printPo.po.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Supplier + Details row */}
          <div style={{ display: "flex", gap: "12px", margin: "14px 0 10px" }}>
            <div style={{ flex: 2, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "3px" }}>Supplier</div>
              <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "2px" }}>{printPo.supplier?.name ?? "Unknown"}</div>
              <div style={{ fontSize: "12px", color: printPo.supplier?.contact_name ? "#475569" : "#94a3b8" }}>
                Contact: {printPo.supplier?.contact_name || "_______________"}&emsp;
                Phone: {printPo.supplier?.phone ? fmtPhone(printPo.supplier.phone) : "_______________"}
              </div>
              <div style={{ fontSize: "12px", color: printPo.supplier?.email ? "#475569" : "#94a3b8", marginTop: "1px" }}>
                Email: {printPo.supplier?.email || "_______________"}
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Status</div>
                <span style={{ fontSize: "13px", fontWeight: 700, padding: "2px 10px", borderRadius: "10px", background: statusBg, color: statusColor }}>{statusLabel}</span>
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Expected Delivery</div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>_______________</div>
              </div>
              <div style={{ border: "1px solid #cbd5e1", borderRadius: "5px", padding: "8px 12px", flex: 1 }}>
                <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "2px" }}>Prepared By</div>
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>_______________</div>
              </div>
            </div>
          </div>

          {printPo.po.notes && (
            <div style={{ fontSize: "13px", color: "#475569", marginBottom: "10px", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px", borderLeft: "3px solid #94a3b8" }}>
              <strong style={{ color: "#334155" }}>Notes:</strong> {printPo.po.notes}
            </div>
          )}

          {/* Items table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid #94a3b8" }}>
            <thead>
              <tr style={{ background: "#1e293b" }}>
                <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Product</th>
                <th style={{ textAlign: "center", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "70px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "100px" }}>Unit Cost</th>
                <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff", width: "100px" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {printPo.items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                  <td style={{ padding: "10px 12px" }}>{productMap[item.product_id] ?? "Unknown"}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>${Number(item.unit_cost).toFixed(2)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>${Number(item.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Grand total box */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0" }}>
            <div style={{ background: "#f1f5f9", border: "1px solid #94a3b8", borderTop: "none", borderRadius: "0 0 5px 5px", padding: "10px 24px", minWidth: "240px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Grand Total</span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Signature blocks */}
          <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
            <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: "6px" }}>Manager Approval</div>
              {sigs.manager ? (
                <>
                  <img src={sigs.manager.dataUrl} alt="Manager signature" style={{ height: "44px", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{new Date(sigs.manager.signedAt).toLocaleString()}</div>
                </>
              ) : (
                <div style={{ borderBottom: "1px solid #334155", height: "36px", marginBottom: "4px" }} />
              )}
              <div style={{ fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>Name: _______________&emsp;Date: ________</div>
            </div>
            <div style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.06em", marginBottom: "6px" }}>Supplier Acceptance</div>
              {sigs.supplier ? (
                <>
                  <img src={sigs.supplier.dataUrl} alt="Supplier signature" style={{ height: "44px", width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }} />
                  <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>{new Date(sigs.supplier.signedAt).toLocaleString()}</div>
                </>
              ) : (
                <div style={{ borderBottom: "1px solid #334155", height: "36px", marginBottom: "4px" }} />
              )}
              <div style={{ fontSize: "11px", color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: "4px", marginTop: "4px" }}>Name: _______________&emsp;Date: ________</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "18px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#94a3b8" }}>
            Generated by Wegn-Store&emsp;|&emsp;Generated: {new Date().toLocaleString()}
          </div>

          <div id="po-print-actions" style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
            <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}>
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
