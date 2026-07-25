-- ========================================
-- Receiving Sessions v2.3: Supplier invoice capture
-- Applied: 2026-06-25
-- Scope: Add invoice metadata fields to receiving_sessions
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE receiving_sessions
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS invoice_date date,
  ADD COLUMN IF NOT EXISTS invoice_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS freight_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_cost numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_status text NOT NULL DEFAULT 'pending'
    CHECK (invoice_status IN ('pending', 'matched', 'variance'));

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE receiving_sessions
--   DROP COLUMN IF EXISTS invoice_number,
--   DROP COLUMN IF EXISTS invoice_date,
--   DROP COLUMN IF EXISTS invoice_total,
--   DROP COLUMN IF EXISTS freight_cost,
--   DROP COLUMN IF EXISTS additional_cost,
--   DROP COLUMN IF EXISTS invoice_status;
