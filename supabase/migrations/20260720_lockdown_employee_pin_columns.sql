-- ========================================
-- Staff Mode: lock down client SELECT on pin/pin_hash
-- Scope: deferred from 20260720_employee_pin_hashing.sql. That migration
-- found that a plain `REVOKE SELECT (pin, pin_hash) ON employees FROM
-- authenticated` has no effect while Supabase's default table-level
-- `GRANT SELECT ON employees TO authenticated` still stands - table-level
-- and column-level grants are independent, so the real fix is a
-- table-level REVOKE plus an explicit column-level re-GRANT naming every
-- other column. Applying that immediately would have broken every
-- business's live PIN login, since the frontend still selected pin at
-- that time (Staff Mode Phase 3 hadn't shipped yet).
--
-- Phase 3 (real per-employee sessions, employees.pin no longer selected
-- anywhere in the frontend) has now been live for over a day, manually
-- verified working (PIN login, mid-shift refresh, Switch User). Safe to
-- apply the real lockdown now.
-- Rollback: See bottom of file
-- ========================================

REVOKE SELECT ON employees FROM authenticated;

GRANT SELECT (
  id, business_id, name, employee_code, role, status,
  auth_user_id, invited_at, invite_status, pin_set,
  failed_pin_attempts, pin_locked_until, created_at
) ON employees TO authenticated;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- GRANT SELECT ON employees TO authenticated;
