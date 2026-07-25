-- ========================================
-- Returns v2: extend return_items with tracking fields
-- Applied: 2026-06-22
-- ========================================

ALTER TABLE return_items
  ADD COLUMN IF NOT EXISTS return_number text UNIQUE,
  ADD COLUMN IF NOT EXISTS return_reason text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS processed_by uuid;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE return_items
--   DROP COLUMN IF EXISTS return_number,
--   DROP COLUMN IF EXISTS return_reason,
--   DROP COLUMN IF EXISTS notes,
--   DROP COLUMN IF EXISTS processed_by;
