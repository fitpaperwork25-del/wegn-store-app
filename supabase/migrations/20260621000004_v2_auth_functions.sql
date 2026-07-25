-- ========================================
-- V2 Phase 1.0 Migration 2: Auth security functions
-- Applied: 2026-06-21
-- Scope: Update auth_business_id(), create auth_user_role()
-- Rollback: See bottom of file
-- ========================================

-- Update auth_business_id() to resolve both owners and staff
CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid()
  UNION ALL
  SELECT business_id FROM employees
    WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- New function: resolve current user's role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 'owner' WHERE EXISTS (
    SELECT 1 FROM businesses WHERE owner_id = auth.uid()
  )
  UNION ALL
  SELECT role FROM employees
    WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- CREATE OR REPLACE FUNCTION auth_business_id()
-- RETURNS uuid
-- LANGUAGE sql
-- SECURITY DEFINER
-- STABLE
-- AS $$
--   SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
-- $$;
--
-- DROP FUNCTION IF EXISTS auth_user_role();
