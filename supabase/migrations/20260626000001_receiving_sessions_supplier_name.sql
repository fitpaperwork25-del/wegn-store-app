-- ========================================
-- Smart Receive: preserve extracted supplier name
-- Applied: 2026-06-26
-- Scope: Store AI-extracted supplier name even when no supplier_id match found
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE receiving_sessions
  ADD COLUMN IF NOT EXISTS supplier_name text;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE receiving_sessions DROP COLUMN IF EXISTS supplier_name;
