import { test } from "node:test";
import assert from "node:assert/strict";
import { isPasswordRecoveryUrl, validateNewPassword } from "./passwordRecovery.ts";

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
  if (!result.ok) assert.match(result.error, /at least 6 characters/);
});

test("validateNewPassword rejects mismatched passwords", () => {
  assert.deepEqual(validateNewPassword("abcdef", "abcdeg"), { ok: false, error: "Passwords do not match." });
});

test("validateNewPassword accepts a valid, matching password", () => {
  assert.deepEqual(validateNewPassword("abcdef", "abcdef"), { ok: true });
});
