import { createClient } from "@supabase/supabase-js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { secureCompare } from "./_lib/security/timingSafeEqual.js";
import { createRateLimitStore, checkRateLimit } from "./_lib/security/rateLimiter.js";

// Health check for Platform Admin's Health Engine. Same response contract
// as qrwegn's and qrbooker's api/health.ts so Platform Admin can consume
// all three products uniformly - but see the Phase 1 security audit's L-2
// finding: this endpoint used to run its service-role-backed database and
// auth.admin checks for EVERY caller, unauthenticated, with no rate limit.
// It now runs those checks only for a caller presenting the correct
// HEALTH_CHECK_SECRET header; anyone else gets a minimal, safe response
// (still a real 200/503 and a timestamp, enough for uptime monitoring)
// with no service-role call made on their behalf at all. Platform Admin's
// Health Engine needs to send `x-health-check-secret` going forward to
// keep receiving the detailed response.
//
// version is "1.1" (git tag v1.1-documentation-freeze), not
// package.json's stale "0.0.0" (never bumped) — matching the same
// version already declared in Platform Admin's registered manifest for
// this product, per that manifest's own documented reasoning.
const VERSION = "1.1";
const ENVIRONMENT = process.env.VERCEL_ENV ?? "production";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const healthCheckSecret = process.env.HEALTH_CHECK_SECRET;

// Per-instance, best-effort - see rateLimiter.ts for why this is the
// "reasonable" bar for this endpoint rather than a distributed limiter.
const rateLimitStore = createRateLimitStore();
const RATE_LIMIT_WINDOW_MS = 60_000;
// Generous enough for a legitimate monitor polling every 30-60s from a
// handful of source IPs, low enough to meaningfully blunt abuse.
const RATE_LIMIT_MAX_REQUESTS = 30;

interface CheckResult {
  status: "ok" | "error";
  latencyMs?: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase credentials are not configured.");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await supabase.from("businesses").select("id", { count: "exact", head: true }).limit(1);
    if (error) throw error;
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Database check failed." };
  }
}

async function checkAuthentication(): Promise<CheckResult> {
  const startedAt = Date.now();
  try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Supabase credentials are not configured.");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) throw error;
    return { status: "ok", latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { status: "error", error: err instanceof Error ? err.message : "Authentication check failed." };
  }
}

function isAuthorizedForDetailedHealth(req: VercelRequest): boolean {
  if (!healthCheckSecret) return false;
  const header = req.headers["x-health-check-secret"];
  const provided = typeof header === "string" ? header : null;
  return !!provided && secureCompare(provided, healthCheckSecret);
}

function getClientKey(req: VercelRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = typeof forwardedFor === "string" ? forwardedFor.split(",")[0].trim() : null;
  return ip || "unknown";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startedAt = Date.now();

  // Health status only, no user/business data in the minimal response —
  // safe to expose to any origin so a browser-side monitor can read it (a
  // bare fetch() without this header is opaque to the browser and surfaces
  // as a generic "Failed to fetch", even when the server responds
  // successfully).
  res.setHeader("Access-Control-Allow-Origin", "*");

  const rateLimit = checkRateLimit(rateLimitStore, getClientKey(req), Date.now(), RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS);
  if (rateLimit.limited) {
    res.status(429).json({ status: "error", error: "Too many requests.", timestamp: new Date().toISOString() });
    return;
  }

  if (!isAuthorizedForDetailedHealth(req)) {
    // Minimal safe response: confirms the function is reachable and
    // responding, with no service-role-backed check performed and no
    // internal detail (version, environment, latencies) disclosed.
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
    return;
  }

  // The handler executing at all is the API health signal.
  const api: CheckResult = { status: "ok" };
  const [database, authentication] = await Promise.all([checkDatabase(), checkAuthentication()]);

  const healthy = database.status === "ok" && authentication.status === "ok";

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    version: VERSION,
    environment: ENVIRONMENT,
    runtime: { status: "ok", checkDurationMs: Date.now() - startedAt },
    api,
    database,
    authentication,
    timestamp: new Date().toISOString(),
  });
}
