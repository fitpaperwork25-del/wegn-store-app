-- ========================================
-- Returns v2: Add payment_type to payments
-- Applied: 2026-06-23
-- Scope: Distinguish sale payments from refund payments
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_type text NOT NULL DEFAULT 'sale';

ALTER TABLE payments
  ADD CONSTRAINT payments_payment_type_check
  CHECK (payment_type IN ('sale', 'refund'));

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
-- ALTER TABLE payments DROP COLUMN IF EXISTS payment_type;
