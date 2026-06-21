-- ========================================
-- Add PIN column to employees for staff login
-- Applied: 2026-06-21
-- ========================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS pin text;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE employees DROP COLUMN IF EXISTS pin;
