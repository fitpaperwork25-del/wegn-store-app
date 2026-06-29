# Platform Decisions

Architectural and business decisions made during development, with rationale and trade-offs. All rationale is derived from documentation and code inspection — nothing is invented.

**Related:** [02_ARCHITECTURE.md](02_ARCHITECTURE.md) · [03_DATABASE_REFERENCE.md](03_DATABASE_REFERENCE.md) · [10_TROUBLESHOOTING.md](10_TROUBLESHOOTING.md) · [INDEX.md](INDEX.md)

---

## Architecture Decisions

### DEC-A1: Single-file application (`App.tsx`)

**Choice:** The entire frontend application lives in `src/App.tsx` (~11,050 lines). There is no component tree.

**Rationale:** Intentional — avoids prop-drilling and keeps the app portable. All state, data loaders, event handlers, and UI are co-located.

**Trade-offs:** This is the primary scalability constraint. The file cannot be split without a significant refactor. Large features cannot be added safely inline — future additions should consider componentization first.

---

### DEC-A2: No routing library

**Choice:** Navigation uses an `activeTab` state variable. No `react-router`, `tanstack-router`, or similar library.

**Rationale:** Paired with the single-file decision. Sufficient for a shared-terminal retail POS where no deep-linking is needed.

**Trade-offs:** Deep-linking and browser back/forward do not work. URLs do not reflect the current view.

---

### DEC-A3: No state management library

**Choice:** All state is `useState` inside the `App` function component (~350+ state variables).

**Rationale:** Paired with the single-file decision. No additional dependencies; all state is in one place.

**Trade-offs:** The component has an unusually large number of state variables. No derived state infrastructure; memos (`useMemo`) are used selectively.

---

### DEC-A4: Supabase as the complete backend

**Choice:** PostgreSQL + Auth + Edge Functions + Row Level Security, all via Supabase.

**Rationale:** Provides authentication, database, serverless functions, and tenant security in one hosted service without managing infrastructure.

**Trade-offs:** Platform lock-in. Migrations are managed through Supabase CLI and the Supabase Dashboard (which led to DEC-A10 below).

---

### DEC-A5: Anthropic claude-sonnet-4-6 for invoice parsing

**Choice:** Smart Receive uses the `claude-sonnet-4-6` model via a Supabase Edge Function (Deno runtime).

**Rationale:** The model supports multimodal input (images and PDF via the `pdfs-2024-09-25` beta header), enabling invoice parsing from both scanned images and digital PDFs. The structured JSON prompt produces deterministic output for downstream product matching.

**Trade-offs:** API cost per Smart Receive usage. Requires `ANTHROPIC_API_KEY` to be set as an Edge Function secret. If the API is down, Smart Receive fails entirely.

---

### DEC-A6: No code splitting

**Choice:** The entire app bundles to a single JS chunk (~1.37 MB / 356 KB gzipped). No dynamic imports or lazy-loaded routes.

**Rationale:** Paired with single-file architecture; there are no natural split points without a router and component tree.

**Trade-offs:** Vite warns about this at build time. Initial page load is heavier than necessary. This is expected and non-blocking.

---

### DEC-A7: No error boundaries

**Choice:** No React error boundaries are implemented anywhere in the render tree.

**Rationale:** Deferred during the Production Readiness phase. Would require componentization first to be meaningful — wrapping the single App component would catch errors but not isolate them.

**Trade-offs:** A rendering crash in any section will crash the entire app. Deferred to Technical Backlog.

---

### DEC-A8: Client-side report computation from in-memory state

**Choice:** All report data (revenue, inventory valuation, sales history, low stock) is computed from data loaded at startup — not from dedicated reporting DB queries.

**Rationale:** Implementation simplicity. All data is already in memory after the initial load.

**Trade-offs:** Slow for large datasets (10,000+ records). No date-range-limited DB queries at report time — the filter is applied in-memory. Reports do not scale well.

---

## Data Decisions

### DEC-D1: `inventory.quantity_on_hand` maintained by app logic, not DB triggers

**Choice:** `quantity_on_hand` is updated by explicit `UPDATE` calls in the application code, not by PostgreSQL triggers.

**Rationale:** Application-level control; consistent with the overall design of keeping business logic in the frontend.

**Trade-offs:** Concurrent edits from multiple browser tabs could cause race conditions on stock numbers. If data is modified directly in Supabase, `average_cost` and `quantity_on_hand` may diverge.

---

### DEC-D2: Receiving post is not wrapped in a Postgres transaction

**Choice:** `handlePostReceivingSession` updates products sequentially in a loop. If any product fails mid-loop, earlier products are already committed.

**Rationale:** Supabase JS v2 does not expose Postgres transactions natively (would require a stored procedure / RPC).

**Trade-offs:** Partial failure is possible (BUG-04). A receiving post that crashes halfway will leave inventory in a partially-updated state.

---

### DEC-D3: POS sales do not write `inventory_transactions` rows

**Choice:** The POS sale flow updates `inventory.quantity_on_hand` directly but does not insert a row into `inventory_transactions`.

**Rationale:** Implicit design choice; not documented with explicit rationale. Possibly a performance simplification.

**Trade-offs:** POS sales are not visible in the transaction history view (BUG-03). Only receiving, adjustments, returns, and write-offs appear in the transaction log.

