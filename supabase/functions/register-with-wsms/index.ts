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
 * externalBusinessId comes from the caller rather than being re-derived
 * from auth_business_id(), because handleCreateBusiness can create
 * additional businesses beyond the caller's own default one -
 * verifyAuth alone would only ever resolve the session's primary
 * business. To keep this safe, the businessId is looked up through
 * verified.supabase (the caller's own RLS-scoped client, not the
 * service role) before ever being forwarded to WSMS - businesses'
 * owner_select policy (owner_id = auth.uid()) means this lookup
 * returns nothing for a business the caller doesn't own, so an
 * authenticated caller cannot register an arbitrary business that
 * isn't theirs.
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

  let body: { businessId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const businessId = typeof body.businessId === "string" ? body.businessId : "";
  if (!businessId) return jsonResponse({ error: "businessId is required" }, 400);

  // Ownership check via the caller's own RLS-scoped client - see header
  // comment. Also gives us the authoritative name, rather than trusting
  // a client-supplied display name.
  const { data: business, error: bizErr } = await verified.supabase
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .maybeSingle();
  if (bizErr) { console.error("[register-with-wsms] business lookup failed:", bizErr); return jsonResponse({ ok: false, error: "Lookup failed" }, 500); }
  if (!business) return jsonResponse({ ok: false, error: "Business not found, or you do not have access to it" }, 403);

  try {
    const wsmsRes = await fetch(wsmsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "wegn-store",
        secret: wsmsSecret,
        externalBusinessId: business.id,
        businessDisplayName: business.name,
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
