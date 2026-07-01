# Wegn Partners — Integration Status

**Status:** BLOCKED — pre-existing issues must be resolved inside the Wegn Partners repository before Platform Admin connects.

**Reported by:** Platform Admin health check  
**Date identified:** 2026-06-30  
**Target repository:** `mgtplatform/qrwegn-partners`

---

## Open Issues

### Issue 1 — Admin Credentials Route to the Partner Portal

**Severity:** High  
**File:** `src/pages/LoginPage.jsx`, `src/App.jsx`

The Admin / Partner mode toggle on the login screen is cosmetic only. It changes the email placeholder text but does not affect authentication or role routing in any way. The actual role is resolved from `profiles.role` in the database after login succeeds.

**Observed behaviour:** When an admin account is authenticated, role routing depends entirely on the `profiles` table. If the profiles fetch times out (2.5 s race condition) or returns no row, the fallback `|| "partner"` in `App.jsx` silently grants partner-level access to any authenticated user — including admin accounts that do not have a complete profile row.

**Expected behaviour:** Failed or missing profile lookups should sign the user out and return them to the login screen, not grant a default role.

**Action required (inside Wegn Partners repo):**
- Remove the cosmetic Admin/Partner mode toggle from `LoginPage.jsx`
- Replace `profileData?.role || "partner"` with a hard failure — sign out and surface an error if no role is resolved
- Apply the same fix in both the login path and the session-restore path in `App.jsx`

---

### Issue 2 — Admin Dashboard Accessibility

**Severity:** Medium  
**File:** `src/App.jsx`

Because of Issue 1, any admin credential that does not have a valid `profiles` row will land in the Partner Portal (`PartnerPortal.jsx`) rather than the admin dashboard (`LightDashboard.jsx`). The admin dashboard is unreachable for that account without a database fix.

**Action required (inside Wegn Partners repo):**
- Confirm that all admin accounts have a corresponding `profiles` row with `role: "admin"`
- Verify that the `profiles` table RLS policy allows admin users to read their own row on login

---

### Issue 3 — Promotors and Commissions Require Verification

**Severity:** Low (pre-integration)  
**Files:** `src/pages/PromotorPortal.jsx`, `src/pages/CommissionsPage.jsx`

The Promotors and Commissions modules exist in code and are wired correctly. However, they have not been verified end-to-end against live data as part of this health check. Role resolution for promotors uses `profiles.promotor_id`, which shares the same RLS and profiles-fetch risks as Issue 1.

**Action required (inside Wegn Partners repo):**
- Log in as a promotor account and confirm the Promotor Portal renders correctly
- Log in as an admin and confirm the Commissions page loads live data
- Confirm `commission_summary_with_payouts` view is accessible and returns correct data

---

## Integration Prerequisites Checklist

The following must be confirmed before Platform Admin connects to Wegn Partners:

| # | Requirement | Status |
|---|---|---|
| 1 | Cosmetic mode toggle removed from login | ⬜ Open |
| 2 | Role fallback replaced with hard failure | ⬜ Open |
| 3 | All admin accounts have valid `profiles` rows | ⬜ Open |
| 4 | Admin dashboard verified accessible end-to-end | ⬜ Open |
| 5 | Promotor Portal verified with live promotor account | ⬜ Open |
| 6 | Commissions page verified with live data | ⬜ Open |
| 7 | Platform Admin read-only RLS policy configured | ⬜ Open |

---

## What Platform Admin Has Already Completed

- Repository located and confirmed: `mgtplatform/qrwegn-partners/qrwegn-partners`
- Supabase project confirmed: `yizvlbupvamsietgjtys`
- Full schema documented: `partners`, `leads`, `promotors`, `profiles`, `payouts`, `partner_payouts`, `commission_transactions`, `notification_logs`, `partner_checklist_progress`, `communications`, `demo_links`, `sales_materials`, `training_materials`, `partner_training`
- View documented: `commission_summary_with_payouts`
- Connector architecture built in Platform Admin with correct schema (read-only, env-var-gated, graceful disconnected state)
- Recommended integration approach documented: dedicated RLS read policy with a `platform_admin` auth account

---

## Connector Architecture (Ready, Awaiting Credentials)

Platform Admin connector files are in place and schema-correct. They will activate automatically once credentials are added to `.env`:

```
VITE_PARTNERS_SUPABASE_URL=https://yizvlbupvamsietgjtys.supabase.co
VITE_PARTNERS_ANON_KEY=<platform_admin_readonly_anon_key>
```

All reads go through `src/services/partnersConnector.ts`. No direct database queries exist in UI components. The connector is read-only by design — it contains no INSERT, UPDATE, or DELETE operations.
