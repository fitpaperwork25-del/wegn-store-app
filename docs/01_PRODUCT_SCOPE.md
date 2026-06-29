# Product Scope

**Related:** [00_EXECUTIVE_OVERVIEW.md](00_EXECUTIVE_OVERVIEW.md) · [modules/](modules/) · [INDEX.md](INDEX.md)

---

## Current Product Scope

| Module | Status |
|---|---|
| Point of Sale (POS) | Shipped |
| Inventory management (CRUD, adjustments, stock counts) | Shipped |
| Smart Receive (AI invoice parsing → receiving session) | Shipped |
| Manual Receiving Sessions | Shipped |
| Supplier Invoice reconciliation | Shipped |
| Supplier Payments | Shipped |
| Purchase Orders | Shipped |
| FEFO batch/expiry tracking | Shipped |
| Customer management + loyalty points | Shipped |
| Returns/refunds | Shipped |
| Cash drawer sessions | Shipped |
| Staff / Roles / PIN login | Shipped |
| Reports (revenue, analytics, inventory valuation, low stock) | Shipped |
| Bulk product import (CSV) | Shipped |
| AI Smart Reorder recommendations | Shipped |
| Business settings (name, tax rate, selling policy) | Shipped |

---

## Intentionally Out of Scope (as of this release)

- Multi-location support
- Automated email delivery (PO email generates a mailto: draft only)
- Online storefront or e-commerce
- Automated stock replenishment
- Automated low-stock push alerts or notifications
- Accounting system integration (QuickBooks, Xero, etc.)
- Multi-currency
- Offline mode / service workers
- Mobile native app
- Automated test suite
- Server-side PDF generation
- User role permissions at the field level (access is tab-level only)

---

## Future Features (Customer-Driven, Do Not Build Yet)

The following have been identified as candidates for future development but must not be built until customer demand is confirmed:

- Multi-location inventory
- Thermal printer integration (ESC/POS)
- Offline mode / PWA
- Staff invite via email (partially scaffolded via `auth_user_id`)
- Automated low-stock alerts / email notifications
- Accounting integration
- Tax reporting (by tax category)
- Product variants / modifiers
- Subscription / recurring orders

---

*Source: PLATFORM_REFERENCE.md §1 — Executive Overview, §9 — Known Issues and Deferred Improvements*
