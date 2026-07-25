-- ========================================
-- Smart Pricing v1 Phase 2: Negotiation fields on sale_items
-- Applied: 2026-06-24
-- Scope: Track original price, negotiation reason, and who negotiated
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE sale_items
  ADD COLUMN IF NOT EXISTS original_unit_price numeric,
  ADD COLUMN IF NOT EXISTS negotiation_reason text,
  ADD COLUMN IF NOT EXISTS negotiated_by uuid;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE sale_items
--   DROP COLUMN IF EXISTS original_unit_price,
--   DROP COLUMN IF EXISTS negotiation_reason,
--   DROP COLUMN IF EXISTS negotiated_by;
