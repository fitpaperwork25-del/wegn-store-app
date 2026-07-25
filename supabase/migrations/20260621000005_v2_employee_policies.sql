-- ========================================
-- V2 Phase 1.0 Migration 3: Employee and business RLS policies
-- Applied: 2026-06-21
-- Scope: Granular employees policies, staff business read access
-- Rollback: See bottom of file
-- ========================================

-- Drop existing employees FOR ALL policy
DROP POLICY IF EXISTS "tenant_isolation" ON employees;

-- All authenticated users can read employees in their business
CREATE POLICY "employee_select" ON employees
  FOR SELECT TO authenticated
  USING (business_id = auth_business_id());

-- Only owners can insert employees
CREATE POLICY "employee_manage" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Only owners can update employees
CREATE POLICY "employee_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Only owners can delete employees
CREATE POLICY "employee_delete" ON employees
  FOR DELETE TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Staff can read their business profile (header, receipts, tax rate)
CREATE POLICY "staff_select" ON businesses
  FOR SELECT TO authenticated
  USING (id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS "employee_select" ON employees;
-- DROP POLICY IF EXISTS "employee_manage" ON employees;
-- DROP POLICY IF EXISTS "employee_update" ON employees;
-- DROP POLICY IF EXISTS "employee_delete" ON employees;
-- DROP POLICY IF EXISTS "staff_select" ON businesses;
--
-- CREATE POLICY "tenant_isolation" ON employees
--   FOR ALL TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id());
