-- ========================================
-- Smart Pricing v1: Add product-level pricing controls
-- Applied: 2026-06-24
-- Scope: Overhead %, target margin %, minimum margin %
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS estimated_overhead_pct numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_margin_percent numeric,
  ADD COLUMN IF NOT EXISTS minimum_margin_percent numeric;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE products
--   DROP COLUMN IF EXISTS estimated_overhead_pct,
--   DROP COLUMN IF EXISTS target_margin_percent,
--   DROP COLUMN IF EXISTS minimum_margin_percent;
