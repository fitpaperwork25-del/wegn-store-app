-- ========================================
-- Receiving Sessions v2 Step 1: Enable RLS
-- Applied: 2026-06-25
-- Scope: Tenant isolation for receiving_sessions and receiving_items
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE receiving_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receiving_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON receiving_sessions;
CREATE POLICY tenant_isolation ON receiving_sessions
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS tenant_isolation ON receiving_items;
CREATE POLICY tenant_isolation ON receiving_items
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS tenant_isolation ON receiving_sessions;
-- DROP POLICY IF EXISTS tenant_isolation ON receiving_items;
-- ALTER TABLE receiving_sessions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE receiving_items DISABLE ROW LEVEL SECURITY;
