# Module: Purchase Orders

**Related:** [modules/suppliers.md](suppliers.md) · [modules/receiving_sessions.md](receiving_sessions.md) · [modules/inventory.md](inventory.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Create and track purchase orders sent to suppliers.

---

## Features

- Create POs with supplier, line items, and notes
- PO lifecycle management (draft → ordered → partially received → received / cancelled)
- Receive against a PO (adjusts inventory via standard receiving session flow)
- PDF export (client-side via html2canvas + jsPDF)
- Email draft to supplier via `mailto:` link
- Digital signature capture (manager and/or supplier) — stored in localStorage
- Batch Reorder PO — bulk select low-stock products and create one PO per supplier
- AI Smart Reorder — compute suggested order quantities from 7-day and 30-day sales velocity (in-memory, no API call)

---

## User Workflow

1. Create a new PO (select supplier, add notes).
2. Add line items (product, quantity, unit cost).
3. Mark as Ordered.
4. Receive against the PO (adjusts inventory via standard receive flow).
5. Optionally export as PDF or open email draft to supplier.
6. Optionally collect digital signatures (manager and/or supplier) — stored in localStorage.

---

## Database Tables

- `purchase_orders`
- `purchase_order_items`
- `receiving_sessions`
- `receiving_items`

---

## Business Rules

- PO statuses flow: `draft` → `ordered` → `partially_received` → `received` (or `cancelled`).
- Receiving against a PO creates a standard receiving session. The PO `quantity_received` per item is updated.
- Batch Reorder PO: the Reorder Center allows bulk selection of low-stock products and creates a single PO per supplier.
- AI Smart Reorder computes suggested order quantities from 7-day and 30-day sales velocity (in-memory, no API call).
- PO signatures are localStorage-only (device-specific, not persisted to database).

---

## UI Components

- PO list with status filters
- PO form (supplier selector, notes field)
- Line item editor (product selector, qty, unit cost)
- PO status action buttons (Mark Ordered, Mark Cancelled)
- PDF download button (client-side html2canvas + jsPDF)
- Email draft button (`mailto:` link with PO details)
- Signature capture UI (drawing canvas) — stored in localStorage
- Reorder Center (low-stock product list with checkbox selection, grouped by supplier)
- AI Smart Reorder suggestions panel (suggested qty per product based on sales velocity)

---

## Edge Cases

- A PO can exist without a supplier being linked to the products (supplier is selected at PO level).
- Receiving against a PO routes through the standard manual receiving session flow.
- Signatures are device-specific; a signature captured on one device will not appear on another.

---

## Known Issues

- Email sends via `mailto:` link (opens mail client, no server-side send). Not reliable for suppliers without a default mail client. (UX-04)
- Signatures not stored in database — lost on browser data clear.
- PDF is generated client-side with html2canvas + jsPDF; complex layouts may not render perfectly.

---

## Test Checklist

- [ ] Create PO, add items, mark as ordered
- [ ] Receive against PO updates quantity_received
- [ ] PDF download generates correctly
- [ ] Email draft opens with correct supplier
- [ ] Smart Reorder suggests quantities based on sales velocity
- [ ] Batch PO creation groups by supplier

---

## Future Enhancements

- Server-side email delivery to supplier
- PO signature storage in database (not localStorage)
- Server-side PDF generation

---

*Source: PLATFORM_REFERENCE.md §4 — Purchase Orders*
