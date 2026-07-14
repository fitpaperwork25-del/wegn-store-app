import React from "react";
import type { Employee } from "../lib/staff/types";

type StaffPanelProps = {
  visible: boolean;

  canManageStaff: boolean;
  onAddEmployee: (e: React.FormEvent) => Promise<void>;
  newEmpName: string;
  setNewEmpName: React.Dispatch<React.SetStateAction<string>>;
  newEmpPin: string;
  setNewEmpPin: React.Dispatch<React.SetStateAction<string>>;
  newEmpRole: "cashier" | "manager" | "inventory_clerk";
  setNewEmpRole: React.Dispatch<React.SetStateAction<"cashier" | "manager" | "inventory_clerk">>;

  employeeListOpen: boolean | null;
  setEmployeeListOpen: React.Dispatch<React.SetStateAction<boolean | null>>;
  employees: Employee[];
  editingEmpId: string | null;
  setEditingEmpId: React.Dispatch<React.SetStateAction<string | null>>;
  editEmpRole: string;
  setEditEmpRole: React.Dispatch<React.SetStateAction<string>>;
  onSaveEmployeeRole: (emp: Employee) => Promise<void>;
  onToggleEmployeeStatus: (emp: Employee) => Promise<void>;
};

export function StaffPanel({
  visible,
  canManageStaff,
  onAddEmployee,
  newEmpName,
  setNewEmpName,
  newEmpPin,
  setNewEmpPin,
  newEmpRole,
  setNewEmpRole,
  employeeListOpen,
  setEmployeeListOpen,
  employees,
  editingEmpId,
  setEditingEmpId,
  editEmpRole,
  setEditEmpRole,
  onSaveEmployeeRole,
  onToggleEmployeeStatus,
}: StaffPanelProps) {
  return (
      <div style={{ display: visible ? '' : 'none' }}>

      <div className="page-header">
        <h2 className="page-title">Staff</h2>
        <p className="page-subtitle">Manage employees, roles, and cash drawer operations</p>
      </div>

      {canManageStaff && (
        <form onSubmit={onAddEmployee} style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Employee name *"
            value={newEmpName}
            onChange={(e) => setNewEmpName(e.target.value)}
            style={{ padding: "8px", flex: "1 1 150px" }}
            required
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="PIN (4–6 digits) *"
            value={newEmpPin}
            onChange={(e) => setNewEmpPin(e.target.value.replace(/\D/g, ""))}
            maxLength={6}
            style={{ padding: "8px", width: "140px" }}
            required
          />
          <select
            value={newEmpRole}
            onChange={(e) => setNewEmpRole(e.target.value as "cashier" | "manager" | "inventory_clerk")}
            style={{ padding: "8px" }}
          >
            <option value="cashier">Cashier</option>
            <option value="manager">Manager</option>
            <option value="inventory_clerk">Inventory Clerk</option>
          </select>
          <button
            type="submit"
            disabled={!newEmpName.trim() || !newEmpPin.trim()}
            style={{ padding: "8px 20px", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            Add Employee
          </button>
        </form>
      )}

      <button
        onClick={() => setEmployeeListOpen(!(employeeListOpen ?? (employees.length < 10)))}
        style={{ marginBottom: "12px", background: "none", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%" }}
      >
        <span style={{ fontSize: "16px" }}>{(employeeListOpen ?? (employees.length < 10)) ? "▼" : "▶"}</span>
        <h3 style={{ margin: 0 }}>Employees</h3>
        <span style={{ fontSize: "13px", color: "#64748b" }}>({employees.length} employees)</span>
      </button>
      <div style={{ display: (employeeListOpen ?? (employees.length < 10)) ? '' : 'none', overflowX: "auto", marginBottom: "40px" }}>
        <table border={1} cellPadding={10} style={{ width: "100%" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>PIN</th>
              <th>Role</th>
              <th>Status</th>
              {canManageStaff && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr><td colSpan={canManageStaff ? 5 : 4} style={{ color: "#888" }}>No employees yet</td></tr>
            ) : (
              employees.map(emp => {
                const rowStyle = emp.status === "inactive" ? { backgroundColor: "#f5f5f5", color: "#999" } : {};
                const isEditing = editingEmpId === emp.id;
                const roleBg = emp.role === "manager" ? "#fef3c7" : emp.role === "inventory_clerk" ? "#f0fdfa" : "#dbeafe";
                const roleColor = emp.role === "manager" ? "#92400e" : emp.role === "inventory_clerk" ? "#0d9488" : "#1e40af";
                return (
                  <tr key={emp.id} style={rowStyle}>
                    <td style={{ fontWeight: "bold" }}>{emp.name}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "13px", color: "#64748b" }}>{emp.pin ? "****" : "—"}</td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <select value={editEmpRole} onChange={(e) => setEditEmpRole(e.target.value)} style={{ padding: "4px 8px", fontSize: "13px" }}>
                            <option value="cashier">Cashier</option>
                            <option value="manager">Manager</option>
                            <option value="inventory_clerk">Inventory Clerk</option>
                          </select>
                          <button onClick={() => onSaveEmployeeRole(emp)} style={{ padding: "2px 10px", cursor: "pointer", background: "#1d4ed8", color: "#fff", border: "none", borderRadius: "4px", fontSize: "12px", fontWeight: "bold" }}>Save</button>
                          <button onClick={() => setEditingEmpId(null)} style={{ padding: "2px 10px", cursor: "pointer", border: "1px solid #ccc", borderRadius: "4px", fontSize: "12px", background: "#fff" }}>Cancel</button>
                        </div>
                      ) : (
                        <span style={{ padding: "2px 8px", borderRadius: "12px", fontSize: "12px", background: roleBg, color: roleColor }}>{emp.role.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: "2px 8px", borderRadius: "12px", fontSize: "12px",
                        background: emp.status === "active" ? "#dcfce7" : "#f3f4f6",
                        color: emp.status === "active" ? "#15803d" : "#6b7280",
                      }}>{emp.status}</span>
                    </td>
                    {canManageStaff && (
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {!isEditing && (
                            <button
                              onClick={() => { setEditingEmpId(emp.id); setEditEmpRole(emp.role); }}
                              style={{ padding: "3px 12px", cursor: "pointer", borderRadius: "4px", background: "#eff6ff", color: "#1d4ed8", border: "none", fontWeight: "bold" }}
                            >
                              Edit Role
                            </button>
                          )}
                          <button
                            onClick={() => onToggleEmployeeStatus(emp)}
                            style={{
                              padding: "3px 12px", cursor: "pointer", borderRadius: "4px",
                              background: emp.status === "active" ? "#fee2e2" : "#dcfce7",
                              color: emp.status === "active" ? "#b91c1c" : "#15803d",
                              border: "none", fontWeight: "bold",
                            }}
                          >
                            {emp.status === "active" ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      </div>
  );
}
