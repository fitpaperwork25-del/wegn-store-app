import type { AnalyticsData } from "../App";

type SalesAnalyticsReportProps = {
  analyticsData: AnalyticsData;
  analyticsRange: 'today' | '7d' | '30d' | 'all';
  setAnalyticsRange: (v: 'today' | '7d' | '30d' | 'all') => void;
};

export function SalesAnalyticsReport({ analyticsData, analyticsRange, setAnalyticsRange }: SalesAnalyticsReportProps) {
  const { revenue, txCount, avgTx, itemsSold, discounts, taxCollected,
          cashTotal, cardTotal, otherTotal, dailyRows, productRows, rangeLabel } = analyticsData;

  return (
    <>
      {/* Sales Analytics Dashboard */}
      <h2 style={{ marginTop: "40px" }}>Sales Analytics</h2>

      {/* Period selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {(['today', '7d', '30d', 'all'] as const).map(r => {
          const label = r === 'today' ? 'Today' : r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time';
          const active = analyticsRange === r;
          return (
            <button
              key={r}
              onClick={() => setAnalyticsRange(r)}
              style={{
                padding: "7px 18px", cursor: "pointer", borderRadius: "6px", fontWeight: active ? "bold" : "normal",
                background: active ? "#1d4ed8" : "#fff", color: active ? "#fff" : "#333",
                border: active ? "1px solid #1d4ed8" : "1px solid #ccc",
              }}
            >{label}</button>
          );
        })}
        <span style={{ alignSelf: "center", fontSize: "13px", color: "#888", marginLeft: "8px" }}>
          {txCount} completed sale{txCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* KPI cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "28px" }}>
        {[
          { label: "Revenue", value: `$${revenue.toFixed(2)}`, color: "#1d4ed8" },
          { label: "Transactions", value: String(txCount) },
          { label: "Avg Transaction", value: `$${avgTx.toFixed(2)}` },
          { label: "Items Sold", value: String(itemsSold) },
          { label: "Discounts Given", value: `$${discounts.toFixed(2)}`, color: discounts > 0 ? "#b45309" : undefined },
          { label: "Tax Collected", value: `$${taxCollected.toFixed(2)}`, color: taxCollected > 0 ? "#b45309" : undefined },
        ].map(card => (
          <div key={card.label} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "14px 20px", minWidth: "140px", flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#888" }}>{card.label}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: card.color ?? "inherit" }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Payment split */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "32px" }}>
        {[
          { label: "Cash", value: cashTotal, color: "#15803d" },
          { label: "Card", value: cardTotal, color: "#1d4ed8" },
          ...(otherTotal > 0 ? [{ label: "Other", value: otherTotal, color: "#6b7280" }] : []),
        ].map(p => (
          <div key={p.label} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 18px", minWidth: "120px" }}>
            <div style={{ fontSize: "12px", color: "#888" }}>{p.label}</div>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: p.color }}>${p.value.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>
              {revenue > 0 ? `${((p.value / revenue) * 100).toFixed(0)}%` : '—'}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Daily revenue breakdown */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <h3 style={{ marginBottom: "8px" }}>Daily Revenue — {rangeLabel}</h3>
          {dailyRows.length === 0 ? (
            <p style={{ color: "#888", fontSize: "14px" }}>No completed sales in this period.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table border={1} cellPadding={10} style={{ width: "100%", fontSize: "14px" }}>
                <thead>
                  <tr><th>Date</th><th>Revenue</th><th>Transactions</th></tr>
                </thead>
                <tbody>
                  {dailyRows.map(([date, row]) => (
                    <tr key={date}>
                      <td>{new Date(date + 'T12:00:00').toLocaleDateString()}</td>
                      <td>${row.revenue.toFixed(2)}</td>
                      <td>{row.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                    <td>Total</td>
                    <td>${revenue.toFixed(2)}</td>
                    <td>{txCount}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Best-selling products */}
        <div style={{ flex: 1, minWidth: "280px" }}>
          <h3 style={{ marginBottom: "8px" }}>Best-Selling Products — {rangeLabel}</h3>
          {productRows.length === 0 ? (
            <p style={{ color: "#888", fontSize: "14px" }}>No product data for this period.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table border={1} cellPadding={10} style={{ width: "100%", fontSize: "14px" }}>
                <thead>
                  <tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>
                </thead>
                <tbody>
                  {productRows.map((row, i) => (
                    <tr key={row.product_id}>
                      <td>{i + 1}</td>
                      <td>{row.name}</td>
                      <td>{row.units}</td>
                      <td>${row.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: "bold", background: "#f9fafb" }}>
                    <td colSpan={2}>Total</td>
                    <td>{productRows.reduce((s, r) => s + r.units, 0)}</td>
                    <td>${productRows.reduce((s, r) => s + r.revenue, 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
