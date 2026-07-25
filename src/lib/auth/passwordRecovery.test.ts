import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPasswordRecoveryUrl,
  validateNewPassword,
  validatePasswordLength,
  validateRecoveryEmail,
  MIN_PASSWORD_LENGTH,
} from "./passwordRecovery.ts";

test("isPasswordRecoveryUrl detects type=recovery in the hash", () => {
  assert.equal(isPasswordRecoveryUrl({ hash: "#access_token=abc&type=recovery", search: "" }), true);
});

test("isPasswordRecoveryUrl detects type=recovery in the query string", () => {
  assert.equal(isPasswordRecoveryUrl({ hash: "", search: "?type=recovery" }), true);
});

test("isPasswordRecoveryUrl returns false when neither hash nor search mention recovery", () => {
  assert.equal(isPasswordRecoveryUrl({ hash: "#access_token=abc&type=signup", search: "" }), false);
  assert.equal(isPasswordRecoveryUrl({ hash: "", search: "" }), false);
});

test("validateNewPassword rejects empty password or confirmation", () => {
  assert.deepEqual(validateNewPassword("", ""), { ok: false, error: "Please enter and confirm your new password." });
  assert.deepEqual(validateNewPassword("abcdef", ""), { ok: false, error: "Please enter and confirm your new password." });
});

test("validateNewPassword rejects passwords shorter than the minimum length", () => {
  const result = validateNewPassword("abc", "abc");
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, new RegExp(`at least ${MIN_PASSWORD_LENGTH} characters`));
});

test("validateNewPassword rejects mismatched passwords that both meet the length minimum", () => {
  assert.deepEqual(validateNewPassword("abcdefghij", "abcdefghik"), { ok: false, error: "Passwords do not match." });
});

test("validateNewPassword accepts a valid, matching password at the length minimum", () => {
  const password = "a".repeat(MIN_PASSWORD_LENGTH);
  assert.deepEqual(validateNewPassword(password, password), { ok: true });
});

test("validateNewPassword rejects a matching pair that's one character short of the minimum", () => {
  const password = "a".repeat(MIN_PASSWORD_LENGTH - 1);
  const result = validateNewPassword(password, password);
  assert.equal(result.ok, false);
});

test("validatePasswordLength rejects an empty password", () => {
  assert.deepEqual(validatePasswordLength(""), { ok: false, error: "Please enter a password." });
});

test("validatePasswordLength rejects a password shorter than the minimum", () => {
  const result = validatePasswordLength("a".repeat(MIN_PASSWORD_LENGTH - 1));
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, new RegExp(`at least ${MIN_PASSWORD_LENGTH} characters`));
});

test("validatePasswordLength accepts a password meeting the minimum", () => {
  assert.deepEqual(validatePasswordLength("a".repeat(MIN_PASSWORD_LENGTH)), { ok: true });
});

test("MIN_PASSWORD_LENGTH is the approved production value (raised from the prior 6 - M-1)", () => {
  assert.equal(MIN_PASSWORD_LENGTH, 10);
});

test("validateRecoveryEmail rejects an empty or whitespace-only email", () => {
  assert.deepEqual(validateRecoveryEmail(""), { ok: false, error: "Please enter your email address." });
  assert.deepEqual(validateRecoveryEmail("   "), { ok: false, error: "Please enter your email address." });
});

test("validateRecoveryEmail rejects a malformed email", () => {
  assert.deepEqual(validateRecoveryEmail("not-an-email"), { ok: false, error: "Please enter a valid email address." });
});

test("validateRecoveryEmail accepts a well-formed, whitespace-padded email", () => {
  assert.deepEqual(validateRecoveryEmail("  owner@example.com  "), { ok: true });
});
