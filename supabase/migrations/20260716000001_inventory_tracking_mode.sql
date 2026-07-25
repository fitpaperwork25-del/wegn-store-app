-- ========================================
-- Generic Inventory Tracking Mode
-- Applied: 2026-07-16
-- Scope: Product-level tracking_mode (constrained, not free-form) plus
--        traceability columns so inventory_batches rows can originate
--        from a Purchase Order receive, not only Smart Receive.
--        inventory_batches itself is NOT generalized - it stays a
--        quantity-based batch/lot/expiration store. Future tracking
--        modes (serial numbers, warranties, regulated-product metadata)
--        get their own storage model and their own allowed value here;
--        this migration only adds the two values needed today.
-- Migration strategy: purely additive. No backfill - existing products
-- default to 'none' (identical receive behavior to today); existing
-- inventory_batches rows get NULL for the new PO-linkage columns
-- (correct, since they were Smart-Receive-sourced).
-- Rollback: See bottom of file
-- ========================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tracking_mode text NOT NULL DEFAULT 'none';

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_tracking_mode_check;

ALTER TABLE products
  ADD CONSTRAINT products_tracking_mode_check
  CHECK (tracking_mode IN ('none', 'expiration_batch'));

ALTER TABLE inventory_batches
  ADD COLUMN IF NOT EXISTS purchase_order_id uuid REFERENCES purchase_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS purchase_order_item_id uuid REFERENCES purchase_order_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_batches_po ON inventory_batches(purchase_order_id);

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE inventory_batches DROP COLUMN IF EXISTS purchase_order_id;
-- ALTER TABLE inventory_batches DROP COLUMN IF EXISTS purchase_order_item_id;
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tracking_mode_check;
-- ALTER TABLE products DROP COLUMN IF EXISTS tracking_mode;
