-- ============================================================
-- FEFO Phase 1: sale_item_batches + depleted status + FEFO index
-- Applied: 2026-06-27
-- ============================================================

-- 1. Extend inventory_batches status to allow 'depleted'
--    (batch fully consumed by POS sales, distinct from expired/written_off)
DO $$
DECLARE v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.inventory_batches'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%active%expired%';
  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.inventory_batches DROP CONSTRAINT %I', v_conname);
  END IF;
END $$;

ALTER TABLE public.inventory_batches
  ADD CONSTRAINT inventory_batches_status_check
  CHECK (status IN ('active', 'expired', 'consumed', 'written_off', 'depleted'));

-- 2. Partial composite index for FEFO lookups
--    Covers: SELECT ... WHERE product_id = ? AND status = 'active' AND quantity_remaining > 0
--    ORDER BY expiration_date ASC NULLS LAST
CREATE INDEX IF NOT EXISTS idx_inventory_batches_fefo
  ON public.inventory_batches (product_id, expiration_date ASC NULLS LAST)
  WHERE status = 'active' AND quantity_remaining > 0;

-- 3. sale_item_batches — audit trail of which batch(es) each sale line consumed
CREATE TABLE IF NOT EXISTS public.sale_item_batches (
  id                  uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         uuid          NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_id             uuid          NOT NULL REFERENCES public.sales(id)      ON DELETE CASCADE,
  sale_item_id        uuid          NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
  product_id          uuid          NOT NULL REFERENCES public.products(id)   ON DELETE CASCADE,
  inventory_batch_id  uuid          NOT NULL REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
  quantity            numeric       NOT NULL,
  unit_cost           numeric,
  expiration_date     date,
  created_at          timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sib_business   ON public.sale_item_batches (business_id);
CREATE INDEX IF NOT EXISTS idx_sib_sale        ON public.sale_item_batches (sale_id);
CREATE INDEX IF NOT EXISTS idx_sib_sale_item   ON public.sale_item_batches (sale_item_id);
CREATE INDEX IF NOT EXISTS idx_sib_product     ON public.sale_item_batches (product_id);
CREATE INDEX IF NOT EXISTS idx_sib_batch       ON public.sale_item_batches (inventory_batch_id);

-- 4. RLS — same tenant-isolation pattern as all other business-owned tables
ALTER TABLE public.sale_item_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.sale_item_batches
  FOR ALL TO authenticated
  USING  (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
