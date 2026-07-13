-- ========================================
-- Stabilization Phase 7: po_email_log table
-- Applied: 2026-07-13
-- Scope: Migrate per-PO "emailed to supplier" tracking from localStorage
--        (po-email-{poId}) to a business_id-scoped table, so the log is
--        visible across devices/staff and survives browser data clearing.
--        Write-mostly log of send attempts — no compliance implications.
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS po_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  email_count integer NOT NULL DEFAULT 0,
  last_emailed_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (purchase_order_id)
);

CREATE INDEX IF NOT EXISTS idx_po_email_log_po_id ON po_email_log(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_email_log_business_id ON po_email_log(business_id);

ALTER TABLE po_email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON po_email_log;
CREATE POLICY tenant_isolation ON po_email_log
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS po_email_log;
