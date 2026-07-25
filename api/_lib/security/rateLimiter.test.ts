import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimitStore, checkRateLimit } from "./rateLimiter.ts";

const WINDOW_MS = 60_000;
const MAX = 3;

test("allows requests under the limit", () => {
  const store = createRateLimitStore();
  const r1 = checkRateLimit(store, "1.2.3.4", 0, WINDOW_MS, MAX);
  const r2 = checkRateLimit(store, "1.2.3.4", 1_000, WINDOW_MS, MAX);
  const r3 = checkRateLimit(store, "1.2.3.4", 2_000, WINDOW_MS, MAX);
  assert.equal(r1.limited, false);
  assert.equal(r2.limited, false);
  assert.equal(r3.limited, false);
});

test("denies requests once the limit is exceeded within the window", () => {
  const store = createRateLimitStore();
  checkRateLimit(store, "1.2.3.4", 0, WINDOW_MS, MAX);
  checkRateLimit(store, "1.2.3.4", 1_000, WINDOW_MS, MAX);
  checkRateLimit(store, "1.2.3.4", 2_000, WINDOW_MS, MAX);
  const fourth = checkRateLimit(store, "1.2.3.4", 3_000, WINDOW_MS, MAX);
  assert.equal(fourth.limited, true);
  assert.equal(fourth.remaining, 0);
});

test("resets once the window has fully elapsed", () => {
  const store = createRateLimitStore();
  checkRateLimit(store, "1.2.3.4", 0, WINDOW_MS, MAX);
  checkRateLimit(store, "1.2.3.4", 1_000, WINDOW_MS, MAX);
  checkRateLimit(store, "1.2.3.4", 2_000, WINDOW_MS, MAX);
  checkRateLimit(store, "1.2.3.4", 3_000, WINDOW_MS, MAX); // limited, 4th in window
  const afterWindow = checkRateLimit(store, "1.2.3.4", 3_000 + WINDOW_MS + 1, WINDOW_MS, MAX);
  assert.equal(afterWindow.limited, false);
});

test("tracks distinct keys independently", () => {
  const store = createRateLimitStore();
  checkRateLimit(store, "1.1.1.1", 0, WINDOW_MS, MAX);
  checkRateLimit(store, "1.1.1.1", 1_000, WINDOW_MS, MAX);
  checkRateLimit(store, "1.1.1.1", 2_000, WINDOW_MS, MAX);
  const otherIp = checkRateLimit(store, "2.2.2.2", 3_000, WINDOW_MS, MAX);
  assert.equal(otherIp.limited, false, "a different key must not be affected by another key's usage");
});

test("remaining counts down correctly as requests accumulate", () => {
  const store = createRateLimitStore();
  const r1 = checkRateLimit(store, "1.2.3.4", 0, WINDOW_MS, MAX);
  const r2 = checkRateLimit(store, "1.2.3.4", 1_000, WINDOW_MS, MAX);
  assert.equal(r1.remaining, 2);
  assert.equal(r2.remaining, 1);
});
