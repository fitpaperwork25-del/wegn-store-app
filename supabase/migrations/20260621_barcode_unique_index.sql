-- ========================================
-- Barcode uniqueness: one barcode per product per business
-- Applied: 2026-06-21
-- Pre-requisite: clear duplicate barcodes before applying
-- ========================================

-- Before running this migration, detect and resolve duplicates:
--
-- SELECT business_id, barcode, count(*) as cnt,
--        array_agg(id) as product_ids,
--        array_agg(name) as product_names
-- FROM products
-- WHERE barcode IS NOT NULL
-- GROUP BY business_id, barcode
-- HAVING count(*) > 1;
--
-- To clear barcode on zero-stock duplicates:
--
-- UPDATE products SET barcode = NULL
-- WHERE id IN (
--   SELECT p.id FROM products p
--   JOIN inventory i ON i.product_id = p.id
--   WHERE p.barcode IS NOT NULL
--     AND i.quantity_on_hand = 0
--     AND EXISTS (
--       SELECT 1 FROM products p2
--       JOIN inventory i2 ON i2.product_id = p2.id
--       WHERE p2.business_id = p.business_id
--         AND p2.barcode = p.barcode
--         AND p2.id != p.id
--         AND i2.quantity_on_hand > 0
--     )
-- );

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
  ON products (business_id, barcode)
  WHERE barcode IS NOT NULL;

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP INDEX IF EXISTS idx_products_barcode_unique;
