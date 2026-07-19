/**
 * Pure, stateless helpers for the password-recovery flow. Extracted from
 * AuthGate.tsx so the URL-detection and new-password validation rules can
 * be unit-tested without a live Supabase connection or a DOM/React
 * renderer - see passwordRecovery.test.ts.
 *
 * Detecting a recovery link from the URL is a best-effort, same-tick
 * signal, checked alongside (not instead of) Supabase's own
 * PASSWORD_RECOVERY auth event in AuthGate.tsx - the event is the
 * authoritative signal (fired by the SDK once it finishes establishing the
 * recovery session), but the SDK also strips the recovery params from the
 * URL as part of that same process, so this URL check is a redundant,
 * same-render-cycle fallback for the moment just before that event fires.
 */

export function isPasswordRecoveryUrl(location: Pick<Location, "hash" | "search"> = window.location): boolean {
  return location.hash.includes("type=recovery") || location.search.includes("type=recovery");
}

export type NewPasswordValidationResult = { ok: true } | { ok: false; error: string };

/** Matches the minimum the existing sign-up form's own minLength already
 *  assumes (and Supabase's own default) - not a new rule being introduced. */
export const MIN_PASSWORD_LENGTH = 6;

export function validateNewPassword(password: string, confirmPassword: string): NewPasswordValidationResult {
  if (!password || !confirmPassword) {
    return { ok: false, error: "Please enter and confirm your new password." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: "Passwords do not match." };
  }
  return { ok: true };
}

export type EmailValidationResult = { ok: true } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRecoveryEmail(email: string): EmailValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { ok: false, error: "Please enter your email address." };
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  return { ok: true };
}

/**
 * Where Supabase's recovery email links back to. Hardcoded to the live
 * production URL rather than window.location.origin - a recovery email
 * must always return the user to the real app regardless of what host
 * (e.g. localhost during development) issued the request.
 */
export const PRODUCTION_APP_URL = "https://wegn-store-app.vercel.app";
