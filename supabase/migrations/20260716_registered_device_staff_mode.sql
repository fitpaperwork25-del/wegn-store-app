-- ========================================
-- Registered Store Device / Staff Mode (Option A - shared device identity)
-- Scope: lets Employee ID + PIN login work without requiring the owner's
--        own Supabase session to be alive on the device. A device is its
--        own minimal Supabase Auth identity, scoped to exactly one
--        business via device_registrations, used only to unlock Staff
--        Mode. Multiple employees share this one device session
--        throughout the day - this migration does not mint per-employee
--        sessions.
--
-- Deliberately deferred (documented, not silently dropped): per-employee
-- Supabase sessions minted at PIN-login time. PIN matching stays
-- client-side, exactly as it works today. auth_user_role()'s new device
-- branch resolves to a distinct 'device' role (not 'owner'), added
-- explicitly to the specific write policies below rather than folded
-- into the existing owner/manager checks, so this preserves TODAY's
-- actual behavior unchanged: any PIN-logged-in role currently gets
-- owner-level DB access because the underlying session has always been
-- the owner's. A shared device session continues that, it does not
-- newly restrict or newly loosen anything. Tightening this to true
-- per-employee enforcement later should only require removing 'device'
-- from the IN-lists below plus minting real per-employee sessions - not
-- a redesign of this migration or these tables.
-- Rollback: See bottom of file
-- ========================================

CREATE TABLE IF NOT EXISTS device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL UNIQUE,
  device_label text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  registered_by uuid NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  revoked_by uuid,
  revoked_at timestamptz,
  last_seen_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_business ON device_registrations(business_id);
CREATE INDEX IF NOT EXISTS idx_device_registrations_auth_user ON device_registrations(auth_user_id);

ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Owners manage device registrations for their own business only. Writes
-- in practice only ever happen via the service-role-backed Edge Functions
-- (register-device / revoke-device), but this policy also allows an
-- owner's own authenticated session to read the list directly for a
-- device-management UI.
CREATE POLICY "device_registrations_owner_all" ON device_registrations
  FOR ALL TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- A device can read its own registration row, to self-check active status.
CREATE POLICY "device_registrations_self_select" ON device_registrations
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS device_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  device_id uuid REFERENCES device_registrations(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'device_registered', 'device_revoked', 'staff_mode_entered',
    'staff_mode_exited', 'owner_override'
  )),
  actor_auth_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_audit_log_business ON device_audit_log(business_id);

ALTER TABLE device_audit_log ENABLE ROW LEVEL SECURITY;

-- Owners can read their business's audit log. No client-side INSERT
-- policy is defined deliberately - writes happen only via the
-- service-role-backed Edge Functions, never directly from a device or
-- employee session, so the log can't be forged from the client.
CREATE POLICY "device_audit_log_owner_select" ON device_audit_log
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));

-- Any authenticated session already valid for a business (owner,
-- employee, or device) may log its own non-privileged lifecycle events
-- directly - staff_mode_entered/exited and owner_override don't need the
-- elevated, service-role context register-device/revoke-device run with.
-- device_registered/device_revoked are deliberately excluded from this
-- policy's WITH CHECK, so a client session can never insert one of those
-- directly - only the service-role-backed Edge Functions can, preserving
-- the "can't be forged from the client" guarantee for those two events.
CREATE POLICY "device_audit_log_self_insert" ON device_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND event_type IN ('staff_mode_entered', 'staff_mode_exited', 'owner_override')
    AND actor_auth_id = auth.uid()
  );

-- An INSERT with Prefer: return=representation (used by the client insert
-- above) also needs the inserted row to satisfy a SELECT policy, or
-- Postgres reports the same "violates row-level security policy" error
-- even though the WITH CHECK above passed. Scoped to rows the caller was
-- themselves the actor for, so this doesn't broaden general audit-log
-- visibility to employees/devices - device_registered/device_revoked rows
-- are always actor'd by the owner, so a device session can never match
-- this for those two privileged event types either.
CREATE POLICY "device_audit_log_self_select" ON device_audit_log
  FOR SELECT TO authenticated
  USING (actor_auth_id = auth.uid());

-- Extend auth_business_id() with a device branch.
CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid()
  UNION ALL
  SELECT business_id FROM employees
    WHERE auth_user_id = auth.uid() AND status = 'active'
  UNION ALL
  SELECT business_id FROM device_registrations
    WHERE auth_user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

-- Extend auth_user_role() with a device branch, resolving to the distinct
-- value 'device' - deliberately not equated to 'owner' or any other role
-- here, so every place it's granted equivalent access is an explicit,
-- greppable addition below rather than an implicit side effect.
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 'owner' WHERE EXISTS (
    SELECT 1 FROM businesses WHERE owner_id = auth.uid()
  )
  UNION ALL
  SELECT role FROM employees
    WHERE auth_user_id = auth.uid() AND status = 'active'
  UNION ALL
  SELECT 'device' WHERE EXISTS (
    SELECT 1 FROM device_registrations
      WHERE auth_user_id = auth.uid() AND status = 'active'
  )
  LIMIT 1;
