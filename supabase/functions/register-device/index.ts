import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth } from "../_shared/verifyAuth.ts";
import { writeDeviceAuditLog } from "../_shared/deviceAuditLog.ts";

/**
 * Registers a new shared store device for Staff Mode (Registered Store
 * Device architecture, Option A - see
 * supabase/migrations/20260716_registered_device_staff_mode.sql).
 *
 * Owner-only. Mints a dedicated, minimal Supabase Auth identity for the
 * physical device, scoped to exactly one business via
 * device_registrations, then returns that identity's session tokens once.
 * The device's random password is generated here, used once to sign in,
 * and never stored or returned - only the resulting access/refresh tokens
 * are, matching "do not store the owner password" / "do not treat
 * localStorage alone as trusted authorization": what the caller persists
 * afterward is a real, revocable Supabase session, not a shared secret.
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

  let requestBody: { deviceLabel?: string };
  try {
    requestBody = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const deviceLabel = typeof requestBody.deviceLabel === "string" ? requestBody.deviceLabel.trim() : "";
  if (!deviceLabel) {
    return jsonResponse({ error: "deviceLabel is required" }, 400);
  }

  // 1. Authenticated caller verification + tenant resolution.
  const verified = await verifyAuth({
    supabaseUrl,
    supabaseAnonKey,
    authorizationHeader: req.headers.get("Authorization"),
  });
  if (!verified) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  // 2. Only the real, JWT-verified owner may register a device - never an
  // employee or an existing device session, even one with broad
  // permission-matrix access today.
  const { data: ownerRow, error: ownerErr } = await verified.supabase
    .from("businesses")
    .select("id")
    .eq("id", verified.businessId)
    .eq("owner_id", verified.authUserId)
    .maybeSingle();
  if (ownerErr) {
    console.error("[register-device] owner check failed:", ownerErr);
    return jsonResponse({ error: "Could not verify owner" }, 500);
  }
  if (!ownerRow) {
    return jsonResponse({ error: "Only the business owner can register a device" }, 403);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // 3. Mint a dedicated, minimal Supabase Auth identity for this device.
  // The password is random, single-use (only to obtain the initial
  // session below), and discarded immediately after - it is never stored
  // in device_registrations or returned to the caller.
  const deviceEmail = `device-${crypto.randomUUID()}@device.wegnstore.internal`;
  const devicePassword = crypto.randomUUID() + crypto.randomUUID();

  const { data: createdUser, error: createUserErr } = await admin.auth.admin.createUser({
    email: deviceEmail,
    password: devicePassword,
    email_confirm: true,
    user_metadata: { kind: "device", business_id: verified.businessId },
  });
  if (createUserErr || !createdUser?.user) {
    console.error("[register-device] failed to create device auth identity:", createUserErr);
    return jsonResponse({ error: "Could not create device identity" }, 500);
  }
  const deviceAuthUserId = createdUser.user.id;

  // 4. Scope the device to exactly this business.
  const { data: deviceRow, error: insertErr } = await admin
    .from("device_registrations")
    .insert({
      business_id: verified.businessId,
      auth_user_id: deviceAuthUserId,
      device_label: deviceLabel,
      status: "active",
      registered_by: verified.authUserId,
    })
    .select("id, device_label")
    .single();
  if (insertErr || !deviceRow) {
    console.error("[register-device] failed to insert device_registrations row:", insertErr);
    // Best-effort cleanup so a failed registration doesn't leave an orphan
    // auth identity with no corresponding device_registrations row.
    await admin.auth.admin.deleteUser(deviceAuthUserId).catch(() => {});
    return jsonResponse({ error: "Could not register device" }, 500);
  }

  // 5. Exchange the one-time password for a real session, then let the
  // password fall out of scope - nothing below this line references it.
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: supabaseAnonKey },
    body: JSON.stringify({ email: deviceEmail, password: devicePassword }),
  });
  const tokenBody = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tokenBody.access_token || !tokenBody.refresh_token) {
    console.error("[register-device] failed to sign in newly created device:", tokenBody);
    await admin.from("device_registrations").delete().eq("id", deviceRow.id).catch(() => {});
    await admin.auth.admin.deleteUser(deviceAuthUserId).catch(() => {});
    return jsonResponse({ error: "Could not establish a device session" }, 500);
  }

  await writeDeviceAuditLog(admin, {
    businessId: verified.businessId,
    deviceId: deviceRow.id,
    eventType: "device_registered",
    actorAuthId: verified.authUserId,
    metadata: { device_label: deviceRow.device_label },
  });

  return jsonResponse({
    deviceId: deviceRow.id,
    deviceLabel: deviceRow.device_label,
    accessToken: tokenBody.access_token,
    refreshToken: tokenBody.refresh_token,
  });
});