---

### DEC-D4: Returns do not restore `inventory_batches.quantity_remaining`

**Choice:** The return flow restores `inventory.quantity_on_hand` but does not decrement or reverse `inventory_batches.quantity_remaining`.

**Rationale:** The original batch may already be depleted or consumed by other sales. Restoring to a specific batch is ambiguous without additional tracking of which batch was sold.

**Trade-offs:** Batch records remain at their depleted quantities even after a customer return (BUG-02).

---

### DEC-D5: `sessionPayments` is transient, lazy-loaded state

**Choice:** `sessionPayments` (the in-memory map of payments per receiving session) is empty on page load. It is populated by `loadSessionPayments()` only when a payment panel is opened.

**Rationale:** Avoids loading all supplier payment history at startup for every session in the list.

**Trade-offs:** The "Paid" badge may not show on page load for fully-paid sessions until the panel is opened at least once (UX-02). This is expected behavior.

---

### DEC-D6: `supplier_payments.supplier_id` is NOT NULL

**Choice:** The `supplier_payments` table enforces `supplier_id NOT NULL` at the DB level.

**Rationale:** Data integrity — every supplier payment must be traceable to a known supplier. This is a load-bearing constraint.

**Trade-offs:** Receiving sessions without a linked `supplier_id` cannot have payments recorded. The UI must show a "Link a supplier" nudge for such sessions. Removing this guard in the UI will cause a DB error on insert.

---

### DEC-D7: `received_date` column created directly in Supabase Dashboard

**Choice:** The `received_date` column on `receiving_sessions` was added directly via the Supabase Dashboard UI, not through a migration file.

**Rationale:** Expedience during development.

**Trade-offs:** Any fresh project restore will fail on `loadSessionHistory`'s SELECT because the column won't exist (BUG-05). Must be added manually.

---

## Staff / Auth Decisions

### DEC-S1: PIN-based staff login, not Supabase Auth

**Choice:** Staff log in via a PIN lock screen on the frontend. The PIN check is client-side only. Supabase Auth is used only for the business owner account.

**Rationale:** PIN-only login fits shared-terminal retail scenarios where multiple employees use the same device throughout the day. No invite infrastructure is needed.

**Trade-offs:** PIN login provides no server-side identity. All staff actions are attributed to the currently selected role, not a unique auth token. `auth_user_id` on `employees` is partially scaffolded for future use but not production-ready.

---

### DEC-S2: PINs stored plaintext

**Choice:** `employees.pin` is a plaintext `text` column. No hashing is applied.

**Rationale:** Operational simplicity for a local PIN entry scenario.

**Trade-offs:** This is a known security concern for production environments. If the `employees` table is exposed or queried directly, PINs are visible.

---

### DEC-S3: PO signatures in localStorage

**Choice:** Digital signatures for purchase orders are stored in `localStorage`, not in the database.

**Rationale:** No DB schema for signatures was created. This is an expedient local solution.

**Trade-offs:** Signatures are device-specific and are lost if the browser's local data is cleared. They are not persisted to the backend.

---

## Business Logic Decisions

### DEC-B1: FEFO (First Expired, First Out) batch allocation

**Choice:** At POS sale time, active batches for each cart product are fetched ordered by `expiration_date ASC NULLS LAST`. The soonest-expiring batch is consumed first.

**Rationale:** Perishable goods management requirement. The `idx_inventory_batches_fefo` partial index supports this efficiently.

**Trade-offs:** Requires batch records to exist. If a product has no active batches, FEFO is silently skipped (the sale proceeds but no batch records are decremented). Returns do not restore batch quantities (DEC-D4).

---

### DEC-B2: Duplicate invoice detection at two layers

**Choice:** Duplicate invoice check runs at Smart Receive session creation AND at manual receiving post. Both check for the same `invoice_number` + `supplier_id` combination in existing sessions.

**Rationale:** Prevents accidental double-entry of the same invoice.

**Trade-offs:** The Smart Receive check shows a blocking warning; the manual post check uses `window.confirm`. Both can be bypassed by the user ("Create Anyway" / OK).

---

### DEC-B3: Loyalty points are not reversed on void or return

**Choice:** Void and return flows do not create negative `loyalty_transactions` to reverse points earned on the original sale.

**Rationale:** Simplicity; noted as a known limitation.

**Trade-offs:** Customers retain loyalty points even if their sale is voided or returned (BUG-01 and return known limitation).

---

### DEC-B4: Tax applied to discounted subtotal

**Choice:** `tax = (subtotal - discount_amount) × tax_rate`.

**Rationale:** Standard retail tax calculation — tax is on the amount actually charged, not the pre-discount price.

**Trade-offs:** None noted. This is the expected behavior.

---

### DEC-B5: Loyalty redemption subtracted before tax

**Choice:** Loyalty point redemption reduces the total before tax is applied. `tax = (subtotal - discount - loyalty_redemption_dollars) × tax_rate`.

**Rationale:** Loyalty redemption is treated as a discount, reducing the taxable base.

**Trade-offs:** None noted.

---

*Source: PLATFORM_REFERENCE.md §2, §3, §5, §7, §9, §10 — synthesized into decision records*
