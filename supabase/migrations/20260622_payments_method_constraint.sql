-- ========================================
-- Expand payment_method constraint for mobile money
-- Applied: 2026-06-22
-- ========================================

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'telebirr', 'cbe_birr', 'chapa', 'mtn_mobile', 'airtel_money'));

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
-- ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
--   CHECK (payment_method IN ('cash', 'card'));
