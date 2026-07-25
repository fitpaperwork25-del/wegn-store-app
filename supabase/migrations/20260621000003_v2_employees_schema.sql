-- ========================================
-- V2 Phase 1.0 Migration 1: Employee schema updates
-- Applied: 2026-06-21
-- Scope: Add auth linkage and invite tracking columns
-- Rollback: See bottom of file
-- ========================================

-- New columns for staff account linkage
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_status text DEFAULT 'pending'
    CHECK (invite_status IN ('pending', 'accepted', 'revoked'));

-- Partial index for fast auth_user_id lookups in auth_business_id() and auth_user_role()
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id
  ON employees (auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Role constraint: allow current values plus new v2 roles
-- Will fail if any existing row has a role outside this list
ALTER TABLE employees
  ADD CONSTRAINT employees_role_check
  CHECK (role IN ('owner', 'manager', 'cashier', 'inventory_clerk'));

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
-- DROP INDEX IF EXISTS idx_employees_auth_user_id;
-- ALTER TABLE employees
--   DROP COLUMN IF EXISTS auth_user_id,
--   DROP COLUMN IF EXISTS invited_at,
--   DROP COLUMN IF EXISTS invite_status;
