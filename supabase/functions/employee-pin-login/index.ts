import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { writeDeviceAuditLog } from "../_shared/deviceAuditLog.ts";

/**
 * Employee ID + PIN login (Staff Mode Phase 2 - see
 * supabase/migrations/20260720_employee_pin_hashing.sql).
 *
 * Any valid tenant session (device or owner) may call this - no
 * owner-only check, matching today's PIN screen precondition that it
 * only ever renders under an existing device/owner session. PIN
 * verification happens entirely server-side via
 * verify_and_consume_employee_pin(); the plaintext PIN is never compared
 * client-side and the caller's session is otherwise untouched by a
 * failed attempt.
 *
 * On a match, mints (first login) or rotates (returning employee) a
 * dedicated, minimal Supabase Auth identity for that employee - same
 * shape as register-device: a random, single-use password is generated,
 * used once to sign in, and discarded; only the resulting session tokens
 * are returned. employees.auth_user_id is populated on first login so
 * auth_business_id()/auth_user_role() resolve this employee correctly on
 * every subsequent request made with the returned session.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server is not configured (missing required secrets)" }, 500);
  }

  let requestBody: { employeeCode?: string; pin?: string };
  try {
    requestBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const employeeCode = typeof requestBody.employeeCode === "string" ? requestBody.employeeCode.trim() : "";
  const pin = typeof requestBody.pin === "string" ? requestBody.pin.trim() : "";
  if (!employeeCode || !pin) {
    return jsonResponse({ error: "employeeCode and pin are required" }, 400);
  }

  const verified = await verifyAuth({
    supabaseUrl,
    supabaseAnonKey,
    authorizationHeader: req.headers.get("Authorization"),
  });
  if (!verified) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Server-side verification only - the plaintext PIN never round-trips
  // to the client for comparison. Not-matched and locked-out both return
  // the same generic error, matching today's "never reveal which check
  // failed" behavior for the not-matched case.
  const { data: verifyRows, error: verifyErr } = await admin.rpc("verify_and_consume_employee_pin", {
    p_business_id: verified.businessId,
    p_employee_code: employeeCode,
    p_pin: pin,
  });
  if (verifyErr) {
    console.error("[employee-pin-login] verify_and_consume_employee_pin failed:", verifyErr);
    return jsonResponse({ error: "Could not verify PIN" }, 500);
  }
  const result = Array.isArray(verifyRows) ? verifyRows[0] : verifyRows;
  if (!result?.matched) {
    return jsonResponse({ error: "Invalid Employee ID or PIN" }, 401);
  }

  const employeeId = result.employee_id as string;
  const employeeName = result.employee_name as string;
  const employeeRole = result.employee_role as string;
  let authUserId = result.existing_auth_user_id as string | null;

  const employeeEmail = `employee-${crypto.randomUUID()}@employee.wegnstore.internal`;
  const employeePassword = crypto.randomUUID() + crypto.randomUUID();

  if (!authUserId) {
    // First-ever login for this employee - lazy-mint a dedicated identity,
    // same shape as register-device.
    const { data: createdUser, error: createUserErr } = await admin.auth.admin.createUser({
      email: employeeEmail,
      password: employeePassword,
      email_confirm: true,
      user_metadata: { kind: "employee", business_id: verified.businessId, employee_id: employeeId },
    });
    if (createUserErr || !createdUser?.user) {
      console.error("[employee-pin-login] failed to create employee auth identity:", createUserErr);
      return jsonResponse({ error: "Could not establish employee session" }, 500);
    }
    authUserId = createdUser.user.id;

    const { error: linkErr } = await admin.from("employees").update({ auth_user_id: authUserId }).eq("id", employeeId);
    if (linkErr) {
      console.error("[employee-pin-login] failed to link auth_user_id to employee:", linkErr);
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
      return jsonResponse({ error: "Could not establish employee session" }, 500);
    }
  } else {
    // Returning employee - rotate a fresh throwaway password rather than
    // persisting any reusable secret, same convention as register-device.
    const { error: updateErr } = await admin.auth.admin.updateUserById(authUserId, { password: employeePassword });
    if (updateErr) {
      console.error("[employee-pin-login] failed to rotate employee password:", updateErr);
      return jsonResponse({ error: "Could not establish employee session" }, 500);
    }
  }

  // Exchange the (fresh or newly-created) password for a real session,
  // then let it fall out of scope - nothing below this line references it.
  // For a returning employee, sign-in must use their EXISTING email
  // (fetched from the identity, not the throwaway `employeeEmail`
  // generated above only for the first-login createUser call).
  let signInEmail = employeeEmail;
  if (result.existing_auth_user_id) {
    const { data: existingUser, error: getUserErr } = await admin.auth.admin.getUserById(authUserId);
    if (getUserErr || !existingUser?.user?.email) {
      console.error("[employee-pin-login] failed to look up existing employee identity:", getUserErr);
      return jsonResponse({ error: "Could not establish employee session" }, 500);
    }
    signInEmail = existingUser.user.email;
  }

  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseAnonKey },
    body: JSON.stringify({ email: signInEmail, password: employeePassword }),
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.access_token || !tokenBody.refresh_token) {
    console.error("[employee-pin-login] failed to sign in employee identity:", tokenBody);
    return jsonResponse({ error: "Could not establish employee session" }, 500);
  }

  await writeDeviceAuditLog(admin, {
    businessId: verified.businessId,
    deviceId: null,
    employeeId,
    eventType: "staff_mode_entered",
    actorAuthId: verified.authUserId,
  });

  return jsonResponse({
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token,
    employeeId,
    name: employeeName,
    role: employeeRole,
  });
});
