import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveMountSessionTrust, isOwnerAccessGranted } from "./sessionAccess.ts";

/**
 * Regression coverage for the two confirmed Owner Access bypasses:
 *
 * Bug #1 (AuthGate mount trust gap): a live, valid, non-device session
 * was always trusted on mount, even on a browser with a registered
 * device cache - so a page refresh/reopen during an unclosed Owner
 * Access override left the browser as "owner" with zero re-auth.
 *
 * Bug #2 (App.tsx userRole formula): userRole reported "owner" purely
 * from sessionKind === "owner", regardless of whether access had
 * actually been granted - combined with the (now-removed) one-click
 * "Continue as Owner" button, this was a real no-password bypass.
 */

test("resolveMountSessionTrust: no live session defers to the existing no-session restore path", () => {
  const decision = resolveMountSessionTrust({ hasLiveSession: false, liveSessionIsDevice: false, hasDeviceCache: true });
  assert.equal(decision, "use_live_session");
});

test("resolveMountSessionTrust: a genuine live device session is trusted as-is", () => {
  const decision = resolveMountSessionTrust({ hasLiveSession: true, liveSessionIsDevice: true, hasDeviceCache: true });
  assert.equal(decision, "use_live_session");
});

test("resolveMountSessionTrust: owner's own browser with no device ever registered is trusted as-is", () => {
  const decision = resolveMountSessionTrust({ hasLiveSession: true, liveSessionIsDevice: false, hasDeviceCache: false });
  assert.equal(decision, "use_live_session");
});

test("resolveMountSessionTrust: BUG #1 - a leftover live owner session on a registered device must restore the device instead", () => {
  // This is the exact state after: register a device, enter an Owner
  // Access override, then refresh/reopen the tab instead of clicking
  // "Return to Staff Mode." The live session is the owner's, but this
  // browser has a device cache - it must never be trusted outright.
  const decision = resolveMountSessionTrust({ hasLiveSession: true, liveSessionIsDevice: false, hasDeviceCache: true });
  assert.equal(decision, "restore_device_cache");
});

test("isOwnerAccessGranted: BUG #2 - a live owner-identity session alone must not grant access", () => {
  // Staff Mode gate is configured (hasStaffPins) and no fresh
  // re-authentication (ownerBypass) has happened yet - merely holding a
  // valid owner JWT must not report granted access.
  const granted = isOwnerAccessGranted({ ownerBypass: false, sessionKind: "owner", hasStaffPins: true });
  assert.equal(granted, false);
});

test("isOwnerAccessGranted: a device session with no override is never granted", () => {
  const granted = isOwnerAccessGranted({ ownerBypass: false, sessionKind: "device", hasStaffPins: true });
  assert.equal(granted, false);
});

test("isOwnerAccessGranted: a fresh, successful re-authentication (ownerBypass) grants access on a device session", () => {
  const granted = isOwnerAccessGranted({ ownerBypass: true, sessionKind: "device", hasStaffPins: true });
  assert.equal(granted, true);
});

test("isOwnerAccessGranted: a fresh, successful re-authentication (ownerBypass) grants access on an owner session", () => {
  const granted = isOwnerAccessGranted({ ownerBypass: true, sessionKind: "owner", hasStaffPins: true });
  assert.equal(granted, true);
});

test("isOwnerAccessGranted: legacy single-operator convenience - no PIN gate configured at all, nothing to bypass", () => {
  const granted = isOwnerAccessGranted({ ownerBypass: false, sessionKind: "owner", hasStaffPins: false });
  assert.equal(granted, true);
});

test("isOwnerAccessGranted: a device session is never granted via the no-PIN-gate convenience (owner-only carve-out)", () => {
  const granted = isOwnerAccessGranted({ ownerBypass: false, sessionKind: "device", hasStaffPins: false });
  assert.equal(granted, false);
});
