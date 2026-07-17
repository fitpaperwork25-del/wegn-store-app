import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { registerDevice, revokeDevice } from "../lib/devices/deviceClient";

type DeviceRow = {
  id: string;
  device_label: string;
  status: string;
  registered_at: string;
  revoked_at: string | null;
  last_seen_at: string | null;
};

type DeviceManagementPanelProps = {
  visible: boolean;
  businessId: string;
  activateDeviceSession: (tokens: { accessToken: string; refreshToken: string }) => Promise<{ ok: boolean; error?: string }>;
};

/**
 * Owner-only device management for Registered Store Device / Staff Mode.
 * Register is meant to be run from the physical shared device itself - a
 * successful registration immediately activates the new device session on
 * THIS browser (see activateDeviceSession), handing it over to Staff Mode.
 * Revoke has no such effect on the caller's own session; it only ever
 * targets the device being revoked (see supabase/functions/revoke-device).
 */
export function DeviceManagementPanel({ visible, businessId, activateDeviceSession }: DeviceManagementPanelProps) {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [registering, setRegistering] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadDevices() {
    setLoading(true);
    const { data, error: loadErr } = await supabase
      .from("device_registrations")
      .select("id, device_label, status, registered_at, revoked_at, last_seen_at")
      .eq("business_id", businessId)
      .order("registered_at", { ascending: false });
    if (loadErr) {
      setError(loadErr.message);
    } else {
      setDevices((data ?? []) as DeviceRow[]);
      setError("");
    }
    setLoading(false);
  }

  useEffect(() => {
    // loadDevices sets loading state synchronously (before its first
    // await) so the table can show a loading state immediately - safe
    // here since this effect only re-runs on an explicit visible/business
    // change, not on every render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (visible && businessId) loadDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, businessId]);

  async function handleRegister() {
    const label = newLabel.trim();
    if (!label) return;
    setRegistering(true);
    setError("");
    setNotice("");
    const result = await registerDevice(label);
    if (!result.ok) {
      setError(result.error);
      setRegistering(false);
      return;
    }
    const activated = await activateDeviceSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    if (!activated.ok) {
      setError(activated.error ?? "Device was registered, but this browser could not switch to it.");
      setRegistering(false);
      await loadDevices();
      return;
    }
    setNewLabel("");
    setNotice(`"${result.deviceLabel}" is registered and now active on this browser - it will show the Employee ID + PIN screen going forward.`);
    setRegistering(false);
    // No loadDevices() here: activateDeviceSession just swapped this
    // browser's live session to the new device's, which can't read the
    // owner-only device_registrations list anymore.
  }

  async function handleRevoke(deviceId: string, label: string) {
    setRevokingId(deviceId);
    setError("");
    setNotice("");
    const result = await revokeDevice(deviceId);
    if (!result.ok) {
      setError(result.error);
      setRevokingId(null);
      return;
    }
    setNotice(`"${label}" has been revoked and can no longer be used.`);
    setRevokingId(null);
    await loadDevices();
  }

  return (
    <div style={{ display: visible ? "" : "none", marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #e2e8f0" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: "18px", color: "#0f172a" }}>Registered Devices</h3>
      <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "14px" }}>
        Shared devices (registers, tablets) that can show the Employee ID + PIN screen without an owner having to sign in first.
      </p>

      {error && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "13px" }}>{error}</div>
      )}
      {notice && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontSize: "13px" }}>{notice}</div>
      )}

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", maxWidth: "480px" }}>
        <input
          type="text"
          placeholder="Device label (e.g. Front Register)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
        />
        <button
          onClick={handleRegister}
          disabled={registering || !newLabel.trim()}
          style={{ padding: "8px 16px", background: newLabel.trim() ? "#1d4ed8" : "#ccc", color: "#fff", border: "none", borderRadius: "6px", fontWeight: 600, cursor: newLabel.trim() ? "pointer" : "not-allowed", whiteSpace: "nowrap" }}
        >
          {registering ? "Registering..." : "Register This Device"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
      ) : devices.length === 0 ? (
        <p style={{ color: "#64748b", fontSize: "13px" }}>No devices registered yet.</p>
      ) : (
        <table style={{ width: "100%", maxWidth: "640px", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
              <th style={{ padding: "6px 8px" }}>Label</th>
              <th style={{ padding: "6px 8px" }}>Status</th>
              <th style={{ padding: "6px 8px" }}>Registered</th>
              <th style={{ padding: "6px 8px" }}></th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "6px 8px" }}>{d.device_label}</td>
                <td style={{ padding: "6px 8px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                    background: d.status === "active" ? "#dcfce7" : "#fee2e2",
                    color: d.status === "active" ? "#15803d" : "#b91c1c",
                  }}>
                    {d.status}
                  </span>
                </td>
                <td style={{ padding: "6px 8px", color: "#64748b" }}>{new Date(d.registered_at).toLocaleDateString()}</td>
                <td style={{ padding: "6px 8px" }}>
                  {d.status === "active" && (
                    <button
                      onClick={() => handleRevoke(d.id, d.device_label)}
                      disabled={revokingId === d.id}
                      style={{ padding: "4px 12px", background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "5px", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}
                    >
                      {revokingId === d.id ? "Revoking..." : "Revoke"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
