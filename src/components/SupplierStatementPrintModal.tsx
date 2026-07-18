import type { SupplierStatementRow } from "../lib/purchasing/types";
import type { SessionPayment } from "../lib/inventory/types";
import { getSupplierInvoiceStatus, computePaymentRunningBalance } from "../lib/purchasing/purchasingHelpers";

export type PrintableSupplierStatement = {
  supplierId: string;
  supplierName: string;
  rows: SupplierStatementRow[];
  paymentsByInvoice: Record<string, SessionPayment[]>;
};

type SupplierStatementPrintModalProps = {
  statement: PrintableSupplierStatement | null;
  businessName: string;
  businessAddress: string;
  /** Business Configuration (v1.2) - display only, never converts amounts. */
  currencySymbol: string;
  onClose: () => void;
  onExportPdf: () => void;
  isExportingPdf: boolean;
};

/**
 * Print/PDF-ready rendering of a Supplier Statement — presentation only.
 * Structurally modeled on POPrintModal.tsx (same scoped @media print
 * technique, same logo/business header, same footer convention) so Print
 * and PDF export share one DOM: window.print() reads this element directly,
 * and the PDF export handler (App.tsx) screenshots the same
 * #supplier-statement-print-content element via html2canvas. Does not
 * compute or alter any invoice/payment amount - every figure here is
 * already-aggregated data passed in as props.
 */
export function SupplierStatementPrintModal({
  statement,
  businessName,
  businessAddress,
  currencySymbol,
  onClose,
  onExportPdf,
  isExportingPdf,
}: SupplierStatementPrintModalProps) {
  if (!statement) return null;

  const { supplierName, rows, paymentsByInvoice } = statement;
  const totalInvoiced = rows.reduce((sum, r) => sum + r.invoice_total, 0);
  const totalPaid = rows.reduce((sum, r) => sum + r.paid, 0);
  const totalOutstanding = Math.round((totalInvoiced - totalPaid) * 100) / 100;
  const statementDate = new Date().toLocaleDateString();

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0.5in; }
          .app-root > * { display: none !important; }
          #supplier-statement-print-modal {
            display: block !important;
            position: static !important;
            background: none !important;
            align-items: stretch !important;
            justify-content: flex-start !important;
            height: auto !important;
            inset: auto !important;
          }
          #supplier-statement-print-content {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            font-size: 12pt !important;
          }
          #supplier-statement-print-content table { page-break-inside: avoid; break-inside: avoid; }
          #supplier-statement-print-actions { display: none !important; }
        }
      `}</style>
      <div
        id="supplier-statement-print-modal"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          id="supplier-statement-print-content"
          style={{
            background: "#fff", padding: "36px 40px", width: "800px", maxHeight: "90vh", overflowY: "auto",
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
              </div>
            </div>
            <div style={{ textAlign: "right", minWidth: "220px" }}>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "0.03em" }}>SUPPLIER STATEMENT</div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#334155", marginTop: "2px" }}>{supplierName}</div>
              <div style={{ fontSize: "13px", color: "#64748b", marginTop: "2px" }}>Statement Date: {statementDate}</div>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: "flex", gap: "12px", margin: "16px 0" }}>
            <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "3px" }}>Total Invoiced</div>
              <div style={{ fontWeight: 700, fontSize: "18px" }}>{currencySymbol}{totalInvoiced.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "3px" }}>Total Paid</div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: "#15803d" }}>{currencySymbol}{totalPaid.toFixed(2)}</div>
            </div>
            <div style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: "5px", padding: "10px 14px" }}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.08em", marginBottom: "3px" }}>Outstanding Balance</div>
              <div style={{ fontWeight: 700, fontSize: "18px", color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>{currencySymbol}{totalOutstanding.toFixed(2)}</div>
            </div>
          </div>

          {/* Invoice table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", border: "1px solid #94a3b8", marginBottom: "18px" }}>
            <thead>
              <tr style={{ background: "#1e293b" }}>
                <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Invoice #</th>
                <th style={{ textAlign: "left", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Invoice Date</th>
                <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Original Amount</th>
                <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Amount Paid</th>
                <th style={{ textAlign: "right", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Remaining</th>
                <th style={{ textAlign: "center", padding: "9px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#fff" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const remaining = Math.round((row.invoice_total - row.paid) * 100) / 100;
                const status = getSupplierInvoiceStatus(row.invoice_total, row.paid);
                const statusLabel = status === "paid" ? "Paid" : status === "partial" ? "Partially Paid" : "Outstanding";
                return (
                  <tr key={row.session_id} style={{ borderBottom: "1px solid #e2e8f0", background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{row.invoice_number}</td>
                    <td style={{ padding: "9px 12px" }}>{row.invoice_date ?? "—"}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right" }}>{currencySymbol}{row.invoice_total.toFixed(2)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", color: "#15803d" }}>{currencySymbol}{row.paid.toFixed(2)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "right", fontWeight: 600, color: remaining > 0 ? "#dc2626" : "#15803d" }}>{currencySymbol}{remaining.toFixed(2)}</td>
                    <td style={{ padding: "9px 12px", textAlign: "center" }}>{statusLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Payment history, per invoice */}
          {rows.map((row) => {
            const payments = paymentsByInvoice[row.session_id] ?? [];
            if (payments.length === 0) return null;
            const runningBalance = computePaymentRunningBalance(row.invoice_total, payments);
            return (
              <div key={row.session_id} style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", color: "#0f172a" }}>Payment History — {row.invoice_number}</div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #cbd5e1" }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9" }}>
                      <th style={{ textAlign: "left", padding: "6px 10px" }}>Payment Date</th>
                      <th style={{ textAlign: "left", padding: "6px 10px" }}>Payment Method</th>
                      <th style={{ textAlign: "right", padding: "6px 10px" }}>Amount</th>
                      <th style={{ textAlign: "left", padding: "6px 10px" }}>Reference</th>
                      <th style={{ textAlign: "left", padding: "6px 10px" }}>Notes</th>
                      <th style={{ textAlign: "right", padding: "6px 10px" }}>Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td style={{ padding: "6px 10px" }}>{p.payment_date}</td>
                        <td style={{ padding: "6px 10px" }}>{p.payment_method}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right" }}>{currencySymbol}{Number(p.amount).toFixed(2)}</td>
                        <td style={{ padding: "6px 10px" }}>{p.reference ?? "—"}</td>
                        <td style={{ padding: "6px 10px" }}>{p.notes ?? "—"}</td>
                        <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600 }}>{currencySymbol}{runningBalance[i].balanceAfter.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Grand outstanding */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <div style={{ background: "#f1f5f9", border: "1px solid #94a3b8", borderRadius: "5px", padding: "10px 24px", minWidth: "260px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#475569" }}>Grand Outstanding Balance</span>
              <span style={{ fontSize: "20px", fontWeight: 800, color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>{currencySymbol}{totalOutstanding.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "18px", paddingTop: "8px", borderTop: "1px solid #e2e8f0", fontSize: "11px", color: "#94a3b8" }}>
            Generated by Wegn Store&emsp;|&emsp;Generated: {new Date().toLocaleString()}
          </div>

          <div id="supplier-statement-print-actions" style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "16px" }}>
            <button onClick={() => window.print()} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "5px" }}>
              Print
            </button>
            <button onClick={onExportPdf} disabled={isExportingPdf} style={{ padding: "8px 20px", cursor: "pointer", fontWeight: "bold", background: "#15803d", color: "#fff", border: "none", borderRadius: "5px", opacity: isExportingPdf ? 0.6 : 1 }}>
              {isExportingPdf ? "Exporting..." : "Export PDF"}
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
