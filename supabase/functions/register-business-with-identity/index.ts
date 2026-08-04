import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sprint 5 Phase 1C: registers the caller's own owned Wegn Store business
 * with WEGN Identity's canonical Business Registry, via wegn-identity's
 * register-business-link. Mirrors link-identity-account's shape exactly
 * (self-contained JWT verification, server-side credential, fire-and-
 * forget-safe response shape) with one deliberate difference: this is
 * NOT wired to any automatic trigger. register-business-link's envelope
 * requires ownerConfirmed: true, and the frozen Business Registry
 * contract requires the owner to explicitly confirm a business link, not
 * have one silently created on their behalf - so this function exists as
 * a capability, to be invoked only from a real, deliberate owner action.
 *
 * Holds IDENTITY_REGISTRY_CREDENTIAL server-side only - a credential
 * scoped in wegn-identity to register-business-link + productKey
 * "wegn-store" only. Separate from IDENTITY_CREDENTIAL (link-account) -
 * see wegn-identity's credentialRegistry.ts.
 *
 * Ownership is verified server-side (businesses.owner_id = caller's own
 * auth id from their verified JWT) - the caller only supplies which of
 * their own businesses to register, never whose.
 *
 * Reliable Business Registration Phase 2: the call to Identity's
 * register-business-link is now retried, bounded, with backoff, instead
 * of a single best-effort attempt. All attempts reuse the exact same
 * requestId/issuedAt/expiresAt envelope generated once below, so retries
 * land inside wegn-identity's own business_registry_requests idempotency
 * window as the same logical request, not as separate ones - this
 * function does not own that window and does not change its length.
 * Only transient failures are retried (network errors and 5xx); a 4xx
 * from Identity (e.g. already-linked conflicts) is a real outcome, not a
 * transient one, and is returned immediately as before.
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
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const identityUrl = Deno.env.get("IDENTITY_REGISTER_BUSINESS_LINK_URL");
  const identitySecret = Deno.env.get("IDENTITY_REGISTRY_CREDENTIAL");

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !identityUrl || !identitySecret) {
    return jsonResponse({ error: "Server is not configured (missing required secrets)" }, 500);
  }

  const authorizationHeader = req.headers.get("Authorization");
  if (!authorizationHeader) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }
  const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorizationHeader } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonResponse({ error: "Not authenticated" }, 401);
  }
  const authUserId = userData.user.id;

  let body: { businessId?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const businessId = typeof body.businessId === "string" ? body.businessId : "";
  if (!businessId) {
    return jsonResponse({ error: "businessId is required" }, 400);
  }

  // Service-role lookup, but authorization is still the caller's own JWT
  // above - this only reads the specific business the caller asked
  // about, and the owner_id match below is what actually authorizes it.
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: business, error: businessErr } = await admin
    .from("businesses")
    .select("id, name, owner_id, country_code")
    .eq("id", businessId)
    .maybeSingle();
  if (businessErr) {
    return jsonResponse({ error: "Business lookup failed" }, 500);
  }
  if (!business || business.owner_id !== authUserId) {
    return jsonResponse({ error: "Business not found or not owned by caller" }, 404);
  }

  const requestId = crypto.randomUUID();
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 4 * 60 * 1000);
  const requestBody = JSON.stringify({
    secret: identitySecret,
    productKey: "wegn-store",
    productAuthUserId: authUserId,
    externalBusinessId: business.id,
    ownerConfirmed: true,
    displayName: business.name,
    businessType: null,
    countryCode: business.country_code ?? null,
    requestId,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });

  // Bounded retry/backoff, reusing the single requestId envelope above on
  // every attempt so retries fall inside Identity's own
  // business_registry_requests idempotency window as the same request.
  // 3 attempts, short delays (300ms/900ms) - total worst case well under
  // a second of backoff, nowhere near the envelope's own expiry.
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS_MS = [300, 900];
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const identityRes = await fetch(identityUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Request-ID": requestId },
        body: requestBody,
      });
      const identityBody = await identityRes.json().catch(() => ({}));

      if (identityRes.ok) {
        return jsonResponse({
          ok: true,
          wegnBusinessId: identityBody.wegnBusinessId ?? null,
          alreadyLinked: !!identityBody.alreadyLinked,
        });
      }

      // 4xx from Identity (bad request, conflict, etc.) is a real,
      // non-transient outcome for this same requestId - retrying it
      // would just get the same answer again.
      if (identityRes.status < 500) {
        console.error("[register-business-with-identity] Identity service returned a non-retryable error:", identityRes.status, identityBody);
        return jsonResponse({ ok: false, error: "Business registration failed" }, 502);
      }

      console.error(`[register-business-with-identity] Identity service returned a retryable error (attempt ${attempt}/${MAX_ATTEMPTS}):`, identityRes.status, identityBody);
      lastError = identityBody;
    } catch (err) {
      console.error(`[register-business-with-identity] request to Identity service failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, err);
      lastError = err;
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
    }
  }

  console.error("[register-business-with-identity] all attempts to reach Identity service failed:", lastError);
  return jsonResponse({ ok: false, error: "Request to Identity service failed" }, 502);
});
