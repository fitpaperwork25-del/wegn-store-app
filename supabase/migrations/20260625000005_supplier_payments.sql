-- ========================================
-- Supplier Payables Step 1: supplier_payments table
-- Applied: 2026-06-25
-- Scope: Track payments made to suppliers
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS supplier_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  receiving_session_id uuid REFERENCES receiving_sessions(id) ON DELETE SET NULL,
  payment_date date NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_session_id ON supplier_payments(receiving_session_id);

ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON supplier_payments;
CREATE POLICY tenant_isolation ON supplier_payments
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS supplier_payments;
