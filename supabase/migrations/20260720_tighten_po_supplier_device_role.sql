-- ========================================
-- Staff Mode Phase 4: remove 'device' from owner/manager-only policies
-- Scope: 20260716_registered_device_staff_mode.sql added a 'device' role
-- bucket into the owner/manager IN-lists on purchase_orders/suppliers so
-- shared-device PIN logins (client-side only, no real session) kept
-- today's actual access unchanged. Staff Mode Phase 3
-- (20260716_registered_device_staff_mode.sql's own documented follow-up)
-- now mints a real per-employee session at PIN-login time, so
-- auth_user_role() correctly resolves the actual employee's role
-- (cashier/manager/inventory_clerk) instead of the generic 'device'
-- bucket. This migration is the second half of that fix: removing
-- 'device' from these six policies so a bare device session (no employee
-- clocked in) no longer gets owner/manager-level access on POs/suppliers,
-- and a clocked-in employee's OWN role now genuinely governs what they
-- can do here - a cashier or inventory_clerk no longer implicitly gets
-- manager-level PO/supplier access just by being on a registered device.
--
-- Deliberately shipped as its own migration, a full day after Phase 3's
-- frontend deploy, per that migration's documented Risk 2: shipping this
-- before Phase 3 had baked would have stranded any employee still on the
-- old local-state-only staffSession (real session still 'device') with
-- no explanation why PO/supplier access suddenly disappeared mid-shift.
-- Confirmed before applying: Phase 3 has been live and manually verified
-- (real employee session, survives refresh, Switch User) for over 7
-- hours with no reported issues.
-- Rollback: See bottom of file
-- ========================================

DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
CREATE POLICY "po_insert" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "po_update" ON purchase_orders;
CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND (auth_user_role() IN ('owner', 'manager') OR status <> 'cancelled')
  );

DROP POLICY IF EXISTS "po_delete" ON purchase_orders;
CREATE POLICY "po_delete" ON purchase_orders
  FOR DELETE TO authenticated
  USING (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE TO authenticated
  USING (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
-- CREATE POLICY "po_insert" ON purchase_orders FOR INSERT TO authenticated
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager', 'device'));
-- DROP POLICY IF EXISTS "po_update" ON purchase_orders;
-- CREATE POLICY "po_update" ON purchase_orders FOR UPDATE TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id() AND (auth_user_role() IN ('owner', 'manager', 'device') OR status <> 'cancelled'));
-- DROP POLICY IF EXISTS "po_delete" ON purchase_orders;
-- CREATE POLICY "po_delete" ON purchase_orders FOR DELETE TO authenticated
--   USING (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager', 'device'));
-- DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
-- CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT TO authenticated
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager', 'device'));
-- DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
-- CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager', 'device'));
-- DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
-- CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE TO authenticated
--   USING (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager', 'device'));
