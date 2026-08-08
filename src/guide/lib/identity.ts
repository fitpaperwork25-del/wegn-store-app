// Resolves the real signed-in person's name and business, for the one
// place the Academy actually needs live identity: auto-filling a
// certificate recipient's name instead of leaving it blank.
//
// The Academy is otherwise intentionally backend-free (see
// GuideProgressContext's header comment) - this is the one deliberate,
// minimal, read-only exception, because a blank certificate name is a
// real defect, not a missing feature. It reuses the exact same
// `supabase` client and session the host app already authenticates
// with (Supabase persists the session in localStorage by default, so
// it's readable here too, even though the Academy is a separate
// standalone mount - see main.tsx).
//
// Covers both real-world identities in this schema:
// - An employee signed in via PIN (Staff Mode): resolved by
//   `employees.auth_user_id`, which the employee-pin-login Edge
//   Function sets at login (see supabase/functions/employee-pin-login).
// - The account Owner: there is no full-name field anywhere in this
//   schema (auth.signUp collects only email/password - see
//   AuthGate.tsx), so the email's local part is the best real signal
//   available, the same fallback Wegn AI's Executive Briefing already
//   uses (`deriveGreetingName` in executiveBriefing.ts).
//
// Never throws - a resolution failure (signed out, RLS denial, offline)
// just means the certificate name field stays editable and blank,
// exactly like today, rather than breaking the page.

import { supabase } from "../../supabase";

export interface LearnerIdentity {
  name: string | null;
  businessName: string | null;
}

const EMPTY_IDENTITY: LearnerIdentity = { name: null, businessName: null };

export async function resolveLearnerIdentity(): Promise<LearnerIdentity> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return EMPTY_IDENTITY;

    const { data: employee } = await supabase
      .from("employees")
      .select("name, business_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (employee?.name) {
      const { data: business } = await supabase
        .from("businesses")
        .select("name")
        .eq("id", employee.business_id)
        .maybeSingle();
      return { name: employee.name, businessName: business?.name ?? null };
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("owner_id", user.id)
      .maybeSingle();
    const emailLocalPart = user.email ? user.email.split("@")[0] : null;
    return { name: emailLocalPart, businessName: business?.name ?? null };
  } catch {
    return EMPTY_IDENTITY;
  }
}
