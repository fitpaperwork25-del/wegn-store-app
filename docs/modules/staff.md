# Module: Staff / Roles / PIN Login

**Related:** [modules/pos.md](pos.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Control access to features by role; require staff to identify themselves at a shared terminal via PIN.

---

## Features

- Add, edit, and deactivate employees with name, role, and optional PIN
- Four roles: owner, manager, cashier, inventory_clerk
- PIN lock screen when any active employee has a PIN set
- Owner bypass button (no PIN required for owner)
- Tab-level access control per role
- `canVoidSales` flag (owner and manager only)
- `canManageStaff` flag (owner only)
- Partial scaffolding for Supabase Auth-linked staff accounts (`auth_user_id`, `invited_at`, `invite_status`)

---

## User Workflow

1. Owner adds employees with name, role, and optional PIN.
2. If any active employee has a PIN set, the app shows a PIN lock screen.
3. Staff enter their PIN → session unlocked as their role.
4. Owner can bypass PIN lock via "Owner Access" button.
5. Staff logs out → PIN screen returns.

---

## Database Tables

- `employees`

---

## Business Rules

- PINs are stored plaintext in the `employees` table.
- PIN login does not use Supabase Auth — it is purely client-side role switching.
- `canManageStaff` = owner only. `canVoidSales` = owner or manager.
- If no employees have PINs, the app is accessible to anyone without a PIN.

**Roles and tab access:**

| Role | Dashboard | POS | Inventory | Purchasing | Customers | Reports | Settings | Staff |
|---|---|---|---|---|---|---|---|---|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cashier | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Inventory Clerk | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

**Permission flags:**

| Permission | Owner | Manager | Cashier | Inventory Clerk |
|---|---|---|---|---|
| Complete sales | ✓ | ✓ | ✓ | ✗ |
| Void sales | ✓ | ✓ | ✗ | ✗ |
| Add/edit products | ✓ | ✓ | ✗ | ✓ |
| Adjust inventory | ✓ | ✓ | ✗ | ✓ |
| Deactivate products | ✓ | ✓ | ✗ | ✗ |
| Bulk import | ✓ | ✓ | ✗ | ✗ |
| Manage categories | ✓ | ✓ | ✗ | ✗ |
| Manage suppliers | ✓ | ✓ | ✗ | ✓ |
| Manage POs | ✓ | ✓ | ✗ | ✓ |
| Manage staff | ✓ | ✗ | ✗ | ✗ |
| View reports | ✓ | ✓ | ✗ | ✗ |
| Change settings | ✓ | ✓ | ✗ | ✗ |

Note: these permissions are implemented via tab-level access control in `tabAccess` and boolean flags like `canVoidSales`. There is no field-level permission enforcement.

---

## UI Components

- Employee list with role and status display
- Employee form (name, role dropdown, PIN field, status)
- PIN lock screen (shown on app load when any active employee has a PIN)
- "Owner Access" bypass button on PIN lock screen
- Staff logout button (returns to PIN lock screen)

---

## Edge Cases

- If no employees have PINs set, the PIN lock screen does not appear — the app is open to anyone.
- Inactive employees cannot log in via PIN.
- Auth-linked staff (`auth_user_id`) are partially scaffolded but inviting staff via email is not production-ready.

---

## Known Issues

- PINs are stored plaintext — a security concern for production environments.
- Auth-linked staff accounts (`auth_user_id`) are only partially implemented. Inviting staff via email is not yet production-ready.
- Permission enforcement is tab-level only — no field-level restrictions.

---

## Test Checklist

See TC-08 in [../09_QA_TEST_SUITE.md](../09_QA_TEST_SUITE.md).

- [ ] Add employee with PIN
- [ ] PIN screen appears on next load
- [ ] Correct role restricts tab access
- [ ] Owner bypass works
- [ ] Staff logout returns to PIN screen
- [ ] Inactive employee PIN is rejected

---

## Future Enhancements

- PIN hashing (bcrypt or similar) for production security
- Staff invite via email (fully implemented via `auth_user_id`)
- Field-level permission enforcement

---

*Source: PLATFORM_REFERENCE.md §4 — Staff / Roles / PIN Login, §5 — Role Permissions*
