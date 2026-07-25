-- ========================================
-- Allow authenticated users to create their own business
-- Applied: 2026-06-21
-- ========================================

CREATE POLICY "owner_insert" ON businesses
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