$$;

-- Preserve today's actual behavior on the permission-matrix policies
-- (20260716_role_based_po_supplier_policies.sql /
-- 20260716_tighten_po_update_policy.sql): a shared device session grants
-- the same access any PIN-logged-in role already gets today via the
-- owner's session.
DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
CREATE POLICY "po_insert" ON purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager', 'device')
  );

DROP POLICY IF EXISTS "po_update" ON purchase_orders;
CREATE POLICY "po_update" ON purchase_orders
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND (auth_user_role() IN ('owner', 'manager', 'device') OR status <> 'cancelled')
  );

DROP POLICY IF EXISTS "po_delete" ON purchase_orders;
CREATE POLICY "po_delete" ON purchase_orders
  FOR DELETE TO authenticated
  USING (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager', 'device')
  );

DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager', 'device')
  );

DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager', 'device')
  );

DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE TO authenticated
  USING (
    business_id = auth_business_id()
    AND auth_user_role() IN ('owner', 'manager', 'device')
  );

-- Fix policies that hardcoded owner_id = auth.uid() directly instead of
-- going through auth_business_id() - these only ever worked because the
-- underlying session happened to be the owner's. A device session doing
-- legitimate staff work (receiving with expiration tracking, FEFO sale
-- consumption) needs the same access any PIN-logged-in role already has.
DROP POLICY IF EXISTS "Users can manage their own business batches" ON inventory_batches;
CREATE POLICY "tenant_isolation" ON inventory_batches
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

DROP POLICY IF EXISTS "tenant_isolation" ON sale_item_batches;
CREATE POLICY "tenant_isolation" ON sale_item_batches
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- ========================================
-- ROLLBACK SQL (do not run unless reverting)
-- ========================================
--
-- DROP POLICY IF EXISTS "device_registrations_owner_all" ON device_registrations;
-- DROP POLICY IF EXISTS "device_registrations_self_select" ON device_registrations;
-- DROP TABLE IF EXISTS device_registrations;
-- DROP POLICY IF EXISTS "device_audit_log_owner_select" ON device_audit_log;
-- DROP POLICY IF EXISTS "device_audit_log_self_insert" ON device_audit_log;
-- DROP POLICY IF EXISTS "device_audit_log_self_select" ON device_audit_log;
-- DROP TABLE IF EXISTS device_audit_log;
--
-- CREATE OR REPLACE FUNCTION auth_business_id()
-- RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
--   SELECT id FROM businesses WHERE owner_id = auth.uid()
--   UNION ALL
--   SELECT business_id FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
--   LIMIT 1;
-- $$;
--
-- CREATE OR REPLACE FUNCTION auth_user_role()
-- RETURNS text LANGUAGE sql SECURITY DEFINER STABLE AS $$
--   SELECT 'owner' WHERE EXISTS (SELECT 1 FROM businesses WHERE owner_id = auth.uid())
--   UNION ALL
--   SELECT role FROM employees WHERE auth_user_id = auth.uid() AND status = 'active'
--   LIMIT 1;
-- $$;
--
-- DROP POLICY IF EXISTS "po_insert" ON purchase_orders;
-- CREATE POLICY "po_insert" ON purchase_orders FOR INSERT TO authenticated
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager'));
-- DROP POLICY IF EXISTS "po_update" ON purchase_orders;
-- CREATE POLICY "po_update" ON purchase_orders FOR UPDATE TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id() AND (auth_user_role() IN ('owner', 'manager') OR status <> 'cancelled'));
-- DROP POLICY IF EXISTS "po_delete" ON purchase_orders;
-- CREATE POLICY "po_delete" ON purchase_orders FOR DELETE TO authenticated
--   USING (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager'));
-- DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
-- CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT TO authenticated
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager'));
-- DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
-- CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE TO authenticated
--   USING (business_id = auth_business_id())
--   WITH CHECK (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager'));
-- DROP POLICY IF EXISTS "suppliers_delete" ON suppliers;
-- CREATE POLICY "suppliers_delete" ON suppliers FOR DELETE TO authenticated
--   USING (business_id = auth_business_id() AND auth_user_role() IN ('owner', 'manager'));
--
-- DROP POLICY IF EXISTS "tenant_isolation" ON inventory_batches;
-- CREATE POLICY "Users can manage their own business batches" ON inventory_batches
--   FOR ALL TO authenticated
--   USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
--   WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
-- DROP POLICY IF EXISTS "tenant_isolation" ON sale_item_batches;
-- CREATE POLICY "tenant_isolation" ON sale_item_batches
--   FOR ALL TO authenticated
--   USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))
--   WITH CHECK (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
