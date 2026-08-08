// Suggests real values for the Academy's own learner profile (see
// useGuideProgress's AcademyProfile), for the one place the Academy
// actually benefits from live identity: not making a Staff or Owner
// retype what the Store already knows about them.
//
// The Academy is otherwise intentionally backend-free (see
// GuideProgressContext's header comment) - this is a deliberate,
// minimal, read-only exception. It reuses the exact same `supabase`
// client and session the host app already authenticates with
// (Supabase persists the session in localStorage by default, so it's
// readable here too, even though the Academy is a separate standalone
// mount - see main.tsx).
//
// Importantly, this never assumes every learner is a Store employee:
// a Partner, Promoter, or other external trainee has no `employees`
// or `businesses` row to resolve from at all, and that's a normal,
// expected outcome here, not an error - the profile just stays
// self-entered for them. That's what makes future partner
// certification work with zero code changes: same profile shape,
// this resolver simply contributes nothing for an account it doesn't
// recognize, and the learner (or whoever sets them up) fills in the
// rest by hand.
//
// Never throws - a resolution failure (signed out, RLS denial,
// offline) just means the profile form stays exactly as it was:
// blank and editable, never a crash.

import { supabase } from "../../supabase";
import type { AcademyProfileRole } from "../context/useGuideProgress";

export interface ResolvedIdentity {
  /** A real full name, only when one genuinely exists (an employee's
   *  name on file). Null for an Owner - see the note in
   *  resolveLearnerIdentity - so the certificate never silently
   *  substitutes something that isn't actually the person's name. */
  fullName: string | null;
  email: string | null;
  /** The business name, suggested as the profile's Organization -
   *  never as a stand-in for a person's name. */
  organization: string | null;
  role: AcademyProfileRole | null;
}

const EMPTY_IDENTITY: ResolvedIdentity = { fullName: null, email: null, organization: null, role: null };

export async function resolveLearnerIdentity(): Promise<ResolvedIdentity> {
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
      return { fullName: employee.name, email: user.email ?? null, organization: business?.name ?? null, role: "staff" };
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (business) {
      // There is no full-name field anywhere in this schema for an
      // Owner (auth.signUp collects only email/password - see
      // AuthGate.tsx) - deliberately leaving fullName null rather than
      // guessing from the business name, which is often not a person's
      // name at all. The Owner types their own name into the profile
      // once; only the organization is safe to suggest automatically.
      return { fullName: null, email: user.email ?? null, organization: business.name, role: "owner" };
    }

    // Signed in, but neither an employee nor an owner record matched -
    // e.g. a future Partner/Promoter account type. Nothing to suggest
    // beyond the email; the rest is self-entered.
    return { fullName: null, email: user.email ?? null, organization: null, role: null };
  } catch {
    return EMPTY_IDENTITY;
  }
}
