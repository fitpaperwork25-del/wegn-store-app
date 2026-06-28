ALTER TABLE purchase_order_items
  ADD COLUMN IF NOT EXISTS receive_notes TEXT;
