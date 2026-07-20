import { supabase } from "../../supabase";

/**
 * WSMS integration, observe-only phase - see supabase/functions/
 * check-subscription. Never throws; a failure here must not be able to
 * affect anything else in the app, matching the endpoint's own
 * fail-quiet-to-"unknown" behavior.
 */
export type SubscriptionCheckResult = {
  known: boolean;
  active: boolean | null;
  status: string | null;
  currentPeriodEnd?: string | null;
};

const UNKNOWN_RESULT: SubscriptionCheckResult = { known: false, active: null, status: null };

export async function checkSubscription(): Promise<SubscriptionCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke("check-subscription", { body: {} });
    if (error || !data) return UNKNOWN_RESULT;
    return {
      known: !!data.known,
      active: data.active ?? null,
      status: data.status ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
    };
  } catch {
    return UNKNOWN_RESULT;
  }
}
