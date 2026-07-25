-- ========================================
-- Staff Mode Phase 2: PIN hashing infrastructure
-- Scope: employees.pin is currently plaintext text, compared client-side
-- (see src/App.tsx handlePinLogin) after being fetched into the browser
-- via loadEmployees()'s SELECT - readable by any authenticated session in
-- the business (employee_select policy is row-level only). This migration
-- adds hashed-PIN infrastructure alongside the existing plaintext column
-- without removing or blocking it yet - the frontend cutover to the new
-- employee-pin-login Edge Function (Phase 3) has to ship and bake first,
-- since DB migrations and the Vercel deploy aren't atomic. See
-- docs-equivalent plan: any browser still on the old bundle must keep
-- working against the untouched `pin` column until then.
--
-- pgcrypto is already enabled in this project (confirmed before writing
-- this migration).
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_set boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS failed_pin_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

-- In-place backfill - no employee needs to re-enter a PIN. Safe to run
-- directly since the plaintext is already sitting in the row being read.
UPDATE employees
SET pin_hash = crypt(pin, gen_salt('bf')), pin_set = true
WHERE pin IS NOT NULL AND pin_hash IS NULL;

-- Server-side PIN verification, callable only by the employee-pin-login
-- Edge Function's service-role client - never reachable from a client
-- session, so it can't become a client-side brute-force oracle. Row-locks
-- the matching employee so concurrent attempts serialize instead of
-- racing the lockout counter. business_id is always a value the calling
-- Edge Function has already independently verified via verifyAuth, never
-- client-supplied directly into this function.
CREATE OR REPLACE FUNCTION verify_and_consume_employee_pin(
  p_business_id uuid,
  p_employee_code text,
  p_pin text
)
RETURNS TABLE (
  matched boolean,
  locked boolean,
  employee_id uuid,
  existing_auth_user_id uuid,
  employee_name text,
  employee_role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  emp employees%ROWTYPE;
BEGIN
  SELECT * INTO emp
  FROM employees
  WHERE business_id = p_business_id
    AND lower(employee_code) = lower(p_employee_code)
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, NULL::uuid, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  IF emp.pin_locked_until IS NOT NULL AND emp.pin_locked_until > now() THEN
    RETURN QUERY SELECT false, true, emp.id, emp.auth_user_id, emp.name, emp.role;
    RETURN;
  END IF;

  IF emp.pin_hash IS NULL OR crypt(p_pin, emp.pin_hash) <> emp.pin_hash THEN
    UPDATE employees
    SET failed_pin_attempts = failed_pin_attempts + 1,
        pin_locked_until = CASE
          WHEN failed_pin_attempts + 1 >= 5 THEN now() + interval '15 minutes'
          ELSE pin_locked_until
        END
    WHERE id = emp.id;
    RETURN QUERY SELECT false, false, NULL::uuid, NULL::uuid, NULL::text, NULL::text;
    RETURN;
  END IF;

  UPDATE employees
  SET failed_pin_attempts = 0, pin_locked_until = NULL
  WHERE id = emp.id;

  RETURN QUERY SELECT true, false, emp.id, emp.auth_user_id, emp.name, emp.role;
END;
$$;

REVOKE ALL ON FUNCTION verify_and_consume_employee_pin(uuid, text, text) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION verify_and_consume_employee_pin(uuid, text, text) TO service_role;

-- Hashes and writes a new PIN. Owner-authorization is deliberately left
-- to the calling Edge Function (set-employee-pin), not checked here -
-- matches register-device's convention of keeping caller-identity checks
-- in the Edge Function rather than scattered into SQL.
CREATE OR REPLACE FUNCTION set_employee_pin_hash(
  p_employee_id uuid,
  p_pin text
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE employees
  SET pin_hash = crypt(p_pin, gen_salt('bf')),
      pin_set = true,
      failed_pin_attempts = 0,
      pin_locked_until = NULL
  WHERE id = p_employee_id;
$$;

REVOKE ALL ON FUNCTION set_employee_pin_hash(uuid, text) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION set_employee_pin_hash(uuid, text) TO service_role;

-- Deliberately NOT locking down SELECT on pin/pin_hash in this migration.
-- Verified after first attempting it here: Supabase's default table-level
-- `GRANT SELECT ON employees TO authenticated` means a column-level
-- REVOKE has no effect while that table-level grant stands (column-level
-- and table-level privileges are independent - revoking one doesn't
-- override the other). Making the lockdown actually effective requires
-- `REVOKE SELECT ON employees FROM authenticated` (full table-level) plus
-- a re-`GRANT SELECT` naming every column except pin/pin_hash explicitly
-- - and today's live frontend still does `.select("...pin...")` in
-- loadEmployees() until Phase 3 ships, so applying that now would break
-- every business's PIN login immediately. This is the Phase 1/Phase 3
-- deployment-ordering risk this migration set out to avoid - do the real
-- column lockdown in the Phase 3 migration, once the frontend no longer
-- selects `pin`.

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP FUNCTION IF EXISTS set_employee_pin_hash(uuid, text);
-- DROP FUNCTION IF EXISTS verify_and_consume_employee_pin(uuid, text, text);
-- ALTER TABLE employees
--   DROP COLUMN IF EXISTS pin_hash,
--   DROP COLUMN IF EXISTS pin_set,
--   DROP COLUMN IF EXISTS failed_pin_attempts,
--   DROP COLUMN IF EXISTS pin_locked_until;
