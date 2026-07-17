-- ========================================
-- Role-Permissions Revision: server-side enforcement for the Inventory
-- Clerk excessive-permissions fix.
-- Scope: purchase_orders and suppliers only - the two areas the client-side
--        permission audit found ungated (any tenant member could create,
--        cancel, or delete a PO, or manage suppliers, regardless of role).
-- Uses auth_user_role() (defined in 20260621_v2_auth_functions.sql),
-- previously unreferenced by any policy.
--
-- Deliberately NOT touched here (documented, not silently skipped):
-- - purchase_order_items: Add/Remove line item stays ungated at both the UI
--   and DB layer - it was not part of the approved restriction list (only
--   Create/Delete *PO* were named), so restricting it here would silently
--   diverge from the UI.
-- - Read-side restrictions (Cash Drawer/Sales/Financial Reports/EOD
--   visibility for Inventory Clerk) remain UI-only. Every existing RLS
--   policy in this schema is tenant-isolation-only with no precedent for a
--   role-scoped SELECT restriction, and sales/payments/drawer_sessions are
--   read by several other code paths (Copilot tools, receipts, etc.) not
--   audited here. Restricting SELECT on those tables needs its own,
--   dedicated audit - out of scope for this pass.
-- Rollback: See bottom of file
-- ========================================

-- purchase_orders: split "tenant_isolation" (FOR ALL) into per-operation
-- policies. SELECT is unchanged (any tenant member). INSERT and DELETE are
-- owner/manager only (Create PO / Delete PO). UPDATE stays open to any
-- tenant member - Mark Ordered and Receive-driven status changes are
-- legitimate for Inventory Clerk - except setting status to 'cancelled'
-- (Cancel PO), which is owner/manager only.
DROP POLICY IF EXISTS "tenant_isolation" ON purchase_orders;

CREATE POLICY "po_select" ON purchase_orders
  FOR SELECT TO authenticated
  USING (business_id = auth_business_id());

CREATE POLICY "po_insert" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND (auth_user_role() IN ('owner', 'manager') OR status <> 'cancelled')
  );

CREATE POLICY "po_delete" ON purchase_orders
  FOR DELETE TO authenticated
  USING (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

-- suppliers: split "tenant_isolation" (FOR ALL) into per-operation
-- policies. SELECT is unchanged (any tenant member - PO/receiving views
-- need to read supplier names). INSERT, UPDATE, DELETE are owner/manager
-- only (Add/Edit/Delete Suppliers).
DROP POLICY IF EXISTS "tenant_isolation" ON suppliers;

CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT TO authenticated
  USING (business_id = auth_business_id());

CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager')
  );

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
-- DROP POLICY IF EXISTS "po_select" ON purchase_orders;
-- DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
-- DROP POLICY IF EXISTS "po_update" ON purchase_orders;
-- DROP POLICY IF EXISTS "po_delete" ON purchase_orders;
-- CREATE POLICY "tenant_isolation" ON purchase_orders
--   FOR ALL TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id());
--
-- DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
-- DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
-- DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
-- DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
-- CREATE POLICY "tenant_isolation" ON suppliers
--   FOR ALL TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id());
