import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sprint 2 Task 4: links the caller's own Wegn Store owner account to the
 * WEGN Identity Service, fire-and-forget from AuthGate.tsx's standalone
 * owner login only. Mirrors QRWegn's link-identity-account exactly (same
 * repo shape, same contract) - see wegn-identity's README.md "Security
 * model" section for why this uses the one shared bootstrap secret.
 *
 * Deliberately does NOT use this repo's shared _shared/verifyAuth.ts -
 * that helper also resolves auth_business_id(), which every one of its
 * other 7 consumers legitimately needs but this one does not. Identity
 * linking is about proving who the authenticated caller is, not what
 * business they own; requiring a resolvable business here would be an
 * unrelated coupling and would silently fail linking for a caller whose
 * business lookup has any hiccup, even though their login itself is
 * completely valid. So this does its own minimal, self-contained JWT
 * verification instead - the same shape QRWegn's own verifyAuth.ts uses
 * (verify the token, read the user's id/email, nothing about tenancy).
 *
 * No email or auth_user_id is ever trusted from the client - both come
 * from Supabase's own server-side verification of the caller's JWT.
 *
 * Fire-and-forget from the frontend's perspective - a failure here must
 * never block or fail a Wegn Store login, which has already succeeded by
 * the time this is called.
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
  const identityUrl = Deno.env.get("IDENTITY_LINK_ACCOUNT_URL");
  const identitySecret = Deno.env.get("IDENTITY_SERVICE_SECRET");

  if (!supabaseUrl || !supabaseAnonKey || !identityUrl || !identitySecret) {
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
  const email = userData.user.email ?? null;
  if (!email) {
    // No email on the session (should not happen for a password-based
    // owner login, but link-account requires one) - fail quiet, this
    // must never surface as a login error.
    return jsonResponse({ ok: false, error: "No email on session" }, 200);
  }

  try {
    const identityRes = await fetch(identityUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: identitySecret,
        productKey: "wegn-store",
        productAuthUserId: authUserId,
        email,
      }),
    });
    const identityBody = await identityRes.json().catch(() => ({}));
    if (!identityRes.ok) {
      console.error("[link-identity-account] Identity service returned an error:", identityRes.status, identityBody);
      return jsonResponse({ ok: false, error: "Identity link failed" }, 502);
    }
    return jsonResponse({ ok: true, alreadyLinked: !!identityBody.alreadyLinked, wegnAccountId: identityBody.wegnAccountId ?? null });
  } catch (err) {
    console.error("[link-identity-account] request to Identity service failed:", err);
    return jsonResponse({ ok: false, error: "Request to Identity service failed" }, 502);
  }
});
