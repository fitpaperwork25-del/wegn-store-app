-- ========================================
-- RLS Stage 2: Restrictive tenant isolation
-- Applied: 2026-06-20
-- ========================================

-- Helper function: resolves auth.uid() to business_id
CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Enable RLS on all public tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawer_paid_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_count_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing permissive policies
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- businesses: owner-based access
CREATE POLICY "owner_select" ON businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owner_update" ON businesses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- All other tables: tenant isolation via business_id
CREATE POLICY "tenant_isolation" ON products
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON inventory
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON inventory_transactions
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON categories
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON suppliers
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON purchase_orders
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON purchase_order_items
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON sales
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON sale_items
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON payments
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON customers
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON loyalty_transactions
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON return_items
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON drawer_sessions
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON drawer_paid_outs
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON employees
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON stock_counts
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

CREATE POLICY "tenant_isolation" ON stock_count_items
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- Revoke all anon access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
