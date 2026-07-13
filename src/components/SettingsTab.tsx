type SettingsTabProps = {
  visible: boolean;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessTaxRate: number;
  sellingPolicy: "fixed_pricing" | "negotiated_pricing" | "negotiated_with_approval";
  editingBusiness: boolean;
  setEditingBusiness: (v: boolean) => void;
  editBizName: string;
  setEditBizName: (v: string) => void;
  editBizPhone: string;
  setEditBizPhone: (v: string) => void;
  editBizEmail: string;
  setEditBizEmail: (v: string) => void;
  editBizAddress: string;
  setEditBizAddress: (v: string) => void;
  editBizTaxRate: string;
  setEditBizTaxRate: (v: string) => void;
  editBizSellingPolicy: string;
  setEditBizSellingPolicy: (v: string) => void;
  userRole: string;
  onSave: (e: React.FormEvent) => void;
};

export function SettingsTab({
  visible,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  businessTaxRate,
  sellingPolicy,
  editingBusiness,
  setEditingBusiness,
  editBizName,
  setEditBizName,
  editBizPhone,
  setEditBizPhone,
  editBizEmail,
  setEditBizEmail,
  editBizAddress,
  setEditBizAddress,
  editBizTaxRate,
  setEditBizTaxRate,
  editBizSellingPolicy,
  setEditBizSellingPolicy,
  userRole,
  onSave,
}: SettingsTabProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure business profile, tax, receipt, and store preferences</p>
      </div>

      {!editingBusiness ? (
        <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", maxWidth: "480px", marginBottom: "16px" }}>
          <p style={{ margin: "0 0 8px" }}><strong>Name:</strong> {businessName || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Phone:</strong> {businessPhone || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Email:</strong> {businessEmail || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Address:</strong> {businessAddress || "—"}</p>
          <p style={{ margin: "0 0 8px" }}><strong>Tax Rate:</strong> {businessTaxRate}%</p>
          <p style={{ margin: "0 0 16px" }}><strong>Selling Policy:</strong> {sellingPolicy === "fixed_pricing" ? "Fixed Prices" : sellingPolicy === "negotiated_pricing" ? "Negotiated Prices" : "Negotiated Prices with Approval"}</p>
          <button
            onClick={() => {
              setEditBizName(businessName);
              setEditBizPhone(businessPhone);
              setEditBizEmail(businessEmail);
              setEditBizAddress(businessAddress);
              setEditBizTaxRate(String(businessTaxRate));
              setEditBizSellingPolicy(sellingPolicy);
              setEditingBusiness(true);
            }}
            style={{ padding: "8px 20px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600 }}
          >Edit Business Profile</button>
        </div>
      ) : (
        <form
          onSubmit={onSave}
          style={{ maxWidth: "480px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}
        >
          <strong>Edit Business Profile</strong>
          <input
            type="text"
            placeholder="Business name *"
            value={editBizName}
            onChange={(e) => setEditBizName(e.target.value)}
            required
            style={{ padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Phone"
            value={editBizPhone}
            onChange={(e) => setEditBizPhone(e.target.value)}
            style={{ padding: "8px" }}
          />
          <input
            type="email"
            placeholder="Email"
            value={editBizEmail}
            onChange={(e) => setEditBizEmail(e.target.value)}
            style={{ padding: "8px" }}
          />
          <input
            type="text"
            placeholder="Address"
            value={editBizAddress}
            onChange={(e) => setEditBizAddress(e.target.value)}
            style={{ padding: "8px" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Tax rate %"
              value={editBizTaxRate}
              onChange={(e) => setEditBizTaxRate(e.target.value)}
              style={{ padding: "8px", width: "150px" }}
            />
            <span style={{ fontSize: "13px", color: "#64748b" }}>% Sales tax (0 = no tax)</span>
          </div>
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px", background: "#fff" }}>
            <strong style={{ fontSize: "14px", display: "block", marginBottom: "10px" }}>Selling Policy</strong>
            {userRole !== "owner" && (
              <p style={{ margin: "0 0 8px", fontSize: "12px", color: "#94a3b8", fontStyle: "italic" }}>Only the business owner can change this setting</p>
            )}
            {([
              { value: "fixed_pricing", label: "Fixed Prices", desc: "No negotiated prices — sales use listed price only" },
              { value: "negotiated_pricing", label: "Negotiated Prices", desc: "Staff may negotiate prices within policy" },
              { value: "negotiated_with_approval", label: "Negotiated Prices with Approval", desc: "Negotiation allowed — approval workflow coming soon" },
            ] as { value: string; label: string; desc: string }[]).map(opt => (
              <label key={opt.value} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "8px 0", cursor: userRole === "owner" ? "pointer" : "default", opacity: userRole !== "owner" ? 0.6 : 1 }}>
                <input type="radio" name="selling_policy" value={opt.value} checked={editBizSellingPolicy === opt.value} onChange={() => setEditBizSellingPolicy(opt.value)} disabled={userRole !== "owner"} style={{ marginTop: "3px" }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px" }}>{opt.label}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" style={{ padding: "8px 20px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px" }}>Save</button>
            <button type="button" onClick={() => setEditingBusiness(false)} style={{ padding: "8px 20px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      )}

      <h3 style={{ marginTop: "32px", marginBottom: "12px" }}>Receipt Settings</h3>
      <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "20px", maxWidth: "480px", marginBottom: "16px" }}>
        <p style={{ margin: "0 0 8px" }}><strong>Business Name:</strong> {businessName || "—"}</p>
        <p style={{ margin: "0 0 8px" }}><strong>Phone:</strong> {businessPhone || "—"}</p>
        <p style={{ margin: "0 0 8px" }}><strong>Address:</strong> {businessAddress || "—"}</p>
        <p style={{ margin: "0 0 16px" }}><strong>Tax Rate:</strong> {businessTaxRate}%</p>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b", fontStyle: "italic" }}>Receipt logo and printer setup coming in v2</p>
      </div>

      </div>
  );
}
