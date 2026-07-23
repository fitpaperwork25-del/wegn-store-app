import { supabase } from "../../supabase";

/**
 * WEGN Identity Service integration, Sprint 2 Task 4 - fire-and-forget
 * from the standalone owner login (AuthGate.tsx's handleSubmit), mirroring
 * QRWegn's own linkIdentityAccount() exactly, which itself mirrors
 * registerBusinessWithWsms() above. A failure here must never be visible
 * to the person logging in, never delay anything, and never throw - see
 * supabase/functions/link-identity-account/index.ts for the server-side
 * half of this contract.
 */
export async function linkIdentityAccount(): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("link-identity-account", {});
    if (error) console.error("[linkIdentityAccount] link failed (non-blocking):", error);
  } catch (err) {
    console.error("[linkIdentityAccount] link failed (non-blocking):", err);
  }
}
