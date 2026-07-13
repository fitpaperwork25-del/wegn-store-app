-- ========================================
-- Stabilization Phase 7: po_signatures table
-- Applied: 2026-07-13
-- Scope: Migrate PO manager/supplier signatures from localStorage
--        (po-sig-{poId}) to a business_id-scoped table, so a signature is
--        visible across devices/staff and survives browser data clearing.
--        Confirmed with product owner: treated as simple data, not a
--        compliance/audit record. "Clear Signature" hard-deletes the row,
--        matching exact current localStorage behavior. No additional
--        fields (signer identity, IP, etc.) are captured beyond what the
--        app already collects today (role, image, timestamp).
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS po_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('manager', 'supplier')),
  data_url text NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (purchase_order_id, role)
);

CREATE INDEX IF NOT EXISTS idx_po_signatures_po_id ON po_signatures(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_signatures_business_id ON po_signatures(business_id);

ALTER TABLE po_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON po_signatures;
CREATE POLICY tenant_isolation ON po_signatures
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS po_signatures;
