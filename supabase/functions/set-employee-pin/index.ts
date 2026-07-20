import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth } from "../_shared/verifyAuth.ts";

/**
 * Sets (or resets) an employee's PIN, hashed server-side (Staff Mode
 * Phase 2 - see supabase/migrations/20260720_employee_pin_hashing.sql).
 *
 * Owner-only, same pattern as revoke-device. Serves both the "Add
 * Employee" flow (called once right after the employee row is inserted)
 * and any future "Reset PIN" action - one write path for both, since
 * both are just "set this employee's PIN to this value."
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

const PIN_PATTERN = /^\d{4,6}$/;

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

  let requestBody: { employeeId?: string; pin?: string };
  try {
    requestBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const employeeId = typeof requestBody.employeeId === "string" ? requestBody.employeeId.trim() : "";
  const pin = typeof requestBody.pin === "string" ? requestBody.pin.trim() : "";
  if (!employeeId) {
    return jsonResponse({ error: "employeeId is required" }, 400);
  }
  if (!PIN_PATTERN.test(pin)) {
    return jsonResponse({ error: "PIN must be 4-6 digits" }, 400);
  }

  const verified = await verifyAuth({
    supabaseUrl,
    supabaseAnonKey,
    authorizationHeader: req.headers.get("Authorization"),
  });
  if (!verified) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  const { data: ownerRow, error: ownerErr } = await verified.supabase
    .from("businesses")
    .select("id")
    .eq("id", verified.businessId)
    .eq("owner_id", verified.authUserId)
    .maybeSingle();
  if (ownerErr) {
    console.error("[set-employee-pin] owner check failed:", ownerErr);
    return jsonResponse({ error: "Could not verify owner" }, 500);
  }
  if (!ownerRow) {
    return jsonResponse({ error: "Only the business owner can set an employee's PIN" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Confirm the target employee belongs to this owner's own business
  // before writing - defense in depth beyond the service-role bypass.
  const { data: employeeRow, error: employeeErr } = await admin
    .from("employees")
    .select("id")
    .eq("id", employeeId)
    .eq("business_id", verified.businessId)
    .maybeSingle();
  if (employeeErr) {
    console.error("[set-employee-pin] employee lookup failed:", employeeErr);
    return jsonResponse({ error: "Could not verify employee" }, 500);
  }
  if (!employeeRow) {
    return jsonResponse({ error: "Employee not found" }, 404);
  }

  const { error: setErr } = await admin.rpc("set_employee_pin_hash", {
    p_employee_id: employeeId,
    p_pin: pin,
  });
  if (setErr) {
    console.error("[set-employee-pin] set_employee_pin_hash failed:", setErr);
    return jsonResponse({ error: "Could not set PIN" }, 500);
  }

  return jsonResponse({ ok: true, employeeId });
});
