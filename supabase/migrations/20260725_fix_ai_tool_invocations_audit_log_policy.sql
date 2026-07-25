-- ========================================
-- Fix H-1: ai_tool_invocations audit log allowed UPDATE/DELETE by any
-- tenant member
-- Scope: 20260714_ai_tool_invocations.sql (and its re-creation in
-- 20260719_revoke_anon_and_scope_policies.sql) granted a single
-- `tenant_isolation` policy with no FOR clause, which defaults to ALL
-- (SELECT, INSERT, UPDATE, DELETE) - scoped only by business_id, with no
-- restriction to rows the caller actually created. Any authenticated
-- tenant member (cashier, inventory clerk, or a device session) could
-- therefore edit or delete any ai_tool_invocations row in their business
-- via a direct REST call, including 'denied' entries recording their own
-- blocked attempts to reach a restricted tool - defeating the table's
-- purpose as a tamper-evident record of Copilot tool calls.
--
-- Fix: replace the single FOR ALL policy with the same append-only shape
-- device_audit_log already uses - INSERT and SELECT only, both scoped to
-- the caller's own business via auth_business_id(), no UPDATE/DELETE
-- policy for `authenticated` at all. Deletion/retention, if ever needed,
-- goes through the service-role key only, outside RLS.
-- Rollback: See bottom of file
-- ========================================

DROP POLICY IF EXISTS tenant_isolation ON ai_tool_invocations;

CREATE POLICY ai_tool_invocations_insert ON ai_tool_invocations
  FOR INSERT TO authenticated
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY ai_tool_invocations_select ON ai_tool_invocations
  FOR SELECT TO authenticated
  USING (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS ai_tool_invocations_insert ON ai_tool_invocations;
-- DROP POLICY IF EXISTS ai_tool_invocations_select ON ai_tool_invocations;
-- CREATE POLICY tenant_isolation ON ai_tool_invocations
--   FOR ALL TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id());
