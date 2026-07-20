import { supabase } from "../../supabase";

/**
 * Thin client for the employee-pin-login / set-employee-pin Edge
 * Functions. Matches the existing supabase.functions.invoke(...) pattern
 * (see ../devices/deviceClient.ts) - the Supabase client automatically
 * forwards the caller's session JWT.
 */

export type EmployeePinLoginResult =
  | { ok: true; accessToken: string; refreshToken: string; employeeId: string; name: string; role: string }
  | { ok: false; error: string };

export async function employeePinLogin(employeeCode: string, pin: string): Promise<EmployeePinLoginResult> {
  const { data, error } = await supabase.functions.invoke("employee-pin-login", {
    body: { employeeCode, pin },
  });
  if (error) return { ok: false, error: "Could not sign in - try again" };
  if (data?.error) return { ok: false, error: data.error as string };
  return {
    ok: true,
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
    employeeId: data.employeeId as string,
    name: data.name as string,
    role: data.role as string,
  };
}

export type SetEmployeePinResult = { ok: true } | { ok: false; error: string };

export async function setEmployeePin(employeeId: string, pin: string): Promise<SetEmployeePinResult> {
  const { data, error } = await supabase.functions.invoke("set-employee-pin", {
    body: { employeeId, pin },
  });
  if (error) return { ok: false, error: `Could not set PIN: ${error.message}` };
  if (data?.error) return { ok: false, error: data.error as string };
  return { ok: true };
}
