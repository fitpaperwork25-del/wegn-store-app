# Module: Dashboard

**Related:** [modules/pos.md](pos.md) · [modules/inventory.md](inventory.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

At-a-glance daily summary and priority workspace for the owner/manager.

---

## Features

- Today's revenue and transaction count summary
- 5-item recent sales list
- Low-stock alerts for products below reorder level
- Owner "Today's Priorities" section showing pending actions (active receiving session, unpaid invoices, open purchase orders, etc.)

---

## User Workflow

1. Loads automatically on login (or after staff PIN login).
2. Shows today's revenue, transaction count, and a 5-item recent sales list.
3. Shows low-stock alerts if any products are below reorder level.
4. Shows an owner "Today's Priorities" section with pending actions (active receiving session, unpaid invoices, open purchase orders, etc.).

---

## Database Tables

- `sales`
- `sale_items`
- `inventory`
- `products`
- `receiving_sessions`
- `purchase_orders`

---

## Business Rules

- Dashboard data is computed from in-memory state (`dashboardData` memo), not a separate DB query.
- Revenue is from `completed` sales only (`status = 'completed'`).
- Low-stock shows products where `quantity_on_hand < reorder_level` and `status = 'active'`.

---

## UI Components

- Revenue summary cards (today's revenue, transaction count)
- Recent sales list (up to 5 completed sales)
- Low-stock alert badges
- "Today's Priorities" section showing pending platform actions

---

## Edge Cases

- If `reorder_level` is null, the product does not appear in low-stock.

---

## Known Issues

- No date-range selection on dashboard.
- No gross profit shown (would require COGS calculation).
- Priorities section only shows items already loaded in memory — does not make additional DB calls.

---

## Test Checklist

- [ ] Revenue shows today only
- [ ] Low-stock badges are correct
- [ ] Recent sales list shows up to 5 completed sales

---

## Future Enhancements

- Date-range selection on dashboard
- Gross profit calculation (requires COGS)
- Priorities section making independent DB calls for accuracy

---

*Source: PLATFORM_REFERENCE.md §4 — Dashboard*
