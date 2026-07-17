import { supabase } from "../../supabase";

/**
 * Thin client for the register-device / revoke-device Edge Functions.
 * Matches the existing supabase.functions.invoke(...) pattern (see
 * ../copilot/copilotClient.ts) - the Supabase client automatically
 * forwards the caller's session JWT, which both functions verify
 * server-side and require to belong to the business's real owner before
 * doing anything else.
 */

export type RegisterDeviceResult =
  | { ok: true; deviceId: string; deviceLabel: string; accessToken: string; refreshToken: string }
  | { ok: false; error: string };

export async function registerDevice(deviceLabel: string): Promise<RegisterDeviceResult> {
  const { data, error } = await supabase.functions.invoke("register-device", {
    body: { deviceLabel },
  });
  if (error) return { ok: false, error: `Could not register device: ${error.message}` };
  if (data?.error) return { ok: false, error: data.error as string };
  return {
    ok: true,
    deviceId: data.deviceId as string,
    deviceLabel: data.deviceLabel as string,
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
  };
}

export type RevokeDeviceResult = { ok: true } | { ok: false; error: string };

export async function revokeDevice(deviceId: string): Promise<RevokeDeviceResult> {
  const { data, error } = await supabase.functions.invoke("revoke-device", {
    body: { deviceId },
  });
  if (error) return { ok: false, error: `Could not revoke device: ${error.message}` };
  if (data?.error) return { ok: false, error: data.error as string };
  return { ok: true };
}
