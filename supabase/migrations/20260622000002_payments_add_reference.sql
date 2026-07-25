-- ========================================
-- Add reference column to payments for mobile money confirmations
-- Applied: 2026-06-22
-- ========================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS reference text;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE payments DROP COLUMN IF EXISTS reference;
