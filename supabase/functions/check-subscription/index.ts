import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyAuth } from "../_shared/verifyAuth.ts";

/**
 * WSMS integration, observe-only phase. Proxies the caller's own
 * business to WSMS's check-entitlement API and returns the result -
 * never called directly from the browser with the WSMS secret, which
 * would leak it client-side. Same shape as every other cross-project
 * integration in this ecosystem (e.g. wegn-platform-admin's QRWegn
 * operational snapshot): the secret lives only in this server-side
 * function, never in a client bundle.
 *
 * Deliberately does not gate anything yet - the frontend only shows a
 * dismissible notice on a non-active result, never blocks a feature.
 * Wiring real enforcement is separate, later work, once this observe-only
 * phase has run long enough to confirm every real business resolves
 * correctly against WSMS.
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
  const wsmsUrl = Deno.env.get("WSMS_URL");
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

  try {
    const wsmsRes = await fetch(wsmsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productKey: "wegn-store",
        secret: wsmsSecret,
        externalBusinessId: verified.businessId,
      }),
    });
    const wsmsBody = await wsmsRes.json().catch(() => ({}));
    if (!wsmsRes.ok) {
      // Observe-only: a WSMS-side error is logged and reported back as
      // "unknown" rather than surfaced as a hard failure - this endpoint
      // must never be the reason Wegn Store itself becomes unusable.
      console.error("[check-subscription] WSMS returned an error:", wsmsRes.status, wsmsBody);
      return jsonResponse({ known: false, active: null, status: null });
    }
    return jsonResponse({ known: !!wsmsBody.found, active: wsmsBody.active ?? null, status: wsmsBody.status ?? null, currentPeriodEnd: wsmsBody.currentPeriodEnd ?? null });
  } catch (err) {
    console.error("[check-subscription] request to WSMS failed:", err);
    return jsonResponse({ known: false, active: null, status: null });
  }
});
