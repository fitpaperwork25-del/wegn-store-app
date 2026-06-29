# Module: Suppliers

**Related:** [modules/purchase_orders.md](purchase_orders.md) · [modules/receiving_sessions.md](receiving_sessions.md) · [modules/supplier_payments.md](supplier_payments.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Manage supplier contact records; link to products, POs, receiving sessions, and payments.

---

## Features

- Add, edit, and deactivate suppliers
- Supplier contact fields (name, contact name, phone, email, notes)
- Supplier statement view (invoices and payment history per supplier)
- Supplier linkage to products, POs, receiving sessions, and payments

---

## User Workflow

Add/edit/deactivate suppliers. View supplier statement (invoices and payment history).

---

## Database Tables

- `suppliers`
- `purchase_orders`
- `receiving_sessions`
- `supplier_payments`

---

## Business Rules

- Deactivated suppliers are hidden from new-selection dropdowns but remain on historical records.
- Supplier Statement is a computed view from `receiving_sessions` and `supplier_payments` — read-only.
- `supplier_payments.supplier_id` is NOT NULL — every payment must be linked to a supplier. Receiving sessions without a linked supplier cannot have payments recorded.

---

## UI Components

- Supplier list with active/inactive filter
- Supplier form (name, contact name, phone, email, notes)
- Deactivate/reactivate action
- Supplier Statement view (per-supplier breakdown of invoices and payments — read-only)

---

## Edge Cases

- Deactivating a supplier does not affect historical records (POs, receiving sessions, payments all retain the supplier link).
- A supplier that is deactivated will still appear on historical receiving sessions and POs.
- If a receiving session's `supplier_id` is removed or null, the "Record Payment" button will not appear for that session.

---

## Known Issues

- Supplier Statement is read-only; there is no editing of payment records from this view.

---

## Test Checklist

- [ ] Add supplier, edit, deactivate
- [ ] Supplier appears in PO and receiving session dropdowns
- [ ] Supplier Statement shows correct invoice and payment totals

---

## Future Enhancements

None documented in the current issue backlog.

---

*Source: PLATFORM_REFERENCE.md §4 — Suppliers*
