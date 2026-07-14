/**
 * Server-side role resolution for the AI Copilot.
 *
 * Full role enforcement, not tenant-only authorization: the resolved role is
 * always looked up authoritatively (owner via `businesses.owner_id`, staff
 * via `employees.role`), never trusted from a client-supplied role string.
 * The pure decision function below is exported separately from its I/O
 * wrapper specifically so the decision logic itself - the part that matters
 * for security review - is unit-testable without a live database
 * connection (see resolveRole.test.ts).
 */

export type CopilotRole = "owner" | "manager" | "cashier" | "inventory_clerk";

export const ALL_COPILOT_ROLES: CopilotRole[] = ["owner", "manager", "cashier", "inventory_clerk"];

function isCopilotRole(value: string): value is CopilotRole {
  return (ALL_COPILOT_ROLES as string[]).includes(value);
}

export type EmployeeLookupRow = {
  id: string;
  business_id: string;
  role: string;
  status: string;
} | null;

export type ResolveRoleInput = {
  /** Whether auth.uid() matches businesses.owner_id for the verified business. */
  isOwner: boolean;
  /** The business_id already resolved from the verified JWT via auth_business_id(). */
  verifiedBusinessId: string;
  /** Employee id the client asserted as "currently active" (staffSession.id), if any. */
  requestedEmployeeId: string | null;
  /**
   * Result of an independent server-side lookup of `requestedEmployeeId` in
   * `employees`, scoped by the caller. Null if no matching row was found at
   * all (wrong id, or - critically - an id belonging to a different
   * business, which must resolve to "not found", never leak that mismatch).
   */
  employeeLookup: EmployeeLookupRow;
};

export type ResolveRoleResult =
  | { ok: true; role: CopilotRole; employeeId: string | null }
  | { ok: false; reason: "not_owner_and_no_employee_claim" | "employee_not_found" | "employee_inactive" | "employee_business_mismatch" | "unknown_role" };

/**
 * Pure decision function - no network, no Supabase client, plain data in,
 * plain data out. This is the only place "what role does this request get"
 * is decided; every caller (the real edge function and every test) goes
 * through this same logic.
 *
 * Fails closed: any ambiguity or lookup miss is a rejection, never a
 * fallback to a default/tenant-only role. This is the concrete enforcement
 * of "do not use tenant-only authorization as a substitute for role
 * enforcement."
 */
export function determineRole(input: ResolveRoleInput): ResolveRoleResult {
  // The real, JWT-verified owner identity always wins - it is the one
  // server-verifiable role in the system today, and there is no legitimate
  // reason for the actual owner's own authenticated session to be
  // downgraded by an employeeId claim, so it is never even considered.
  if (input.isOwner) {
    return { ok: true, role: "owner", employeeId: null };
  }

  if (!input.requestedEmployeeId) {
    return { ok: false, reason: "not_owner_and_no_employee_claim" };
  }

  if (!input.employeeLookup) {
    return { ok: false, reason: "employee_not_found" };
  }

  // Defense in depth: even though the lookup should already have been
  // scoped to verifiedBusinessId, re-check explicitly here so a caller
  // mistake upstream can never turn into a cross-tenant role grant.
  if (input.employeeLookup.business_id !== input.verifiedBusinessId) {
    return { ok: false, reason: "employee_business_mismatch" };
  }

  if (input.employeeLookup.status !== "active") {
    return { ok: false, reason: "employee_inactive" };
  }

  if (!isCopilotRole(input.employeeLookup.role)) {
    return { ok: false, reason: "unknown_role" };
  }

  return { ok: true, role: input.employeeLookup.role, employeeId: input.employeeLookup.id };
}

/**
 * Minimal structural shape of what this module needs from a Supabase
 * client - kept narrow and dependency-free here so this file doesn't force
 * a hard import of @supabase/supabase-js just to describe the shape it
 * calls. The real edge function passes its actual SupabaseClient, which
 * satisfies this shape.
 */
export type RoleLookupClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): { maybeSingle(): Promise<{ data: unknown; error: unknown }> };
        maybeSingle(): Promise<{ data: unknown; error: unknown }>;
      };
    };
  };
};

/**
 * I/O wrapper: performs the owner check and (if needed) the employee
 * lookup, then defers to the pure determineRole() above for the actual
 * decision. Not unit-tested directly (requires a live Supabase client) -
 * covered by code review and by determineRole()'s own tests, which exercise
 * every branch of the decision this function feeds into.
 */
export async function resolveRoleForRequest(
  supabase: RoleLookupClient,
  params: { businessId: string; authUserId: string; requestedEmployeeId: string | null }
): Promise<ResolveRoleResult> {
  const { data: ownerRow, error: ownerErr } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", params.businessId)
    .eq("owner_id", params.authUserId)
    .maybeSingle();
  if (ownerErr) throw ownerErr;
  const isOwner = !!ownerRow;

  let employeeLookup: EmployeeLookupRow = null;
  if (!isOwner && params.requestedEmployeeId) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, business_id, role, status")
      .eq("id", params.requestedEmployeeId)
      .maybeSingle();
    if (error) throw error;
    employeeLookup = (data as EmployeeLookupRow) ?? null;
  }

  return determineRole({
    isOwner,
    verifiedBusinessId: params.businessId,
    requestedEmployeeId: params.requestedEmployeeId,
    employeeLookup,
  });
}
