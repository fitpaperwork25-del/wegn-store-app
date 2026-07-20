import { supabase } from "../../supabase";

/**
 * WSMS integration, observe-only phase - see supabase/functions/
 * check-subscription. Never throws; a failure here must not be able to
 * affect anything else in the app, matching the endpoint's own
 * fail-quiet-to-"unknown" behavior.
 *
 * checkSubscription() has an explicit timeout and one retry - a hanging
 * or transiently-failing WSMS call must never hang the app itself, and
 * a single retry gives a real network blip a second chance without
 * looping indefinitely.
 */
export type SubscriptionCheckResult = {
  known: boolean;
  active: boolean | null;
  status: string | null;
  currentPeriodEnd?: string | null;
  gracePeriodEndsAt?: string | null;
};

const UNKNOWN_RESULT: SubscriptionCheckResult = { known: false, active: null, status: null, currentPeriodEnd: null, gracePeriodEndsAt: null };

const CHECK_TIMEOUT_MS = 6000;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function invokeCheckOnce(): Promise<SubscriptionCheckResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const { data, error } = await supabase.functions.invoke("check-subscription", { body: {}, signal: controller.signal });
    if (error || !data) return null;
    return {
      known: !!data.known,
      active: data.active ?? null,
      status: data.status ?? null,
      currentPeriodEnd: data.currentPeriodEnd ?? null,
      gracePeriodEndsAt: data.gracePeriodEndsAt ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSubscription(): Promise<SubscriptionCheckResult> {
  const first = await invokeCheckOnce();
  if (first) return first;
  await sleep(RETRY_DELAY_MS);
  const second = await invokeCheckOnce();
  return second ?? UNKNOWN_RESULT;
}

/**
 * Registers a business as a WSMS trialing subscriber. Fire-and-forget by
 * design at every call site - a failure here must never block business
 * creation, which has already succeeded by the time this is called.
 * Never throws. The business's display name is looked up server-side
 * (via the caller's own RLS-scoped session, which also enforces that
 * the caller actually owns this business) - not passed from here.
 */
export async function registerBusinessWithWsms(businessId: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("register-with-wsms", {
      body: { businessId },
    });
    if (error) console.error("[registerBusinessWithWsms] registration failed (non-blocking):", error);
  } catch (err) {
    console.error("[registerBusinessWithWsms] registration failed (non-blocking):", err);
  }
}
