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
  hasDeviceCache: boolean;
}): MountSessionDecision {
  if (!input.hasLiveSession) return "use_live_session";
  if (input.liveSessionIsDevice) return "use_live_session";
  if (input.hasDeviceCache) return "restore_device_cache";
  return "use_live_session";
}

export type OwnerAccessGrantedInput = {
  /** Set only by a successful, fresh Owner Access re-authentication (or its restore-to-false counterpart). */
  ownerBypass: boolean;
  sessionKind: "owner" | "device";
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
