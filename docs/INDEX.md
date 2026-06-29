# Wegn-Store Documentation Library

**Version:** As of commit `862d299` (2026-06-29)
**Master reference:** [`../PLATFORM_REFERENCE.md`](../PLATFORM_REFERENCE.md) — original single-document source; preserved untouched.

---

## How to Use This Library

- Start with [00_EXECUTIVE_OVERVIEW.md](00_EXECUTIVE_OVERVIEW.md) if you are new to the platform.
- Start with [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) if you are an AI coding agent about to make changes.
- Start with [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) if you are working on schema or queries.
- Start with the relevant file in [modules/](modules/) if you are working on a specific feature.

---

## Top-Level Documents

| File | Contents |
|---|---|
| [00_EXECUTIVE_OVERVIEW.md](00_EXECUTIVE_OVERVIEW.md) | What Wegn-Store is, target users, platform mission |
| [01_PRODUCT_SCOPE.md](01_PRODUCT_SCOPE.md) | Shipped modules, intentionally out-of-scope features |
| [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | Frontend structure, backend layers, file map, architectural constraints |
| [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) | All 19 tables, relationships, RLS model, critical fields, data integrity |
| [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md) | Inventory qty changes, average cost, sale flow, returns, invoice matching, payments, drawer math, role permissions |
| [05_PLATFORM_DECISIONS.md](05_PLATFORM_DECISIONS.md) | Architectural and business decisions with rationale and trade-offs |
| [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) | Development rules, coding guardrails, investigation workflow, testing requirements, deployment checklist, documentation standards |
| [07_OPERATIONS.md](07_OPERATIONS.md) | Run locally, build, verify production, git workflow |
| [08_DEPLOYMENT.md](08_DEPLOYMENT.md) | Deploy frontend, deploy Edge Function, environment variables |
| [09_QA_TEST_SUITE.md](09_QA_TEST_SUITE.md) | 10 manual test cases with setup, steps, and pass criteria |
| [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) | Common issues, confirmed bugs, UX gaps, scalability concerns, do-not-touch areas |
| [11_DEVELOPER_HANDOFF.md](11_DEVELOPER_HANDOFF.md) | Git state, build status, deployment info, definition of done |
| [12_CHANGELOG.md](12_CHANGELOG.md) | Commit history, resolved bugs with root causes and commits |

---

## Module Documents

Each module document covers: Purpose · Features · User Workflow · Database Tables · Business Rules · UI Components · Edge Cases · Known Issues · Test Checklist · Future Enhancements.

| File | Module |
|---|---|
| [modules/dashboard.md](modules/dashboard.md) | Dashboard — daily summary, priorities, low-stock alerts |
| [modules/pos.md](modules/pos.md) | Point of Sale — cart, discounts, loyalty, payment, receipt |
| [modules/inventory.md](modules/inventory.md) | Inventory — products, adjustments, stock counts, FEFO, bulk import |
| [modules/smart_receive.md](modules/smart_receive.md) | Smart Receive — AI invoice parsing → receiving session (14-step deep doc) |
| [modules/receiving_sessions.md](modules/receiving_sessions.md) | Receiving Sessions — manual receive, barcode scan, post, session history |
| [modules/purchase_orders.md](modules/purchase_orders.md) | Purchase Orders — PO lifecycle, smart reorder, PDF, email |
| [modules/suppliers.md](modules/suppliers.md) | Suppliers — contacts, statement, linkage |
| [modules/supplier_invoices.md](modules/supplier_invoices.md) | Supplier Invoices — reconciliation, matching, variance |
| [modules/supplier_payments.md](modules/supplier_payments.md) | Supplier Payments — record payment, partial payments, paid state |
| [modules/customers.md](modules/customers.md) | Customers — directory, purchase history, loyalty balance |
| [modules/loyalty.md](modules/loyalty.md) | Loyalty — earn/redeem rules, cross-module behavior |
| [modules/returns.md](modules/returns.md) | Returns — return qty, refund payment, inventory restore |
| [modules/cash_drawer.md](modules/cash_drawer.md) | Cash Drawer — open, paid-outs, close, reconciliation |
| [modules/staff.md](modules/staff.md) | Staff / Roles / PIN Login — roles, permissions, PIN lock screen |
| [modules/reports.md](modules/reports.md) | Reports — revenue analytics, sales history, valuations, low stock |
| [modules/settings.md](modules/settings.md) | Settings — business profile, tax rate, selling policy |

---

## Quick Reference: Critical Facts

| Topic | Location |
|---|---|
| `received_date` has no migration (must be added manually to fresh DB) | [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md), [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) |
| `supplier_payments.supplier_id` is NOT NULL | [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md), [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md) |
| POS sales do NOT write `inventory_transactions` rows | [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md), [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) |
| Receiving post is NOT atomic | [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md), [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) |
| Do-Not-Touch areas | [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md), [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) |
| Smart Receive resolved bugs | [modules/smart_receive.md](modules/smart_receive.md), [12_CHANGELOG.md](12_CHANGELOG.md) |
| Role permissions matrix | [04_BUSINESS_RULES.md](04_BUSINESS_RULES.md), [modules/staff.md](modules/staff.md) |
| Definition of Done | [11_DEVELOPER_HANDOFF.md](11_DEVELOPER_HANDOFF.md), [06_AI_AGENT_GUIDE.md](06_AI_AGENT_GUIDE.md) |

---

*Source: [`../PLATFORM_REFERENCE.md`](../PLATFORM_REFERENCE.md) — generated from codebase inspection as of commit `862d299` on 2026-06-29.*
