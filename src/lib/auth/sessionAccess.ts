/**
 * Pure decision logic for Registered Store Device / Staff Mode session
 * trust and owner-access grants. Extracted from AuthGate.tsx/App.tsx so
 * the exact state transitions responsible for two confirmed owner-access
 * bypasses can be unit-tested without a live Supabase connection or a
 * DOM/React renderer - see sessionAccess.test.mjs.
 */

export type MountSessionDecision = "use_live_session" | "restore_device_cache";

/**
 * Bug #1 (AuthGate mount trust gap): on mount, a live, valid, non-device
 * Supabase session was always trusted outright, even on a browser that
 * has a registered device cache. Concretely: an owner starts an Owner
 * Access override, then refreshes or reopens the tab instead of clicking
 * "Return to Staff Mode" - the browser's persisted Supabase session is
 * still the owner's, and the app resumed as owner with zero re-auth,
 * because the device cache was only ever consulted when NO live session
 * existed at all (a fresh/logged-out browser), never to override an
 * already-live non-device session.
 *
 * Fix: a live non-device session on a browser that has a device cache
 * must never be trusted as standing elevation - it must restore the
 * device identity instead, so owner work always requires a fresh
 * re-authentication through the Owner Access modal.
 */
export function resolveMountSessionTrust(input: {
  hasLiveSession: boolean;
  liveSessionIsDevice: boolean;
  /**
   * True when the live session is an employee's own PIN-login identity
   * (Staff Mode Phase 2 - see supabase/migrations/20260720_employee_pin_hashing.sql
   * and supabase/functions/employee-pin-login). An employee session is
   * layered on top of a device or owner session the same way an Owner
   * Access override is - which means a browser with an employee session
   * live almost always also has a device cache sitting present. Without
   * this check, a mid-shift page refresh would incorrectly match the Bug
   * #1 condition below and kick the employee back to the device's own
   * Staff Mode session (the PIN screen), rather than staying signed in.
   * An employee session is trusted directly on mount, exactly like a
   * device session - restoration works because Supabase persists the
   * live session itself; nothing needs to be read back from a cache.
   */
  liveSessionIsEmployee: boolean;
  hasDeviceCache: boolean;
}): MountSessionDecision {
  if (!input.hasLiveSession) return "use_live_session";
  if (input.liveSessionIsDevice || input.liveSessionIsEmployee) return "use_live_session";
  if (input.hasDeviceCache) return "restore_device_cache";
  return "use_live_session";
}

export type OwnerAccessGrantedInput = {
  /** Set only by a successful, fresh Owner Access re-authentication (or its restore-to-false counterpart). */
  ownerBypass: boolean;
  /** "employee" (Staff Mode Phase 2) behaves exactly like "device" here -
   *  sessionKind === "owner" is false for both, so access is granted only
   *  via ownerBypass, never merely by holding the session. No logic
   *  change needed, just widening the type this already-correct
   *  comparison accepts. */
  sessionKind: "owner" | "device" | "employee";
  /** True when no PIN-enabled employees exist yet - the legacy single-operator convenience, where there is no Staff Mode gate to bypass in the first place. */
  hasStaffPins: boolean;
};

/**
 * Bug #2 (App.tsx userRole formula): userRole reported "owner" whenever
 * sessionKind === "owner", regardless of whether owner access had
 * actually been granted (ownerBypass) - i.e., merely holding a live,
 * valid owner-identity JWT was treated as equivalent to granted access.
 * This both mislabeled the header while the Staff Mode gate was still
 * showing, and made the (now-removed) one-click "Continue as Owner"
 * button a real, no-password bypass, because appUnlocked/userRole would
 * already report "owner" the instant that button flipped ownerBypass -
 * with no re-authentication step in between.
 *
 * Fix: "owner" is granted only via ownerBypass (now exclusively earned
 * through the Owner Access modal's real email/password re-auth) or the
 * legacy no-PIN-gate convenience. Holding a live owner session is never,
 * by itself, sufficient.
 */
export function isOwnerAccessGranted(input: OwnerAccessGrantedInput): boolean {
  return input.ownerBypass || (input.sessionKind === "owner" && !input.hasStaffPins);
}
