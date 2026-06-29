# Module: Settings

**Related:** [modules/pos.md](pos.md) · [../03_DATABASE_REFERENCE.md](../03_DATABASE_REFERENCE.md) · [../04_BUSINESS_RULES.md](../04_BUSINESS_RULES.md) · [../INDEX.md](../INDEX.md)

---

## Purpose

Manage business profile (name, phone, email, address, tax rate, selling policy).

---

## Features

- Edit business name, phone, email, and address
- Configure tax rate (applies to all POS sales)
- Configure selling policy (controls POS price negotiation behavior)

---

## User Workflow

Edit fields, save. Changes apply immediately to all receipts and tax calculations.

---

## Database Tables

- `businesses`

---

## Business Rules

- Tax rate is stored as a percentage number (e.g., `8.5` = 8.5%).
- Tax is applied in POS: `tax = (subtotal - discount) × (tax_rate / 100)`.
- Selling policy controls POS negotiation behavior:
  - `fixed_pricing`: no negotiation UI shown at POS
  - `negotiated_pricing`: "Negotiate Price" button shown per cart line; any employee can negotiate
  - `negotiated_with_approval`: **Needs verification** — negotiation flow may require manager approval (implementation status unclear)

---

## UI Components

- Business name, phone, email, address fields
- Tax rate input (numeric, percentage)
- Selling policy dropdown (`fixed_pricing` / `negotiated_pricing` / `negotiated_with_approval`)
- Save button

---

## Edge Cases

- Tax rate change takes effect on the next sale; existing open sales use the rate in memory at the time they were started.
- Selling policy change takes effect immediately on the next POS session (no page reload required for the policy to affect the POS negotiation button visibility).

---

## Known Issues

- `negotiated_with_approval` policy: the approval flow is not implemented. The behavior when this policy is selected is unverified. (UX-06)

---

## Test Checklist

- [ ] Edit business name → shows on receipts and dashboard
- [ ] Change tax rate → applies to next sale
- [ ] Selling policy change → POS negotiation button appears/disappears

---

## Future Enhancements

- Full implementation of `negotiated_with_approval` policy (manager approval flow)

---

*Source: PLATFORM_REFERENCE.md §4 — Settings*
