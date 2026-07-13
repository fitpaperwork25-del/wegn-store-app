# Architecture Audit — Stabilization Initiative

**Branch:** `stabilization/app-modularization` (created from `main` @ `64203eb`, unmodified)
**Purpose:** Pre-refactor architecture map. No code was changed to produce this document — every claim below is backed by a grep/read against the actual source on this branch.
**Related:** [02_ARCHITECTURE.md](02_ARCHITECTURE.md) · [05_PLATFORM_DECISIONS.md](05_PLATFORM_DECISIONS.md)

---

## How to read this document

For each area: **purpose**, **main files**, **dependencies**, **coupling**, **risks**, **recommended module boundary**. "Coupling" means what this area reads/writes that other areas also read/write — the thing that makes extraction unsafe if done carelessly.

One fact that applies to *every* section below and is worth stating once: **all 10 areas live in a single file and a single React component** (`src/App.tsx`, 11,147 lines, one `function App()`). There is no folder-per-feature structure today. The "module boundaries" described below are logical/comment-based (`{/* ── POS TAB ── */}` style markers), not physical file boundaries. Several of them are not even contiguous — the same logical tab's JSX is split across multiple non-adjacent blocks in the file (evidence below, per area).

---

## 1. Authentication

**Purpose:** Email/password sign-in and sign-up via Supabase Auth; creates the initial `businesses` row on first sign-up; renders the login/signup form or hands off to `<App />` once a session exists.

**Main files:** `src/AuthGate.tsx` (165 lines), `src/main.tsx` (10 lines, mounts `<AuthGate />` in `<StrictMode>`), `src/supabase.ts` (6 lines, client instance).

**Dependencies:** `@supabase/supabase-js` (`auth.getSession`, `auth.onAuthStateChange`, `auth.signUp`, `auth.signInWithPassword`, `auth.signOut`), one direct table write (`businesses` insert on first signup, `AuthGate.tsx:47`).

**Coupling:** Minimal and clean. `AuthGate` passes exactly three things into `App`: `userId`, `userEmail`, `onSignOut` (`AuthGate.tsx:91`). `App` never reaches back into `AuthGate`'s state. This is the **only** module boundary in the codebase that already looks like the target end-state for the others.

**Risks:**
- No password-reset flow visible in this file (not confirmed absent elsewhere — only checked this file).
- Business creation is a side effect buried inside the signup handler (`AuthGate.tsx:47-53`) rather than a separate step — if this insert fails, the user is signed in with no business and no clear recovery path shown here beyond an inline error string.
- No test coverage (repo-wide fact, not specific to auth).

**Recommended module boundary:** Already correct — no action needed. This is the reference example for what "extracted" should look like: own file, narrow prop contract, no shared global state.

---

## 2. App.tsx (the container)

**Purpose:** Currently *is* the application — owns all state, all Supabase calls, all business logic, and the entire render tree for every tab.

**Main files:** `src/App.tsx` only.

**Dependencies:** `@supabase/supabase-js`, `html2canvas`, `jspdf`, React. No routing library, no state-management library, no UI component library (`docs/02_ARCHITECTURE.md:23-25`, confirmed by grep — zero `react-router`/`redux`/`zustand`/etc. imports).

**Coupling:** Total. Every one of the 9 modules below is a region of this same file and this same component scope. There are:
- **170** `useState` hooks (measured via `grep -c "useState("`)
- **119** top-level `function`/`async function` declarations
- **141** direct `supabase.from(...)` call sites across 18 distinct tables
- **8** `useEffect`, **18** `useMemo`, **1** `useCallback`

