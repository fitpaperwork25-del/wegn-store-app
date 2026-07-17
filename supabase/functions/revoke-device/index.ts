import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { writeDeviceAuditLog } from "../_shared/deviceAuditLog.ts";

/**
 * Revokes a registered store device (Registered Store Device architecture,
 * Option A - see supabase/migrations/20260716_registered_device_staff_mode.sql).
 *
 * Owner-only. The primary security boundary is immediate: flipping
 * device_registrations.status to 'revoked' makes auth_business_id() and
 * auth_user_role() stop resolving for that device's JWT on the very next
 * request, regardless of the JWT's remaining expiry - every RLS policy in
 * the app locks the device out instantly. On top of that, this also bans
 * the device's underlying Supabase Auth identity so its refresh token can
 * never mint a new access token either, as defense in depth.
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

  let requestBody: { deviceId?: string };
  try {
    requestBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const deviceId = typeof requestBody.deviceId === "string" ? requestBody.deviceId.trim() : "";
  if (!deviceId) {
    return jsonResponse({ error: "deviceId is required" }, 400);
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
    console.error("[revoke-device] owner check failed:", ownerErr);
    return jsonResponse({ error: "Could not verify owner" }, 500);
  }
  if (!ownerRow) {
    return jsonResponse({ error: "Only the business owner can revoke a device" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Scoped to this owner's own business - device_registrations_owner_all
  // would enforce this too via verified.supabase, but the admin client is
  // needed below for the ban step regardless, so the business_id filter
  // here is what keeps this update tenant-scoped.
  const { data: deviceRow, error: updateErr } = await admin
    .from("device_registrations")
    .update({ status: "revoked", revoked_by: verified.authUserId, revoked_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("business_id", verified.businessId)
    .select("id, auth_user_id, device_label")
    .maybeSingle();
  if (updateErr) {
    console.error("[revoke-device] failed to update device_registrations:", updateErr);
    return jsonResponse({ error: "Could not revoke device" }, 500);
  }
  if (!deviceRow) {
    return jsonResponse({ error: "Device not found" }, 404);
  }

  // Defense in depth beyond the RLS status check: ban the device's auth
  // identity so its refresh token can't mint a new access token either.
  // Best-effort - the RLS status flip above is what actually enforces
  // revocation, so this must never block a successful revoke response.
  await admin.auth.admin.updateUserById(deviceRow.auth_user_id, { ban_duration: "876000h" }).catch((err) => {
    console.error("[revoke-device] failed to ban device auth identity (non-fatal):", err);
  });

  await writeDeviceAuditLog(admin, {
    businessId: verified.businessId,
    deviceId: deviceRow.id,
    eventType: "device_revoked",
    actorAuthId: verified.authUserId,
    metadata: { device_label: deviceRow.device_label },
  });

  return jsonResponse({ ok: true, deviceId: deviceRow.id });
});
