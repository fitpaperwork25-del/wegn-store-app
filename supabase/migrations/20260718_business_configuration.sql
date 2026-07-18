-- ========================================
-- Business Configuration Foundation (v1.2)
-- Applied: 2026-07-18
-- Scope: country, currency, timezone, and date-format settings on
-- businesses, with sensible US defaults so every existing business keeps
-- working unchanged (no backfill script needed - column defaults cover it).
--
-- Left as plain, unconstrained text (no CHECK enum) rather than following
-- the selling_policy CHECK-constrained precedent elsewhere in this schema:
-- this is explicitly a foundation for "at least" 5 countries with more
-- coming later, and the initial supported set is validated in the
-- application layer (src/lib/business/businessConfig.ts) - a CHECK
-- constraint here would need a migration every time a country is added.
--
-- No RLS policy changes: the existing owner_update policy on businesses
-- (20260620_rls_tenant_isolation.sql) already restricts every UPDATE on
-- this table - including these new columns - to owner_id = auth.uid().
-- ========================================

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS currency_symbol text NOT NULL DEFAULT '$',
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York',
  ADD COLUMN IF NOT EXISTS date_format text NOT NULL DEFAULT 'MM/DD/YYYY';

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE public.businesses
--   DROP COLUMN IF EXISTS country_code,
--   DROP COLUMN IF EXISTS currency_code,
--   DROP COLUMN IF EXISTS currency_symbol,
--   DROP COLUMN IF EXISTS timezone,
--   DROP COLUMN IF EXISTS date_format;
