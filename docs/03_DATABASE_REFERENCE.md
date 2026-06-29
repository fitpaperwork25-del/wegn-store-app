# Database Reference

**Related:** [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md) · [02_ARCHITECTURE.md](02_ARCHITECTURE.md) · [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) · [INDEX.md](INDEX.md)

---

## Tables

### `businesses`
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

### `products`
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

### `inventory`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | Called `inventory_id` in joined queries |
| `business_id` | uuid FK | |
| `product_id` | uuid FK | |
| `quantity_on_hand` | numeric | |
| `reorder_level` | numeric | Nullable |
| `created_at` | timestamptz | |

### `inventory_transactions`
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

### `categories`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `description` | text | Nullable |
| `status` | text | `active` / `inactive` |

### `suppliers`
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

### `purchase_orders`
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

### `purchase_order_items`
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

### `receiving_sessions`
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

### `receiving_items`
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

### `inventory_batches`
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

### `sale_item_batches`
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

### `sales`
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

### `sale_items`
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

### `payments`
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

### `supplier_payments`
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

**Critical:** `supplier_id` is `NOT NULL`. A receiving session must have a linked `supplier_id` before a payment can be recorded against it. See [modules/supplier_payments.md](modules/supplier_payments.md).

### `customers`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `name` | text | |
| `phone` | text | |
| `email` | text | Nullable |
| `status` | text | `active` / `inactive` |

### `loyalty_transactions`
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

### `return_items`
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

### `drawer_sessions`
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

### `drawer_paid_outs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `drawer_session_id` | uuid FK | |
| `business_id` | uuid FK | |
| `amount` | numeric | |
| `reason` | text | Nullable |
| `created_at` | timestamptz | |

### `employees`
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

### `stock_counts`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `status` | text | |
| `notes` | text | Nullable |
| `completed_at` | timestamptz | |
| `created_at` | timestamptz | |

### `stock_count_items`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `business_id` | uuid FK | |
| `stock_count_id` | uuid FK | |
| `product_id` | uuid FK | |
| `system_qty` | numeric | Qty at time of count |
| `counted_qty` | numeric | Physical count |
| `variance` | numeric | `counted_qty - system_qty` |

---

## Key Relationships

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

---

## RLS / Security Model

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

---

## Important Functions / Policies

| Name | Type | Purpose |
|---|---|---|
| `auth_business_id()` | Function | Maps `auth.uid()` → `business_id` for RLS |
| `auth_user_role()` | Function | Maps `auth.uid()` → role string |
| `tenant_isolation` | Policy name | Standard policy on all business-owned tables |
| `idx_inventory_batches_fefo` | Index | Partial composite on `(product_id, expiration_date ASC)` WHERE `status='active' AND quantity_remaining>0` — powers FEFO lookups |

---

## Business-Critical Fields

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

---

## Data Integrity Assumptions

- One `inventory` row per `product` per business. The app does not handle multiple inventory locations.
- `inventory.quantity_on_hand` is maintained by the app, not by DB triggers. Concurrent edits from multiple browser tabs could cause race conditions on stock.
- Receiving posts are NOT atomic (not wrapped in a Postgres transaction). If a post partially fails mid-loop, some products may be updated and others not. This is a known limitation.
- Loyalty points are integer values. Redemption converts 100 pts → $1.00.
- `received_date` on `receiving_sessions` was added directly in the Supabase Dashboard; there is no migration for it.

---

*Source: PLATFORM_REFERENCE.md §3 — Database Reference*
