-- ========================================
-- Fix: deterministic tenant resolution
-- Applied: 2026-07-18
-- Scope: auth_business_id() and auth_user_role() (most recently redefined in
-- 20260716_registered_device_staff_mode.sql) used a 3-way UNION ALL followed
-- by a bare LIMIT 1 with no ORDER BY. Postgres does not guarantee which row
-- a LIMIT without ORDER BY returns when more than one branch matches the
-- same auth.uid() (e.g. a duplicate businesses row, or a stale
-- employees/device_registrations row for the same user) - and it is not
-- even guaranteed to be the same row across separate queries in one
-- session, since STABLE only guarantees consistency within a single
-- statement. This can silently resolve different tables to different
-- business_id values in the same session.
--
-- Fix: attach an explicit priority per branch (owner=1, employee=2,
-- device=3 - preserving the original branch order as the tie-break) and
-- ORDER BY it before LIMIT 1, so resolution is deterministic whenever more
-- than one branch matches. Behavior is unchanged for the common case where
-- only one branch matches.
--
-- This does not touch table data - function definitions only.
-- Rollback: See bottom of file
-- ========================================

CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT business_id FROM (
    SELECT id AS business_id, 1 AS priority
      FROM businesses WHERE owner_id = auth.uid()
    UNION ALL
    SELECT business_id, 2 AS priority
      FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
    UNION ALL
    SELECT business_id, 3 AS priority
      FROM device_registrations WHERE auth_user_id = auth.uid() AND status = 'active'
  ) resolved
  ORDER BY priority
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM (
    SELECT 'owner' AS role, 1 AS priority
      WHERE EXISTS (SELECT 1 FROM businesses WHERE owner_id = auth.uid())
    UNION ALL
    SELECT role, 2 AS priority
      FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
    UNION ALL
    SELECT 'device' AS role, 3 AS priority
      WHERE EXISTS (
        SELECT 1 FROM device_registrations
          WHERE auth_user_id = auth.uid() AND status = 'active'
      )
  ) resolved
  ORDER BY priority
  LIMIT 1;
$$;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- CREATE OR REPLACE FUNCTION auth_business_id()
-- RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
--   SELECT id FROM businesses WHERE owner_id = auth.uid()
--   UNION ALL
--   SELECT business_id FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
--   UNION ALL
--   SELECT business_id FROM device_registrations WHERE auth_user_id = auth.uid() AND status = 'active'
--   LIMIT 1;
-- $$;
--
-- CREATE OR REPLACE FUNCTION auth_user_role()
-- RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
--   SELECT 'owner' WHERE EXISTS (SELECT 1 FROM businesses WHERE owner_id = auth.uid())
--   UNION ALL
--   SELECT role FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
--   UNION ALL
--   SELECT 'device' WHERE EXISTS (
--     SELECT 1 FROM device_registrations WHERE auth_user_id = auth.uid() AND status = 'active'
--   )
--   LIMIT 1;
-- $$;
