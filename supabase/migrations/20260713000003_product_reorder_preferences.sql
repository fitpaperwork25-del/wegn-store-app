-- ========================================
-- Stabilization Phase 7: product_reorder_preferences table
-- Applied: 2026-07-13
-- Scope: Migrate per-product preferred reorder quantity from localStorage
--        (pref-qty-{productId}) to a business_id-scoped table, so the
--        preference is visible across devices/staff and survives browser
--        data clearing. Pure UX preference — no compliance implications.
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS product_reorder_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  preferred_qty numeric NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reorder_preferences_product_id ON product_reorder_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reorder_preferences_business_id ON product_reorder_preferences(business_id);

ALTER TABLE product_reorder_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON product_reorder_preferences;
CREATE POLICY tenant_isolation ON product_reorder_preferences
  FOR ALL
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP TABLE IF EXISTS product_reorder_preferences;
