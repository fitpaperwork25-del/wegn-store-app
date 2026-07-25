-- ========================================
-- Smart Pricing v1: Add selling policy to businesses
-- Applied: 2026-06-24
-- Scope: Master switch for negotiation engine behavior
-- Note: Renamed from pricing_policy to selling_policy
-- Rollback: See bottom of file
-- ========================================

-- Rename if the old column name exists (from earlier deployment)
ALTER TABLE businesses RENAME COLUMN pricing_policy TO selling_policy;

-- If running fresh (no pricing_policy column), add selling_policy
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS selling_policy text NOT NULL DEFAULT 'fixed_pricing'
  CHECK (selling_policy IN ('fixed_pricing', 'negotiated_pricing', 'negotiated_with_approval'));

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE businesses DROP COLUMN IF EXISTS selling_policy;
