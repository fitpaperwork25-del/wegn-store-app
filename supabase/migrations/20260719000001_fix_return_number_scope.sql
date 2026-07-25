-- ========================================
-- Fix: return_number uniqueness must be per-business, not global
-- Applied: 2026-07-19
-- Scope: return_items_return_number_key (UNIQUE (return_number)) is global
-- across all tenants, but nextReturnNumber() in App.tsx generates numbers
-- by scanning only the calling business's own return history (RLS-scoped).
-- Every business therefore starts its own sequence at RET-000001 - which
-- collides with any other business that already used that number, causing
-- the return_items insert to fail with a 23505 unique violation. Because
-- that insert had no error handling (separately fixed in App.tsx), the
-- failure was silent: inventory still restocked, refund still issued, sale
-- still marked 'returned', but no return_items row was ever created for
-- any business after the first one to claim a given number.
--
-- Fix: scope the uniqueness to (business_id, return_number) instead, so
-- each tenant's own sequence is independent. Existing data already has
-- no duplicate (business_id, return_number) pairs, so this is safe to
-- apply directly - no cleanup needed first.
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_return_number_key;

ALTER TABLE return_items
  ADD CONSTRAINT return_items_business_return_number_key UNIQUE (business_id, return_number);

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE return_items DROP CONSTRAINT IF EXISTS return_items_business_return_number_key;
-- ALTER TABLE return_items ADD CONSTRAINT return_items_return_number_key UNIQUE (return_number);
