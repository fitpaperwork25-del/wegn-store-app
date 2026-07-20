import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import App from "./App";
import { resolveMountSessionTrust } from "./lib/auth/sessionAccess";
import { isPasswordRecoveryUrl, validateNewPassword, validateRecoveryEmail, PRODUCTION_APP_URL } from "./lib/auth/passwordRecovery";

// Registered Store Device / Staff Mode (Option A - shared device identity).
// See supabase/migrations/20260716_registered_device_staff_mode.sql.
//
// Supabase's client only ever holds ONE live session at a time. On a
// shared store device that session is normally the device's own minimal
// Supabase Auth identity (auth_user_id in device_registrations), so the
// Employee ID + PIN screen (inside App) can render without the owner ever
// signing in on that browser. This cache is what lets that device session
// survive a temporary Owner Access override: entering Owner Access swaps
// the live session to the owner's real account, which discards the
// device's tokens from Supabase's own storage - so the latest known-good
// device tokens are mirrored here on every device-session auth event, and
// restored from here when the owner returns to Staff Mode.
//
// This is a cache of a real, revocable Supabase session - not a bare
// trust flag. Restoring from it re-authenticates via setSession(), which
// fails immediately if the device has since been revoked (revoke-device
// bans the underlying auth identity), so a stale/invalid cache can never
// grant access on its own.
const DEVICE_SESSION_CACHE_KEY = "wegn_device_session_v1";

type CachedDeviceSession = { accessToken: string; refreshToken: string };

