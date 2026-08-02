import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Cross-product SSO owner verification, WEGN Store side. Answers exactly
 * one question for the frontend: "did this page load come from a
 * verified wegn-identity SSO handoff, moments ago?" - nothing else.
 *
 * Why this exists: a business with any active staff PIN gates owner
 * access behind ownerBypass (see App.tsx's own "Security fix" comments
 * on ownerAccessGranted/appUnlocked - a documented, deliberate control:
 * merely holding a live session must never be treated as proof of
 * present owner intent on what could be a shared device). Landing an
 * SSO-authenticated owner on ?module=dashboard alone does not clear
 * that gate, and it must not - this endpoint does not weaken that
 * control. It adds a narrow, ADDITIONAL path to the exact same
 * ownerBypass flag, gated on a signal at least as strong as the
 * password re-entry the existing path already requires: a short-lived
 * (30s), single-purpose, HMAC-signed token that sso-login only ever
 * mints immediately after independently verifying, server-side, that
 * this specific request came from an authenticated WEGN Home session
 * with a confirmed wegn_business_memberships + wegn_business_product_links
 * match. Signed with the same IDENTITY_CREDENTIAL secret already shared
 * with wegn-identity for link-identity-account - no new credential.
 *
 * Deliberately stateless (no replay/nonce table): the 30s window plus
 * the requirement that the caller's browser ALSO be carrying the real
 * session from the same magic-link redirect (itself single-use, GoTrue
 * invalidates the OTP on first verification) bounds the exposure to a
 * caller who was on this exact device within this exact short window -
 * the same practical bound as a leaked, still-warm password-reentry
 * session would carry.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } });
}

function base64UrlDecode(input: string): string {
  let b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return atob(b64);
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return jsonResponse({ verified: false }, 405);

  let body: { token?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ verified: false });
  }
  const token = typeof body.token === "string" ? body.token : "";
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return jsonResponse({ verified: false });

  const secret = Deno.env.get("IDENTITY_CREDENTIAL");
  if (!secret) return jsonResponse({ verified: false });

  const expectedSignature = await hmacSha256Hex(secret, encodedPayload);
  if (!timingSafeEqualHex(expectedSignature, signature)) return jsonResponse({ verified: false });

  let payload: { purpose?: unknown; exp?: unknown };
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return jsonResponse({ verified: false });
  }
  if (payload.purpose !== "sso_owner_verify" || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return jsonResponse({ verified: false });
  }

  return jsonResponse({ verified: true });
});
