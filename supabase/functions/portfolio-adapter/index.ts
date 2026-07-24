import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sprint 5 Phase 1D: WEGN Store's read-only portfolio adapter for
 * wegn-identity's business-portfolio-v1. Implements the frozen
 * server-to-server adapter trust contract (see wegn-identity's
 * docs/SPRINT5_PHASE1B_PORTFOLIO_BACKEND_DESIGN_FREEZE.md, Section 8):
 * authenticated by a dedicated shared secret, only ever returns data for
 * the exact externalBusinessIds requested - never a general listing.
 *
 * Only two fields actually feed the portfolio contract per business
 * (see wegn-identity's portfolioContract.ts normalizeBusiness): `setup`
 * and `recentActivity`. Business name, country, and lifecycle status are
 * NOT read from this adapter - those are canonical Business Registry
 * fields, set once at registration time, not re-derived here on every
 * portfolio read. Store has no documented setup-completeness signal, so
 * `setup` is always null ("products without one do not emit it," per
 * the frozen contract). `recentActivity` maps inventory_transactions to
 * the one activity category the frozen contract permits for Store:
 * "inventory_updated".
 */

const PRODUCT_KEY = "wegn-store";
const MAX_ITEMS = 100;
const MAX_WINDOW_MS = 5 * 60 * 1000;
const RECENT_ACTIVITY_LIMIT = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function validWindow(issuedAt: string, expiresAt: string): boolean {
  const issued = Date.parse(issuedAt);
  const expires = Date.parse(expiresAt);
  const now = Date.now();
  return Number.isFinite(issued) && Number.isFinite(expires)
    && expires > issued && expires - issued <= MAX_WINDOW_MS
    && issued <= now + 30_000 && expires >= now;
}

serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const expectedSecret = Deno.env.get("WEGN_PORTFOLIO_ADAPTER_SECRET");
  if (!expectedSecret || req.headers.get("x-wegn-portfolio-secret") !== expectedSecret) {
    return json({ error: "Invalid credentials" }, 401);
  }

  let body: {
    productKey?: unknown;
    requestId?: unknown;
    issuedAt?: unknown;
    expiresAt?: unknown;
    externalBusinessIds?: unknown;
    activityCursor?: unknown;
    activityLimit?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const productKey = typeof body.productKey === "string" ? body.productKey : "";
  const requestId = typeof body.requestId === "string" ? body.requestId.trim() : "";
  const issuedAt = typeof body.issuedAt === "string" ? body.issuedAt : "";
  const expiresAt = typeof body.expiresAt === "string" ? body.expiresAt : "";
  const ids = Array.isArray(body.externalBusinessIds)
    ? body.externalBusinessIds.filter((id): id is string => typeof id === "string" && UUID_PATTERN.test(id))
    : [];
  if (productKey !== PRODUCT_KEY || !requestId || !validWindow(issuedAt, expiresAt)
    || ids.length > MAX_ITEMS || ids.length !== new Set(ids).size
    || ids.length !== (Array.isArray(body.externalBusinessIds) ? body.externalBusinessIds.length : 0)) {
    return json({ error: "Invalid or expired request" }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return json({ error: "Server is not configured" }, 500);
  if (ids.length === 0) {
    return json({ requestId, productKey: PRODUCT_KEY, sourceSchemaVersion: "1", asOf: new Date().toISOString(), businesses: [] });
  }

  const admin = createClient(url, serviceRoleKey);
  const allowed = new Set(ids);

  // Phase 2A-3: single-business paginated activity read for the Business
  // Workspace Activity Timeline. Deliberately a separate branch, not a
  // change to the batched query above it - the existing multi-business
  // path (Overview's 3-item summary) is untouched, this only activates
  // when the caller explicitly asks for a page beyond the default.
  if (ids.length === 1 && (body.activityCursor !== undefined || body.activityLimit !== undefined)) {
    const cursor = typeof body.activityCursor === "string" && body.activityCursor ? body.activityCursor : null;
    if (cursor !== null && !Number.isFinite(Date.parse(cursor))) {
      return json({ error: "Invalid activity cursor" }, 400);
    }
    const requestedLimit = typeof body.activityLimit === "number" ? Math.trunc(body.activityLimit) : 20;
    const activityLimit = Math.min(Math.max(requestedLimit, 1), 50);

    let query = admin
      .from("inventory_transactions")
      .select("id, business_id, created_at")
      .eq("business_id", ids[0])
      .order("created_at", { ascending: false })
      .limit(activityLimit);
    if (cursor !== null) query = query.lt("created_at", cursor);

    const { data: pageRows, error: pageError } = await query;
    if (pageError) return json({ error: "Portfolio lookup failed" }, 500);

    const recentActivity = (pageRows ?? []).map((row) => ({
      id: row.id, category: "inventory_updated", summary: "Inventory updated", occurredAt: row.created_at,
    }));
    const nextCursor = recentActivity.length === activityLimit ? recentActivity[recentActivity.length - 1].occurredAt : null;

    return json({
      requestId,
      productKey: PRODUCT_KEY,
      sourceSchemaVersion: "1",
      asOf: new Date().toISOString(),
      businesses: [{
        externalBusinessId: ids[0],
        sourceUpdatedAt: new Date().toISOString(),
        setup: null,
        recentActivity,
      }],
      nextCursor,
    });
  }

  const [{ data: rows, error: businessError }, { data: activityRows, error: activityError }] = await Promise.all([
    admin.from("businesses").select("id").in("id", ids),
    admin
      .from("inventory_transactions")
      .select("id, business_id, created_at")
      .in("business_id", ids)
      .order("created_at", { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT * ids.length),
  ]);
  if (businessError || activityError) return json({ error: "Portfolio lookup failed" }, 500);

  const activityByBusiness = new Map<string, Array<{ id: string; category: string; summary: string; occurredAt: string }>>();
  for (const row of activityRows ?? []) {
    if (!allowed.has(row.business_id)) continue;
    const list = activityByBusiness.get(row.business_id) ?? [];
    if (list.length < RECENT_ACTIVITY_LIMIT) {
      list.push({ id: row.id, category: "inventory_updated", summary: "Inventory updated", occurredAt: row.created_at });
      activityByBusiness.set(row.business_id, list);
    }
  }

  const businesses = (rows ?? []).flatMap((business) =>
    allowed.has(business.id) ? [{
      externalBusinessId: business.id,
      sourceUpdatedAt: new Date().toISOString(),
      setup: null,
      recentActivity: activityByBusiness.get(business.id) ?? [],
    }] : []
  );

  return json({
    requestId,
    productKey: PRODUCT_KEY,
    sourceSchemaVersion: "1",
    asOf: new Date().toISOString(),
    businesses,
  });
});
