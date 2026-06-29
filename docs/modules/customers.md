# Module: Customers

**Related:** [modules/loyalty.md](loyalty.md) · [modules/pos.md](pos.md) · [modules/returns.md](returns.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Customer directory with loyalty point tracking.

---

## Features

- Add, edit, and deactivate customers (name and phone)
- Search by phone number at POS to attach to a sale
- Purchase history per customer
- Loyalty balance display (sum of all loyalty_transactions)
- Loyalty earning (1 point per $1 of sale total) and redemption (100 pts = $1.00)

---

## User Workflow

Add/edit customers by name and phone. Search by phone at POS to attach to a sale. View purchase history and loyalty balance.

---

## Database Tables

- `customers`
- `loyalty_transactions`
- `sales`

---

## Business Rules

- Customers are identified by phone number at POS.
- Loyalty: 1 point per $1 of sale total. 100 points = $1.00 redeemable.
- A customer can have their account deactivated (hidden from new-sale lookup, history preserved).
- Loyalty balance = sum of all `loyalty_transactions.points` for the customer (positive = earned, negative = redeemed).

---

## UI Components

- Customer list with search and active/inactive filter
- Customer form (name, phone, email optional)
- Deactivate/reactivate action
- Customer detail view (purchase history, loyalty balance)

---

## Edge Cases

- Deactivated customers are hidden from the POS customer lookup but their history and loyalty balance are preserved.
- A customer can be deactivated after a sale and their loyalty points are still tracked.

---

## Known Issues

- No pagination on customer list (SCALE-05).

---

## Test Checklist

- [ ] Add customer with name and phone
- [ ] Attach customer to POS sale
- [ ] Loyalty points earned after sale
- [ ] Points redeemed correctly at POS
- [ ] Customer history shows correct sales

---

## Future Enhancements

- Customer list pagination

---

*Source: PLATFORM_REFERENCE.md §4 — Customers*