**Risks:** This is the container for every risk listed in the previous engineering-health assessment (no error boundaries, no tests, 86% commit-touch rate, Babel's own 500KB tooling-degradation warning). Nothing new to add here beyond: this file *is* the coupling problem, not a symptom of it.

**Recommended module boundary:** Not a single boundary — this is what gets decomposed into modules 3–9 below, with module 10 (database layer) extracted orthogonally as a service layer underneath all of them.

---

## 3. POS

**Purpose:** Cart building, barcode scan-to-cart, checkout/payment, cash drawer open/close, returns, receipt printing, price negotiation.

**Main files:** All in `src/App.tsx`. JSX for this tab is **not contiguous** — split across two blocks: `{/* ── POS TAB ── */}` (line 4475) and `{/* ── POS TAB (2) ── */}` (line 8477).

**Key functions:** `handleBarcodeSubmit`, `handleAddToCart`, `handleRemoveFromCart`, `handlePrintReceipt`, `handleVoidSale`, `handleCompleteSale`, `handleToggleEod`, `handleOpenDrawer`, `handleCloseDrawer`, `handlePaidOut`, `handleOpenReturn`, `handleConfirmReturn`.

**Key state:** `cart`, `barcodeInput`, `drawerSession`, `posDiscountType`/`posDiscountValue`, `paymentMethod`/`paymentRef`/`amountTendered`, `negotiatingProductId`, `posCustomerId`, `receipt` (print modal state).

**Dependencies:** `products` (read, for cart pricing/stock checks — owned by Inventory), `customers` (read, for loyalty lookup — owned by Customers), `loyaltyTransactions` (read/write — owned by Customers), `employees`/`activeCashierId` (read — owned by Staff), tables: `sales`, `sale_items`, `payments`, `drawer_sessions`, `drawer_paid_outs`, `return_items`, `inventory`, `inventory_transactions`.

**Coupling:** **Highest in the app.** POS reads live state owned by three other modules (Inventory, Customers, Staff) simultaneously, on every cart operation. This is the module this entire recent debugging session's barcode work lived inside, and firsthand evidence of how expensive it is to change safely without tests.

**Risks:** Revenue-critical path with zero test coverage. Split across two non-adjacent blocks, so a reviewer/editor must jump between two distant regions of the file to see the whole tab. The barcode-matching logic specifically (`products.find(...)` against a client-side array) has already proven fragile to state-staleness in practice this session.

**Recommended module boundary:** Extract **last**, not first. Before extracting: (a) consolidate the two POS blocks into one location, (b) add smoke-test coverage for checkout + barcode scan, (c) only then extract into its own component receiving `products`/`customers`/`employees` as read-only props/context rather than reaching into a shared scope.

---

## 4. Inventory

**Purpose:** Product catalog (create/edit/deactivate, barcode assignment), stock adjustments, categories, expiration/batch tracking (FEFO), Smart Receive (AI invoice parsing), rapid/session-based receiving.

**Main files:** All in `src/App.tsx`. JSX is the **most fragmented tab in the app** — four separate blocks: `{/* ── INVENTORY TAB ── */}` (5120), `{/* ── INVENTORY TAB (2) ── */}` (6333), `{/* ── INVENTORY TAB (3) ── */}` (8391), `{/* ── INVENTORY TAB (4) ── */}` (9712).

**Key functions:** `loadProducts`, `handleAddProduct`, `handleEditProduct`, `handleToggleProductStatus`, `handleBulkImport`, `handleAddCategory`/`handleEditCategory`/`handleDeleteCategory`, `loadBatches`, `handleWriteOffBatch`, `handleStartReceivingSession`, `handleSessionScan`, `handlePostReceivingSession`, `processSmartReceiveInvoice`, `handleRapidReceiveScan`, `handlePostRapidReceive`, `handleReceive`, `handleAdjust`.

**Key state:** `products` (the single most shared state variable in the app), `categories`, `activeReceivingSession`, `sessionItems`, `smartReceiveResult`/`smartReceiveMatches`, `rapidReceiveItems`, `productResolution` (the unified "unmatched item" dialog, shared with Smart Receive).

**Dependencies:** `suppliers` (read — owned by Purchasing), tables: `products`, `inventory`, `inventory_transactions`, `inventory_batches`, `categories`, `receiving_sessions`, `receiving_items`.

**Coupling:** `products` state specifically is read by POS, Purchasing, Reports, and (per the git history evidence in the prior assessment) was the exact state the Barcode Center work modified. It is the single highest-blast-radius piece of state in the codebase — more modules depend on it than on any other state variable.

**Risks:** Worst code-locality in the app (4 non-contiguous blocks). Receiving/Smart Receive is also, per commit history, the area with the **highest current feature-development velocity** (most of the last 15 commits touching `App.tsx` were receiving/invoice features) — meaning it is also the area most likely to have merge conflicts with any refactor work done concurrently.

**Recommended module boundary:** Split in two, not one: **(a) Product Catalog** (products, categories, barcode assignment — the "master data" piece other modules read) and **(b) Receiving/Smart Receive** (sessions, batches, AI invoice parsing — the highest-velocity, most write-heavy piece). Consolidate each into one contiguous block *before* extracting. Do not extract the Product Catalog piece until POS and Purchasing's read access to `products` has a stable interface, since it's their shared dependency.

---

## 5. Purchasing

**Purpose:** Supplier management, purchase order creation/lifecycle (draft → ordered → received), reorder planning, supplier invoices/payments, PO signatures and email log (the latter two persisted in `localStorage`, not the database — confirmed: `getPoSignatures`/`savePoSignature`/`getPrefQty`/`savePrefQty`/`getPoEmailLog`/`savePoEmailLog` are the first six functions in the file and operate on `localStorage`, not Supabase).

**Main files:** All in `src/App.tsx`. JSX split across two blocks: `{/* ── PURCHASING TAB ── */}` (6831) and `{/* ── PURCHASING TAB (2) ── */}` (7909).

**Key functions:** `loadSuppliers`, `handleAddSupplier`/`handleSaveSupplier`/`handleToggleSupplierStatus`/`handleDeleteSupplier`, `loadPurchaseOrders`, `handleCreatePO`/`handleCreateCatalogPO`/`handleBatchReorderPO`, `handleSelectPO`, `handleConfirmReceive`, `handleMarkOrdered`/`handleCancelPO`/`handleDeletePO`, `handleSaveInvoice`, `loadSupplierStatement`, `handleSavePayment`.

**Key state:** `suppliers`, `purchaseOrders`, `poItems`, `receivingItems`/`receiveQtys` (traditional PO receiving — distinct from Inventory's session-based receiving), `poStatusFilter`.

**Dependencies:** `products` (read, for PO line items — owned by Inventory), tables: `suppliers`, `purchase_orders`, `purchase_order_items`, `supplier_payments`, plus `inventory`/`inventory_transactions` writes on receive.

**Coupling:** Moderate. Reads `products` but does not own it. Two receiving mechanisms exist in the app — this module's traditional PO-based receive (`handleConfirmReceive`) and Inventory's session-based receive (`handlePostReceivingSession`) — which is itself worth flagging: **there are two different code paths for "receiving inventory," not one**, a structural fact a modularization effort needs to resolve or explicitly document as intentional.

**Risks:** By raw table-touch count, `receiving_sessions` (17), `purchase_orders` (15), `purchase_order_items` (13), and `receiving_items` (15) are the four most-queried tables in the app — this is the busiest area of the codebase by database interaction, and (per commit history) currently the highest feature-development velocity area.

**Recommended module boundary:** Good early-extraction candidate *for the supplier/PO-lifecycle piece specifically* (lower coupling than Inventory), but the receiving-workflow piece should be extracted together with Inventory's session-receiving (see §4) since they represent the same real-world action through two different code paths — extracting them separately risks cementing the duplication rather than resolving it.

---

## 6. Customers

**Purpose:** Customer directory (create/edit/deactivate, phone lookup), loyalty points ledger (earn/redeem).

**Main files:** All in `src/App.tsx`. JSX is a **single contiguous block**: `{/* ── CUSTOMERS TAB ── */}` (7544) — one of only three tabs (with Dashboard and Settings) that isn't fragmented.

**Key functions:** `loadCustomers`, `handleAddCustomer`/`handleEditCustomer`/`handleToggleCustomerStatus`, `handleLookupCustomer`, `loadLoyaltyTransactions`.

**Key state:** `customers`, `loyaltyTransactions`, `customerSearch`.

**Dependencies:** Tables: `customers`, `loyalty_transactions`. Read by POS (for checkout customer selection/loyalty redemption) and Reports (for analytics).

**Coupling:** Low-to-moderate. It's a dependency *of* POS and Reports, but doesn't itself depend on other modules' state. One-directional coupling is much easier to extract safely than the bidirectional kind seen in POS/Inventory.

**Risks:** None specific beyond the repo-wide lack of tests. Smallest, cleanest tab in the app after Settings.

**Recommended module boundary:** Strong early-extraction candidate — single contiguous block, one-directional dependency (feeds POS/Reports, depends on nothing else), small surface area.

---

## 7. Reports

**Purpose:** Sales analytics (revenue, margin, top products), sales history search, inventory valuation, low-stock report.

**Main files:** All in `src/App.tsx`. JSX split across two blocks: `{/* ── REPORTS TAB ── */}` (8682) and `{/* ── REPORTS TAB (2) ── */}` (9186).

**Key logic:** `analyticsData` (`useMemo`, line 948) is the core of this module — and its own dependency array is the most concrete evidence of this module's coupling: `[sales, saleItems, allPayments, products, purchaseOrders, customers, loyaltyTransactions, lowStockProducts, productIdMap]` (verified directly, line ~1061). That is **every other module's primary state, read simultaneously.**

**Dependencies:** Reads from every other module (Sales/POS, Purchasing, Inventory, Customers). Writes nothing — this module appears to be **read-only** with respect to the database (no `handleX` mutation functions attributable to Reports specifically were found in the function list).

**Coupling:** Wide (depends on almost everything) but shallow (read-only, one direction — nothing else depends on Reports' state). This combination — "depends on everything, but nothing depends on it" — makes it safer to extract than its dependency count alone would suggest.

**Risks:** If the underlying state shapes of Sales, Purchasing, Inventory, or Customers change during their own extraction, Reports' `analyticsData` memo will need to be updated in lockstep, every time, since it touches all of them. Treat it as a required regression-check for *every other* module's extraction, not just its own.

**Recommended module boundary:** Extract only *after* the modules it reads from (Customers, then Purchasing, then Inventory, then POS) have stabilized their own state shape/interface — extracting Reports first would mean re-touching it repeatedly as its dependencies keep moving underneath it.

---

## 8. Settings

**Purpose:** Business profile (name, phone, email, address, tax rate, selling policy).

**Main files:** All in `src/App.tsx`. JSX is a **single contiguous block**: `{/* ── SETTINGS TAB ── */}` (10055) — confirmed via direct read, no "(2)" duplicate exists.

**Key functions:** `loadBusiness`, `handleSaveBusiness`.

**Key state:** `businessName`/`businessPhone`/`businessEmail`/`businessAddress`/`businessTaxRate`/`sellingPolicy` and their `editBiz*` form-draft counterparts.

**Dependencies:** Table: `businesses`. Read by nearly every other module (`businessTaxRate` for POS checkout math, `sellingPolicy` for negotiation rules, `businessName`/`businessPhone`/`businessAddress` for receipt/PO letterheads) but this module doesn't read anything back from them.

**Coupling:** Low from Settings' own perspective (writes to one table, one form), but it's a **quiet dependency of almost every printed/calculated artifact in the app** (receipts, POs, tax math). Small blast radius to edit, but a shared read-dependency worth documenting.

**Risks:** None specific found. Smallest, simplest tab in the app.

**Recommended module boundary:** Best possible first real extraction (alongside, or even before, Customers) — single contiguous block, one table, one-directional dependency, smallest functional surface in the application. Good candidate to validate the extraction *pattern* itself at minimum risk before applying it anywhere with real stakes.

*(Note: "Staff" — employee accounts and PINs — is a separate nav tab, keyed `'employees'`, with its own two blocks, `{/* ── EMPLOYEES TAB (2) ── */}` at 8827 and `{/* ── EMPLOYEES TAB ── */}` at 9919. It was not in the requested 1–10 list but is worth naming here since "Settings" and "Staff" are easily conflated: they are distinct tabs in the nav bar and in the code.)*

---

## 9. Shared utilities

**Purpose:** Cross-cutting logic used by more than one tab — this is the connective tissue that makes clean extraction hard.

**Main files:** All in `src/App.tsx`, scattered (no dedicated `utils.ts` exists in `src/`).

**Concrete inventory:**
- **Data loaders** (`load*` functions, ~30 of them) — each owned conceptually by one module, but several are called from multiple places (e.g., `loadProducts` is invoked after mutations originating in Inventory, Purchasing, *and* POS).
- **Cross-module dialogs:** the "Product Resolution" dialog (`productResolution` state, `openProductResolution`/`closeProductResolution`/`handleProductResolutionLink`/`handleProductResolutionCreate`) is explicitly shared between Smart Receive (Inventory) and POS's unmatched-barcode flow — one UI component serving two tabs' workflows.
- **Print modals:** receipt (`receipt` state, POS), PO (`printPo` state, Purchasing) — each is a full inline modal with its own `@media print` CSS block, duplicated per use rather than shared as a component.
- **Derived-data memos:** `productIdMap`, `customerMap`, `saleItemsBySaleId`, `filteredProducts`, `categoryChips`, `lowStockProducts`, `recentSales`, `posCustomerLoyaltyBalance` — `useMemo`-based lookup tables built from primary state, consumed across multiple tabs (e.g., `productIdMap` feeds both Reports and Sales History search).
- **Formatting helpers:** `fmtPhone` — the only true "pure utility function" found; everything else above has side effects or reads component state directly.
- **Local device persistence:** PO signatures/email log/preferred-quantity (`getPoSignatures` et al.) use `localStorage` directly, not the database — device-specific, not synced (documented already in `05_PLATFORM_DECISIONS.md`, confirmed in code as the first six functions in the file).

**Coupling:** By definition, everything here is coupled to 2+ modules — that's what makes it "shared." The derived-data memos in particular have deep dependency chains (`filteredProducts` depends on `products` + `categoryFilter` + `debouncedProductSearch`; `analyticsData` in Reports depends on nearly all of them).

**Risks:** No dedicated location for shared logic means every "utility" is defined inline, next to whichever tab happened to need it first, then reused elsewhere via direct reference to the same component scope. There is no way to move one tab to its own file without first deciding where each shared piece goes.

**Recommended module boundary:** This is not a tab to extract — it's the **first real decision point** of any modularization: create `src/lib/` (pure helpers like `fmtPhone`, future `generateWegnBarcode`-style functions), `src/hooks/` (data loaders as custom hooks), and a small `src/components/shared/` (Product Resolution dialog, print modal shells) *before* extracting any tab, so tabs have somewhere correct to import shared pieces from instead of re-declaring them.

---

## 10. Database layer

**Purpose:** All persistence — PostgreSQL via Supabase, with Row Level Security for multi-tenant isolation.

**Main files:** `src/supabase.ts` (6 lines — bare client, **no generated `Database` type parameter passed to `createClient`**, confirmed by reading the file), `supabase/migrations/` (**25 SQL files**), `supabase/functions/process-invoice/index.ts` (Deno Edge Function for Smart Receive AI parsing).

**Dependencies:** None inward — everything else depends on this.

**Coupling:** **There is no service/repository/data-access layer.** All 141 `supabase.from(...)` calls are made directly from inside UI event handlers in `App.tsx`, each with its own inline `.select(...)` string and manual response-shape assumptions. Confirmed pattern, not an assumption: `loadProducts` (App.tsx) hand-builds a `ProductStock` object field-by-field from a raw joined query result typed as `any` — this is exactly the class of bug (assumed vs. actual shape mismatch) that caused real failures during this session's barcode work.

**Risks:**
- **No typed client.** Since `createClient` isn't parameterized with a generated `Database` type, every query result is effectively `any` at the boundary, and 13 explicit `any` annotations exist elsewhere in the file — TypeScript cannot catch a schema/query mismatch anywhere in this app today.
- **RLS is consistently applied** (fact, not a risk): every table has a `tenant_isolation` policy scoped to `auth_business_id()` (confirmed: 18 `CREATE POLICY` matches for `tenant_isolation` in `supabase/migrations/20260620_rls_tenant_isolation.sql`), and `anon` access is explicitly revoked repo-wide. This is a genuine strength, not a gap.
- **One undocumented schema change exists outside migrations**: `receiving_sessions.received_date` was added directly via the Supabase Dashboard with no corresponding migration file (documented in `docs/02_ARCHITECTURE.md:112` and `docs/08_DEPLOYMENT.md:75-79` — a real drift-risk for anyone restoring the database from migrations alone).
- **Receiving posts are not transactional** (documented, `docs/03_DATABASE_REFERENCE.md:409`): a partial failure mid-loop can leave some products updated and others not, with no rollback.

**Recommended module boundary:** Introduce a typed `Database` generic on the Supabase client first (cheapest, highest-leverage single change — turns every one of the 141 call sites' results from `any` into checked types with zero behavior change). Then, as each tab module above is extracted, give it a thin `src/lib/api/<module>.ts` file wrapping just its own table calls — do not attempt one big "repository layer" refactor across all 18 tables at once; let each module's extraction carry its own data-access file with it.

---

## Cross-cutting summary table

| Module | JSX contiguity | Depends on | Depended on by | Extraction risk |
|---|---|---|---|---|
| Authentication | 1 file, isolated | — | App (3 props only) | Already done |
| POS | 2 blocks | Inventory, Customers, Staff | Reports | **Highest** — extract last |
| Inventory | **4 blocks** | Purchasing (suppliers) | POS, Purchasing, Reports | High — split into Catalog vs. Receiving first |
| Purchasing | 2 blocks | Inventory (products) | Reports | Medium-high — busiest by DB call count |
| Customers | 1 block | — | POS, Reports | Low — good early candidate |
| Reports | 2 blocks | Everything (read-only) | — | Medium — extract only after its dependencies stabilize |
| Settings | 1 block | — | Everything (reads `businessTaxRate` etc.) | **Lowest** — best first candidate |
| Shared utilities | scattered | — | Everything | Not extractable as a "tab" — must be organized first |
| Database layer | scattered (141 call sites) | — | Everything | Add typing first; extract per-module alongside each tab |

---

*No source files were modified to produce this document. All line numbers and counts were measured directly against `src/App.tsx` on `stabilization/app-modularization` at commit `64203eb`.*
