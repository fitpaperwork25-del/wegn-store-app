import { test } from "node:test";
import assert from "node:assert/strict";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// health.ts reads HEALTH_CHECK_SECRET from process.env at module load time,
// and a static `import` is hoisted above any code in this file - so the
// env var has to be set before a dynamic import triggers that module load,
// not just before the test bodies run. This keeps the test self-contained
// (works under a plain `npm test`) rather than depending on the secret
// being pre-set in the invoking shell.
const TEST_SECRET = "test-secret-for-health-check-tests";
process.env.HEALTH_CHECK_SECRET = TEST_SECRET;
const { default: handler } = await import("./health.ts");

// Minimal mock of the exact VercelRequest/VercelResponse surface
// api/health.ts's handler actually touches - no real Vercel dev server
// needed to exercise the gating logic this test cares about (L-2).
function mockReqRes(headers: Record<string, string> = {}) {
  const req = { headers, method: "GET", query: {} } as unknown as VercelRequest;
  const state = { statusCode: 0, body: undefined as unknown, headers: {} as Record<string, string> };
  const res = {
    setHeader(name: string, value: string) {
      state.headers[name] = value;
      return res;
    },
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: unknown) {
      state.body = body;
      return res;
    },
  } as unknown as VercelResponse;
  return { req, res, state };
}

test("L-2: an unauthenticated caller gets only the minimal safe response, no service-role details", async () => {
  const { req, res, state } = mockReqRes();
  await handler(req, res);
  assert.equal(state.statusCode, 200);
  const body = state.body as Record<string, unknown>;
  assert.equal(body.status, "ok");
  assert.ok(typeof body.timestamp === "string");
  // Must NOT contain any of the detailed/service-role-backed fields.
  assert.equal(body.version, undefined);
  assert.equal(body.environment, undefined);
  assert.equal(body.database, undefined);
  assert.equal(body.authentication, undefined);
  assert.equal(body.runtime, undefined);
});

test("L-2: a caller presenting the wrong secret gets the same minimal response as no secret at all", async () => {
  const { req, res, state } = mockReqRes({ "x-health-check-secret": "definitely-not-the-real-secret" });
  await handler(req, res);
  assert.equal(state.statusCode, 200);
  const body = state.body as Record<string, unknown>;
  assert.equal(body.status, "ok");
  assert.equal(body.database, undefined);
});

test("L-2: a caller presenting the correct secret receives the detailed response shape", async () => {
  const { req, res, state } = mockReqRes({ "x-health-check-secret": TEST_SECRET });
  await handler(req, res);
  const body = state.body as Record<string, unknown>;
  // Detailed shape - present regardless of whether the underlying Supabase
  // checks succeed in this environment (no live credentials assumed here).
  assert.equal(body.version, "1.1");
  assert.ok("environment" in body);
  assert.ok("database" in body);
  assert.ok("authentication" in body);
  assert.ok("runtime" in body);
  assert.ok(state.statusCode === 200 || state.statusCode === 503);
});

test("L-2: rate limiting kicks in after repeated requests from the same client", async () => {
  const clientKey = "203.0.113.77"; // distinct IP so this test doesn't share a bucket with the others above
  let lastStatus = 0;
  for (let i = 0; i < 40; i++) {
    const { req, res, state } = mockReqRes({ "x-forwarded-for": clientKey });
    await handler(req, res);
    lastStatus = state.statusCode;
    if (lastStatus === 429) break;
  }
  assert.equal(lastStatus, 429, "expected rate limiting to trigger a 429 within 40 requests from one client");
});
