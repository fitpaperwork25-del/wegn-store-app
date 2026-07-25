-- ========================================
-- Invoice Approval Workflow Phase 1: Approval fields
-- Applied: 2026-06-25
-- Scope: Track invoice approval on receiving_sessions
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE receiving_sessions
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_note text;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE receiving_sessions
--   DROP COLUMN IF EXISTS approved_by,
--   DROP COLUMN IF EXISTS approved_at,
--   DROP COLUMN IF EXISTS approval_note;
