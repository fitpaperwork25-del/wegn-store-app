# V2 Phase 1: Staff Accounts & Permissions

## Design Document

**Version:** Draft 1.0

**Date:** June 2026

**Status:** Planning

**FIT Paper Work**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Goals](#2-business-goals)
3. [Current State](#3-current-state)
4. [Role Definitions](#4-role-definitions)
5. [Permission Matrix](#5-permission-matrix)
6. [Database Design](#6-database-design)
7. [RLS Strategy](#7-rls-strategy)
8. [UI Changes](#8-ui-changes)
9. [Staff Invitation Flow](#9-staff-invitation-flow)
10. [Staff Deactivation Flow](#10-staff-deactivation-flow)
11. [Implementation Phases](#11-implementation-phases)
12. [Testing Plan](#12-testing-plan)
13. [Rollback Plan](#13-rollback-plan)
14. [Risks and Mitigations](#14-risks-and-mitigations)

---

## 1. Executive Summary

V2 Phase 1 introduces multi-user access to Wegn-Store. In v1, only the business owner can authenticate and access the application. Staff members (cashiers, managers, inventory clerks) exist as data records for reporting but cannot log in or operate the system independently.

Phase 1 adds authenticated staff accounts with role-based permissions. Each staff member gets their own Supabase Auth login, linked to the business through the existing `employees` table. Access is controlled by role — cashiers see only the POS, inventory clerks see only the Inventory tab, managers see operations and reporting, and the owner retains full access including staff management and business settings.

The design extends the existing database schema (no new tables), updates the `auth_business_id()` security function to resolve both owners and staff, and adds UI-level tab gating based on role. Row-level security continues to enforce tenant isolation — staff can only access data belonging to their business.

---

## 2. Business Goals

**Enable shift-based operations.** Store owners need cashiers and managers to operate the POS, open/close cash drawers, and process sales independently during their shifts without sharing the owner's login credentials.

**Enforce least-privilege access.** A cashier should not be able to modify product prices, edit supplier information, or view profit reports. Each role should see only the features required for their job function.

**Maintain accountability.** Every sale, drawer session, and inventory adjustment should be traceable to the specific staff member who performed it, using their own authenticated identity rather than a shared account.

**Preserve owner control.** Only the business owner can invite staff, assign roles, deactivate accounts, and access business settings. Staff cannot escalate their own permissions or access other businesses.

---

## 3. Current State

### Authentication

- Single Supabase Auth account per business (the owner).
- Login via email/password in `AuthGate.tsx`.
- `businesses.owner_id` links to `auth.users.id`.
- `auth_business_id()` resolves `auth.uid()` → `businesses.id` via the `owner_id` lookup.

### Employee Records

- The `employees` table stores staff as data records: `id`, `business_id`, `name`, `role`, `status`, `created_at`.
- The `role` field is a free-text string. The UI dropdown offers "cashier" and "manager".
- Employees have no Supabase Auth accounts and cannot log in.
- `activeCashierId` is selected from a dropdown on the POS tab and stamped on `sales.cashier_id` and `drawer_sessions.cashier_id` for reporting.

### Access Control

- No permission checks exist anywhere in the codebase.
- All authenticated users (currently only the owner) have full access to every feature.
- RLS enforces tenant isolation by `business_id` but does not distinguish between roles.

### Staff Tab

- Labeled "Staff" with a subtitle noting that staff accounts are coming in v2.
- Provides: add employee form (name + role), employee list with activate/deactivate toggle, and cash drawer management.

---

## 4. Role Definitions

### Owner

The business owner. Created during signup. Has unrestricted access to all features, settings, and staff management. There is exactly one owner per business.

- **Authentication:** Supabase Auth account linked via `businesses.owner_id`.
- **Scope:** Full application access.
- **Unique capabilities:** Business settings, tax configuration, staff invitation/deactivation, all reports.

### Manager

A trusted staff member responsible for daily operations. Can perform all operational tasks but cannot modify business configuration or manage staff accounts.

- **Authentication:** Supabase Auth account linked via `employees.auth_user_id`.
- **Scope:** POS, Inventory, Purchasing, Customers, Reports, Cash Drawer, Stock Counts.
- **Restrictions:** Cannot access Settings or Staff management tabs. Cannot invite or deactivate other staff.

### Cashier

A front-line staff member operating the point of sale. Limited to checkout operations and their own cash drawer.

- **Authentication:** Supabase Auth account linked via `employees.auth_user_id`.
- **Scope:** POS checkout, cash drawer open/close, own sales history.
- **Restrictions:** Cannot access Inventory, Purchasing, Customers, Reports, Settings, or Staff tabs. Cannot view cost prices, profit data, or supplier information.

### Inventory Clerk

A staff member responsible for stock management. Limited to inventory operations.

- **Authentication:** Supabase Auth account linked via `employees.auth_user_id`.
- **Scope:** Inventory tab (product catalog, stock adjustments, stock movement history, stock counts, receiving).
- **Restrictions:** Cannot access POS, Purchasing, Customers, Reports, Settings, or Staff tabs. Cannot process sales or manage cash drawers.

---

## 5. Permission Matrix

| Feature | Owner | Manager | Cashier | Inventory Clerk |
|---|---|---|---|---|
| **Dashboard** | Full | Full | — | — |
| **POS — Checkout** | Full | Full | Full | — |
| **POS — Sales History** | Full | Full | Own sales only | — |
| **POS — Void Sales** | Full | Full | — | — |
| **POS — Returns** | Full | Full | — | — |
| **Inventory — Products** | Full | Full | — | View + Edit |
| **Inventory — Stock Adjustments** | Full | Full | — | Full |
| **Inventory — Stock Counts** | Full | Full | — | Full |
| **Inventory — Stock Movement** | Full | Full | — | View |
| **Purchasing — Suppliers** | Full | Full | — | — |
| **Purchasing — Purchase Orders** | Full | Full | — | — |
| **Purchasing — Receiving** | Full | Full | — | Full |
| **Purchasing — Reorder Center** | Full | Full | — | — |
| **Customers** | Full | Full | — | — |
| **Staff — Employee List** | Full | — | — | — |
| **Staff — Invite/Deactivate** | Full | — | — | — |
| **Cash Drawer** | Full | Full | Full | — |
| **Reports — Sales Analytics** | Full | Full | — | — |
| **Reports — End-of-Day** | Full | Full | — | — |
| **Reports — Profit Report** | Full | Full | — | — |
| **Settings — Business Profile** | Full | — | — | — |
| **Settings — Tax Configuration** | Full | — | — | — |

---

## 6. Database Design

### Schema Changes to `employees` Table

Three new columns are added to the existing `employees` table. No new tables are required.

```sql
ALTER TABLE employees
  ADD COLUMN auth_user_id uuid UNIQUE,
  ADD COLUMN invited_at timestamptz,
  ADD COLUMN invite_status text DEFAULT 'pending'
    CHECK (invite_status IN ('pending', 'accepted', 'revoked'));
```

| Column | Type | Purpose |
|---|---|---|
| `auth_user_id` | `uuid`, unique, nullable | Links the employee record to a Supabase Auth account. `NULL` for legacy employee records without login access. |
| `invited_at` | `timestamptz`, nullable | Timestamp when the owner sent the staff invitation. |
| `invite_status` | `text`, default `'pending'` | Tracks invitation lifecycle: `pending` (invited, not yet logged in), `accepted` (first login completed), `revoked` (access removed by owner). |

### Updated `employees` Schema

```
employees
├── id              uuid        PK
├── business_id     uuid        FK → businesses.id
├── name            text        NOT NULL
├── role            text        ('owner', 'manager', 'cashier', 'inventory_clerk')
├── status          text        ('active', 'inactive')
├── auth_user_id    uuid        UNIQUE, nullable → auth.users.id
├── invited_at      timestamptz nullable
├── invite_status   text        ('pending', 'accepted', 'revoked')
└── created_at      timestamptz
```

### Role Constraint

```sql
ALTER TABLE employees
  ADD CONSTRAINT employees_role_check
  CHECK (role IN ('owner', 'manager', 'cashier', 'inventory_clerk'));
```

### Updated `auth_business_id()` Function

The security function is updated to resolve both owners and staff:

```sql
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
  LIMIT 1;
$$;
```

The `UNION ALL` with `LIMIT 1` short-circuits after the first match. Owners are checked first (primary path). Staff resolution is the fallback. Both paths are indexed.

### New `auth_user_role()` Function

A helper function to resolve the current user's role:

```sql
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
  LIMIT 1;
$$;
```

Returns `'owner'`, `'manager'`, `'cashier'`, or `'inventory_clerk'`. Returns `NULL` if the user has no business association.

### Index

```sql
CREATE INDEX idx_employees_auth_user_id ON employees (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
```

Ensures fast lookup in `auth_business_id()` and `auth_user_role()` for staff resolution.

---

## 7. RLS Strategy

### Tenant Isolation (18 Data Tables)

**No change required.** All 18 data tables already enforce `business_id = auth_business_id()`. Once `auth_business_id()` resolves staff accounts, staff automatically get tenant-scoped access to their business's data.

### Businesses Table

Add a SELECT policy for staff so they can read their business profile (needed for header display, receipts, tax rate):

```sql
CREATE POLICY "staff_select" ON businesses
  FOR SELECT TO authenticated
  USING (id = auth_business_id());
```

The existing `owner_select` and `owner_update` policies remain unchanged. Staff can read but not update the business profile.

### Employees Table

Replace the current `tenant_isolation` (FOR ALL) policy with specific policies:

```sql
-- All staff can read employee records in their business
CREATE POLICY "employee_select" ON employees
  FOR SELECT TO authenticated
  USING (business_id = auth_business_id());

-- Only owners can insert, update, or delete employee records
CREATE POLICY "employee_manage" ON employees
  FOR INSERT TO authenticated
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "employee_update" ON employees
  FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "employee_delete" ON employees
  FOR DELETE TO authenticated
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );
```

This ensures staff can see the employee list (needed for cashier dropdowns) but cannot modify employee records, change their own role, or invite other staff.

### Role-Based Data Restrictions (Future)

Phase 1 enforces role-based access at the UI level (tab visibility). Data-level restrictions (e.g., preventing cashiers from reading `products.cost_price` or `products.average_cost`) are deferred to Phase 1.1. The current RLS policies grant full read access to all data within the tenant — UI gating is the primary control in Phase 1.

---

## 8. UI Changes

### AuthGate

No changes to the login form. Staff log in using the same email/password form as the owner. After authentication, the application resolves their role and adjusts the UI accordingly.

### App.tsx — Role Loading

On mount, the application queries the user's role:

```javascript
const { data } = await supabase.rpc('auth_user_role');
setUserRole(data); // 'owner' | 'manager' | 'cashier' | 'inventory_clerk'
```

The role is stored in React state and drives tab visibility.

### Tab Visibility

| Tab | Visible To |
|---|---|
| Dashboard | owner, manager |
| POS | owner, manager, cashier |
| Inventory | owner, manager, inventory_clerk |
| Purchasing | owner, manager |
| Customers | owner, manager |
| Staff | owner |
| Reports | owner, manager |
| Settings | owner |

Tabs not permitted for the current role are hidden from the navigation. The default tab on login is determined by role:

| Role | Default Tab |
|---|---|
| owner | Dashboard |
| manager | Dashboard |
| cashier | POS |
| inventory_clerk | Inventory |

### Header

- Display the current user's role as a badge next to "My Account": e.g., `Owner`, `Manager`, `Cashier`, `Inventory`.
- The business name continues to display from `businessName` state.

### Staff Tab (Owner Only)

The existing employee list and add form are retained. New additions:

- **Invite Staff** section: email input + role dropdown → sends invitation.
- **Invite status** column in employee table: pending, accepted, revoked.
- **Revoke Access** button per employee: deactivates the account.
- **Role editing**: owner can change a staff member's role from the employee table.

### Cashier View

The cashier sees a simplified interface:

- POS tab with product search, barcode scanning, cart, checkout, and payment.
- Cash drawer open/close and paid outs.
- Own recent sales (filtered by `cashier_id = current employee id`).
- No access to sales history for other cashiers, void, or returns.

---

## 9. Staff Invitation Flow

```
Owner opens Staff tab
  │
  ▼
Owner enters staff email and selects role
  │
  ▼
Application creates Supabase Auth account
  │   supabase.auth.admin.createUser() or
  │   supabase.auth.signUp() with generated password
  ▼
Application creates employee record
  │   auth_user_id = new user's id
  │   role = selected role
  │   status = 'active'
  │   invite_status = 'pending'
  │   invited_at = now()
  ▼
Invitation email sent to staff member
  │   Contains login credentials or magic link
  ▼
Staff member logs in for the first time
  │
  ▼
Application detects first login
  │   Updates invite_status = 'accepted'
  ▼
Staff member sees role-appropriate UI
```

### Constraints

- The owner must have an active business to invite staff.
- Each email can only be linked to one employee record across all businesses (enforced by `auth_user_id UNIQUE`).
- The role must be one of: `manager`, `cashier`, `inventory_clerk`. Owners cannot invite other owners.
- The invite creates both the auth account and the employee record atomically. If either fails, neither is persisted.

---

## 10. Staff Deactivation Flow

```
Owner opens Staff tab
  │
  ▼
Owner clicks "Revoke Access" on a staff member
  │
  ▼
Application updates employee record
  │   status = 'inactive'
  │   invite_status = 'revoked'
  ▼
Effect is immediate
  │   auth_business_id() filters by status = 'active'
  │   Deactivated staff get zero rows on next request
  │   All RLS policies return no data
  ▼
Staff member's next action fails silently
  │   They see no data, cannot perform any operation
  ▼
On next page load, application detects no business
  │   Shows "Contact your business owner" message
```

### Key Behaviors

- Deactivation does not delete the Supabase Auth account. The staff member can still authenticate, but `auth_business_id()` returns `NULL` (no active employee record), so all RLS policies deny access.
- Deactivation is reversible. The owner can reactivate by setting `status = 'active'` and `invite_status = 'accepted'`.
- The owner cannot deactivate themselves.
- Active sessions are not forcibly terminated. Access is denied on the next database query.

---

## 11. Implementation Phases

### Phase 1.0: Database Foundation

**Scope:** Schema changes and function updates only. No code changes.

1. Add `auth_user_id`, `invited_at`, `invite_status` columns to `employees`.
2. Add `employees_role_check` constraint.
3. Create index on `auth_user_id`.
4. Update `auth_business_id()` to resolve owners and staff.
5. Create `auth_user_role()` function.
6. Update employees RLS policies (select for all, manage for owner only).
7. Add `staff_select` policy on businesses.

**Verification:** Existing owner login works. All modules load. RLS enforces. No regressions.

### Phase 1.1: Role Loading and Tab Gating

**Scope:** Frontend code changes only.

1. Add `userRole` state to `App.tsx`.
2. Call `auth_user_role()` on mount via Supabase RPC.
3. Gate tab visibility by role.
4. Set default tab by role.
5. Add role badge to header.

**Verification:** Owner sees all tabs. Role state is set correctly. No UI regressions.

### Phase 1.2: Staff Invitation

**Scope:** Frontend + auth integration.

1. Add invite form to Staff tab (email + role).
2. Implement `handleInviteStaff`: create auth account + employee record.
3. Add invite status display to employee table.
4. Handle first-login detection to update `invite_status`.

**Verification:** Owner can invite. Staff can log in. Role-appropriate UI appears.

### Phase 1.3: Staff Deactivation and Management

**Scope:** Frontend code changes.

1. Add "Revoke Access" button per employee.
2. Implement `handleRevokeAccess`: update status + invite_status.
3. Add "Reactivate" button for revoked staff.
4. Add role-change dropdown for active staff.

**Verification:** Deactivated staff lose access immediately. Reactivation restores access.

### Phase 1.4: Cashier Restrictions

**Scope:** Frontend code changes.

1. Filter sales history to own sales for cashier role.
2. Hide void and return actions for cashiers.
3. Auto-set `activeCashierId` to the logged-in employee for staff accounts.

**Verification:** Cashier can only complete sales and manage their drawer. Cannot void, return, or see other cashiers' sales.

---

## 12. Testing Plan

### Unit Tests

| Test | Expected Result |
|---|---|
| `auth_business_id()` with owner auth | Returns `businesses.id` |
| `auth_business_id()` with staff auth | Returns `employees.business_id` |
| `auth_business_id()` with inactive staff | Returns `NULL` |
| `auth_business_id()` with unlinked user | Returns `NULL` |
| `auth_user_role()` with owner | Returns `'owner'` |
| `auth_user_role()` with manager | Returns `'manager'` |
| `auth_user_role()` with cashier | Returns `'cashier'` |
| `auth_user_role()` with deactivated staff | Returns `NULL` |

### RLS Tests

| Test | Expected Result |
|---|---|
| Staff SELECT on own business products | Returns rows |
| Staff SELECT on other business products | Returns zero rows |
| Staff UPDATE on employees table | Rejected (no matching policy) |
| Owner UPDATE on employees table | Succeeds |
| Staff UPDATE on businesses table | Rejected |
| Owner UPDATE on businesses table | Succeeds |
| Deactivated staff SELECT on any table | Returns zero rows |

### UI Tests

| Test | Expected Result |
|---|---|
| Owner login | All 8 tabs visible. Default tab: Dashboard. |
| Manager login | 7 tabs visible (no Settings). Default tab: Dashboard. |
| Cashier login | 2 tabs visible (POS + Cash Drawer). Default tab: POS. |
| Inventory clerk login | 1 tab visible (Inventory). Default tab: Inventory. |
| Cashier attempts direct URL to /settings | Tab content hidden. |
| Owner invites staff | Auth account created, employee record linked. |
| Owner deactivates staff | Staff's next request returns no data. |
| Deactivated staff refreshes page | Sees "Contact your business owner" screen. |

### Regression Tests

| Test | Expected Result |
|---|---|
| Existing owner login after migration | Full access, no changes to behavior. |
| All modules (POS, Inventory, Purchasing, etc.) | Function identically for owner role. |
| Sales with cashier assignment | Cashier dropdown still works. |
| Cash drawer open/close | Works for owner and permitted staff. |
| End-of-day report | Displays correctly with staff sales data. |
| Receipt generation | Shows business name and details correctly. |

---

## 13. Rollback Plan

Each implementation phase is independently reversible:

### Phase 1.0 Rollback (Database)

```sql
-- Restore original auth_business_id()
CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;

-- Drop role function
DROP FUNCTION IF EXISTS auth_user_role();

-- Restore original employees policy
DROP POLICY IF EXISTS "employee_select" ON employees;
DROP POLICY IF EXISTS "employee_manage" ON employees;
DROP POLICY IF EXISTS "employee_update" ON employees;
DROP POLICY IF EXISTS "employee_delete" ON employees;
DROP POLICY IF EXISTS "staff_select" ON businesses;

CREATE POLICY "tenant_isolation" ON employees
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());

-- Remove new columns (optional — nullable columns are harmless)
ALTER TABLE employees
  DROP COLUMN IF EXISTS auth_user_id,
  DROP COLUMN IF EXISTS invited_at,
  DROP COLUMN IF EXISTS invite_status;

DROP INDEX IF EXISTS idx_employees_auth_user_id;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;
```

### Phase 1.1–1.4 Rollback (Frontend)

Revert the relevant commits. The database changes from Phase 1.0 are backward-compatible (new columns are nullable, updated functions still resolve owners correctly), so frontend rollback does not require database rollback.

### Rollback Verification

After any rollback:
1. Owner can log in and access all features.
2. All RLS policies enforce tenant isolation.
3. `auth_business_id()` resolves owner → business correctly.
4. No staff-related UI elements are visible.

---

## 14. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **`auth_business_id()` regression** | Owner loses access to all data if the function breaks. | Low | Deploy function update as a separate migration. Test owner access immediately. Keep rollback SQL ready. |
| **Performance degradation** | `UNION ALL` in `auth_business_id()` adds a second lookup to every query. | Low | Both lookups use indexed columns (`owner_id`, `auth_user_id`). `LIMIT 1` short-circuits. Monitor query execution time. |
| **Role escalation via API** | Staff crafts a direct Supabase API call to update their own `employees.role`. | Low | RLS `employee_manage` policy restricts INSERT/UPDATE/DELETE on employees to owners only. Staff cannot modify employee records. |
| **Data leakage via API** | Cashier accesses cost prices or profit data via direct API calls (bypassing UI gating). | Medium | Phase 1 relies on UI gating. Data-level restrictions (column-level RLS) deferred to Phase 1.1. Acceptable risk for initial rollout — staff would need to craft raw API requests. |
| **Invite email delivery** | Supabase may require email confirmation depending on project settings. Staff can't log in until confirmed. | Medium | Verify email confirmation setting. If enabled, use `admin.createUser()` with `email_confirm: true` to skip confirmation. |
| **Orphaned auth accounts** | Deactivating a staff member doesn't delete their Supabase Auth account. Orphaned accounts accumulate. | Low | Acceptable for v2 scope. Auth accounts consume minimal resources. Full account deletion can be added later. |
| **Concurrent owner + staff edits** | Owner and manager both edit the same product or process overlapping sales. | Medium | PostgreSQL handles concurrent writes via MVCC. No additional locking needed. Last-write-wins is acceptable for this scale. |
| **Migration on live production** | Schema changes applied while the app is in use. | Low | All changes are additive (new columns, new functions, new policies). No destructive operations. Deploy during low-traffic period. |
| **Staff sees setup screen** | If `auth_business_id()` fails for staff, the app shows "Set Up Your Business" instead of a staff-appropriate message. | Medium | Add role-aware messaging: if user is authenticated but has no business, check if they're a deactivated staff member and show "Contact your business owner" instead of the business creation form. |