function readDeviceSessionCache(): CachedDeviceSession | null {
  try {
    const raw = window.localStorage.getItem(DEVICE_SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.accessToken === "string" && typeof parsed?.refreshToken === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeDeviceSessionCache(tokens: CachedDeviceSession) {
  try {
    window.localStorage.setItem(DEVICE_SESSION_CACHE_KEY, JSON.stringify(tokens));
  } catch {
    // Best-effort - a failed cache write only affects whether Owner Access
    // can restore the device session afterward, never current access.
  }
}

function clearDeviceSessionCache() {
  try {
    window.localStorage.removeItem(DEVICE_SESSION_CACHE_KEY);
  } catch {
    // Ignore - nothing to clean up if storage is unavailable.
  }
}

function isDeviceUser(user: User | null): boolean {
  return !!user && (user.user_metadata as Record<string, unknown> | undefined)?.kind === "device";
}

// Employee PIN login (Staff Mode Phase 2 - see
// supabase/migrations/20260720_employee_pin_hashing.sql and
// supabase/functions/employee-pin-login). A parallel, independent
// instance of the device-cache/override pattern above, not a
// modification to it: an employee session is layered on top of
// whichever session (device's or owner's un-overridden own) was already
// live, the same shape as Owner Access override layering on top of a
// device session. Kept as its own cache key and its own pair of
// functions deliberately - the owner-override code above is
// bug-sensitive (see sessionAccess.ts's documented Bug #1/#2), and this
// case differs from it in one load-bearing way: the "parent" session
// here can be either a device session OR the owner's own un-overridden
// session (the PIN screen already renders on both today when
// hasStaffPins is true), which DEVICE_SESSION_CACHE_KEY was never
// designed to capture.
const EMPLOYEE_PARENT_SESSION_CACHE_KEY = "wegn_employee_parent_session_v1";

function readEmployeeParentSessionCache(): CachedDeviceSession | null {
  try {
    const raw = window.localStorage.getItem(EMPLOYEE_PARENT_SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.accessToken === "string" && typeof parsed?.refreshToken === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeEmployeeParentSessionCache(tokens: CachedDeviceSession) {
  try {
    window.localStorage.setItem(EMPLOYEE_PARENT_SESSION_CACHE_KEY, JSON.stringify(tokens));
  } catch {
    // Best-effort - a failed cache write only affects whether exiting the
    // employee session can restore the parent session afterward, never
    // the employee session that's about to become live.
  }
}

function clearEmployeeParentSessionCache() {
  try {
    window.localStorage.removeItem(EMPLOYEE_PARENT_SESSION_CACHE_KEY);
  } catch {
    // Ignore - nothing to clean up if storage is unavailable.
  }
}

function isEmployeeUser(user: User | null): boolean {
  return !!user && (user.user_metadata as Record<string, unknown> | undefined)?.kind === "employee";
}

export default function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [restoringDevice, setRestoringDevice] = useState(true);
  const [overrideActive, setOverrideActive] = useState(false);
  // State-model fix: overrideActive alone does not say whether the current
  // owner elevation has an actual registered-device session to return to.
  // It's set the instant a device cache exists at the moment Owner Access
  // is entered (enterOwnerOverride) - a standalone owner login (the
  // owner's own browser, never a registered device) has no device to
  // return to, so "Return to Staff Mode" must not be offered for it, and
  // restoreDeviceSession's "no device found" error must never surface for
  // a state where that action was never actually available.
  const [canReturnToStaffMode, setCanReturnToStaffMode] = useState(false);
  const restoreAttempted = useRef(false);

  // Password recovery: a recovery-link session must never fall through to
  // the normal signed-in App render (that would silently "log the user in"
  // without ever letting them set a new password). Lazy-initialized from
  // the URL so the very first render already knows, in addition to the
  // authoritative PASSWORD_RECOVERY event handled in onAuthStateChange below.
  const [passwordRecovery, setPasswordRecovery] = useState(() => isPasswordRecoveryUrl());
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");

  // Forgot password: a small "request a reset email" form shown inline on
  // the sign-in card, distinct from the passwordRecovery screen above
  // (which only appears after the user has already clicked the emailed
  // link). Its own email field, not the sign-in form's, since it must
  // still work even if the sign-in email field is empty or wrong.
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user ?? null;
      const cachedBeforeDecision = readDeviceSessionCache();
      const decision = resolveMountSessionTrust({
        hasLiveSession: !!sessionUser,
        liveSessionIsDevice: isDeviceUser(sessionUser),
        liveSessionIsEmployee: isEmployeeUser(sessionUser),
        hasDeviceCache: !!cachedBeforeDecision,
      });

      if (decision === "use_live_session" && sessionUser) {
        if (isDeviceUser(sessionUser) && data.session) {
          writeDeviceSessionCache({ accessToken: data.session.access_token, refreshToken: data.session.refresh_token });
        }
        setUser(sessionUser);
        setLoading(false);
        setRestoringDevice(false);
        return;
      }

      if (decision === "restore_device_cache" && cachedBeforeDecision) {
        // A live session exists but it is NOT this browser's registered
        // device - most concretely, an Owner Access override that was
        // never explicitly ended (page refreshed/reopened instead of
        // clicking "Return to Staff Mode"). A leftover live session must
        // never stand in for a fresh re-authentication, so it is
        // discarded here in favor of the device's own identity.
        restoreAttempted.current = true;
        const { data: restored, error: restoreErr } = await supabase.auth.setSession({
          access_token: cachedBeforeDecision.accessToken,
          refresh_token: cachedBeforeDecision.refreshToken,
        });
        if (restoreErr || !restored.session) {
          clearDeviceSessionCache();
          setUser(null);
        } else {
          writeDeviceSessionCache({ accessToken: restored.session.access_token, refreshToken: restored.session.refresh_token });
          setUser(restored.session.user);
        }
        setLoading(false);
        setRestoringDevice(false);
        return;
      }

      // No live session on this browser - if a device was previously
      // registered here, restore it automatically so a refresh or a
      // reopened tab lands back in Staff Mode, never the public owner
      // form. setSession re-authenticates against Supabase; a revoked or
      // banned device fails here and the cache is discarded.
      if (!restoreAttempted.current) {
        restoreAttempted.current = true;
        const cached = cachedBeforeDecision;
        if (cached) {
          const { data: restored, error: restoreErr } = await supabase.auth.setSession({
            access_token: cached.accessToken,
            refresh_token: cached.refreshToken,
          });
          if (restoreErr || !restored.session) {
            clearDeviceSessionCache();
          } else {
            writeDeviceSessionCache({ accessToken: restored.session.access_token, refreshToken: restored.session.refresh_token });
          }
        }
      }
      setLoading(false);
      setRestoringDevice(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Supabase has established a temporary recovery session - hold here
        // on the Set New Password screen rather than treating this like a
        // normal sign-in (the mount effect above may otherwise have already
        // set loading/restoringDevice false with no session; this covers it).
        setPasswordRecovery(true);
        setLoading(false);
        setRestoringDevice(false);
        return;
      }
      const sessionUser = session?.user ?? null;
      if (isDeviceUser(sessionUser) && session) {
        writeDeviceSessionCache({ accessToken: session.access_token, refreshToken: session.refresh_token });
      }
      setUser(sessionUser);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!email.trim() || !password) return;
    setSubmitting(true);

    if (mode === "signup") {
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (signUpErr) {
        setError(signUpErr.message);
        setSubmitting(false);
        return;
      }
      if (signUpData.session && signUpData.user) {
        // Email confirmation disabled — session is live, create the business now.
        const { error: bizErr } = await supabase.from("businesses").insert({
          owner_id: signUpData.user.id,
          name: "My Store",
        });
        if (bizErr) {
          setError("Account created but store setup failed: " + bizErr.message);
        }
        // onAuthStateChange will fire and render App automatically.
      } else {
        // Email confirmation is required — no session yet, business will be created
        // after the user confirms and logs in (App shows "Set Up Your Business").
        setSuccessMsg("Account created — please check your email to confirm, then sign in.");
        setEmail("");
        setPassword("");
        setMode("login");
      }
      setSubmitting(false);
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setError(signInErr.message);
    }
    setSubmitting(false);
  }

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setRecoveryError("");
    const validation = validateNewPassword(newPassword, confirmNewPassword);
    if (!validation.ok) {
      setRecoveryError(validation.error);
      return;
    }
    setRecoverySubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    if (updateErr) {
      setRecoveryError(updateErr.message);
      setRecoverySubmitting(false);
      return;
    }
    await supabase.auth.signOut();
    setNewPassword("");
    setConfirmNewPassword("");
    setRecoverySubmitting(false);
    setRecoveryError("");
    setPasswordRecovery(false);
    setUser(null);
    setEmail("");
    setPassword("");
    setMode("login");
    setSuccessMsg("Your password has been updated. Please sign in with your new password.");
    window.history.replaceState(null, "", window.location.pathname);
  }

  function openForgotPassword() {
    setForgotEmail(email);
    setForgotError("");
    setForgotSuccess("");
    setShowForgotPassword(true);
  }

  function closeForgotPassword() {
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotSubmitting(false);
    setForgotError("");
    setForgotSuccess("");
  }

  async function handleForgotPassword() {
    setForgotError("");
    setForgotSuccess("");
    const validation = validateRecoveryEmail(forgotEmail);
    if (!validation.ok) {
      setForgotError(validation.error);
      return;
    }
    setForgotSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: PRODUCTION_APP_URL,
    });
    setForgotSubmitting(false);
    if (resetErr) {
      setForgotError(resetErr.message);
      return;
    }
    // Deliberately generic - Supabase itself does not error for an unknown
    // email (to avoid confirming which addresses have accounts), so this
    // message must never imply "your account was found."
    setForgotSuccess("If an account exists for that email, a password reset link has been sent.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setOverrideActive(false);
    setCanReturnToStaffMode(false);
    setUser(null);
  }

  // Owner Access: re-authenticates as the real owner. Two distinct
  // situations reach this same function, and the resulting state must
  // keep them distinguishable afterward:
  //   - a temporary elevation OVER an existing registered device session
  //     (the device's tokens are already mirrored in the cache - see
  //     onAuthStateChange above - so there is something for
  //     restoreDeviceSession() to hand the browser back to), vs.
  //   - a standalone owner login on a browser that was never a
  //     registered device (no cache exists, nothing to "return" to).
  // canReturnToStaffMode records which one this is, captured from the
  // cache's presence at the moment BEFORE the sign-in swap (signing in as
  // owner never touches the device cache either way, so before/after
  // would agree here - "before" is used because it's the plain, direct
  // answer to "was there a device session being elevated from").
  async function enterOwnerOverride(ownerEmail: string, ownerPassword: string): Promise<{ error?: string }> {
    const hadDeviceSession = !!readDeviceSessionCache();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: ownerEmail.trim(),
      password: ownerPassword,
    });
    if (signInErr) return { error: signInErr.message };
    setOverrideActive(true);
    setCanReturnToStaffMode(hadDeviceSession);
    return {};
  }

  // Returns from an Owner Access override back to the device's own Staff
  // Mode session. Only ever called from UI that first checks
  // canReturnToStaffMode (see App.tsx), so reaching here with no cache
  // would itself indicate a state-tracking bug rather than an expected
  // user-facing outcome - the error text is kept as a fail-closed safety
  // net, not a message users are expected to see.
  async function restoreDeviceSession(): Promise<{ ok: boolean; error?: string }> {
    const cached = readDeviceSessionCache();
    if (!cached) return { ok: false, error: "No registered device session found on this browser." };
    const { data: restored, error: restoreErr } = await supabase.auth.setSession({
      access_token: cached.accessToken,
      refresh_token: cached.refreshToken,
    });
    if (restoreErr || !restored.session) {
      clearDeviceSessionCache();
      return { ok: false, error: "This device's registration is no longer valid. Register a new device from Settings." };
    }
    writeDeviceSessionCache({ accessToken: restored.session.access_token, refreshToken: restored.session.refresh_token });
    setOverrideActive(false);
    setCanReturnToStaffMode(false);
    return { ok: true };
  }

  // Used by the owner-facing device management UI right after
  // register-device succeeds - makes the newly registered device this
  // browser's live session immediately.
  async function activateDeviceSession(tokens: { accessToken: string; refreshToken: string }): Promise<{ ok: boolean; error?: string }> {
    const { data: activated, error: activateErr } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (activateErr || !activated.session) {
      return { ok: false, error: activateErr?.message ?? "Could not activate the device session." };
    }
    writeDeviceSessionCache({ accessToken: activated.session.access_token, refreshToken: activated.session.refresh_token });
    setOverrideActive(false);
    setCanReturnToStaffMode(false);
    return { ok: true };
  }

  // Employee PIN login: captures whichever session is currently live
  // (device's or the owner's own un-overridden session - both are valid
  // "parents" the PIN screen can render under) before swapping to the
  // employee's session, mirroring enterOwnerOverride's capture-before-swap
  // idiom but generalized to capture whichever session is live rather
  // than assuming a device.
  async function enterEmployeeSession(tokens: { accessToken: string; refreshToken: string }): Promise<{ ok: boolean; error?: string }> {
    const { data: currentSession } = await supabase.auth.getSession();
    if (currentSession.session) {
      writeEmployeeParentSessionCache({
        accessToken: currentSession.session.access_token,
        refreshToken: currentSession.session.refresh_token,
      });
    }
    const { data: activated, error: activateErr } = await supabase.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    if (activateErr || !activated.session) {
      clearEmployeeParentSessionCache();
      return { ok: false, error: activateErr?.message ?? "Could not start the employee session." };
    }
    return { ok: true };
  }

  // Returns from an employee session back to whichever session (device's
  // or owner's) was live before the employee logged in. Mirrors
  // restoreDeviceSession(); only ever called from UI reached while an
  // employee session is genuinely live, so reaching here with no cache
  // would itself indicate a state-tracking bug, not an expected
  // user-facing outcome.
  async function exitEmployeeSession(): Promise<{ ok: boolean; error?: string }> {
    const cached = readEmployeeParentSessionCache();
    if (!cached) return { ok: false, error: "No prior session found on this browser." };
    const { data: restored, error: restoreErr } = await supabase.auth.setSession({
      access_token: cached.accessToken,
      refresh_token: cached.refreshToken,
    });
    clearEmployeeParentSessionCache();
    if (restoreErr || !restored.session) {
      return { ok: false, error: "Could not return to the previous session. Please sign in again." };
    }
    if (isDeviceUser(restored.session.user)) {
      writeDeviceSessionCache({ accessToken: restored.session.access_token, refreshToken: restored.session.refresh_token });
    }
    return { ok: true };
  }

  if (passwordRecovery) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div style={{ width: "100%", maxWidth: "380px", padding: "40px 32px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Set New Password</h1>
            <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>Choose a new password for your account.</p>
          </div>

          <form onSubmit={handleSetNewPassword}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Confirm password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              />
            </div>

            {recoveryError && (
              <div style={{ padding: "8px 12px", marginBottom: "14px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "13px" }}>
                {recoveryError}
              </div>
            )}

            <button
              type="submit"
              disabled={recoverySubmitting}
              style={{
                width: "100%", padding: "10px", background: "#1d4ed8", color: "#fff", border: "none",
                borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: recoverySubmitting ? "not-allowed" : "pointer",
                opacity: recoverySubmitting ? 0.7 : 1,
              }}
            >
              {recoverySubmitting ? "Please wait..." : "Set New Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading || restoringDevice) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#64748b", fontSize: "16px" }}>Loading...</p>
      </div>
    );
  }

  if (user) {
    return (
      <App
        userId={user.id}
        userEmail={user.email ?? ""}
        onSignOut={handleSignOut}
        sessionKind={isDeviceUser(user) ? "device" : isEmployeeUser(user) ? "employee" : "owner"}
        overrideActive={overrideActive}
        canReturnToStaffMode={canReturnToStaffMode}
        enterOwnerOverride={enterOwnerOverride}
        restoreDeviceSession={restoreDeviceSession}
        activateDeviceSession={activateDeviceSession}
        enterEmployeeSession={enterEmployeeSession}
        exitEmployeeSession={exitEmployeeSession}
      />
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
      <div style={{ width: "100%", maxWidth: "380px", padding: "40px 32px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src="/logo.png" alt="" style={{ height: "56px", marginBottom: "12px" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Wegn-Store</h1>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "4px" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          {mode === "login" && !showForgotPassword && (
            <div style={{ textAlign: "right", margin: "-10px 0 14px" }}>
              <button
                type="button"
                onClick={openForgotPassword}
                style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontSize: "13px", padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {mode === "login" && showForgotPassword && (
            <div style={{ marginBottom: "20px", padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
              <p style={{ fontSize: "13px", color: "#374151", margin: "0 0 10px", fontWeight: 500 }}>Reset your password</p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box", marginBottom: "10px" }}
              />

              {forgotSuccess && (
                <div style={{ padding: "8px 12px", marginBottom: "10px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontSize: "13px" }}>
                  {forgotSuccess}
                </div>
              )}

              {forgotError && (
                <div style={{ padding: "8px 12px", marginBottom: "10px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "13px" }}>
                  {forgotError}
                </div>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotSubmitting}
                  style={{
                    flex: 1, padding: "9px", background: "#1d4ed8", color: "#fff", border: "none",
                    borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: forgotSubmitting ? "not-allowed" : "pointer",
                    opacity: forgotSubmitting ? 0.7 : 1,
                  }}
                >
                  {forgotSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  style={{ padding: "9px 12px", background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: "8px 12px", marginBottom: "14px", background: "#f0fdf4", color: "#15803d", borderRadius: "6px", fontSize: "13px" }}>
              {successMsg}
            </div>
          )}

          {error && (
            <div style={{ padding: "8px 12px", marginBottom: "14px", background: "#fef2f2", color: "#b91c1c", borderRadius: "6px", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%", padding: "10px", background: "#1d4ed8", color: "#fff", border: "none",
              borderRadius: "6px", fontSize: "15px", fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b", marginTop: "16px" }}>
          {mode === "login" ? (
            <>No account? <button onClick={() => { setMode("signup"); setError(""); setSuccessMsg(""); }} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 600, fontSize: "13px", padding: 0 }}>Sign up</button></>
          ) : (
            <>Already have an account? <button onClick={() => { setMode("login"); setError(""); setSuccessMsg(""); }} style={{ background: "none", border: "none", color: "#1d4ed8", cursor: "pointer", fontWeight: 600, fontSize: "13px", padding: 0 }}>Sign in</button></>
          )}
        </p>
      </div>
    </div>
  );
}
