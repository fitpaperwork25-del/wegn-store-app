/**
 * Server-side role resolution for the AI Copilot.
 *
 * Full role enforcement, not tenant-only authorization: the resolved role
 * comes only from `auth_user_role()`, evaluated against the caller's own
 * verified JWT (auth.uid()) - the same SQL function every RLS policy in
 * this app already trusts, and the same pattern verifyAuth.ts already uses
 * for `auth_business_id()`. There is deliberately no code path that derives
 * a role from anything the client sends in the request body: a prior
 * version of this file accepted a client-supplied `employeeId` and looked
 * it up without checking it belonged to the caller, which let any
 * authenticated tenant session claim any other employee's role. See
 * resolveRole.test.ts for the fix's regression coverage.
 *
 * The pure decision function below is exported separately from its I/O
 * wrapper specifically so the decision logic itself - the part that matters
 * for security review - is unit-testable without a live database
 * connection.
 */

export type CopilotRole = "owner" | "manager" | "cashier" | "inventory_clerk";

export const ALL_COPILOT_ROLES: CopilotRole[] = ["owner", "manager", "cashier", "inventory_clerk"];

function isCopilotRole(value: string): value is CopilotRole {
  return (ALL_COPILOT_ROLES as string[]).includes(value);
}

export type ResolveRoleResult =
  | { ok: true; role: CopilotRole; employeeId: string | null }
  | { ok: false; reason: "not_authenticated" | "unknown_role" };

/**
 * Pure decision function - no network, no Supabase client, plain data in,
 * plain data out. `resolvedRole` is whatever `auth_user_role()` returned
 * for the caller's own JWT; `employeeId` is the caller's own employees.id
 * (looked up by their own auth_user_id, never client-supplied) if they're
 * staff, or null for an owner.
 *
 * Fails closed: a null/unrecognized role (including the SQL function's
 * "device" bucket, which is not a Copilot-eligible role - a bare device
 * session with no employee clocked in and no owner override gets no
 * Copilot access at all) is always a rejection, never a fallback role.
 */
export function determineRole(resolvedRole: string | null, employeeId: string | null): ResolveRoleResult {
  if (!resolvedRole) {
    return { ok: false, reason: "not_authenticated" };
  }
  if (!isCopilotRole(resolvedRole)) {
    return { ok: false, reason: "unknown_role" };
  }
  return { ok: true, role: resolvedRole, employeeId: resolvedRole === "owner" ? null : employeeId };
}

/**
 * Minimal structural shape of what this module needs from a Supabase
 * client - kept narrow and dependency-free here so this file doesn't force
 * a hard import of @supabase/supabase-js just to describe the shape it
 * calls. The real edge function passes its actual SupabaseClient, which
 * satisfies this shape.
 */
export type RoleLookupClient = {
  rpc(fn: string): Promise<{ data: unknown; error: unknown }>;
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): { maybeSingle(): Promise<{ data: unknown; error: unknown }> };
      };
    };
  };
};

/**
 * I/O wrapper: resolves the caller's role via `auth_user_role()` on their
 * own verified JWT, then (for staff only) looks up their own employees.id
 * by their own auth_user_id - purely for audit-log attribution, never for
 * authorization - before deferring to the pure determineRole() above.
 *
 * `supabase` must be a client scoped to the caller's own JWT (the same
 * client verifyAuth.ts already builds), so `auth_user_role()`/`auth.uid()`
 * resolve to the real caller, not any client-asserted identity.
 */
export async function resolveRoleForRequest(
  supabase: RoleLookupClient,
  params: { businessId: string; authUserId: string }
): Promise<ResolveRoleResult> {
  const { data: roleData, error: roleErr } = await supabase.rpc("auth_user_role");
  if (roleErr) throw roleErr;
  const resolvedRole = typeof roleData === "string" ? roleData : null;

  let employeeId: string | null = null;
  if (resolvedRole && resolvedRole !== "owner") {
    const { data, error } = await supabase
      .from("employees")
      .select("id")
      .eq("business_id", params.businessId)
      .eq("auth_user_id", params.authUserId)
      .maybeSingle();
    if (error) throw error;
    employeeId = (data as { id: string } | null)?.id ?? null;
  }

  return determineRole(resolvedRole, employeeId);
}
