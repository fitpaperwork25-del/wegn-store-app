/**
 * Writes one row to device_audit_log per device lifecycle event - device
 * registered, device revoked, Staff Mode entered/exited, owner override.
 * See supabase/migrations/20260716_registered_device_staff_mode.sql for the
 * schema. Never throws, matching the established pattern in
 * ./auditLog.ts: an audit-write failure must not be able to take down the
 * registration/revocation it's trying to record, but is still surfaced in
 * the function's own console output so a persistent failure stays visible
 * in Supabase's function logs.
 */

export type DeviceAuditLogClient = {
  from(table: string): {
    insert(row: Record<string, unknown>): Promise<{ error: unknown }>;
  };
};

export type DeviceAuditEventType =
  | "device_registered"
  | "device_revoked"
  | "staff_mode_entered"
  | "staff_mode_exited"
  | "owner_override";

export type DeviceAuditLogEntry = {
  businessId: string;
  deviceId: string | null;
  employeeId?: string | null;
  eventType: DeviceAuditEventType;
  actorAuthId: string;
  metadata?: Record<string, unknown>;
};

export async function writeDeviceAuditLog(client: DeviceAuditLogClient, entry: DeviceAuditLogEntry): Promise<void> {
  try {
    const { error } = await client.from("device_audit_log").insert({
      business_id: entry.businessId,
      device_id: entry.deviceId,
      employee_id: entry.employeeId ?? null,
      event_type: entry.eventType,
      actor_auth_id: entry.actorAuthId,
      metadata: entry.metadata ?? null,
    });
    if (error) {
      console.error("[device_audit_log] audit log write failed:", error);
    }
  } catch (err) {
    console.error("[device_audit_log] audit log write threw:", err);
  }
}
