import type { SupplierStatementRow } from "../lib/purchasing/types";

/**
 * Renders a single supplier's invoice/payment statement, expanded inline
 * within the Supplier list row that triggered it (see
 * SupplierManagementPanel.tsx). The data itself is Inventory-owned — see
 * the SupplierStatementRow doc comment in App.tsx for provenance — this
 * component only knows the already-aggregated, typed shape, not the
 * underlying receiving_sessions/supplier_payments tables.
 */
type SupplierStatementPanelProps = {
  supplierName: string;
  isLoadingStatement: boolean;
  supplierStatement: SupplierStatementRow[];
};

export function SupplierStatementPanel({ supplierName, isLoadingStatement, supplierStatement }: SupplierStatementPanelProps) {
  return (
    <tr>
      <td colSpan={8} style={{ padding: "0", borderTop: "2px solid #e2e8f0" }}>
        <div style={{ padding: "16px 20px", background: "#f8fafc" }}>
          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px", color: "#0f172a" }}>Supplier Statement — {supplierName}</div>
          {isLoadingStatement ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
          ) : supplierStatement.length === 0 ? (
            <p style={{ fontSize: "13px", color: "#64748b" }}>No invoiced receiving sessions found for this supplier.</p>
          ) : (() => {
            const totalInvoiced = supplierStatement.reduce((sum, r) => sum + r.invoice_total, 0);
            const totalPaid = supplierStatement.reduce((sum, r) => sum + r.paid, 0);
            const totalOutstanding = Math.round((totalInvoiced - totalPaid) * 100) / 100;
            return (
            <>
              <div style={{ display: "flex", gap: "16px", marginBottom: "14px", flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Invoiced</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>${totalInvoiced.toFixed(2)}</div>
                </div>
                <div style={{ padding: "10px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Paid</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#15803d" }}>${totalPaid.toFixed(2)}</div>
                </div>
                <div style={{ padding: "10px 16px", background: totalOutstanding > 0 ? "#fef2f2" : "#f0fdf4", border: `1px solid ${totalOutstanding > 0 ? "#fecaca" : "#86efac"}`, borderRadius: "8px", minWidth: "140px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Outstanding</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>${totalOutstanding.toFixed(2)}</div>
                </div>
              </div>
              <table border={1} cellPadding={8} style={{ width: "100%", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f1f5f9" }}>
                    <th style={{ textAlign: "left" }}>Invoice #</th>
                    <th style={{ textAlign: "left" }}>Invoice Date</th>
                    <th style={{ textAlign: "right" }}>Invoice Total</th>
                    <th style={{ textAlign: "right" }}>Paid</th>
                    <th style={{ textAlign: "right" }}>Remaining</th>
                    <th style={{ textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierStatement.map(row => {
                    const remaining = Math.round((row.invoice_total - row.paid) * 100) / 100;
                    const paidStatus = remaining <= 0 ? "paid" : row.paid > 0 ? "partial" : "outstanding";
                    const statusBg = paidStatus === "paid" ? "#dcfce7" : paidStatus === "partial" ? "#fef9c3" : "#fef2f2";
                    const statusColor = paidStatus === "paid" ? "#15803d" : paidStatus === "partial" ? "#a16207" : "#dc2626";
                    const statusLabel = paidStatus === "paid" ? "Paid" : paidStatus === "partial" ? "Partially Paid" : "Outstanding";
                    return (
                    <tr key={row.session_id}>
                      <td style={{ fontWeight: 600 }}>
                        {row.invoice_number}
                      </td>
                      <td style={{ color: "#64748b" }}>{row.invoice_date ?? "—"}</td>
                      <td style={{ textAlign: "right" }}>${row.invoice_total.toFixed(2)}</td>
                      <td style={{ textAlign: "right", color: "#15803d" }}>${row.paid.toFixed(2)}</td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: remaining > 0 ? "#dc2626" : "#15803d" }}>${remaining.toFixed(2)}</td>
                      <td style={{ textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", background: statusBg, color: statusColor }}>{statusLabel}</span>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: "#f1f5f9", fontWeight: 700 }}>
                    <td colSpan={2}>Total</td>
                    <td style={{ textAlign: "right" }}>${totalInvoiced.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: "#15803d" }}>${totalPaid.toFixed(2)}</td>
                    <td style={{ textAlign: "right", color: totalOutstanding > 0 ? "#dc2626" : "#15803d" }}>${totalOutstanding.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </>
            );
          })()}
        </div>
      </td>
    </tr>
  );
}
