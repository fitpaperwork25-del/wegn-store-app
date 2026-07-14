import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Verifies the caller's Supabase JWT server-side and resolves their
 * business_id via the existing auth_business_id() SQL function - the same
 * tenant-isolation boundary every other read in this app already relies
 * on. Returns null on any failure; callers must treat null as "reject the
 * request", never fall back to a default tenant or role.
 *
 * Not unit-tested directly - requires a live Supabase connection to verify
 * a real JWT. The logic here is intentionally thin (delegate to Supabase's
 * own auth verification and RPC call) specifically to keep the amount of
 * untested code on this path as small as possible.
 */
export type VerifiedRequest = {
  authUserId: string;
  businessId: string;
  /** A Supabase client scoped to the caller's own JWT - RLS applies to
   *  every query made with this client, exactly as it does for the app's
   *  own reads. Never use the service-role key for tool data queries. */
  supabase: SupabaseClient;
};

export async function verifyAuth(params: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  authorizationHeader: string | null;
}): Promise<VerifiedRequest | null> {
  if (!params.authorizationHeader) return null;

  const supabase = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: { headers: { Authorization: params.authorizationHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  const { data: businessId, error: bizErr } = await supabase.rpc("auth_business_id");
  if (bizErr || !businessId) return null;

  return { authUserId: userData.user.id, businessId: businessId as string, supabase };
}
