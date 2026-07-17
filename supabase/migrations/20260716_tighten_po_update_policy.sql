-- ========================================
-- Role-Permissions Revision: tighten purchase_orders UPDATE policy.
-- Scope: Mark Ordered (draft -> ordered) is now owner/manager only in the
--        UI (see PurchaseOrderLifecyclePanel.tsx). The prior po_update
--        policy (20260716_role_based_po_supplier_policies.sql) only
--        excluded 'cancelled' from non-owner/manager UPDATEs, so a direct
--        API call could still perform Mark Ordered as any tenant member -
--        inconsistent with the UI. This migration also excludes 'ordered'.
--
-- Verified compatible with the existing Receive flow (handleConfirmReceive):
-- that function only reaches its purchase_orders UPDATE after confirming at
-- least one item was actually received, which guarantees the computed
-- newStatus is always 'partially_received' or 'received' - never 'ordered'
-- or 'cancelled' - so Inventory Clerk's legitimate receiving path is
-- unaffected.
-- Rollback: See bottom of file
-- ========================================

DROP POLICY IF EXISTS "po_update" ON purchase_orders;

CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND (
      auth_user_role() IN ('owner', 'manager')
      OR status NOT IN ('cancelled', 'ordered')
    )
  );

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS "po_update" ON purchase_orders;
-- CREATE POLICY "po_update" ON purchase_orders
--   FOR UPDATE TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (
--     business_id = auth_business_id()
--     AND (auth_user_role() IN ('owner', 'manager') OR status <> 'cancelled')
--   );
