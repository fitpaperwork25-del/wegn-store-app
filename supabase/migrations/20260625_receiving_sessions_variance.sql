-- ========================================
-- Invoice Reconciliation Phase 1: Variance calculation fields
-- Applied: 2026-06-25
-- Scope: Store calculated_total and variance_amount on receiving_sessions
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE receiving_sessions
  ADD COLUMN IF NOT EXISTS calculated_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS variance_amount numeric NOT NULL DEFAULT 0;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE receiving_sessions
--   DROP COLUMN IF EXISTS calculated_total,
--   DROP COLUMN IF EXISTS variance_amount;
