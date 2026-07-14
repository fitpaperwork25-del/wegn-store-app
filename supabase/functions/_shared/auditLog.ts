import type { CopilotRole } from "./resolveRole.ts";

/**
 * Writes one row to ai_tool_invocations per tool call - success, denial, or
 * error. See supabase/migrations/20260714_ai_tool_invocations.sql for the
 * schema. Never throws: a failure to write the audit log must not be able
 * to take down the tool call it's trying to record, but it is logged to
 * the function's own console output so a persistent audit-write failure is
 * still visible in Supabase's function logs.
 */

export type AuditLogClient = {
  from(table: string): {
    insert(row: Record<string, unknown>): Promise<{ error: unknown }>;
  };
};

export type AuditLogEntry = {
  businessId: string;
  authUserId: string;
  resolvedRole: CopilotRole;
  employeeId: string | null;
  conversationId: string;
  toolName: string;
  inputJson: unknown;
  fieldsRestricted?: string[];
  status: "success" | "denied" | "error";
  errorMessage?: string;
};

export async function writeAuditLog(client: AuditLogClient, entry: AuditLogEntry): Promise<void> {
  try {
    const { error } = await client.from("ai_tool_invocations").insert({
      business_id: entry.businessId,
      auth_user_id: entry.authUserId,
      resolved_role: entry.resolvedRole,
      employee_id: entry.employeeId,
      conversation_id: entry.conversationId,
      tool_name: entry.toolName,
      input_json: entry.inputJson,
      fields_restricted: entry.fieldsRestricted ?? [],
      status: entry.status,
      error_message: entry.errorMessage ?? null,
    });
    if (error) {
      console.error("[ai_tool_invocations] audit log write failed:", error);
    }
  } catch (err) {
    console.error("[ai_tool_invocations] audit log write threw:", err);
  }
}
