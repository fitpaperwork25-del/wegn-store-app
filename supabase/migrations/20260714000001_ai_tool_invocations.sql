-- ========================================
-- AI Copilot Foundation Milestone 1: ai_tool_invocations
-- Scope: Audit log for every AI Copilot tool invocation - who called what,
--        with what input, what role was resolved server-side, and the
--        outcome (success/denied/error). Every tool call writes exactly
--        one row here, regardless of whether it succeeded, was denied by
--        role/permission checks, or errored.
-- Not applied to the live database as part of this commit - file only,
-- per "do not modify Wegn Store live." Applying this migration is a
-- separate, explicitly-requested action.
-- Applied: (not yet applied)
-- Rollback: see bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS ai_tool_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  resolved_role text NOT NULL CHECK (resolved_role IN ('owner', 'manager', 'cashier', 'inventory_clerk')),
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  conversation_id uuid NOT NULL,
  tool_name text NOT NULL,
  input_json jsonb NOT NULL,
  fields_restricted text[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('success', 'denied', 'error')),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_business_id ON ai_tool_invocations(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_conversation_id ON ai_tool_invocations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_invocations_created_at ON ai_tool_invocations(created_at);

ALTER TABLE ai_tool_invocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON ai_tool_invocations;
CREATE POLICY tenant_isolation ON ai_tool_invocations
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS ai_tool_invocations;
