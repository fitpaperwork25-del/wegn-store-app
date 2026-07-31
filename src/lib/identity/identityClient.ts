import { supabase } from "../../supabase";

/**
 * WEGN Identity Service integration, Sprint 2 Task 4 - links the
 * caller's own Wegn Store owner account to WEGN Identity. Mirrors
 * QRWegn's own linkIdentityAccount() exactly, which itself mirrors
 * registerBusinessWithWsms() above. See supabase/functions/
 * link-identity-account/index.ts for the server-side half of this
 * contract.
 *
 * Cross-product signup Phase A: now returns its result instead of void,
 * so a caller (AuthGate.tsx's signup branch) can decide whether it's
 * safe to proceed to registerBusinessWithIdentity() below -
 * register-business-link requires an existing account_links row and
 * 409s otherwise, so business linking must never be attempted before
 * this succeeds. Still never throws and still safe to call
 * fire-and-forget (`void linkIdentityAccount()`) wherever the caller
 * doesn't need the result, e.g. the standalone owner login.
 */
export type LinkIdentityAccountResult = { ok: boolean; wegnAccountId: string | null };

export async function linkIdentityAccount(): Promise<LinkIdentityAccountResult> {
  try {
    const { data, error } = await supabase.functions.invoke("link-identity-account", {});
    if (error) {
      console.error("[linkIdentityAccount] link failed (non-blocking):", error);
      return { ok: false, wegnAccountId: null };
    }
    return { ok: !!data?.ok, wegnAccountId: data?.wegnAccountId ?? null };
  } catch (err) {
    console.error("[linkIdentityAccount] link failed (non-blocking):", err);
    return { ok: false, wegnAccountId: null };
  }
}

/**
 * Cross-product signup Phase A / Phase C stub: registers the caller's
 * own business with WEGN Identity's canonical Business Registry (see
 * supabase/functions/register-business-with-identity/index.ts, Sprint 5
 * Phase 1C). This is what makes a business appear in WEGN Home's
 * portfolio.
 *
 * PHASE C PLACEHOLDER - decision not yet made: that Edge Function's own
 * header comment says this was deliberately NOT wired to any automatic
 * trigger, since register-business-link's envelope requires
 * ownerConfirmed: true and the Business Registry contract calls for a
 * deliberate owner action. This client is now called automatically,
 * immediately after a successful linkIdentityAccount(), from
 * AuthGate.tsx's signup branch - not from any explicit
 * owner-confirmation UI, because none exists yet. If a future decision
 * requires explicit confirmation instead, move this call (and only this
 * call) behind that UI; nothing else in this chain needs to change.
 */
export type RegisterBusinessWithIdentityResult = { ok: boolean; wegnBusinessId: string | null };

export async function registerBusinessWithIdentity(businessId: string): Promise<RegisterBusinessWithIdentityResult> {
  try {
    const { data, error } = await supabase.functions.invoke("register-business-with-identity", {
      body: { businessId },
    });
    if (error) {
      console.error("[registerBusinessWithIdentity] link failed (non-blocking):", error);
      return { ok: false, wegnBusinessId: null };
    }
    return { ok: !!data?.ok, wegnBusinessId: data?.wegnBusinessId ?? null };
  } catch (err) {
    console.error("[registerBusinessWithIdentity] link failed (non-blocking):", err);
    return { ok: false, wegnBusinessId: null };
  }
}
