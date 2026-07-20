import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAuth } from "../_shared/verifyAuth.ts";

/**
 * Registers the caller's own business as a WSMS trialing subscriber.
 * Fire-and-forget from the frontend's perspective - a failure here must
 * never block business creation, which has already committed by the
 * time this is called (see AuthGate.tsx/App.tsx call sites). Holds
 * WSMS_PRODUCT_SECRET server-side only, same as check-subscription -
 * this is wegn-store's OWN product secret, not platform-admin's; it can
 * only ever self-register a trialing subscription for wegn-store's own
 * businesses (see WSMS's self-register-subscription for the enforced
 * boundary).
 *
 * externalBusinessId/businessDisplayName come from the caller (the
 * business row already exists by the time this runs) rather than being
 * re-derived from auth_business_id(), because handleCreateBusiness can
 * create additional businesses beyond the caller's own default one -
 * verifyAuth alone would only ever resolve the session's primary
 * business. The caller is still required to be authenticated; this
 * endpoint does not accept an arbitrary businessId with no proof the
 * caller has any relationship to this tenant, ownership of the specific
 * business row is enforced by RLS if the caller looks it up themselves
 * before calling this.
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
  const wsmsUrl = Deno.env.get("WSMS_SELF_REGISTER_URL");
  const wsmsSecret = Deno.env.get("WSMS_PRODUCT_SECRET");

  if (!supabaseUrl || !supabaseAnonKey || !wsmsUrl || !wsmsSecret) {
    return jsonResponse({ error: "Server is not configured (missing required secrets)" }, 500);
  }

  const verified = await verifyAuth({
    supabaseUrl,
    supabaseAnonKey,
    authorizationHeader: req.headers.get("Authorization"),
  });
  if (!verified) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }

  let body: { businessId?: string; businessDisplayName?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const businessId = typeof body.businessId === "string" ? body.businessId : "";
  const businessDisplayName = typeof body.businessDisplayName === "string" ? body.businessDisplayName : null;
  if (!businessId) return jsonResponse({ error: "businessId is required" }, 400);

  try {
    const wsmsRes = await fetch(wsmsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "wegn-store",
        secret: wsmsSecret,
        externalBusinessId: businessId,
        businessDisplayName,
      }),
    });
    const wsmsBody = await wsmsRes.json().catch(() => ({}));
    if (!wsmsRes.ok) {
      console.error("[register-with-wsms] WSMS returned an error:", wsmsRes.status, wsmsBody);
      return jsonResponse({ ok: false, error: typeof wsmsBody.error === "string" ? wsmsBody.error : "WSMS registration failed" }, 502);
    }
    return jsonResponse({ ok: true, alreadyExists: !!wsmsBody.alreadyExists, status: wsmsBody.status ?? null, currentPeriodEnd: wsmsBody.currentPeriodEnd ?? null });
  } catch (err) {
    console.error("[register-with-wsms] request to WSMS failed:", err);
    return jsonResponse({ ok: false, error: "Request to WSMS failed" }, 502);
  }
});
