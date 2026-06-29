# Wegn-Store Platform Reference

**Version:** As of commit `862d299` (2026-06-29)
**Status:** Active codebase — paused for real-world testing. Future work should be incremental and customer-driven.

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Reference](#3-database-reference)
4. [Feature Documentation](#4-feature-documentation)
5. [Business Rules](#5-business-rules)
6. [Smart Receive Deep Documentation](#6-smart-receive-deep-documentation)
7. [Operational Guide](#7-operational-guide)
8. [QA and Regression Test Suite](#8-qa-and-regression-test-suite)
9. [Known Issues and Deferred Improvements](#9-known-issues-and-deferred-improvements)
10. [Developer Handoff](#10-developer-handoff)

---

## 1. Executive Overview

### What Wegn-Store Is

Wegn-Store is a single-tenant, web-based retail management platform. It provides point-of-sale (POS), inventory management, purchasing, receiving, supplier invoicing, supplier payments, customer loyalty, cash drawer management, staff/role management, and reporting — all in one application.

It is designed for small-to-medium retail businesses that need an integrated system without the complexity of enterprise software.

### Target Users

- **Owner:** Full access to all features. Sets up the business, manages staff, and reviews reports.
- **Manager:** Access to sales, inventory, purchasing, customers, and reports. Cannot manage staff or settings.
- **Cashier:** Access to dashboard, POS, and customers only.
- **Inventory Clerk:** Access to dashboard, inventory, and purchasing only.

### Current Product Scope

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

### Intentionally Out of Scope (as of this release)

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

## 2. System Architecture

### Frontend Structure

| File | Responsibility |
|---|---|
| `src/main.tsx` | React entry point; mounts `<AuthGate />` inside `<StrictMode>` |
| `src/AuthGate.tsx` | Handles Supabase email/password login and signup; passes `userId` and `onSignOut` to `<App />` |
| `src/App.tsx` | Entire application — all state, all data loaders, all event handlers, all UI (~11,050 lines) |
| `src/supabase.ts` | Creates and exports the Supabase JS v2 client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `src/App.css` | Global styles |

**Stack:**
- React 19.2
- TypeScript 6
- Vite 8
- `@supabase/supabase-js` v2
- `html2canvas` v1.4 + `jsPDF` v4 (PO PDF download)
- No routing library — navigation is `activeTab` state
- No state management library — all state is `useState` in `App`
- No UI component library — all UI is inline JSX with inline styles

**Key architectural fact:** There is no component tree. The entire application is a single React function component (`App`) with approximately 350+ state variables, 100+ async functions, and the full render tree — all in one file. This is intentional (avoids prop-drilling and keeps the app portable) but is the primary scalability constraint.

### Backend / Supabase Structure

| Layer | Details |
|---|---|
| Database | PostgreSQL via Supabase (hosted) |
| Auth | Supabase Auth — email/password only |
| RLS | Row Level Security on every table; enforced via `auth_business_id()` function |
| Edge Function | `supabase/functions/process-invoice/index.ts` — Deno runtime, calls Anthropic API |
| Storage | Not used |
| Realtime | Not used |

### Deployment Flow

```
npm run build
  → tsc -b (TypeScript type check)
  → vite build (bundles to dist/)
```

Built output: `dist/` directory. Deployment target is **not configured** in the repo (no `vercel.json`, no `netlify.toml`, no CI/CD pipeline). Deployment is manual. **Needs verification** on the exact hosting provider.

The Supabase Edge Function is deployed separately via Supabase CLI:
```
supabase functions deploy process-invoice
```

### Environment Variables

| Variable | Where | Required | Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `.env` (frontend) | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` (frontend) | Yes | Supabase anon/public key |
| `ANTHROPIC_API_KEY` | Supabase Edge Function secret | Yes | Claude API key for Smart Receive invoice parsing |

The `.env` file is not committed. `.env.example` shows the required keys. The Anthropic key lives only in Supabase's secret store and is never exposed to the browser.

### Major Files and Responsibilities

```
wegn-store-app/
├── src/
│   ├── main.tsx              # Entry point
│   ├── AuthGate.tsx          # Auth layer
│   ├── App.tsx               # Entire application (~11,050 lines)
│   ├── supabase.ts           # Supabase client
│   └── App.css               # Global styles
├── supabase/
│   ├── functions/
│   │   └── process-invoice/
│   │       └── index.ts      # AI invoice parsing Edge Function
│   └── migrations/           # SQL migration history (25 files)
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── .env.example              # Required env var template
├── package.json
├── tsconfig.app.json
├── vite.config.ts
└── PLATFORM_REFERENCE.md    # This file
```

### Known Architectural Constraints

1. **Single-file app.** `App.tsx` is ~11,050 lines. It cannot be split without a significant refactor. Avoid adding large features inline — future features should consider componentization first.
2. **No router.** Navigation is `activeTab` state. Deep-linking and browser back/forward do not work.
3. **No test suite.** There are zero automated tests. All verification is manual.
4. **No error boundaries.** A rendering crash in any section will crash the entire app. Deferred to Technical Backlog.
5. **Bundle size.** Build output is ~1.37 MB JS (356 KB gzipped). Vite warns about this. No code splitting is implemented.
6. **Transient state.** Several key state slices (`sessionPayments`, `sessionHistoryItems`, `batches`) are component-level and reset on page reload. This is expected behavior — the app reloads from Supabase on each mount.
7. **PO signatures in localStorage.** Digital signatures for purchase orders are stored in `localStorage`, not the database. They are device-specific and not persisted to the backend.
8. **`received_date` column.** This column exists on `receiving_sessions` in Supabase and is referenced in `loadSessionHistory`'s SELECT, but there is no migration file for it — it was created directly in the Supabase Dashboard. Any fresh project restore must add it manually.

---

## 3. Database Reference

### Tables

#### `businesses`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid | FK → `auth.users.id` |
| `name` | text | |
| `phone` | text | |
| `email` | text | |
| `address` | text | |
| `tax_rate` | numeric | Percentage (e.g. 8.5 = 8.5%) |
| `selling_policy` | text | `fixed_pricing` / `negotiated_pricing` / `negotiated_with_approval` |
| `created_at` | timestamptz | |

#### `products`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Called `product_id` in the join/view result (`ProductStock` type) |
| `business_id` | uuid FK | |
| `name` | text | |
| `sku` | text | Nullable |
| `barcode` | text | Unique index per business |
| `selling_price` | numeric | |
| `cost_price` | numeric | Last known/set cost |
| `average_cost` | numeric | Weighted average; updated on receive |
| `status` | text | `active` / `inactive` |
| `supplier_id` | uuid | Nullable FK → `suppliers.id` |
| `category_id` | uuid | Nullable FK → `categories.id` |
| `estimated_overhead_pct` | numeric | Default 0 |
| `target_margin_percent` | numeric | Nullable |
| `minimum_margin_percent` | numeric | Nullable |
| `created_at` | timestamptz | |

#### `inventory`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Called `inventory_id` in joined queries |
| `business_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity_on_hand` | numeric | |
| `reorder_level` | numeric | Nullable |
| `created_at` | timestamptz | |

#### `inventory_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `product_id` | uuid FK | |
| `transaction_type` | text | `receiving`, `sale`, `adjustment`, `return`, `expired`, `stock_count` |
| `quantity_change` | numeric | Positive = added, negative = removed |
| `quantity_before` | numeric | |
| `quantity_after` | numeric | |
| `reason` | text | Nullable |
| `reference_id` | uuid | Nullable; links to session/sale/etc. |
| `created_by` | uuid | Nullable (profiles table is empty; not actively used) |
| `created_at` | timestamptz | |

#### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `description` | text | Nullable |
| `status` | text | `active` / `inactive` |

#### `suppliers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `contact_name` | text | Nullable |
| `phone` | text | Nullable |
| `email` | text | Nullable |
| `notes` | text | Nullable |
| `status` | text | `active` / `inactive` |

#### `purchase_orders`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `supplier_id` | uuid FK | |
| `po_number` | text | |
| `status` | text | `draft` / `ordered` / `partially_received` / `received` / `cancelled` |
| `subtotal` | numeric | |
| `notes` | text | Nullable |
| `created_at` | timestamptz | |

#### `purchase_order_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `purchase_order_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity` | numeric | Ordered qty |
| `quantity_received` | numeric | Received so far |
| `unit_cost` | numeric | |
| `line_total` | numeric | |
| `receive_notes` | text | Nullable; per-line exception notes from receiving |

#### `receiving_sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `supplier_id` | uuid | Nullable FK → `suppliers.id` |
| `supplier_name` | text | Nullable; AI-extracted name when no match found |
| `received_by` | text | Nullable |
| `status` | text | `draft` / `completed` / `cancelled` |
| `notes` | text | Nullable |
| `invoice_number` | text | Nullable |
| `invoice_date` | date | Nullable |
| `invoice_total` | numeric | NOT NULL DEFAULT 0 |
| `freight_cost` | numeric | NOT NULL DEFAULT 0 |
| `additional_cost` | numeric | NOT NULL DEFAULT 0 |
| `invoice_status` | text | NOT NULL DEFAULT `pending`; CHECK: `pending` / `matched` / `variance` |
| `calculated_total` | numeric | NOT NULL DEFAULT 0; sum of line items + freight + additional |
| `variance_amount` | numeric | NOT NULL DEFAULT 0; `invoice_total - calculated_total` |
| `approved_by` | text | Nullable; `"auto"` for Smart Receive auto-matched |
| `approved_at` | timestamptz | Nullable |
| `approval_note` | text | Nullable |
| `received_date` | date | **No migration file** — created directly in Supabase Dashboard |
| `created_at` | timestamptz | |

#### `receiving_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `receiving_session_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity_received` | numeric | |
| `unit_cost` | numeric | |
| `total_cost` | numeric | Nullable; `unit_cost × quantity_received` |
| `created_at` | timestamptz | |

#### `inventory_batches`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `product_id` | uuid FK | |
| `receiving_session_id` | uuid | Nullable FK → `receiving_sessions.id` ON DELETE SET NULL |
| `receiving_session_item_id` | uuid | Nullable FK → `receiving_items.id` ON DELETE SET NULL |
| `supplier_id` | uuid | Nullable FK → `suppliers.id` ON DELETE SET NULL |
| `supplier_name` | text | Nullable |
| `batch_number` | text | Nullable |
| `lot_number` | text | Nullable |
| `manufactured_date` | date | Nullable |
| `expiration_date` | date | Nullable; used for FEFO ordering |
| `quantity_received` | numeric | Original received qty |
| `quantity_remaining` | numeric | Decremented by POS sales |
| `unit_cost` | numeric | Nullable |
| `status` | text | `active` / `expired` / `consumed` / `written_off` / `depleted` |
| `created_at` | timestamptz | |

#### `sale_item_batches`
Audit trail linking each sale line item to the specific batch(es) it consumed (FEFO).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `sale_id` | uuid FK | |
| `sale_item_id` | uuid FK | |
| `product_id` | uuid FK | |
| `inventory_batch_id` | uuid FK | |
| `quantity` | numeric | Units consumed from this batch |
| `unit_cost` | numeric | Nullable |
| `expiration_date` | date | Nullable; copied from batch at sale time |

#### `sales`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `cashier_id` | uuid | Nullable FK → `employees.id` |
| `customer_id` | uuid | Nullable FK → `customers.id` |
| `subtotal` | numeric | Before discount and tax |
| `tax` | numeric | |
| `discount_amount` | numeric | |
| `total` | numeric | Final amount charged |
| `status` | text | `open` (in-progress) / `completed` / `voided` |
| `created_at` | timestamptz | |

#### `sale_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `sale_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity` | numeric | |
| `unit_price` | numeric | Price at time of sale (may differ from current selling_price) |
| `line_total` | numeric | |
| `original_unit_price` | numeric | Nullable; catalog price before any negotiation |
| `negotiation_reason` | text | Nullable |
| `negotiated_by` | uuid | Nullable FK → `employees.id` |

#### `payments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `sale_id` | uuid FK | |
| `payment_method` | text | `cash` / `card` / `bank_transfer` / `mobile_money` / `other` |
| `payment_type` | text | NOT NULL DEFAULT `sale`; CHECK: `sale` / `refund` |
| `amount` | numeric | Negative for refunds |
| `reference` | text | Nullable; mobile money confirmation code, etc. |
| `created_at` | timestamptz | |

#### `supplier_payments`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `supplier_id` | uuid | **NOT NULL** FK → `suppliers.id` ON DELETE CASCADE |
| `receiving_session_id` | uuid | Nullable FK → `receiving_sessions.id` ON DELETE SET NULL |
| `payment_date` | date | NOT NULL |
| `amount` | numeric | NOT NULL DEFAULT 0 |
| `payment_method` | text | NOT NULL |
| `reference` | text | Nullable |
| `notes` | text | Nullable |
| `created_at` | timestamptz | |

**Critical:** `supplier_id` is `NOT NULL`. A receiving session must have a linked `supplier_id` before a payment can be recorded against it.

#### `customers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `phone` | text | |
| `email` | text | Nullable |
| `status` | text | `active` / `inactive` |

#### `loyalty_transactions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `customer_id` | uuid FK | |
| `sale_id` | uuid | Nullable |
| `points` | integer | Positive = earned, negative = redeemed |
| `type` | text | `earned` / `redeemed` |
| `created_at` | timestamptz | |

**Loyalty rate:** 1 point per dollar spent. 100 points = $1.00 redemption value. Redemption is applied as a dollar discount before tax.

#### `return_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `sale_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity_returned` | numeric | |
| `reason` | text | Nullable (legacy) |
| `return_number` | text | Nullable; unique per return |
| `return_reason` | text | Nullable |
| `notes` | text | Nullable |
| `processed_by` | uuid | Nullable |
| `created_at` | timestamptz | |

#### `drawer_sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `cashier_id` | uuid | Nullable |
| `status` | text | `open` / `closed` |
| `opening_float` | numeric | Cash in drawer at open |
| `opened_at` | timestamptz | |
| `closed_at` | timestamptz | Nullable |
| `closing_count` | numeric | Nullable; physical cash count |
| `expected_cash` | numeric | Nullable; float + cash sales - paid outs |
| `over_short` | numeric | Nullable; `closing_count - expected_cash` |
| `notes` | text | Nullable |

#### `drawer_paid_outs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `drawer_session_id` | uuid FK | |
| `business_id` | uuid FK | |
| `amount` | numeric | |
| `reason` | text | Nullable |
| `created_at` | timestamptz | |

#### `employees`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `role` | text | CHECK: `owner` / `manager` / `cashier` / `inventory_clerk` |
| `status` | text | `active` / `inactive` |
| `pin` | text | Nullable; plaintext 4–6 digit PIN |
| `auth_user_id` | uuid | Nullable; for Supabase Auth-linked staff accounts |
| `invited_at` | timestamptz | Nullable |
| `invite_status` | text | `pending` / `accepted` / `revoked` |

**Note:** PINs are stored plaintext. PIN-based login is local to the device — it does not use Supabase Auth. Auth-linked staff accounts (via `auth_user_id`) are partially implemented but not yet production-ready.

#### `stock_counts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `status` | text | |
| `notes` | text | Nullable |
| `completed_at` | timestamptz | |
| `created_at` | timestamptz | |

#### `stock_count_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `stock_count_id` | uuid FK | |
| `product_id` | uuid FK | |
| `system_qty` | numeric | Qty at time of count |
| `counted_qty` | numeric | Physical count |
| `variance` | numeric | `counted_qty - system_qty` |

### Key Relationships

```
businesses
  ├── products → inventory, inventory_transactions, sale_items, inventory_batches
  ├── suppliers → purchase_orders, receiving_sessions, supplier_payments
  ├── receiving_sessions → receiving_items → inventory_batches
  ├── sales → sale_items → sale_item_batches → inventory_batches
  ├── sales → payments (sale + refund)
  ├── customers → loyalty_transactions, sales
  ├── employees → sales (cashier_id)
  └── drawer_sessions → drawer_paid_outs
```

### RLS / Security Model

All tables use Row Level Security. The core pattern:

```sql
USING (business_id = auth_business_id())
WITH CHECK (business_id = auth_business_id())
```

`auth_business_id()` is a `SECURITY DEFINER` stable function that resolves the current Supabase Auth user to a `business_id` by checking:
1. `businesses.owner_id = auth.uid()` — returns owner's business
2. `employees.auth_user_id = auth.uid() AND status = 'active'` — returns employee's business

`auth_user_role()` similarly returns the current user's role string (`owner` / `manager` / `cashier` / `inventory_clerk`).

`anon` role has all table access revoked.

**Exception:** `inventory_batches` uses a simpler owner-only policy (does not check `employees.auth_user_id`). This means staff logged in via `auth_user_id` may not be able to query batches directly. **Needs verification** in production.

`businesses` table uses owner-specific policies (`owner_id = auth.uid()`) rather than `auth_business_id()`.

### Important Functions / Policies

| Name | Type | Purpose |
|---|---|---|
| `auth_business_id()` | Function | Maps `auth.uid()` → `business_id` for RLS |
| `auth_user_role()` | Function | Maps `auth.uid()` → role string |
| `tenant_isolation` | Policy name | Standard policy on all business-owned tables |
| `idx_inventory_batches_fefo` | Index | Partial composite on `(product_id, expiration_date ASC)` WHERE `status='active' AND quantity_remaining>0` — powers FEFO lookups |

### Business-Critical Fields

| Field | Importance |
|---|---|
| `receiving_sessions.invoice_status` | Controls badge display and Record Payment eligibility |
| `receiving_sessions.approved_by` | Required for Record Payment button to appear |
| `receiving_sessions.invoice_total` | Must be > 0 for payment to be available |
| `receiving_sessions.supplier_id` | **NOT NULL constraint on `supplier_payments`** — must be linked before payment |
| `inventory.quantity_on_hand` | The authoritative stock number; updated on receive, sale, return, adjustment, write-off |
| `products.average_cost` | Weighted average; updated on every receiving post |
| `inventory_batches.quantity_remaining` | Decremented by POS FEFO allocation; tracks sellable batch qty |
| `payments.payment_type` | `sale` vs `refund` — critical for drawer cash calculation |

### Data Integrity Assumptions

- One `inventory` row per `product` per business. The app does not handle multiple inventory locations.
- `inventory.quantity_on_hand` is maintained by the app, not by DB triggers. Concurrent edits from multiple browser tabs could cause race conditions on stock.
- Receiving posts are NOT atomic (not wrapped in a Postgres transaction). If a post partially fails mid-loop, some products may be updated and others not. This is a known limitation.
- Loyalty points are integer values. Redemption converts 100 pts → $1.00.
- `received_date` on `receiving_sessions` was added directly in the Supabase Dashboard; there is no migration for it.

---

## 4. Feature Documentation

### Dashboard

**Purpose:** At-a-glance daily summary and priority workspace for the owner/manager.

**User workflow:**
1. Loads automatically on login (or after staff PIN login).
2. Shows today's revenue, transaction count, and a 5-item recent sales list.
3. Shows low-stock alerts if any products are below reorder level.
4. Shows an owner "Today's Priorities" section with pending actions (active receiving session, unpaid invoices, open purchase orders, etc.).

**Database tables:** `sales`, `sale_items`, `inventory`, `products`, `receiving_sessions`, `purchase_orders`

**Business rules:**
- Dashboard data is computed from in-memory state (`dashboardData` memo), not a separate DB query.
- Revenue is from `completed` sales only (`status = 'completed'`).
- Low-stock shows products where `quantity_on_hand < reorder_level` and `status = 'active'`.

**Edge cases:** If `reorder_level` is null, the product does not appear in low-stock.

**Known limitations:** No date-range selection on dashboard. No gross profit shown (would require COGS calculation). Priorities section only shows items already loaded in memory — does not make additional DB calls.

**Testing checklist:**
- [ ] Revenue shows today only
- [ ] Low-stock badges are correct
- [ ] Recent sales list shows up to 5 completed sales

---

### POS (Point of Sale)

**Purpose:** Complete a customer sale — add items to cart, apply discounts, process payment, print receipt.

**User workflow:**
1. Scan barcode or search/select product → added to cart.
2. Optionally attach customer (by phone number).
3. Optionally apply discount (% or fixed amount).
4. Optionally redeem loyalty points.
5. Select payment method (cash, card, bank transfer, mobile money, other).
6. Complete Sale → deducts inventory, records sale, records payment, awards loyalty points.
7. Receipt modal appears; can print.

**Database tables:** `sales`, `sale_items`, `payments`, `inventory`, `inventory_transactions`, `inventory_batches`, `sale_item_batches`, `customers`, `loyalty_transactions`

**Business rules:**
- Stock is checked before completing: if `quantity > quantity_on_hand`, sale is blocked.
- Tax is applied to the discounted subtotal: `tax = (subtotal - discount) × tax_rate`.
- Loyalty: 1 point earned per $1 of sale total (after discount, after tax). Points earned are floored.
- Loyalty redemption: 100 pts = $1.00, subtracted before tax. Cannot exceed customer balance.
- FEFO: At sale time, active batches for each cart product are fetched ordered by `expiration_date ASC NULLS LAST`. The soonest-expiring batch is consumed first. Each consumption is logged to `sale_item_batches` and `inventory_batches.quantity_remaining` is decremented.
- If a product has no active batches, FEFO allocation is skipped (no crash — batch deduction is optional).
- If `sellingPolicy = 'negotiated_pricing'`, a "Negotiate Price" button appears per cart line.
- Cashier must be selected if any active employees exist. Sale is blocked otherwise.
- Cart in progress triggers `beforeunload` warning to prevent accidental tab close.

**Edge cases:**
- A product can be in the cart and sold even if it has no batches (FEFO skipped).
- Payment method `other` requires a reference field.
- Voiding a completed sale reverses inventory (adds back) and records a refund payment with `payment_type = 'refund'`.

**Known limitations:**
- No split-tender (one payment method per sale).
- No layaway or on-account sales.
- Void does not reverse loyalty points.
- Receipt prints via browser's print dialog (no thermal printer driver integration).

**Testing checklist:**
- [ ] Barcode scan adds product to cart
- [ ] Stock validation blocks oversell
- [ ] Discount (% and fixed) calculates correctly
- [ ] Tax applies to discounted amount
- [ ] Loyalty earned appears on receipt and updates balance
- [ ] Loyalty redemption reduces total and cannot exceed balance
- [ ] Payment completes, inventory decremented, transaction recorded
- [ ] FEFO: correct batch `quantity_remaining` decremented
- [ ] Void reverses inventory and records refund payment
- [ ] Cash drawer expected cash includes this sale

---

### Inventory

**Purpose:** Full product catalog management — CRUD, stock adjustments, bulk import, barcode linking, expiration tracking, stock counts.

**User workflow:**
- Add/edit/deactivate products.
- Adjust inventory (damaged, expired, stolen, correction).
- Run stock counts.
- View transaction history.
- View/write-off expiration batches.

**Database tables:** `products`, `inventory`, `inventory_transactions`, `inventory_batches`, `categories`

**Business rules:**
- Adding a product also creates an `inventory` row (quantity 0).
- `average_cost` is set to `cost_price` on product creation; updated on receive.
- Adjustments write an `inventory_transactions` row and update `inventory.quantity_on_hand`.
- Write-off of a batch: decrements `inventory_batches.quantity_remaining`, updates `inventory.quantity_on_hand`, writes a transaction with `transaction_type = 'expired'`.
- Stock count: records a `stock_counts` + `stock_count_items` row; updates `inventory.quantity_on_hand` to counted qty; writes adjustment transactions.
- Barcode must be unique per business (enforced by index `idx_barcode_unique_per_business`).

**Edge cases:**
- If a product has no barcode, it cannot be scanned at POS (must be selected manually).
- Deactivated products remain in history but do not appear in POS search.
- Bulk CSV import: `name` and `selling_price` are required; `barcode` must be unique or row is skipped.

**Known limitations:**
- No batch-level cost editing after receive.
- No serial-number tracking.
- No multi-location stock.

**Testing checklist:**
- [ ] Create product → inventory row created at 0
- [ ] Edit product saves all fields
- [ ] Deactivate product hides from POS
- [ ] Inventory adjustment updates quantity and writes transaction
- [ ] Write-off batch updates quantity_remaining and inventory qty
- [ ] Stock count records variance and updates system qty
- [ ] Bulk import creates products and inventory rows
- [ ] Duplicate barcode is rejected

---

### Smart Receive

See [Section 6](#6-smart-receive-deep-documentation) for detailed documentation.

**Brief summary:** Upload a supplier invoice (image or PDF) → Claude AI extracts line items → user reviews matches → receiving session created in draft → user posts to update inventory.

---

### Receiving Sessions

**Purpose:** Manual version of Smart Receive — scan or add items to a draft session, set unit costs, then post to update inventory.

**User workflow:**
1. Start a new session (optional: select supplier, add notes).
2. Scan barcodes or use the barcode scan input to add products.
3. Adjust quantities with +/− buttons or edit inline.
4. Set unit cost per item.
5. Optionally add batch/expiry details per line.
6. Post Receiving → inventory updated, session marked completed, appears in Session History.

**Database tables:** `receiving_sessions`, `receiving_items`, `inventory`, `inventory_transactions`, `inventory_batches`

**Business rules:**
- Only one active (draft) session allowed at a time per business.
- If a product barcode is not found on scan, a Product Resolution dialog opens — user can link to existing product or create new.
- Unit costs typed but not confirmed via onBlur are flushed via `Promise.all` before posting.
- Duplicate invoice guard: if the session has an `invoice_number` matching a completed session for the same supplier, user is prompted to confirm.
- Posting is sequential (not atomic). Each product is updated in a loop. Partial failure possible.

**Known limitations:**
- No partial post.
- No barcode scanning of quantities (each scan = +1).

**Testing checklist:**
- [ ] Start session, scan product, quantity increments
- [ ] Unknown barcode triggers Product Resolution
- [ ] Unit cost saves on blur
- [ ] Post updates inventory qty and creates transaction
- [ ] Batch fields create inventory_batches row
- [ ] Session appears in Session History after post
- [ ] Duplicate invoice number shows warning

---

### Supplier Invoices

**Purpose:** Record or reconcile a supplier invoice against a completed receiving session.

**User workflow:**
1. In Receiving Session History, click "Invoice" on a completed session.
2. Invoice panel opens — pre-filled with items total if `invoice_total = 0`.
3. Enter invoice number, date, total, freight, additional costs.
4. Save Invoice → updates `receiving_sessions` with invoice fields and sets `invoice_status` to `matched` or `variance`.
5. Badge in session history reflects current `invoice_status`.

**Database tables:** `receiving_sessions`

**Business rules:**
- `invoice_status`:
  - `matched` if `|invoice_total - calculated_total| ≤ 0.01`
  - `variance` if difference > 0.01
- `approved_by` is set to `"auto"` for Smart Receive sessions where invoice matched at creation; otherwise must be manually set (note: manual approval UI is not yet implemented — `approved_by` is only set by Smart Receive auto-match or the invoice save path when `invoice_status = 'matched'`).
- After save, `loadSessionHistory()` is called to refresh the list and clear the "Invoice: pending" badge.

**Edge cases:**
- If session was created by Smart Receive with a pre-matched invoice, the invoice fields are pre-populated and `invoice_status` is already `matched`.
- Opening the invoice panel when `invoice_total = 0` pre-fills the total from the sum of received item costs.

**Known limitations:**
- Manual approval workflow not implemented. `approved_by` must be set to something non-null for "Record Payment" to appear. For sessions created via Smart Receive with a matching invoice, this is set automatically. For manually created sessions, it must be set in the database or via a future UI.

**Testing checklist:**
- [ ] Invoice panel pre-fills total from received items when `invoice_total = 0`
- [ ] Save Invoice updates badge to "matched" or "variance"
- [ ] Badge clears after save (no stale "Invoice: pending")
- [ ] Variance calculation is correct
- [ ] `approved_by` is set on matched sessions

---

### Supplier Payments

**Purpose:** Record payments made to suppliers against completed, invoiced receiving sessions.

**User workflow:**
1. In Receiving Session History, click "Record Payment" on an eligible session.
2. Payment panel opens. Eligible = `status = completed`, `approved_by` is set, `invoice_total > 0`, `supplier_id` is linked.
3. If session has no `supplier_id`, an inline "Link a supplier to record payment" nudge appears.
4. Enter payment date, amount, method, optional reference/notes.
5. Save Payment → recorded in `supplier_payments`; panel shows "Invoice fully paid." when remaining = 0.
6. "Paid" badge appears in the session row when remaining ≤ 0.

**Database tables:** `supplier_payments`, `receiving_sessions`

**Business rules:**
- `supplier_payments.supplier_id` is NOT NULL — a supplier must be linked to the session before a payment can be recorded.
- Payment amount cannot exceed remaining balance (+ $0.01 rounding tolerance).
- `sessionPayments` state is loaded lazily when the panel is opened. After a page reload, `sessionPayments` is empty until a panel is opened.
- When the payment panel is open and `loadSessionPayments` reveals remaining = 0 (e.g., session was previously fully paid on another device), the panel shows "Invoice fully paid." and hides the form — the Save button is not accessible.
- Payments can be partial (multiple payments per session).

**Edge cases:**
- If payment is recorded but the session has no supplier linked (possible in legacy data), the Record Payment button will not appear.
- "Paid" badge uses in-memory `sessionPayments` state. After reload, if `sessionPayments` has not been loaded for that session, the badge may not appear until the panel is opened.

**Known limitations:**
- No payment deletion or editing.
- Supplier Statement view exists (per-supplier breakdown) but is read-only.

**Testing checklist:**
- [ ] "Record Payment" button appears only when all conditions met
- [ ] "Link Supplier" nudge appears for sessions with no supplier_id
- [ ] Payment amount validates against remaining balance
- [ ] Paid badge appears after full payment
- [ ] Panel shows "Invoice fully paid." when remaining = 0
- [ ] Partial payments accumulate correctly
- [ ] Supplier Statement shows correct totals

---

### Purchase Orders

**Purpose:** Create and track purchase orders sent to suppliers.

**User workflow:**
1. Create a new PO (select supplier, add notes).
2. Add line items (product, quantity, unit cost).
3. Mark as Ordered.
4. Receive against the PO (adjusts inventory via standard receive flow).
5. Optionally export as PDF or open email draft to supplier.
6. Optionally collect digital signatures (manager and/or supplier) — stored in localStorage.

**Database tables:** `purchase_orders`, `purchase_order_items`, `receiving_sessions`, `receiving_items`

**Business rules:**
- PO statuses flow: `draft` → `ordered` → `partially_received` → `received` (or `cancelled`).
- Receiving against a PO creates a standard receiving session. The PO `quantity_received` per item is updated.
- Batch Reorder PO: the Reorder Center allows bulk selection of low-stock products and creates a single PO per supplier.
- AI Smart Reorder computes suggested order quantities from 7-day and 30-day sales velocity (in-memory, no API call).
- PO signatures are localStorage-only (device-specific, not persisted to database).

**Known limitations:**
- Email sends via `mailto:` link (opens mail client, no server-side send). PDF is generated client-side with html2canvas + jsPDF.
- Signatures not stored in database.

**Testing checklist:**
- [ ] Create PO, add items, mark as ordered
- [ ] Receive against PO updates quantity_received
- [ ] PDF download generates correctly
- [ ] Email draft opens with correct supplier
- [ ] Smart Reorder suggests quantities based on sales velocity
- [ ] Batch PO creation groups by supplier

---

### Suppliers

**Purpose:** Manage supplier contact records; link to products, POs, receiving sessions, and payments.

**User workflow:** Add/edit/deactivate suppliers. View supplier statement (invoices and payment history).

**Database tables:** `suppliers`, `purchase_orders`, `receiving_sessions`, `supplier_payments`

**Business rules:**
- Deactivated suppliers are hidden from new-selection dropdowns but remain on historical records.
- Supplier Statement is a computed view from `receiving_sessions` and `supplier_payments` — read-only.

**Testing checklist:**
- [ ] Add supplier, edit, deactivate
- [ ] Supplier appears in PO and receiving session dropdowns
- [ ] Supplier Statement shows correct invoice and payment totals

---

### Customers

**Purpose:** Customer directory with loyalty point tracking.

**User workflow:** Add/edit customers by name and phone. Search by phone at POS to attach to a sale. View purchase history and loyalty balance.

**Database tables:** `customers`, `loyalty_transactions`, `sales`

**Business rules:**
- Customers are identified by phone number at POS.
- Loyalty: 1 point per $1 of sale total. 100 points = $1.00 redeemable.
- A customer can have their account deactivated (hidden from new-sale lookup, history preserved).

**Testing checklist:**
- [ ] Add customer with name and phone
- [ ] Attach customer to POS sale
- [ ] Loyalty points earned after sale
- [ ] Points redeemed correctly at POS
- [ ] Customer history shows correct sales

---

### Loyalty

No dedicated module — loyalty is embedded in Customers and POS.

**Rules:**
- Earning: `floor(sale.total)` points per sale (1 pt per $1 of final total). Written to `loyalty_transactions` with `type = 'earned'`.
- Redemption: 100 pts = $1.00. Deducted from total before tax. Written with `type = 'redeemed'` and negative points.
- Balance: sum of all `loyalty_transactions.points` for the customer.
- Redemption is blocked if requested points exceed balance.
- Voiding a sale does NOT reverse loyalty points (known limitation).

---

### Returns

**Purpose:** Process product returns against completed sales. Restores inventory, issues refund payment.

**User workflow:**
1. In Sales History, click Return on a completed sale.
2. System shows eligible return quantities (original qty − already returned).
3. Select return quantities, choose reason (dropdown + notes), submit.
4. Inventory restored, refund payment recorded.

**Database tables:** `return_items`, `payments`, `inventory`, `inventory_transactions`

**Business rules:**
- Return qty cannot exceed available-to-return qty (original qty − already returned).
- A `return_items` row is created per line.
- A `payments` row is created with `payment_type = 'refund'` and the payment method used in the original sale.
- Inventory is restored: `quantity_on_hand += return_qty`. An `inventory_transactions` row with `transaction_type = 'return'` is written.
- Return does NOT restore batch quantities in `inventory_batches` (known limitation).
- Return does NOT reverse loyalty points (known limitation).

**Testing checklist:**
- [ ] Return dialog shows correct available-to-return quantities
- [ ] Partial return allowed
- [ ] Inventory restored after return
- [ ] Refund payment recorded with correct payment method
- [ ] Returned quantity blocked on second return attempt
- [ ] Return appears in return history

---

### Cash Drawer

**Purpose:** Track opening float, cash sales, paid-outs, and closing count for cash drawer reconciliation.

**User workflow:**
1. Open Drawer — enter opening float.
2. During the session: record paid-outs as needed.
3. Close Drawer — enter physical closing count. System shows expected cash, over/short.

**Database tables:** `drawer_sessions`, `drawer_paid_outs`

**Business rules:**
- Expected cash = opening float + cash sales (payments) − cash refunds − paid-outs.
- Cash sales are scoped to the current session by `opened_at` timestamp — only sales after the drawer was opened are included.
- Over/short = `closing_count − expected_cash`.
- `drawerCashSales` is computed as a memo from in-memory `sales` and `allPayments` state — it will not reflect sales made before the current state was loaded.
- Only one active drawer session per business (enforced by app logic, not DB constraint).

**Testing checklist:**
- [ ] Open drawer records opening float
- [ ] Cash sales accumulate in expected cash
- [ ] Paid-out reduces expected cash
- [ ] Closing count computes over/short correctly
- [ ] Closed drawer session stored in history

---

### Staff / Roles / PIN Login

**Purpose:** Control access to features by role; require staff to identify themselves at a shared terminal via PIN.

**User workflow:**
1. Owner adds employees with name, role, and optional PIN.
2. If any active employee has a PIN set, the app shows a PIN lock screen.
3. Staff enter their PIN → session unlocked as their role.
4. Owner can bypass PIN lock via "Owner Access" button.
5. Staff logs out → PIN screen returns.

**Database tables:** `employees`

**Roles and access:**

| Role | Dashboard | POS | Inventory | Purchasing | Customers | Reports | Settings | Staff |
|---|---|---|---|---|---|---|---|---|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Cashier | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Inventory Clerk | ✓ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

**Business rules:**
- PINs are stored plaintext in the `employees` table.
- PIN login does not use Supabase Auth — it is purely client-side role switching.
- `canManageStaff` = owner only. `canVoidSales` = owner or manager.
- If no employees have PINs, the app is accessible to anyone without a PIN.

**Known limitations:**
- Auth-linked staff accounts (`auth_user_id`) are only partially implemented. Inviting staff via email is not yet production-ready.
- Plaintext PINs are a security concern for production environments.

**Testing checklist:**
- [ ] Add employee with PIN
- [ ] PIN screen appears on next load
- [ ] Correct role restricts tab access
- [ ] Owner bypass works
- [ ] Staff logout returns to PIN screen
- [ ] Inactive employee PIN is rejected

---

### Reports

**Purpose:** Sales analytics, inventory valuation, low-stock report, stock count history, PO report.

**Sections:**
- **Revenue Analytics:** Total revenue, transaction count, avg transaction, items sold, tax collected, payment method breakdown, daily breakdown, top products by units. Filterable by today / 7d / 30d / all time.
- **Sales History:** Full filterable/searchable sale list with details expandable per sale. Filter by cashier and date range.
- **Return History:** List of all return transactions.
- **Inventory Valuation:** Per-product snapshot of qty × average_cost.
- **Low Stock Report:** Products below reorder level.
- **Stock Count History:** Past counts with variance per item.
- **PO Report:** Purchase order summary.

**Database tables:** All major tables — data is computed from in-memory state, not dedicated reporting queries.

**Known limitations:**
- No export to CSV or PDF (except PO PDF via html2canvas).
- All report data is from in-memory state loaded at page load. Very large datasets (10,000+ transactions) may cause slow initial loads.
- No scheduled or emailed reports.

**Testing checklist:**
- [ ] Revenue totals match sum of completed sales
- [ ] Date range filter changes numbers correctly
- [ ] Sales history search finds by product name, customer, sale ID
- [ ] Inventory valuation reflects current qty × average_cost

---

### Settings

**Purpose:** Manage business profile (name, phone, email, address, tax rate, selling policy).

**User workflow:** Edit fields, save. Changes apply immediately to all receipts and tax calculations.

**Database tables:** `businesses`

**Business rules:**
- Tax rate is stored as a percentage number (e.g., `8.5` = 8.5%).
- Selling policy controls POS negotiation behavior:
  - `fixed_pricing`: no negotiation UI shown
  - `negotiated_pricing`: "Negotiate Price" button shown per cart line; any employee can negotiate
  - `negotiated_with_approval`: **Needs verification** — negotiation flow may require manager approval (implementation status unclear)

**Testing checklist:**
- [ ] Edit business name → shows on receipts and dashboard
- [ ] Change tax rate → applies to next sale
- [ ] Selling policy change → POS negotiation button appears/disappears

---

## 5. Business Rules

### Inventory Quantity Changes

Quantity on hand changes in exactly these scenarios:

| Event | Change | Table written |
|---|---|---|
| Receiving session posted | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| Rapid Receive posted | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| PO Receive (legacy) | `+ quantity_received` per item | `inventory`, `inventory_transactions` (type: `receiving`) |
| Sale completed | `- quantity` per cart item | `inventory` (via POS flow) |
| Sale voided | `+ quantity` per item | `inventory`, `inventory_transactions` (type: `adjustment`) |
| Return processed | `+ quantity_returned` | `inventory`, `inventory_transactions` (type: `return`) |
| Manual adjustment | `+ or -` | `inventory`, `inventory_transactions` (type: `adjustment`) |
| Batch write-off | `- qty_written_off` | `inventory`, `inventory_transactions` (type: `expired`), `inventory_batches` |
| Stock count committed | set to `counted_qty` | `inventory`, `inventory_transactions` (type: `stock_count`) |

### Average Cost Updates

`products.average_cost` is updated only on **receiving post** using the weighted average formula:

```
new_average_cost = ((qty_on_hand × old_avg_cost) + (qty_received × unit_cost)) / (qty_on_hand + qty_received)
```

If `qty_on_hand + qty_received = 0`, `average_cost` is set to `unit_cost`.

Average cost is NOT recalculated on sales, returns, adjustments, or write-offs.

### Sales

1. Cart items are validated: `quantity ≤ quantity_on_hand` for each product.
2. Sale row is inserted with status `open`.
3. Sale items are inserted.
4. Payment is inserted.
5. For each cart item:
   - FEFO batches are allocated (soonest expiry first).
   - `inventory.quantity_on_hand` is decremented (via app logic — not a trigger).
   - Sale does NOT write an `inventory_transactions` row (unlike receiving). **Note:** This means POS sales do not appear in the transaction history view. Only receiving, adjustments, returns, and write-offs create transaction records.
6. Loyalty points are awarded.
7. Sale status is updated to `completed`.

### Returns / Refunds

1. Eligible qty per product = original sale qty − already returned qty.
2. `return_items` row created.
3. `payments` row created with `payment_type = 'refund'`.
4. `inventory.quantity_on_hand` incremented.
5. `inventory_transactions` row written with `transaction_type = 'return'`.
6. Batch quantities (`inventory_batches.quantity_remaining`) are NOT restored.
7. Loyalty points from the original sale are NOT reversed.

### Supplier Invoice Matching

During receiving session creation (Smart Receive):
```
calculated_total = sum(item.quantity × item.unitCost) + freight + additionalCost
variance_amount  = invoice_total - calculated_total
invoice_status   = |variance_amount| ≤ 0.01 ? "matched" : "variance"
```

When a user manually saves an invoice against a completed session, the same calculation runs and `invoice_status` is updated.

`approved_by` is set automatically to `"auto"` when `invoice_status = "matched"` via Smart Receive. For manually received sessions, the invoice save path sets `approved_by` when saving with `invoice_status = "matched"` — **Needs verification** of exact path.

### Supplier Payments

- `supplier_payments.supplier_id` is NOT NULL. Sessions must have `supplier_id` set before a payment can be recorded.
- `remaining = invoice_total − sum(payments.amount)` — computed client-side from in-memory `sessionPayments` state.
- Payment blocked if `amount > remaining + 0.01`.
- Multiple payments per session are supported (partial payments).
- `sessionPayments` is loaded lazily on panel open. After page reload, the badge may not reflect prior payments until the panel is opened.

### Cash Drawer Behavior

```
expected_cash = opening_float
              + Σ(cash payments where payment_type = 'sale' and sale after drawer opened)
              − Σ(cash payments where payment_type = 'refund' and sale after drawer opened)
              − Σ(paid_outs)
over_short = closing_count − expected_cash
```

The drawer session start time (`opened_at`) is used to scope which sales are included. Only `completed` sales (not voided) are counted.

### Role Permissions

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

### Tenant / Business Isolation

Every table has a `business_id` column. RLS policies enforce `business_id = auth_business_id()` for all reads and writes. Cross-tenant data access is impossible at the DB level assuming RLS is correctly enabled and the `auth_business_id()` function is correct. The `businesses` table itself uses `owner_id = auth.uid()` — only the account owner can see or modify their own business profile.

### Barcode Handling

- Barcodes are stored on `products.barcode`.
- A partial unique index enforces one barcode per business (exact migration name: `20260621_barcode_unique_index.sql`).
- At POS and receiving, barcode lookup is: `products.find(p => String(p.barcode || "").trim() === code)`.
- Lookup is exact-match only (no fuzzy).
- If barcode is not found, a Product Resolution dialog opens to link or create the product.

### Expiration / Batch Tracking (FEFO)

- Batch records are created on receiving post (manual sessions) or at Smart Receive session creation, if batch/expiry fields are provided.
- `inventory_batches.quantity_remaining` starts equal to `quantity_received`.
- At POS sale, batches are fetched for all cart products ordered by `expiration_date ASC NULLS LAST` (FEFO index). Earliest-expiring batches are depleted first.
- When a batch's `quantity_remaining` reaches 0, it is set to `status = 'depleted'`.
- Write-offs: manual from the Expiration Tracking UI. Sets `status = 'expired'` when remaining hits 0 after write-off.
- Batches are shown in the "Expiration Tracking" section of the Inventory tab.
- FEFO filter: only shows batches linked to active receiving sessions (or orphan batches with no session).

---

## 6. Smart Receive Deep Documentation

Smart Receive is the most complex workflow in the platform. It converts a supplier invoice image or PDF into a fully pre-populated receiving session using AI extraction.

### Step-by-Step Workflow

#### 1. Upload Invoice

User opens the Smart Receive panel (button in Inventory tab header) and uploads an image (JPEG, PNG) or PDF file.

#### 2. AI Parsing (`processSmartReceiveInvoice`)

- File is read as base64 in the browser using `FileReader`.
- A call is made to the Supabase Edge Function `process-invoice` (via `supabase.functions.invoke`).
- The Edge Function sends the base64 file to the Anthropic API (`claude-sonnet-4-6` model via `https://api.anthropic.com/v1/messages`).
- The prompt instructs Claude to return a strict JSON object:
  ```json
  {
    "supplier": "string",
    "invoiceNumber": "string",
    "invoiceDate": "YYYY-MM-DD",
    "items": [
      { "description": "string", "quantity": number, "unitCost": number,
        "batchNumber": "string or null", "expirationDate": "YYYY-MM-DD or null" }
    ],
    "freight": number,
    "additionalCost": number,
    "invoiceTotal": number
  }
  ```
- The Edge Function parses the first `{...}` JSON block from Claude's response and returns it.
- The Anthropic API key (`ANTHROPIC_API_KEY`) lives only in the Edge Function's environment — it is never sent to or exposed in the browser.

#### 3. Supplier Matching

After extraction, the app attempts to auto-match the extracted `supplier` name to an existing `suppliers` record:
- Exact match (case-insensitive) on `supplier.name`.
- If matched: `smartReceiveLinkedSupplierId` is set to the matched supplier's UUID.
- If no match: displayed as "Unlinked" — user can manually select from supplier list, create a new supplier, or choose "Continue Unlinked."

Three supplier resolution cases in the UI:
1. **Auto-matched:** supplier found, `Link Supplier` button is pre-selected.
2. **No match:** user picks from dropdown or creates.
3. **AI wrong name:** user overrides with correct supplier via the "Select correct supplier" picker.

"Continue Unlinked" sets `smartReceiveLinkedSupplierId = ""`. The session will have `supplier_id = null` and `supplier_name = extracted_name`.

#### 4. Product Matching

Each extracted line item is matched against the product catalog:
- Match strategy: exact or fuzzy match on `description` vs. `product_name`, `sku`, or `barcode` — matching logic is in the UI with manual fallback (auto-match is attempted; unresolved items show in yellow).
- Per line, the user can: select an existing product, create a new product (inline), or leave unmatched (line is skipped when creating the session).
- `smartReceiveMatches[i]` holds the resolved `product_id` for line `i` or `""` if unresolved.

#### 5. Batch / Expiry Extraction

If Claude extracts `batchNumber` or `expirationDate` for a line item, these are stored in `smartReceiveItemBatch[i]`. The user can view/edit them in the Smart Receive review UI before creating the session.

Date formats recognized by the prompt include: `DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`, `MMM YYYY`, `MM/YYYY`, and others.

#### 6. Receiving Session Creation (`handleCreateSmartReceivingSession`)

When user clicks "Create Receiving Session":

1. **Duplicate invoice guard:** queries `receiving_sessions` for any existing session with the same `invoice_number` and `supplier_id` in `draft` or `completed` status. If found, shows a warning with option to proceed.
2. Computes `calculated_total` and `variance_amount`.
3. Sets `invoice_status = 'matched'` if `|variance| ≤ 0.01`, else `'variance'`.
4. Inserts the `receiving_sessions` row with full invoice fields.
5. Inserts `receiving_items` rows for all matched products.
6. If any items had batch/expiry data (`smartReceiveItemBatch`), inserts `inventory_batches` rows immediately (not deferred to post time).
7. Sets `activeReceivingSession` to the newly created session (by ID — does not re-query for "newest draft").
8. Navigates to Inventory tab.

#### 7. Unit Cost Persistence

Unit costs from the extracted invoice are stored in `receiving_items.unit_cost` at session creation. When the user adjusts costs in the session view, `handleSessionItemCostChange` immediately writes to the DB via `supabase.from("receiving_items").update({ unit_cost, total_cost })`.

Before posting, a `Promise.all` flush writes all in-memory costs to the DB, capturing any cost that was typed but not yet onBlurred:
```js
await Promise.all(
  sessionItems.map(item =>
    supabase.from("receiving_items")
      .update({ unit_cost: item.unit_cost, total_cost: item.unit_cost * item.quantity_received })
      .eq("id", item.id)
  )
);
```

This fix was required because the cost input previously had an unstable `key` prop (`key={cost-${item.id}-${item.unit_cost}}`), causing React to unmount the input on every keystroke, preventing onBlur from firing.

#### 8. Posting Inventory (`handlePostReceivingSession`)

See [Receiving Sessions — Business Rules](#receiving-sessions). The FEFO batch is created at post time if batch fields exist in `sessionItemBatch` and a batch for that session item does not already exist (prevents double-batch for Smart Receive sessions where batches were pre-created at session creation).

After post: `loadProducts`, `loadTransactions`, `loadSessionHistory`, `loadBatches` are all called.

#### 9. Supplier Invoice Fields

Smart Receive pre-populates all invoice fields at session creation:
- `invoice_number`, `invoice_date`, `invoice_total`, `freight_cost`, `additional_cost`
- `calculated_total`, `variance_amount`, `invoice_status`
- `approved_by = "auto"`, `approved_at`, `approval_note` — set automatically when `invoice_status = 'matched'`

This means Smart Receive sessions with matched invoices are immediately ready for payment recording (no manual invoice save needed).

#### 10. Reconciliation

If `invoice_status = 'variance'`, the session shows in history with a "variance" badge. The user can open the Invoice panel, review, and re-save with corrected figures. The reconciliation formula is the same as manual sessions.

#### 11. Supplier Payment

Same as described in [Supplier Payments](#supplier-payments). Because Smart Receive sets `approved_by` automatically on match, the "Record Payment" button appears immediately for matched sessions that have a linked `supplier_id`.

#### 12. Paid / Read-Only State

When `remaining ≤ 0`:
- Button area shows green "Paid" badge instead of "Record Payment" button.
- Payment panel (if open) shows "Invoice fully paid." and hides the form and Save button.
- This prevents double-payment even if `sessionPayments` was not yet loaded at the time the panel was opened.

#### 13. Duplicate Invoice Protection

Two layers:
1. At Smart Receive session creation: checks for existing `draft` or `completed` sessions with the same `invoice_number` + `supplier_id`. Shows a blocking warning with "Cancel" or "Create Anyway."
2. At manual post: checks for existing `completed` sessions with the same `invoice_number` + `supplier_id`. Shows a `window.confirm` dialog.

#### 14. Known Resolved Bugs (Smart Receive and Receiving)

| Bug | Root cause | Fix applied | Commit |
|---|---|---|---|
| Unit cost showing $0.00 after post | Cost input `key` prop included `unit_cost`, causing React to unmount on each keystroke — onBlur never fired | Stable key + pre-post Promise.all flush | `77fd84c` |
| Invoice total defaulting to $0.00 in invoice panel | `loadSessionHistoryItems` was called but return value was ignored; invoice panel used old (empty) items | Made `loadSessionHistoryItems` return items; invoice handler uses them to seed total | `b4dda9c` |
| "Invoice: pending" badge not clearing after save | `handleSaveInvoice` had no `loadSessionHistory()` call after save — relied on optimistic patch only | Added `await loadSessionHistory()` after successful save | `175dcea` |
| Record Payment not appearing after `supplier_id` was removed from guard | `supplier_payments.supplier_id` is NOT NULL FK — removing the guard caused a DB error on payment insert | Restored `supplier_id` guard; added inline "Link a supplier" nudge | `5387171` |
| Payment form open and enabled when remaining = $0 | `paymentPanelSessionId` set on click; `loadSessionPayments` then revealed remaining = 0; panel had no remaining guard | Added `remaining ≤ 0` guard inside panel — hides form, shows "Invoice fully paid." | `862d299` |

---

## 7. Operational Guide

### How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env from template
cp .env.example .env
# Edit .env and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start dev server
npm run dev
# → opens at http://localhost:5173
```

### How to Build

```bash
npm run build
# → TypeScript check (tsc -b) then Vite bundle
# → Output: dist/
```

Build succeeds = TypeScript passes + bundle generated. There is no automated test run in the build step.

### How to Deploy

**Needs verification** on the exact hosting target. General process:
1. `npm run build` → produces `dist/`
2. Upload `dist/` to static hosting (Vercel, Netlify, Cloudflare Pages, or manual server).
3. Set environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting provider.

Supabase Edge Function (separate deployment):
```bash
supabase functions deploy process-invoice
# Set secret: supabase secrets set ANTHROPIC_API_KEY=<key>
```

### How to Check Git Status

```bash
git status        # working tree state
git log --oneline -10   # recent commits
git diff --stat   # staged/unstaged changes
```

### How to Verify Production

1. Open the production URL and log in.
2. Run a test sale: add a product to cart, complete sale, verify receipt.
3. Open Inventory and verify product quantity decremented.
4. Navigate to Reports → verify today's revenue shows the test sale.

### How to Troubleshoot Common Issues

| Issue | Check |
|---|---|
| "Failed to load" on any data | Check Supabase project is up; verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| Smart Receive fails | Verify `ANTHROPIC_API_KEY` is set in Supabase Edge Function secrets; check function is deployed |
| RLS errors (permission denied) | Check that `auth_business_id()` function is deployed; check that user has a row in `businesses` |
| Invoice total shows $0.00 | Open receiving session history items first; or enter total manually |
| Payment panel shows "Invoice fully paid." unexpectedly | Session already has payments in DB — this is correct behavior |
| `received_date` column error | Column was added directly in Supabase Dashboard — verify it exists on `receiving_sessions` in your Supabase project |
| Build fails on TypeScript errors | Run `tsc --noEmit` to see specific errors before attempting fixes |

### How to Avoid Unsafe Changes

1. **Always run `npm run build` before committing.** TypeScript errors will catch type mismatches.
2. **Never edit `App.tsx` without reading the surrounding context.** The file is 11,000+ lines. Edits in the wrong location are easy.
3. **Do not add `useEffect` with missing dependencies** — it will cause stale closures or infinite loops.
4. **Do not change `auth_business_id()` or RLS policies** without testing in a staging environment. A broken policy can lock out all users.
5. **Do not remove `supplier_id` requirement from supplier payment guards.** `supplier_payments.supplier_id` is NOT NULL — a payment without it will fail at the DB level.
6. **Do not use unstable `key` props on form inputs** (e.g., including a changing value in the key). This causes React to unmount/remount the input and prevents `onBlur` from firing.
7. **Do not wrap the session list `{sessionHistory.map(...)}` with an outer wrapper** without also adjusting the `historyExpanded` Fragment boundary.
8. **Avoid direct DB writes that bypass `average_cost` recalculation** — it is maintained by the app, not DB triggers.

---

## 8. QA and Regression Test Suite

This is a manual test plan. Run after any significant change before shipping.

### TC-01: End-to-End Sale

**Setup:** At least one active product with stock > 0 and a known barcode.

1. Log in as owner.
2. Go to POS tab.
3. Scan product barcode → verify it appears in cart.
4. Set qty to 2 → verify line total = 2 × unit price.
5. Apply 10% discount → verify subtotal − 10%.
6. Select cash payment.
7. Click Complete Sale.
8. **Expected:** Receipt modal appears with correct totals. Inventory decremented by 2. Transaction recorded.
9. Go to Inventory → verify `quantity_on_hand` decreased by 2.
10. Go to Reports → verify today's revenue includes this sale.

**Pass criteria:** Receipt shown, qty updated, revenue shown.

---

### TC-02: Return / Refund

**Setup:** A completed sale (from TC-01 or existing).

1. Go to Reports → Sales History.
2. Find the sale. Click Return.
3. Enter return qty = 1 for the product.
4. Select reason, click Submit Return.
5. **Expected:** Return recorded. Inventory incremented by 1. Refund payment with `payment_type = 'refund'` recorded.
6. Verify quantity in Inventory tab.
7. Try to return more than available → should be blocked.

**Pass criteria:** Qty restored, refund payment recorded, excess return blocked.

---

### TC-03: Smart Receive (Full Path)

**Setup:** A supplier invoice image (JPEG or PDF). At least one product on the invoice matches a product in the catalog.

1. Go to Inventory tab.
2. Click Smart Receive.
3. Upload the invoice file.
4. Wait for AI extraction. Verify supplier name, invoice number, items extracted.
5. Match any unmatched items. If creating a new product, fill name and price.
6. Click Create Receiving Session.
7. **Expected:** Navigated to Inventory tab with an active draft session. Items and costs pre-populated.
8. Adjust a unit cost. Click out of field (onBlur) → cost saved.
9. Click Post Receiving.
10. **Expected:** Session completed. Inventory updated. Session appears in Session History.
11. In Session History, find the session. Verify "Invoice: matched" or "Invoice: variance" badge.
12. If matched and supplier linked: Record Payment button should appear. Click it, enter amount, save.
13. **Expected:** "Paid" badge appears. Panel shows "Invoice fully paid."

**Pass criteria:** AI extracts correctly, session created, inventory updated, payment recorded.

---

### TC-04: Manual Receiving

1. Go to Inventory tab.
2. Click Start New Session. Select a supplier. Click Start.
3. Scan a product barcode → added with qty 1.
4. Edit unit cost → cost saves.
5. Increment qty to 3.
6. Add batch/expiry fields.
7. Click Post Receiving.
8. **Expected:** Inventory +3. Transaction recorded. Batch record created. Session in history.

**Pass criteria:** Qty updated, batch created, session in history.

---

### TC-05: Supplier Invoice Save

**Setup:** A completed receiving session without invoice fields set.

1. Find session in Receiving Session History.
2. Click Invoice.
3. Verify invoice total is pre-filled from received items sum (if not already set).
4. Enter invoice number, date. Adjust total to create a variance.
5. Save Invoice.
6. **Expected:** Badge updates to "variance". "Invoice: pending" badge is gone.
7. Re-open invoice, correct total to match. Save again.
8. **Expected:** Badge updates to "matched".

**Pass criteria:** Badge reflects correct status after save.

---

### TC-06: Supplier Payment

**Setup:** A receiving session with `status = completed`, `approved_by` set, `invoice_total > 0`, and `supplier_id` linked.

1. Find session in history. Verify "Record Payment" button appears.
2. Click Record Payment. Verify panel opens with remaining = invoice_total.
3. Enter partial payment (e.g., 50% of total). Save.
4. **Expected:** Panel shows updated Paid/Remaining. "Record Payment" button still shows (still a balance).
5. Click Record Payment again. Enter remaining balance. Save.
6. **Expected:** "Paid" badge appears. Panel shows "Invoice fully paid." when reopened.
7. Reload page. Open payment panel again.
8. **Expected:** Panel loads from DB, shows "Invoice fully paid." — not the form.

**Pass criteria:** Partial payments work, full payment shows paid state, reload preserves state.

---

### TC-07: Cash Drawer

1. Open Drawer with $100 float.
2. Complete a $25 cash sale (TC-01 path).
3. Record a $10 paid-out.
4. Close Drawer → enter $115 as physical count.
5. **Expected:** Expected cash = $100 + $25 - $10 = $115. Over/short = $0.00.

**Pass criteria:** Expected cash calculation is correct.

---

### TC-08: Staff Role Permissions

1. Add a Cashier employee with a PIN (e.g., 1234).
2. Log out / lock screen appears.
3. Enter PIN 1234.
4. **Expected:** Logged in as cashier. Only Dashboard, POS, Customers tabs visible.
5. Navigate to POS. Complete a sale.
6. Attempt to access Inventory via URL — should redirect or be hidden.
7. Log out. Enter owner bypass.
8. **Expected:** All tabs visible.

**Pass criteria:** Tab restriction enforced. Cashier cannot access restricted tabs.

---

### TC-09: Inventory Transaction History

1. Go to Inventory tab.
2. Filter transactions by product and date range.
3. Verify a "receiving" transaction appears after TC-04.
4. Verify a "return" transaction appears after TC-02.
5. Verify types shown correctly.

**Pass criteria:** Transactions reflect all inventory-changing events with correct types.

---

### TC-10: Receiving Session History — Load More and Collapse

**Setup:** 21+ completed receiving sessions.

1. Go to Inventory tab. Expand Receiving Session History (click header).
2. **Expected:** Up to 20 sessions shown. "Load More" button appears.
3. Click Load More.
4. **Expected:** Next 20 sessions appended. Load More disappears when no more sessions.
5. Click the header again to collapse.
6. **Expected:** Session list and Load More hidden.
7. Click to expand again.
8. **Expected:** List reappears; count in header is correct.

**Pass criteria:** Load More appends correctly. Collapse/expand toggles correctly. Count in header is accurate.

---

## 9. Known Issues and Deferred Improvements

### Confirmed Bugs

| ID | Description | Severity | Notes |
|---|---|---|---|
| BUG-01 | Voiding a sale does NOT reverse loyalty points | Medium | Points remain credited after void |
| BUG-02 | Returns do NOT restore `inventory_batches.quantity_remaining` | Medium | Batch qty stays at consumed level even after return |
| BUG-03 | POS sales do NOT write `inventory_transactions` rows | Low | Sales are not visible in transaction history |
| BUG-04 | Receiving post is not atomic — partial failures possible | High | If any product fails mid-loop, earlier products are already updated |
| BUG-05 | `received_date` column has no migration file | Medium | Fresh DB restore will fail without manually adding this column |
| BUG-06 | `inventory_batches` RLS uses owner-only policy | Medium | Auth-linked staff may not be able to read batch data |

### UX Improvements

| ID | Description | Priority |
|---|---|---|
| UX-01 | "Record Payment" button shows before `sessionPayments` are loaded; badge may be wrong until panel is opened | Medium |
| UX-02 | Session History badge for "Paid" requires panel to have been opened at least once since page load | Low |
| UX-03 | Receiving post progress is not shown (loading spinner, but no per-item feedback for long sessions) | Low |
| UX-04 | PO email is `mailto:` only — no reliable delivery for suppliers without a default mail client | Medium |
| UX-05 | No way to cancel a payment attempt once "Save Payment" is clicked | Low |
| UX-06 | Negotiated pricing with approval (`negotiated_with_approval` policy) — approval flow not implemented | Medium |

### Scalability Improvements

| ID | Description | Priority |
|---|---|---|
| SCALE-01 | `App.tsx` is ~11,050 lines — needs componentization before major feature additions | High |
| SCALE-02 | Bundle is 1.37 MB / 356 KB gzip — no code splitting | Medium |
| SCALE-03 | All data loaded at startup in one `useEffect` — slow for large datasets | Medium |
| SCALE-04 | Sales and transaction history are fully in-memory — will be slow with 10,000+ records | High |
| SCALE-05 | No pagination on Sales History, Transaction History, or Customer list | Medium |
| SCALE-06 | No automated report generation — all reports computed from in-memory state | Low |

### Future Features (Customer-Driven, Do Not Build Yet)

- Multi-location inventory
- Thermal printer integration (ESC/POS)
- Offline mode / PWA
- Staff invite via email (partially scaffolded via `auth_user_id`)
- Automated low-stock alerts / email notifications
- Accounting integration
- Tax reporting (by tax category)
- Product variants / modifiers
- Subscription / recurring orders

### Do-Not-Touch-Without-Care Areas

| Area | Risk | Reason |
|---|---|---|
| `auth_business_id()` and RLS policies | Data isolation failure | Bugs here leak data across tenants |
| `handlePostReceivingSession` | Inventory corruption | Non-atomic; partial failure leaves inconsistent state |
| `handleCompleteSale` FEFO allocation | Inventory / batch sync | FEFO writes are across multiple tables; a partial failure means `inventory_batches` and `inventory` get out of sync |
| `supplier_payments.supplier_id` guard in UI | DB constraint violation | Column is NOT NULL; removing the guard will cause insert failures |
| `historyExpanded` Fragment boundary | JSX parse error | Closing `</>)}` must match opening `{historyExpanded && (<>` exactly |
| `average_cost` calculation in post | Cost accuracy | Weighted average formula must use `quantity_on_hand` before the new receive is added |
| `sessionPayments` transient state | "Fully paid" guard | Payment "remaining" is computed from this; it resets on page reload |

---

## 10. Developer Handoff

### Current Git State

- **Branch:** `main`
- **Latest commit:** `862d299` — Show paid invoice payment panel read only (2026-06-29)
- **Repository:** `https://github.com/fitpaperwork25-del/wegn-store-app`

### Recent Commits (Most Recent First)

| Commit | Description |
|---|---|
| `862d299` | Payment panel: hide form and show "Invoice fully paid." when remaining ≤ 0 |
| `a34025b` | Receiving Session History: collapsible section with arrow toggle and count |
| `ea5d453` | Receiving Session History: Load More (20 per page, append) |
| `175dcea` | Reload receiving history after invoice save (clears stale "Invoice: pending" badge) |
| `5387171` | Restore supplier_id requirement for Record Payment; add inline "Link a supplier" nudge |
| `18035b2` | Fix supplier invoice status display (badge uses `invoice_status` field) |
| `b4dda9c` | Default supplier invoice total from received items when `invoice_total = 0` |
| `77fd84c` | Persist receiving item costs before posting (stable key + pre-post flush) |
| `00f7771` | Fix receiving session state handling |
| `e5b3cec` | Stabilization and performance memoization |

### Build Status

**Last successful build:** `a34025b` and subsequent commits — all pass `tsc -b && vite build` with no TypeScript errors. Only warning is bundle size (> 500 KB), which is expected and non-blocking.

### Deployment URL

**Needs verification.** The hosting target is not defined in the repository.

### Supabase Project Info

**Needs verification.** The Supabase project URL is in `.env` (not committed). The Edge Function `process-invoice` must be deployed and `ANTHROPIC_API_KEY` must be set as a secret.

### How Future Agents Should Approach Changes

1. **Read before writing.** App.tsx is 11,000+ lines. Always `Read` the target section before editing. Never guess line numbers — use `Grep` to find exact text.
2. **Investigate first, change second.** For any bug, trace the full data flow (DB → loader → state → render) before proposing a fix.
3. **Smallest safe change.** The codebase is large and interconnected. Prefer targeted edits over refactors.
4. **Run `npm run build` after every change.** TypeScript errors must be zero before committing.
5. **Do not commit without instruction.** Commit only when the user explicitly asks.
6. **Preserve business rules.** Average cost, FEFO allocation, RLS policies, and `supplier_id` constraints are load-bearing — do not simplify them without understanding the implications.
7. **Check migrations before DB changes.** Any schema change needs a new SQL file in `supabase/migrations/` with rollback SQL included.
8. **Remember the `received_date` exception.** This column has no migration — it must be handled specially when documenting or restoring the schema.

### Definition of Done for Future Work

A change is complete when:
- [ ] The feature works end-to-end in a browser (not just in code)
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No regressions in: POS sale, receiving post, invoice save, payment record
- [ ] The relevant sections of this document are updated if behavior changes
- [ ] A commit is made with a descriptive message
- [ ] The change is pushed to `origin/main`

---

*Document generated from codebase inspection as of commit `862d299` on 2026-06-29.*
*All facts are derived from `src/App.tsx`, `src/AuthGate.tsx`, `src/supabase.ts`, `supabase/functions/process-invoice/index.ts`, `supabase/migrations/*.sql`, `package.json`, and git history.*
*Items marked "Needs verification" could not be confirmed from static code analysis alone.*
