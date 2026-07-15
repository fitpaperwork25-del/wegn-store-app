-- ========================================
-- Supplier Accounts Payable — Phase 1
-- Applied: 2026-07-15
-- Scope: Automatic supplier invoice creation for Purchase Order receiving
--        only (traditional PO "Receive" flow — handleConfirmReceive in
--        App.tsx). Does NOT touch receiving_sessions-based invoicing,
--        which continues to work exactly as before.
--
-- Migration strategy: purely additive. No backfill. Existing purchase_order
-- receipts (already recorded, no invoice) are NOT retroactively invoiced —
-- Phase 1 begins generating supplier invoices only for receives that happen
-- after this migration is applied. See implementation report for the
-- reasoning (test/demo data does not warrant a historical migration; if
-- production data ever does, that is a separate, explicit decision).
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  purchase_order_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_date date NOT NULL,
  original_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_invoices_business_id ON supplier_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_supplier_id ON supplier_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_invoices_po_id ON supplier_invoices(purchase_order_id);

ALTER TABLE supplier_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON supplier_invoices;
CREATE POLICY tenant_isolation ON supplier_invoices
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- Additive only: existing receiving_session_id column and every row that
-- uses it are completely untouched. A payment now references exactly one
-- of (receiving_session_id, supplier_invoice_id), never both.
ALTER TABLE supplier_payments
  ADD COLUMN IF NOT EXISTS supplier_invoice_id uuid REFERENCES supplier_invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_payments_invoice_id ON supplier_payments(supplier_invoice_id);

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE supplier_payments DROP COLUMN IF EXISTS supplier_invoice_id;
-- DROP TABLE IF EXISTS supplier_invoices;
