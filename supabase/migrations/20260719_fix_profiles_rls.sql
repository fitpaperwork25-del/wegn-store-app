-- ========================================
-- Fix: profiles table had no RLS at all
-- Applied: 2026-07-19
-- Scope: profiles (id, business_id, full_name, email, role, status,
-- created_at) was the only table in the schema with row_security disabled
-- and zero policies. Combined with the standard `authenticated` grant
-- (SELECT/INSERT/UPDATE/DELETE), any logged-in user from any business -
-- owner, employee, or device session - could read or modify every other
-- business's rows via a direct REST call, e.g.
-- `/rest/v1/profiles?select=*`. Not referenced anywhere in this repo's
-- frontend or Edge Functions, so nothing here depends on the unrestricted
-- access; a legitimate cross-business admin tool would use the
-- service_role key, which bypasses RLS entirely and is unaffected by this
-- change.
--
-- Fix: enable RLS and add the same tenant_isolation policy used on every
-- other business_id-scoped table.
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON profiles;
CREATE POLICY tenant_isolation ON profiles
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS tenant_isolation ON profiles;
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
