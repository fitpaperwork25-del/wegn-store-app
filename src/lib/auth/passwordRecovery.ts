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

/** Production-approved minimum (raised from the prior 6 - see the Phase 1
 *  security audit's M-1 finding: 6 characters is below current OWASP/NIST
 *  guidance for an account that can reach full tenant data and Owner
 *  Access override). Applies only to NEW passwords being chosen (sign-up,
 *  password reset) - never to the login field, so an existing account
 *  whose password predates this change can still sign in. */
export const MIN_PASSWORD_LENGTH = 10;

/** Length-only check, reused by both the sign-up form (single password
 *  field, no confirm field) and validateNewPassword below (which also
 *  needs the confirm-match check). Kept separate so each caller only
 *  pulls in the validation it actually needs. */
export function validatePasswordLength(password: string): NewPasswordValidationResult {
  if (!password) {
    return { ok: false, error: "Please enter a password." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }
  return { ok: true };
}

export function validateNewPassword(password: string, confirmPassword: string): NewPasswordValidationResult {
  if (!password || !confirmPassword) {
    return { ok: false, error: "Please enter and confirm your new password." };
  }
  const lengthResult = validatePasswordLength(password);
  if (!lengthResult.ok) return lengthResult;
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
