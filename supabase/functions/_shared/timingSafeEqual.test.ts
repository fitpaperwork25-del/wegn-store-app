import { test } from "node:test";
import assert from "node:assert/strict";
import { secureCompare } from "./timingSafeEqual.ts";

test("secureCompare returns true for identical strings", () => {
  assert.equal(secureCompare("correct-secret-value", "correct-secret-value"), true);
});

test("secureCompare returns false for different strings of the same length", () => {
  assert.equal(secureCompare("correct-secret-value", "wrong---secret-value"), false);
});

test("secureCompare returns false when only the last character differs", () => {
  assert.equal(secureCompare("correct-secret-value", "correct-secret-valuX"), false);
});

test("secureCompare returns false for strings of different lengths, without throwing", () => {
  assert.equal(secureCompare("short", "a-much-longer-secret"), false);
  assert.equal(secureCompare("a-much-longer-secret", "short"), false);
});

test("secureCompare returns true for two empty strings", () => {
  assert.equal(secureCompare("", ""), true);
});

test("secureCompare returns false when one side is empty and the other is not", () => {
  assert.equal(secureCompare("", "non-empty"), false);
  assert.equal(secureCompare("non-empty", ""), false);
});

test("secureCompare is case-sensitive", () => {
  assert.equal(secureCompare("Secret", "secret"), false);
});
