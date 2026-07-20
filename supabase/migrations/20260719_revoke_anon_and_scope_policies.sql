-- ========================================
-- Fix: anon grants + unscoped policies on tables created after 20260620
-- Applied: 2026-07-19
-- Scope: 20260620_rls_tenant_isolation.sql revoked all anon access, but
-- only on tables that existed at the time. Every table created by a later
-- migration (11 of them) kept Postgres/Supabase's default anon grants,
-- and 7 of those also created their tenant_isolation policy without a
-- `TO authenticated` clause, defaulting it to `public` (all roles,
-- including anon).
--
-- This was not actively exploitable: auth_business_id() returns NULL for
-- an unauthenticated caller (auth.uid() is NULL, so the owner_id/
-- auth_user_id lookups it does return nothing), and `business_id = NULL`
-- is never true in SQL - so anon requests against these tables already
-- returned zero rows / failed every WITH CHECK in practice. But that's
-- correctness-by-accident (an artifact of NULL comparison semantics)
-- rather than an explicit rule, and the standing anon GRANTs are dead
-- weight that should not exist regardless. Bringing both in line with
-- every other table in the schema.
-- Rollback: See bottom of file
-- ========================================

REVOKE ALL ON
  ai_tool_invocations, business_onboarding_state, device_audit_log,
  device_registrations, inventory_batches, po_email_log, po_signatures,
  product_reorder_preferences, sale_item_batches, supplier_invoices,
  supplier_payments
FROM anon;

DROP POLICY IF EXISTS tenant_isolation ON ai_tool_invocations;
CREATE POLICY tenant_isolation ON ai_tool_invocations
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON business_onboarding_state;
CREATE POLICY tenant_isolation ON business_onboarding_state
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON po_email_log;
CREATE POLICY tenant_isolation ON po_email_log
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON po_signatures;
CREATE POLICY tenant_isolation ON po_signatures
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON product_reorder_preferences;
CREATE POLICY tenant_isolation ON product_reorder_preferences
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON supplier_invoices;
CREATE POLICY tenant_isolation ON supplier_invoices
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON supplier_payments;
CREATE POLICY tenant_isolation ON supplier_payments
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- (anon grants are not restorable to their exact prior default state;
-- re-grant explicitly if ever needed)
-- GRANT ALL ON ai_tool_invocations, business_onboarding_state,
--   device_audit_log, device_registrations, inventory_batches,
--   po_email_log, po_signatures, product_reorder_preferences,
--   sale_item_batches, supplier_invoices, supplier_payments TO anon;
--
-- DROP POLICY IF EXISTS tenant_isolation ON ai_tool_invocations;
-- CREATE POLICY tenant_isolation ON ai_tool_invocations FOR ALL
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id());
-- (repeat per table, omitting TO authenticated, to restore public scope)
