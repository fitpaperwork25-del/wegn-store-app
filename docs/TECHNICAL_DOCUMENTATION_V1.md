# Wegn-Store

## Technical Documentation

**Version 1.0.0**

**Release Tag:** v1.0.0

**June 2026**

**FIT Paper Work**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Architecture](#4-database-architecture)
5. [Authentication](#5-authentication)
6. [Security & RLS](#6-security--rls)
7. [Inventory Module](#7-inventory-module)
8. [Purchasing Module](#8-purchasing-module)
9. [Sales Module](#9-sales-module)
10. [Returns Module](#10-returns-module)
11. [Stock Count Module](#11-stock-count-module)
12. [Cash Drawer Module](#12-cash-drawer-module)
13. [Loyalty Module](#13-loyalty-module)
14. [Reporting Module](#14-reporting-module)
15. [Deployment](#15-deployment)
16. [Release History](#16-release-history)
17. [Current Status](#17-current-status)
18. [Known Limitations](#18-known-limitations)
19. [V2 Roadmap](#19-v2-roadmap)

---

## 1. Project Overview

Wegn-Store is a browser-based point-of-sale and inventory management system designed for independent retail stores. It provides a single integrated platform for managing daily store operations including sales checkout, inventory control, supplier purchasing, customer relationships, and financial reporting.

### Target Users

Wegn-Store is built for small to mid-size retail store owners and their staff. The primary user is a store owner-operator who manages product catalog, supplier relationships, purchasing decisions, and end-of-day reconciliation. Secondary users are cashiers and managers who interact with the POS checkout and cash drawer during daily operations.

### Problem Statement

Independent retailers typically rely on disconnected tools — manual registers, paper-based inventory tracking, spreadsheet ordering, and separate accounting systems. This fragmentation leads to stock discrepancies, missed reorder points, inaccurate profit visibility, and time-consuming end-of-day reconciliation. Wegn-Store consolidates these workflows into a single application backed by a cloud database, giving the store owner real-time visibility into sales, inventory, costs, and profitability.

### Core Capabilities

- **Point of Sale** — Product lookup, barcode scanning, cart management, discounts, tax calculation, cash and card payments, receipt generation
- **Inventory Management** — Real-time stock tracking, stock adjustments, low stock alerts, bulk product import, product categories
- **Purchasing** — Supplier management, purchase order creation, partial and full receiving, reorder center with automatic PO generation
- **Customer Management** — Customer profiles, purchase history, loyalty points (earn and redeem at checkout)
- **Cash Drawer** — Session-based drawer management with opening float, paid outs, expected cash calculation, and over/short reconciliation
- **Returns and Voids** — Per-item partial returns with inventory restoration and loyalty reversal, full sale void support
- **Stock Counting** — Physical inventory count workflow with variance calculation and automatic adjustment
- **Reporting** — Sales analytics, profit reporting with COGS and margin analysis, supplier performance, end-of-day summary, inventory valuation
- **Security** — Supabase authentication with email/password login, row-level security policies enforcing tenant isolation across all 19 database tables

### Current Version

Version 1.0.0 (release tag `v1.0.0`, June 2026) represents the first functionally complete release. All core modules have been implemented, tested against live data, and deployed. The application is production-ready for single-store operation with authenticated owner access and full data isolation.

---

## 2. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              React SPA (Vite)                     │  │
│  │                                                   │  │
│  │  AuthGate ──► Login Form                          │  │
│  │      │                                            │  │
│  │      ▼                                            │  │
│  │  App.tsx (authenticated)                          │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┬──────────┐  │  │
│  │  │ POS  │ Inv  │ Purch│ Cust │ Empl │ Reports  │  │  │
│  │  └──┬───┴──┬───┴──┬───┴──┬───┴──┬───┴────┬─────┘  │  │
│  │     │      │      │      │      │        │        │  │
│  │     ▼      ▼      ▼      ▼      ▼        ▼       │  │
│  │  Supabase JS Client (supabase.ts)                 │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │ HTTPS (JWT in Authorization)     │
└──────────────────────┼──────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                 Supabase Cloud                           │
│                                                          │
│  ┌────────────────────┐   ┌───────────────────────────┐  │
│  │  Auth Service       │   │  PostgREST API            │  │
│  │  - Email/password   │   │  - REST endpoints         │  │
│  │  - JWT issuance     │   │  - Auto-generated from    │  │
│  │  - Session mgmt     │   │    database schema        │  │
│  └────────┬───────────┘   └────────────┬──────────────┘  │
│           │                            │                  │
│           ▼                            ▼                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                   │   │
│  │                                                    │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  Row Level Security (RLS)                    │  │   │
│  │  │  - auth_business_id() helper function        │  │   │
│  │  │  - tenant_isolation policy on 18 tables      │  │   │
│  │  │  - owner_select/owner_update on businesses   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                    │   │
│  │  19 tables │ business_id on every table            │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### Frontend

The frontend is a React single-page application built with Vite. It runs entirely in the browser with no server-side rendering. The application consists of three source files:

- **`src/AuthGate.tsx`** — Authentication wrapper that renders the login/signup form when no session exists and mounts the main application when the user is authenticated.
- **`src/App.tsx`** — The main application component containing all business logic, state management, and UI rendering across eight tabs (Dashboard, POS, Inventory, Purchasing, Customers, Employees, Reports, Settings).
- **`src/supabase.ts`** — Supabase client initialization using environment variables for the project URL and anon key.

The frontend communicates with the database exclusively through the Supabase JavaScript client, which sends authenticated HTTPS requests to the PostgREST API.

### Backend

There is no custom backend server. Supabase provides the entire backend infrastructure:

- **PostgREST** automatically generates RESTful API endpoints from the PostgreSQL schema. Every `select`, `insert`, `update`, and `delete` call in the frontend translates to an API request that PostgREST converts to a SQL query.
- **Supabase Auth** handles user registration, login, session management, and JWT token issuance. The JWT is automatically attached to every API request by the Supabase client.
- **PostgreSQL RLS** enforces access control at the database layer, ensuring every query is filtered by the authenticated user's business.

### Database

The database is a managed PostgreSQL instance hosted on Supabase. It contains 19 tables organized around a central `businesses` table. Every data table includes a `business_id` foreign key that links it to the owning business. The `businesses` table itself uses an `owner_id` column linked to `auth.users` to establish ownership.

### Authentication Flow

1. User opens the application in a browser.
2. `AuthGate` checks for an existing session via `supabase.auth.getSession()`.
3. If no session exists, the login form is displayed.
4. User submits email and password. `supabase.auth.signInWithPassword()` authenticates against the Supabase Auth service.
5. On success, Supabase returns a JWT containing the user's `uid`. The client stores the session in browser storage.
6. `AuthGate` renders `<App />`, passing the user ID and email as props.
7. `App` calls `loadBusiness()` which queries `businesses` filtered by `owner_id = auth.uid()`.
8. All subsequent queries are automatically authenticated via the JWT in the request header.

### Security Layer

Row Level Security operates at the PostgreSQL level, below the API. Every query — regardless of how it is constructed — is filtered by RLS policies before results are returned.

- **`auth_business_id()`** — A `SECURITY DEFINER` function that resolves `auth.uid()` to a `business_id` by looking up the `businesses` table. Called by every tenant isolation policy.
- **Tenant isolation** — 18 data tables enforce `business_id = auth_business_id()` on all operations (SELECT, INSERT, UPDATE, DELETE).
- **Owner isolation** — The `businesses` table enforces `owner_id = auth.uid()` on SELECT and UPDATE.
- **Anon revocation** — All table privileges have been revoked from the `anon` role. Unauthenticated requests receive zero rows and cannot write data.

### Data Flow Summary

```
User action (e.g. complete sale)
  │
  ▼
React state update + Supabase client call
  │
  ▼
HTTPS POST to PostgREST with JWT header
  │
  ▼
PostgREST converts to SQL INSERT
  │
  ▼
PostgreSQL executes INSERT
  │
  ▼
RLS policy evaluates: business_id = auth_business_id()
  │
  ├── Match: row inserted, response returned
  └── No match: row rejected, error returned
```

All reads follow the same pattern — RLS silently filters rows so the application only sees data belonging to the authenticated user's business.

---

## 3. Technology Stack

### React 19

**Purpose:** Frontend UI framework.

**Why chosen:** React's component model and state management are well-suited for a data-heavy single-page application with multiple interconnected views. Version 19 provides the latest rendering optimizations and hooks API.

**Role in Wegn-Store:** The entire user interface — all eight tabs, forms, tables, KPI cards, modals, and receipt rendering — is built as a React application. State is managed through `useState` hooks within the main `App` component.

### TypeScript 6

**Purpose:** Static type checking for JavaScript.

**Why chosen:** TypeScript catches data shape errors at compile time rather than at runtime, which is critical for a POS system where incorrect types on prices, quantities, or IDs could cause financial discrepancies.

**Role in Wegn-Store:** Every data type flowing through the application — `ProductStock`, `Sale`, `PurchaseOrder`, `POItem`, `Customer`, `LoyaltyTransaction`, and 15 others — is defined as a TypeScript type. The compiler enforces correct field access across all queries, inserts, and UI rendering.

### Vite 8

**Purpose:** Build tool and development server.

**Why chosen:** Vite provides fast hot module replacement during development and optimized production builds with tree-shaking and code splitting. It requires minimal configuration compared to Webpack-based alternatives.

**Role in Wegn-Store:** Vite serves the development environment, compiles TypeScript, bundles the production build, and manages environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Production builds are generated in under 1 second.

### Supabase

**Purpose:** Backend-as-a-service providing authentication, database API, and row-level security.

**Why chosen:** Supabase eliminates the need for a custom backend server. It provides a managed PostgreSQL database with automatic REST API generation, built-in authentication, and database-level security policies — all accessible through a JavaScript client library. This allows the entire application to be deployed as a static frontend with no server infrastructure to manage.

**Role in Wegn-Store:** Supabase serves three functions:
- **Auth Service** — User registration, email/password login, JWT session management.
- **PostgREST API** — Every database operation (select, insert, update, delete) is performed through the `@supabase/supabase-js` client, which sends authenticated REST calls to auto-generated API endpoints.
- **RLS Engine** — Row Level Security policies enforce tenant isolation at the database layer, ensuring each business owner can only access their own data.

### PostgreSQL

**Purpose:** Relational database.

**Why chosen:** PostgreSQL is the database engine underlying Supabase. It provides ACID transactions, foreign key constraints, check constraints, and row-level security — all essential for a financial application handling sales, inventory, and payment records.

**Role in Wegn-Store:** PostgreSQL stores all application data across 19 tables. It enforces referential integrity through foreign keys (e.g., `sale_items.sale_id` references `sales.id`), validates data through check constraints (e.g., `purchase_orders_status_check`), and executes the `auth_business_id()` security function on every query.

### Git

**Purpose:** Version control.

**Why chosen:** Git is the industry standard for source code version control. It provides a complete history of every change, the ability to tag releases, and safe branching for feature development.

**Role in Wegn-Store:** All source code changes are tracked in a Git repository. The development history includes 50+ commits from initial foundation through v1.0.0 release. The `v1.0.0` tag marks the first complete release. SQL migrations are stored in `supabase/migrations/` for reproducibility.

### GitHub

**Purpose:** Remote repository hosting and collaboration.

**Why chosen:** GitHub provides cloud-hosted Git repositories with access control, and integrates with deployment platforms and CI/CD pipelines.

**Role in Wegn-Store:** The repository is hosted at `github.com/fitpaperwork25-del/wegn-store-app`. All commits are pushed to the `main` branch. The repository serves as the single source of truth for application code, migration files, and documentation.

### Vercel

**Purpose:** Frontend deployment and hosting.

**Why chosen:** Vercel provides zero-configuration deployment for Vite-based React applications. It automatically builds from the GitHub repository, serves the static frontend via a global CDN, provisions HTTPS, and provides preview deployments for each push.

**Role in Wegn-Store:** Vercel hosts the production frontend. When code is pushed to the `main` branch on GitHub, Vercel automatically builds and deploys the updated application. The frontend is served as static files — no server runtime is required since all backend functionality is provided by Supabase.

---

## 4. Database Architecture

### Overview

The Wegn-Store database is a PostgreSQL instance managed by Supabase containing 19 tables. The schema is organized around a central `businesses` table that establishes ownership, with every data table linked back to a business through a `business_id` foreign key.

### Multi-Tenant Design

The database follows a shared-schema multi-tenant architecture. All businesses store data in the same tables, isolated by `business_id`. This design was chosen for simplicity and cost efficiency — a single database serves all tenants with no per-tenant schema management overhead.

The ownership chain is:

```
auth.users (Supabase Auth)
    │
    └── businesses.owner_id = auth.uid()
            │
            └── every other table.business_id = businesses.id
```

A user authenticates, their `uid` resolves to a `business_id` via the `auth_business_id()` function, and all subsequent queries are filtered to that business. There is no application-level filtering — isolation is enforced entirely at the database layer through RLS.

### Core Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `businesses` | Business profile and tax configuration | `id`, `owner_id`, `name`, `tax_rate` |
| `products` | Product catalog | `id`, `business_id`, `category_id`, `supplier_id`, `name`, `sku`, `barcode`, `cost_price`, `selling_price`, `average_cost`, `reorder_level`, `status` |
| `categories` | Product categorization | `id`, `business_id`, `name`, `description`, `status` |
| `inventory` | Current stock levels per product | `id`, `business_id`, `product_id`, `quantity_on_hand` |
| `inventory_transactions` | Stock movement audit log | `id`, `business_id`, `product_id`, `transaction_type`, `quantity_change`, `quantity_before`, `quantity_after`, `reason` |
| `suppliers` | Supplier contact and status | `id`, `business_id`, `name`, `contact_name`, `phone`, `email`, `status` |
| `purchase_orders` | Purchase order headers | `id`, `business_id`, `supplier_id`, `po_number`, `status`, `subtotal`, `notes` |
| `purchase_order_items` | Purchase order line items | `id`, `business_id`, `purchase_order_id`, `product_id`, `quantity`, `quantity_received`, `unit_cost`, `line_total` |
| `sales` | Sale transaction headers | `id`, `business_id`, `customer_id`, `cashier_id`, `subtotal`, `tax`, `discount_amount`, `total`, `status` |
| `sale_items` | Sale line items | `id`, `business_id`, `sale_id`, `product_id`, `quantity`, `unit_price`, `line_total` |
| `payments` | Payment records per sale | `id`, `business_id`, `sale_id`, `payment_method`, `amount` |
| `customers` | Customer profiles | `id`, `business_id`, `name`, `phone`, `email`, `status` |
| `loyalty_transactions` | Points earned and redeemed | `id`, `business_id`, `customer_id`, `sale_id`, `points`, `type` |
| `return_items` | Returned items per sale | `id`, `business_id`, `sale_id`, `product_id`, `quantity_returned`, `reason` |
| `employees` | Staff profiles and roles | `id`, `business_id`, `name`, `role`, `status` |
| `drawer_sessions` | Cash drawer open/close records | `id`, `business_id`, `cashier_id`, `opening_float`, `closing_count`, `expected_cash`, `over_short`, `status` |
| `drawer_paid_outs` | Cash removed from drawer during session | `id`, `business_id`, `drawer_session_id`, `amount`, `reason` |
| `stock_counts` | Physical inventory count headers | `id`, `business_id`, `status`, `notes` |
| `stock_count_items` | Per-product count with variance | `id`, `business_id`, `stock_count_id`, `product_id`, `system_qty`, `counted_qty`, `variance` |

### Entity Relationship Diagram

```
                            ┌──────────────┐
                            │  businesses  │
                            │──────────────│
                     ┌──────│ id (PK)      │──────┐
                     │      │ owner_id(FK) │      │
                     │      │ name         │      │
                     │      │ tax_rate     │      │
                     │      └──────────────┘      │
                     │       business_id FK        │
          ┌──────────┼──────────┬─────────────┬────┼──────────┐
          │          │          │             │    │          │
          ▼          ▼          ▼             ▼    ▼          ▼
   ┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐ ┌──────────┐
   │ products │ │suppliers│ │employees │ │sales │ │customers│ │categories│
   │──────────│ │────────│ │──────────│ │──────│ │─────────│ │──────────│
   │ id       │ │ id     │ │ id       │ │ id   │ │ id      │ │ id       │
   │ name     │ │ name   │ │ name     │ │total │ │ name    │ │ name     │
   │ sku      │ │ phone  │ │ role     │ │status│ │ phone   │ └──────────┘
   │ barcode  │ │ email  │ └──────────┘ │tax   │ │ email   │
   │ avg_cost │ └───┬────┘       ▲      └──┬───┘ └────┬────┘
   └─────┬────┘     │            │         │          │
         │          │       cashier_id     │     customer_id
         │     supplier_id                 │          │
         │          │                      │          │
         ▼          ▼                      ▼          ▼
   ┌───────────┐ ┌────────────────┐  ┌──────────┐ ┌───────────────────┐
   │ inventory │ │purchase_orders │  │sale_items │ │loyalty_transactions│
   │───────────│ │────────────────│  │──────────│ │───────────────────│
   │ qty_on_   │ │ po_number      │  │ quantity │ │ points            │
   │ hand      │ │ status         │  │ unit_    │ │ type              │
   └───────────┘ │ subtotal       │  │ price    │ └───────────────────┘
         │       └───────┬────────┘  └──────────┘
         │               │                │
         ▼               ▼                ▼
   ┌───────────────┐ ┌──────────────────┐ ┌──────────┐
   │  inventory_   │ │purchase_order_   │ │ payments │
   │  transactions │ │items             │ │──────────│
   │───────────────│ │──────────────────│ │ method   │
   │ type          │ │ quantity         │ │ amount   │
   │ qty_change    │ │ qty_received     │ └──────────┘
   │ qty_before    │ │ unit_cost        │
   │ qty_after     │ └──────────────────┘
   └───────────────┘

   Additional tables linked to sales:
   ┌──────────────┐  ┌─────────────────┐  ┌──────────────────┐
   │ return_items │  │ drawer_sessions │  │ drawer_paid_outs │
   │──────────────│  │─────────────────│  │──────────────────│
   │ sale_id (FK) │  │ opening_float   │  │ session_id (FK)  │
   │ product_id   │  │ closing_count   │  │ amount           │
   │ qty_returned │  │ expected_cash   │  │ reason           │
   └──────────────┘  │ over_short      │  └──────────────────┘
                     └─────────────────┘

   ┌──────────────┐  ┌──────────────────┐
   │ stock_counts │  │stock_count_items │
   │──────────────│  │──────────────────│
   │ status       │──│ stock_count_id   │
   │ notes        │  │ system_qty       │
   └──────────────┘  │ counted_qty      │
                     │ variance         │
                     └──────────────────┘
```

### Table Relationships

The schema uses foreign keys to enforce referential integrity across all relationships:

- **Products** reference `categories` (optional) and `suppliers` (optional).
- **Inventory** has a one-to-one relationship with `products` via `product_id`.
- **Purchase orders** reference `suppliers`. Purchase order items reference both the parent PO and a `product`.
- **Sales** optionally reference a `customer` and a `cashier` (employee). Sale items reference the parent sale and a `product`.
- **Payments** reference the parent `sale`.
- **Return items** reference the parent `sale` and a `product`.
- **Loyalty transactions** reference a `customer` and optionally a `sale`.
- **Drawer paid outs** reference the parent `drawer_session`.
- **Stock count items** reference the parent `stock_count` and a `product`.

### Data Integrity

Data integrity is maintained through four mechanisms:

1. **Foreign keys** — Every relationship between tables is enforced by a foreign key constraint. Inserting a `sale_item` with a non-existent `sale_id` is rejected at the database level.

2. **Check constraints** — Business rules are enforced in the schema. For example, `purchase_orders_status_check` restricts the `status` column to the values `draft`, `ordered`, `partially_received`, `received`, and `cancelled`.

3. **NOT NULL constraints** — Required fields such as `products.name`, `sales.total`, and `businesses.owner_id` cannot be null.

4. **Application-level validation** — The frontend validates inputs before submission (e.g., positive quantities, non-empty product names, sufficient loyalty balance for redemption) and handles errors from the database gracefully with user-facing messages.

---

## 5. Authentication

### Supabase Auth

Wegn-Store uses Supabase Authentication with the email/password provider. No external identity providers (Google, GitHub, etc.) are configured. User accounts are managed entirely within the Supabase project.

Authentication is handled by the Supabase Auth service, which is separate from the application database. User credentials are stored in the `auth.users` schema managed by Supabase — the application never stores or handles raw passwords.

### Login Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│  Browser │     │  AuthGate    │     │  Supabase Auth   │
│          │     │  Component   │     │  Service         │
└────┬─────┘     └──────┬───────┘     └────────┬─────────┘
     │                  │                      │
     │  Page load       │                      │
     │─────────────────►│                      │
     │                  │  getSession()        │
     │                  │─────────────────────►│
     │                  │                      │
     │                  │  null (no session)   │
     │                  │◄─────────────────────│
     │                  │                      │
     │  Show login form │                      │
     │◄─────────────────│                      │
     │                  │                      │
     │  Submit email    │                      │
     │  + password      │                      │
     │─────────────────►│                      │
     │                  │  signInWithPassword() │
     │                  │─────────────────────►│
     │                  │                      │
     │                  │  JWT + user object   │
     │                  │◄─────────────────────│
     │                  │                      │
     │                  │  Render <App />      │
     │  App loads       │  with userId, email  │
     │◄─────────────────│                      │
     │                  │                      │
```

On first visit or after sign-out, the `AuthGate` component checks for an existing session. If none exists, it renders the login form. On submission, it calls `supabase.auth.signInWithPassword()`. On success, Supabase returns a JWT and user object, and `AuthGate` renders the main `<App />` component with the authenticated user's ID and email.

### Sign-Up Flow

New users can sign up through the same `AuthGate` component by switching to the sign-up form. The sign-up flow calls `supabase.auth.signUp()` and, on success, automatically links the new user to an existing unowned business by setting `businesses.owner_id` to the new user's `auth.uid()`. Email confirmation is disabled in the Supabase project settings to allow immediate access after sign-up.

### Session Handling

Session persistence is managed entirely by the Supabase client library:

- **Storage** — The JWT and refresh token are stored in the browser's `localStorage` by the Supabase client. No custom session storage is implemented.
- **Auto-refresh** — The Supabase client automatically refreshes the JWT before it expires using the stored refresh token. The application does not need to handle token renewal.
- **State listener** — `AuthGate` subscribes to `supabase.auth.onAuthStateChange()` on mount. This listener fires whenever the session changes (login, logout, token refresh), keeping the React state synchronized.
- **Page refresh** — When the user refreshes the browser, `AuthGate` calls `getSession()` on mount, which retrieves the stored session from `localStorage`. If valid, the app loads immediately without requiring re-authentication.

### JWT Usage

Every request from the Supabase client to the PostgREST API includes the JWT in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

The JWT contains the user's `uid` (the `sub` claim), which PostgreSQL accesses via the `auth.uid()` function. This is the foundation of row-level security — every RLS policy evaluates `auth.uid()` to determine which data the request can access.

The application never reads, parses, or validates the JWT directly. The Supabase client handles attachment, and PostgreSQL handles validation.

### Sign-Out

Sign-out is triggered by a button in the application header. It calls `supabase.auth.signOut()`, which clears the session from `localStorage` and invalidates the refresh token. The `onAuthStateChange` listener fires, setting the user state to `null`, which causes `AuthGate` to render the login form.

---

## 6. Security & RLS

### Row Level Security Overview

Row Level Security (RLS) is a PostgreSQL feature that applies access control rules at the database level. Every query — SELECT, INSERT, UPDATE, DELETE — is evaluated against a policy before it executes. If the policy's condition is not met, the row is silently excluded from reads or the operation is rejected for writes.

RLS is the primary security mechanism in Wegn-Store. It operates below the API layer, meaning that even if the PostgREST API or frontend code were compromised, the database would still enforce data isolation.

### The auth_business_id() Function

The core of the security model is a single helper function:

```sql
CREATE OR REPLACE FUNCTION auth_business_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM businesses WHERE owner_id = auth.uid() LIMIT 1;
$$;
```

This function resolves the authenticated user's JWT `uid` to their `business_id`. It is declared `SECURITY DEFINER`, meaning it executes with the privileges of the function owner (the database admin), bypassing RLS on the `businesses` table to perform the lookup. The `STABLE` marker tells PostgreSQL the function returns the same result for the same input within a transaction, allowing query optimization.

If a user has no matching business (e.g., a newly created account that has not been linked to a business), the function returns `NULL`, causing all policy checks to fail and returning zero rows.

### Tenant Isolation Policies

Every data table (18 tables) has the same policy pattern:

```sql
CREATE POLICY "tenant_isolation" ON <table>
  FOR ALL TO authenticated
  USING (business_id = auth_business_id())
  WITH CHECK (business_id = auth_business_id());
```

- **`FOR ALL`** — The policy applies to SELECT, INSERT, UPDATE, and DELETE.
- **`TO authenticated`** — The policy only applies to users with a valid JWT (the `authenticated` role in Supabase).
- **`USING`** — Controls which existing rows the user can see and modify. Only rows where `business_id` matches the user's business are visible.
- **`WITH CHECK`** — Controls which new or updated rows are allowed. Only rows with the correct `business_id` can be inserted or updated.

The `businesses` table uses a different pattern since it does not have a `business_id` column — it uses `owner_id` directly:

```sql
CREATE POLICY "owner_select" ON businesses
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owner_update" ON businesses
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
```

### Anon Lockout

All table privileges have been revoked from the `anon` role:

```sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
```

This means unauthenticated requests — including any request made with the Supabase anon key but without a valid JWT — receive zero rows on reads and permission errors on writes. The anon key, while present in the frontend environment variables, grants no data access.

### Security Architecture Summary

| Layer | Mechanism | Effect |
|---|---|---|
| **Browser** | AuthGate component | Blocks UI access without login |
| **Network** | HTTPS + JWT in Authorization header | Encrypted transport, authenticated requests |
| **API** | PostgREST role resolution | Maps JWT to `authenticated` or `anon` PostgreSQL role |
| **Database** | RLS policies | Filters every query by `business_id = auth_business_id()` |
| **Database** | Anon revocation | Zero access without authentication |

Each layer reinforces the others. Even if one layer were bypassed, the next would enforce access control:

- If someone obtains the anon key: `REVOKE ALL FROM anon` blocks all access.
- If someone crafts a direct API call: RLS filters by `auth.uid()` from the JWT.
- If someone bypasses the frontend: the JWT is still validated by Supabase Auth before reaching PostgreSQL.

### Example Policy Flow

A cashier completes a sale. The following sequence occurs:

```
1. Frontend calls:
   supabase.from("sales").insert({
     business_id: "365bc5a8-...",
     subtotal: 12.50,
     total: 13.50,
     status: "open"
   })

2. Supabase client sends:
   POST /rest/v1/sales
   Authorization: Bearer <jwt with uid=33184250-...>
   Body: { business_id: "365bc5a8-...", ... }

3. PostgREST converts to:
   INSERT INTO sales (business_id, subtotal, total, status)
   VALUES ('365bc5a8-...', 12.50, 13.50, 'open')

4. PostgreSQL evaluates WITH CHECK:
   business_id = auth_business_id()
   → auth_business_id() calls: SELECT id FROM businesses
     WHERE owner_id = '33184250-...'
   → Returns: '365bc5a8-...'
   → Check: '365bc5a8-...' = '365bc5a8-...' → TRUE

5. Row is inserted. Response returned to frontend.
```

If the same user attempted to insert a row with a different `business_id`, step 4 would evaluate to `FALSE` and the insert would be rejected with a policy violation error.

### Current Security Status

| Status | Item |
|---|---|
| ✓ | Authentication enabled — email/password login required for all access |
| ✓ | RLS enabled — row-level security policies active on all 19 tables |
| ✓ | Tenant isolation enabled — `business_id = auth_business_id()` enforced on every query |
| ✓ | Anon access revoked — `REVOKE ALL FROM anon` applied, unauthenticated requests blocked |
| ✓ | Migrations tracked in Git — all security SQL stored in `supabase/migrations/` |
| ✓ | v1.0.0 secured release — first production release with full security enforcement |

---

## 7. Inventory Module

### Purpose

The Inventory Module tracks the quantity and value of every product in the store. It records all stock movements — receiving from suppliers, sales to customers, returns, and manual adjustments — providing a complete audit trail of how inventory levels change over time. The module ensures that the application always reflects the current stock position and supports financial reporting through average cost tracking and inventory valuation.

### Business Workflow

```
Product Created
  │   A new product is added to the catalog with an initial
  │   stock quantity, cost price, and reorder level.
  ▼
Inventory Received
  │   Stock arrives from a supplier via a purchase order.
  │   Quantity on hand increases. Average cost is recalculated.
  ▼
Inventory Sold
  │   A sale is completed at checkout. Quantity on hand
  │   decreases by the quantity sold for each line item.
  ▼
Inventory Adjusted
  │   Stock is manually adjusted to account for damage,
  │   expiry, loss, or correction. An audit record is created.
  ▼
Inventory Counted
      A physical stock count is performed. Variances between
      system quantity and counted quantity are calculated.
      Inventory is updated to match the physical count.
```

Each step in this workflow generates one or more records in `inventory_transactions`, creating a traceable history of every stock movement.

### Core Tables

**`products`** — The product catalog. Each product stores its `cost_price` (the price paid to the supplier), `selling_price` (the retail price), `average_cost` (the weighted average cost recalculated on each receiving event), and `reorder_level` (the threshold below which the product appears in the reorder center). Products are linked to optional `categories` and `suppliers`.

**`inventory`** — Current stock levels. Each row represents a single product's `quantity_on_hand`. This table has a one-to-one relationship with `products` via `product_id`. All stock changes — sales, receiving, adjustments, and count corrections — are applied to this table.

**`inventory_transactions`** — The stock movement audit log. Every change to `quantity_on_hand` is recorded here with the `transaction_type`, `quantity_change` (positive for increases, negative for decreases), `quantity_before`, `quantity_after`, and an optional `reason`. This table provides the complete history needed for auditing and reporting.

### Inventory Transaction Types

Every stock movement is classified by a `transaction_type` stored in `inventory_transactions`:

| Type | Direction | Trigger | Description |
|---|---|---|---|
| `receiving` | + | Purchase order received | Stock arrives from a supplier. Quantity increases by the received amount. Average cost is recalculated using weighted average. |
| `sale` | − | Sale completed | Stock is deducted at checkout. Quantity decreases by the quantity sold per line item. |
| `return` | + | Return processed | A customer returns an item. Quantity increases by the returned amount. The original sale is updated. |
| `void` | + | Sale voided | An entire sale is voided. Quantity is restored for all items in the sale. |
| `damaged` | − | Manual adjustment | Product is physically damaged and removed from sellable stock. Quantity decreases. |
| `expired` | − | Manual adjustment | Product has passed its expiry date and is removed from stock. Quantity decreases. |
| `lost` | − | Manual adjustment | Product is missing (theft, miscount, or unaccounted loss). Quantity decreases. |
| `correction` | ± | Manual adjustment or stock count | A general-purpose correction. Accepts positive or negative values. Used for manual corrections and for reconciling variances after a physical stock count. |

The adjustment types `damaged`, `expired`, and `lost` always apply the quantity as a negative value (reduction), regardless of the sign entered. The `correction` type preserves the entered sign, allowing both increases and decreases.

### Inventory Valuation

Inventory valuation is calculated from two values stored per product:

**Quantity on hand** — The current stock level, stored in `inventory.quantity_on_hand`. This value is updated in real time as stock moves through the system — increased by receiving and returns, decreased by sales and reductions.

**Average cost** — The weighted average cost per unit, stored in `products.average_cost`. This value is recalculated each time stock is received from a supplier using the weighted average formula:

```
new_average_cost = (existing_qty × old_average_cost + received_qty × unit_cost)
                   ÷ (existing_qty + received_qty)
```

If the existing quantity is zero, the average cost is set to the incoming unit cost. Average cost is not recalculated on sales, returns, or manual adjustments — only on receiving events, which is the standard weighted average cost method.

**Inventory value** — The total inventory valuation is calculated as:

```
inventory_value = Σ (quantity_on_hand × average_cost)  for all products
```

This value is displayed on the Dashboard as a KPI card, giving the store owner a real-time view of the total cost value of stock held.

### Current Capabilities

| Capability | Status |
|---|---|
| Product creation with initial stock, cost price, and reorder level | Implemented |
| Bulk product import via CSV | Implemented |
| Product editing (name, price, SKU, barcode, reorder level) | Implemented |
| Product categorization | Implemented |
| Real-time stock tracking across all transaction types | Implemented |
| Weighted average cost recalculation on receiving | Implemented |
| Manual stock adjustments (damaged, expired, lost, correction) | Implemented |
| Low stock alerts based on reorder level threshold | Implemented |
| Reorder center with automatic PO generation for low stock products | Implemented |
| Stock movement history with type filtering | Implemented |
| Inventory valuation on Dashboard | Implemented |
| Physical stock count with variance calculation | Implemented |
| Barcode scanning for product lookup | Implemented |

---

## 8. Purchasing Module

### Purpose

The Purchasing Module manages the full supplier ordering lifecycle — from identifying which products need restocking, through creating and sending purchase orders, to receiving goods and updating inventory. It connects supplier management, reorder detection, and inventory replenishment into a single workflow, giving the store owner control over procurement while maintaining accurate cost and stock records.

### Business Workflow

```
Supplier Created
  │   A supplier is added with name, contact details,
  │   and email address for PO communication.
  ▼
Purchase Order Created
  │   A draft PO is created — either manually for a supplier,
  │   automatically from the reorder center, or from a
  │   supplier's full product catalog.
  ▼
Line Items Added
  │   Products, quantities, and unit costs are added to the
  │   PO. The subtotal is recalculated after each addition.
  ▼
Purchase Order Ordered
  │   The PO is marked as "ordered" — it has been sent to
  │   the supplier. The PO can be emailed or printed with
  │   manager and supplier signature fields.
  ▼
Inventory Received
  │   Goods arrive. Each line item is received individually
  │   with the actual quantity delivered. Partial receiving
  │   is supported across multiple deliveries.
  ▼
Inventory Updated
      For each received line item: quantity on hand increases,
      average cost is recalculated, and an inventory transaction
      is recorded. The PO status updates automatically.
```

### Core Tables

**`suppliers`** — Supplier directory. Each record stores the supplier's `name`, `contact_name`, `phone`, `email`, `notes`, and `status` (active/inactive). The email field is used for PO email delivery. Products can be linked to a supplier via `products.supplier_id`.

**`purchase_orders`** — Purchase order headers. Each PO has a system-generated `po_number` (format: `PO-YYYYMMDD-HHMMSS`), a `supplier_id` linking to the supplier, a `status` tracking the order lifecycle, a `subtotal` (sum of all line totals), and a `notes` field that accumulates receiving history entries.

**`purchase_order_items`** — Purchase order line items. Each row represents one product on a PO with `product_id`, `quantity` (ordered), `quantity_received` (cumulative received), `unit_cost`, and `line_total` (quantity × unit cost). The difference between `quantity` and `quantity_received` determines how much remains to be received.

### Purchase Order Lifecycle

Purchase orders progress through a defined set of statuses:

```
draft ──► ordered ──► partially_received ──► received
  │          │
  │          └──► cancelled
  └──► cancelled
  └──► (deleted)
```

| Status | Meaning | Allowed Transitions |
|---|---|---|
| `draft` | PO has been created but not yet sent to the supplier. Line items can be added, edited, or removed. | → `ordered`, → `cancelled`, → deleted |
| `ordered` | PO has been sent to the supplier. No further item edits. Receiving is now available. | → `partially_received`, → `received`, → `cancelled` |
| `partially_received` | Some but not all ordered quantities have been received. Set automatically when total received > 0 but < total ordered. | → `received` (on final delivery) |
| `received` | All ordered quantities have been fully received. Set automatically when total received ≥ total ordered across all line items. | Terminal state |
| `cancelled` | PO has been cancelled. No further receiving is possible. | Terminal state |

Status transitions between `ordered`, `partially_received`, and `received` are determined automatically by comparing total quantities ordered against total quantities received across all line items on the PO. The `draft → ordered` and `→ cancelled` transitions are triggered manually by the user.

Draft POs can be permanently deleted, which removes both the PO header and all line items. Non-draft POs can only be cancelled, preserving the record for audit purposes.

### Receiving Workflow

Receiving is the process of recording goods arrival against a purchase order. The workflow handles partial deliveries and updates multiple tables atomically:

```
User clicks "Receive" on an ordered PO
  │
  ▼
System loads all PO line items with remaining quantities
  │   remaining = quantity − quantity_received
  │   Pre-fills each line with the remaining amount
  ▼
User adjusts receive quantities (0 to remaining per line)
  │
  ▼
User confirms receiving
  │
  ▼
For each line item with receive quantity > 0:
  │
  ├── 1. Update inventory.quantity_on_hand
  │      quantity_after = quantity_before + received_qty
  │
  ├── 2. Recalculate products.average_cost
  │      new_avg = (old_qty × old_avg + recv_qty × unit_cost)
  │                ÷ (old_qty + recv_qty)
  │
  ├── 3. Create inventory_transaction
  │      type: "receiving", reason: "PO {po_number}"
  │      Records quantity_before, quantity_after, quantity_change
  │
  └── 4. Update purchase_order_items.quantity_received
         quantity_received += received_qty
  │
  ▼
System evaluates PO completion:
  │   total_received = Σ quantity_received across all items
  │   total_ordered  = Σ quantity across all items
  │
  ├── total_received ≥ total_ordered → status = "received"
  ├── total_received > 0             → status = "partially_received"
  └── else                           → status unchanged
  │
  ▼
Receiving history appended to PO notes
  Format: [Received {timestamp}] {product}: +{qty} ({received}/{ordered}); ...
```

Each receiving event is idempotent per line item — the received quantity is clamped to the remaining amount (`min(entered_qty, quantity - quantity_received)`), preventing over-receiving.

### Supplier Management

Supplier records serve as the organizational anchor for purchasing:

- **Contact information** — Each supplier stores `name`, `contact_name`, `phone`, and `email`. The email address is used by the PO email function, which opens a pre-composed `mailto:` link with the PO number in the subject line and a formatted body.
- **Status** — Suppliers can be set to `active` or `inactive`. Only active suppliers appear in supplier selection dropdowns when creating POs.
- **Product linkage** — Products can be assigned to a supplier via `products.supplier_id`. This linkage is used by the reorder center to automatically group low-stock products by supplier when generating POs, and by the catalog PO function to create a PO containing all of a supplier's active products.
- **Supplier history** — The purchase order list can be filtered by supplier, providing a complete ordering history including PO numbers, dates, statuses, and subtotals.

### Reorder Center

The reorder center identifies products that need restocking and streamlines purchase order creation:

**Low stock detection** — A product appears in the reorder center when its `quantity_on_hand` falls below its `reorder_level`. The Dashboard displays a count of low-stock items as a KPI card.

**Reorder quantity calculation** — The default reorder quantity for each product is:

```
default_reorder_qty = reorder_level − quantity_on_hand
```

This brings stock back up to the reorder level. The user can override the quantity per product before generating the PO.

**Automatic PO generation** — The reorder center supports batch PO creation:

1. The user selects one or more low-stock products.
2. Each product must have a supplier assigned — either through `products.supplier_id` or by selecting one in the reorder center interface.
3. On confirmation, the system groups selected products by supplier.
4. One draft PO is created per supplier, containing all of that supplier's selected products.
5. Line totals are calculated using the product's `average_cost` as the unit cost.
6. The PO number is auto-generated with a timestamp.

**Bulk supplier assignment** — Products without an assigned supplier can be assigned in bulk from the reorder center, updating `products.supplier_id` for all selected items at once.

**Catalog PO** — A PO can be created from a supplier's entire active product catalog. This generates a draft PO containing every active product linked to that supplier, with quantities defaulting to the reorder calculation.

### Current Capabilities

| Capability | Status |
|---|---|
| Supplier creation with contact details and email | Implemented |
| Supplier editing and status management (active/inactive) | Implemented |
| Manual PO creation (empty draft for a selected supplier) | Implemented |
| PO line item management (add products, quantities, unit costs) | Implemented |
| PO subtotal auto-recalculation on item changes | Implemented |
| PO status lifecycle (draft → ordered → partially_received → received) | Implemented |
| PO cancellation with confirmation | Implemented |
| PO deletion (draft only) with confirmation | Implemented |
| Receiving with per-item quantity entry and partial delivery support | Implemented |
| Automatic inventory update on receiving (quantity + average cost) | Implemented |
| Inventory transaction creation on receiving with PO reference | Implemented |
| Automatic PO status resolution based on received vs ordered totals | Implemented |
| Receiving history appended to PO notes with timestamps | Implemented |
| Reorder center with low-stock detection and default reorder quantities | Implemented |
| Batch PO generation from reorder center (grouped by supplier) | Implemented |
| Catalog PO creation from a supplier's full product list | Implemented |
| Bulk supplier assignment for products without a supplier | Implemented |
| PO print view with manager and supplier signature fields | Implemented |
| PO email via mailto link with pre-composed subject and body | Implemented |
| PO number auto-generation (PO-YYYYMMDD-HHMMSS format) | Implemented |

---

## 9. Sales Module

### Purpose

The Sales Module handles point-of-sale checkout — the process of building a cart, applying discounts, accepting payment, and recording the completed transaction. Each sale generates a financial record in the database and triggers inventory deductions for every item sold. The module integrates with loyalty, cash drawer, and reporting systems to provide a complete transactional workflow.

### Business Workflow

```
Product Selected
  │   Cashier searches by name or scans a barcode.
  │   Stock availability is validated before adding.
  ▼
Added to Cart
  │   Product, quantity, unit price, and line total are
  │   added to the in-memory cart. Multiple items can be
  │   added. Cart enforces stock limits per product.
  ▼
Discount Applied (optional)
  │   A percentage or fixed-amount discount is applied
  │   to the subtotal. Discount cannot exceed the subtotal.
  ▼
Loyalty Redeemed (optional)
  │   If a customer is attached, loyalty points can be
  │   redeemed as a dollar offset against the total.
  ▼
Payment Received
  │   Payment method (cash or card) is selected. For cash,
  │   the tendered amount is entered and change is calculated.
  ▼
Sale Completed
  │   Sale header, line items, and payment are written to the
  │   database. Loyalty points are earned or redeemed. The
  │   sale status transitions from "open" to "completed".
  ▼
Inventory Reduced
      For each line item, quantity on hand is decreased and
      an inventory transaction of type "sale" is recorded.
```

### Core Tables

**`sales`** — Sale transaction headers. Each sale records the `subtotal` (sum of line totals before discount and tax), `discount_amount`, `tax` (calculated from the business tax rate), `total` (final amount after discount, tax, and loyalty redemption), `status`, and optional references to `customer_id` and `cashier_id` (employee). The `created_at` timestamp is used for daily reporting and sales history.

**`sale_items`** — Sale line items. Each row represents one product sold, storing `product_id`, `quantity`, `unit_price` (the selling price at time of sale), and `line_total` (quantity × unit price). Line items are linked to the parent sale via `sale_id`.

**`payments`** — Payment records. Each sale has one payment record storing the `payment_method` (`cash` or `card`) and `amount` (the sale total). Payments are linked to the parent sale via `sale_id`.

### Sale Lifecycle

Sales progress through the following statuses:

```
open ──► completed ──► voided
                  └──► returned
```

| Status | Meaning | Transition |
|---|---|---|
| `open` | Sale has been created in the database but processing is not yet finalized. This is a transient state that exists only during the completion sequence. | → `completed` (automatic, on successful processing) |
| `completed` | Sale is finalized. Payment recorded, inventory deducted, loyalty processed. This is the normal terminal state for a successful sale. | → `voided`, → `returned` |
| `voided` | Entire sale has been cancelled. Inventory is restored for all line items. Loyalty points earned on this sale are reversed. | Terminal state |
| `returned` | All items on the sale have been individually returned. Set automatically when every line item has been fully returned through the returns workflow. | Terminal state |

A completed sale can be voided or can transition to returned through the Returns Module. A voided sale cannot be un-voided. The `returned` status is set automatically — it is not a manual action — and only applies when all items are fully returned.

### Payment Processing

The POS supports two payment methods:

**Cash** — The cashier enters the amount tendered by the customer. The system calculates change due:

```
change_due = amount_tendered − sale_total
```

The sale cannot be completed until the tendered amount is greater than or equal to the sale total. The change amount is displayed to the cashier before confirmation.

**Card** — No tendered amount is required. The sale total is recorded directly as the payment amount. Card processing is handled externally — the application records the payment method for reporting purposes.

The payment record stores the `payment_method` and `amount` (the sale total). One payment record is created per sale.

### Discount System

Discounts are applied at the sale level (not per item) before tax calculation:

**Percentage discount** — A percentage of the subtotal is deducted:

```
discount_amount = subtotal × (discount_percent / 100)
```

**Fixed amount discount** — A flat dollar amount is deducted from the subtotal:

```
discount_amount = fixed_value
```

In both cases, the discount is capped — it cannot exceed the subtotal. The discount is applied before tax:

```
discounted_subtotal = subtotal − discount_amount
tax = discounted_subtotal × (business_tax_rate / 100)
total = discounted_subtotal + tax − loyalty_redemption_value
```

Tax is calculated on the discounted subtotal, not the original subtotal. The discount amount is stored on the `sales` record for reporting.

### Inventory Impact

When a sale is completed, the system updates inventory for every line item in the cart:

1. **Stock reduction** — `inventory.quantity_on_hand` is decreased by the quantity sold for each product.

2. **Transaction record** — An `inventory_transactions` record is created for each product with:
   - `transaction_type`: `"sale"`
   - `quantity_change`: negative value (e.g., selling 3 units records −3)
   - `quantity_before` and `quantity_after`: the stock level before and after the deduction
   - `reason`: reference to the sale ID

3. **Stock validation** — Before the sale is processed, the system verifies that every item in the cart has sufficient stock. If any product has insufficient `quantity_on_hand`, the sale is blocked with an error message.

When a sale is voided, the inventory impact is reversed — quantity on hand is restored for each item, and a `"void"` transaction is recorded.

### Current Capabilities

| Capability | Status |
|---|---|
| Product search and selection for cart | Implemented |
| Barcode scanning to add products to cart | Implemented |
| Cart management (add, remove, adjust quantity) | Implemented |
| Stock validation before sale completion | Implemented |
| Percentage and fixed-amount discounts | Implemented |
| Discount validation (cannot exceed subtotal) | Implemented |
| Tax calculation on discounted subtotal | Implemented |
| Cash payment with tendered amount and change calculation | Implemented |
| Card payment recording | Implemented |
| Sale completion with atomic database writes | Implemented |
| Inventory deduction on sale completion | Implemented |
| Inventory transaction creation for each sold item | Implemented |
| Sale voiding with inventory restoration | Implemented |
| Loyalty point reversal on void | Implemented |
| Loyalty point earning on completed sales | Implemented |
| Loyalty point redemption at checkout | Implemented |
| Customer attachment to sales | Implemented |
| Cashier assignment to sales | Implemented |
| Receipt generation and print view | Implemented |
| Sales history with filtering and search | Implemented |

---

## 10. Returns Module

### Purpose

The Returns Module allows a store owner or cashier to reverse part or all of a completed sale. Returns are a necessary part of retail operations — customers may bring back defective products, wrong items, or unwanted purchases. Each return restores inventory, creates an audit trail, and adjusts loyalty points if applicable. The module is designed to handle both full returns (every item returned) and partial returns (specific items or quantities), with protections against returning more than was originally sold.

### Business Workflow

```
Original Sale (completed)
  │   A completed sale exists in the system with one or
  │   more line items, recorded inventory deductions,
  │   and optional loyalty points earned.
  ▼
Return Initiated
  │   User opens the return interface from the sale's
  │   row in Sales History. The system loads all line
  │   items and calculates the returnable quantity for
  │   each (original quantity minus any prior returns).
  ▼
Items Selected
  │   User sets the return quantity for each item (0 to
  │   available). A reason can be entered for the return.
  │   Items with zero available quantity are excluded.
  ▼
Inventory Restored
  │   For each returned item, quantity on hand is increased
  │   and an inventory transaction of type "return" is created.
  ▼
Sale Updated
  │   If all items across the sale have been fully returned
  │   (including across multiple return batches), the sale
  │   status is updated from "completed" to "returned".
  ▼
Loyalty Adjusted
      If the sale had a customer with earned loyalty points,
      those points are reversed (once per sale, deduplicated).
```

### Core Tables

The Returns Module does not operate on a single isolated table — it coordinates writes across five tables:

**`return_items`** — The primary return record. Each row stores `sale_id`, `product_id`, `quantity_returned`, and `reason`. Multiple return records can exist for the same sale (from separate partial return batches) and for the same product (if returned across multiple sessions).

**`sales`** — The return workflow reads sale data to identify the original transaction and may update `sales.status` to `"returned"` when all items have been fully returned.

**`sale_items`** — Read to determine the original quantities sold per product. The `quantity` field on each sale item establishes the upper bound on how many units can be returned.

**`inventory`** — Updated to restore stock. `quantity_on_hand` is increased by the returned quantity for each product.

**`inventory_transactions`** — An audit record is created for each returned product with `transaction_type: "return"`, recording `quantity_before`, `quantity_after`, `quantity_change` (positive), and a reason referencing the sale.

**`loyalty_transactions`** — If the original sale earned loyalty points for a customer, a negative `earn` entry is inserted to reverse those points.

### Return Types

**Full Return** — Every item on the sale is returned in full. This can happen in a single return operation (all quantities set to their maximum) or across multiple partial returns that cumulatively exhaust all items. When all items are fully returned, the sale status is automatically set to `"returned"`.

**Partial Return** — One or more items are returned, but not all. The remaining items stay on the sale. The sale status remains `"completed"` because not all items have been returned. The user can initiate additional returns later for the remaining items — each subsequent return only shows items with remaining returnable quantity.

Both types use the same workflow. The distinction is determined by whether all line items reach full return across all batches.

### Inventory Restoration

When a return is confirmed, the system restores inventory for each returned item:

```
For each returned line item:
  │
  ├── 1. Read current quantity_on_hand from inventory
  │
  ├── 2. Calculate new quantity
  │      new_qty = quantity_on_hand + return_qty
  │
  ├── 3. Update inventory
  │      inventory.quantity_on_hand = new_qty
  │
  └── 4. Create inventory_transaction
         transaction_type: "return"
         quantity_change:  +return_qty
         quantity_before:  quantity_on_hand (before update)
         quantity_after:   new_qty
         reason:           "Return for sale {sale_id}: {reason}"
```

The inventory transaction provides a complete audit trail linking the stock increase back to the specific sale and return reason.

### Loyalty Impact

If the original sale was linked to a customer and earned loyalty points, the return workflow reverses those points:

1. The system checks if a negative `earn` entry already exists for this sale (deduplication guard).
2. If no reversal has been recorded, it sums all positive `earn` entries for the sale.
3. A new `loyalty_transactions` record is inserted with `points: -totalEarned` and `type: "earn"`.

This reversal is performed once per sale, not per return batch. If a partial return triggers the first reversal, subsequent returns for the same sale do not create duplicate reversals. The full earned amount is reversed regardless of whether the return is partial or full.

### Sale Status Impact

The sale status is updated based on the cumulative return state across all batches:

```
completed ──► returned    (all items fully returned)
completed ──► completed   (partial return — some items remain)
```

The check evaluates every original sale item:

```
For each sale_item on the sale:
  total_returned = already_returned + current_return_qty
  fully_returned = (total_returned ≥ original_quantity)

If ALL items are fully_returned → status = "returned"
Otherwise → status remains "completed"
```

This evaluation accounts for returns spread across multiple sessions. A sale that was partially returned in one session and has the remainder returned in a later session will transition to `"returned"` on the second return.

### Fraud Prevention and Validation

The return workflow includes several protections to prevent invalid or excessive returns:

**Cannot return more than sold** — When the return interface opens, the system queries `return_items` to calculate how much has already been returned per product. The available quantity for each item is:

```
available_qty = original_qty − already_returned
```

Items where `available_qty` is zero are excluded from the return form entirely.

**Per-item quantity capping** — The return quantity input for each line is bounded between 0 and `available_qty`. Users cannot enter a quantity exceeding what remains returnable.

**Prior return accumulation** — The system aggregates all prior `return_items` records for the sale, not just the most recent batch. This prevents circumventing limits by performing multiple small returns.

**Inventory consistency** — Each return creates an `inventory_transactions` record with `quantity_before` and `quantity_after` values, providing an auditable chain of stock changes. The transaction references the sale ID, linking the inventory increase to the specific return event.

**Status gating** — Returns can only be initiated on sales with status `"completed"` or `"returned"` (for additional partial returns on a previously partially returned sale). Voided sales cannot be returned.

### Current Capabilities

| Capability | Status |
|---|---|
| Per-item partial return with selectable quantities | Implemented |
| Full return (all items returned in one operation) | Implemented |
| Multi-batch returns (return some items now, more later) | Implemented |
| Return reason capture (optional free text) | Implemented |
| Inventory restoration on return (quantity on hand increased) | Implemented |
| Inventory transaction creation with type "return" | Implemented |
| Automatic sale status update to "returned" when fully returned | Implemented |
| Loyalty point reversal on return (deduplicated per sale) | Implemented |
| Prior return tracking (cannot exceed original sold quantity) | Implemented |
| Available quantity calculation excluding prior returns | Implemented |
| Return data included in end-of-day reporting | Implemented |
| Return data included in profit reporting | Implemented |
| Return history visible in customer profile | Implemented |

---

## 11. Stock Count Module

### Purpose

Physical inventory counting is essential for maintaining accurate stock records. Over time, system quantities drift from actual shelf quantities due to theft, damage, miscounting during receiving, scanning errors at checkout, or unrecorded spoilage. The Stock Count Module provides a structured workflow for comparing the system's recorded quantities against a physical count of every product, calculating variances, and automatically correcting inventory to match reality. Each count creates a permanent record for audit purposes.

### Business Workflow

```
Stock Count Created
  │   User initiates a new count. The system loads all
  │   products with their current system quantities.
  │   Counted quantities default to system quantities.
  ▼
Products Counted
  │   User physically counts each product on the shelf
  │   and enters the actual quantity found. Products are
  │   listed with name, SKU, and barcode for identification.
  ▼
Actual Quantities Entered
  │   For each product, the counted quantity is entered.
  │   Variance is calculated and displayed in real time.
  │   Products with variances are highlighted.
  ▼
Variance Calculated
  │   variance = counted_qty − system_qty
  │   Positive = surplus, Negative = shortage, Zero = match.
  │   Total variance count is shown before confirmation.
  ▼
Adjustments Applied
  │   On confirmation, inventory is updated for every
  │   product with a non-zero variance. An inventory
  │   transaction of type "correction" is recorded.
  ▼
Inventory Updated
      System quantities now match physical counts.
      The count record and all item details are saved
      for historical review.
```

### Core Tables

**`stock_counts`** — Count session headers. Each record represents one complete stock count event, storing `status` (always `"completed"` on save), `notes` (auto-generated with timestamp), and `completed_at`. Stock counts are listed in reverse chronological order for historical review.

**`stock_count_items`** — Per-product count details. Each row stores `product_id`, `system_qty` (the quantity on hand at the time of counting), `counted_qty` (the physical count entered by the user), and `variance` (counted minus system). These records are linked to the parent count via `stock_count_id` and provide the permanent audit trail of what was found versus what was expected.

**`inventory`** — Updated during count confirmation. For every product with a non-zero variance, `quantity_on_hand` is set to the counted quantity. Products with zero variance are not touched.

### Count Lifecycle

The stock count has a simplified two-state lifecycle:

```
(not started) ──► active (in-memory) ──► completed (persisted)
                                    └──► cancelled (discarded)
```

| State | Storage | Description |
|---|---|---|
| **Active** | In-memory (React state) | The count is in progress. All products are loaded into an editable table. The user enters counted quantities. Variances are calculated in real time. No data is written to the database until confirmation. |
| **Completed** | Database (`stock_counts` + `stock_count_items`) | The count has been confirmed. A `stock_counts` record is created with `status: "completed"`, and one `stock_count_items` row is inserted per product. Inventory is corrected for all variances. |
| **Cancelled** | Discarded | The user cancels the active count. All in-memory data is cleared. No database writes occur. No record of the cancelled count is preserved. |

There is no `"draft"` status persisted to the database. A count either completes fully (all products saved, all variances corrected) or is cancelled with no side effects.

### Variance Calculation

Variance is the difference between what was physically counted and what the system expected:

```
variance = counted_qty − system_qty
```

| Variance | Meaning | Example |
|---|---|---|
| **Positive** (+) | More stock found than expected. Could indicate unrecorded receiving, a prior miscount, or a return that was physically shelved but not processed. | System: 10, Counted: 12, Variance: +2 |
| **Negative** (−) | Less stock found than expected. Could indicate theft, unrecorded damage, spoilage, or a sale that deducted from the wrong product. | System: 10, Counted: 7, Variance: −3 |
| **Zero** (0) | System and physical counts match. No correction needed. | System: 10, Counted: 10, Variance: 0 |

During an active count, variances are calculated in real time as the user edits counted quantities. Products with non-zero variances are visually highlighted, and the total variance count is displayed in the interface header.

### Adjustment Processing

When the count is confirmed, the system processes adjustments for every product with a non-zero variance:

```
For each product where variance ≠ 0:
  │
  ├── 1. Update inventory
  │      inventory.quantity_on_hand = counted_qty
  │
  ├── 2. Create inventory_transaction
  │      transaction_type: "correction"
  │      quantity_change:   variance (positive or negative)
  │      quantity_before:   system_qty
  │      quantity_after:    counted_qty
  │      reason:            "Stock take count adjustment (count #{count_id})"
  │
  └── 3. Save stock_count_items record
         system_qty, counted_qty, variance — preserved for audit
```

Products with zero variance are still recorded in `stock_count_items` (preserving the fact that they were counted and matched), but no inventory update or transaction is created for them.

The `inventory_transactions` record uses `transaction_type: "correction"`, the same type used for manual inventory adjustments. The `reason` field includes the stock count ID, linking the correction back to the specific count session.

### Inventory Accuracy Strategy

The Stock Count Module supports the following counting approaches:

**Full count** — The current implementation performs a full inventory count. When a count is initiated, every product in the catalog is loaded into the count table. This provides a complete reconciliation of all stock in a single session. Full counts are best performed during low-traffic periods (before opening or after closing).

**Variance investigation** — After a count is completed, the historical record allows the store owner to investigate patterns. The past counts table shows the date, total items counted, and number of variances for each session. Expanding a count reveals per-product details including system quantity, counted quantity, and variance. Repeated negative variances on the same products may indicate theft or a systematic process issue.

**Count history** — All completed counts are preserved in the database and displayed in reverse chronological order. Each count can be expanded to view the full item-by-item breakdown, enabling comparison across counting sessions to track whether accuracy is improving over time.

### Current Capabilities

| Capability | Status |
|---|---|
| Full inventory count across all products | Implemented |
| System quantity pre-loaded for each product | Implemented |
| Counted quantity defaults to system quantity (edit to change) | Implemented |
| Real-time variance calculation during counting | Implemented |
| Visual highlighting of products with non-zero variance | Implemented |
| Live variance count displayed in count header | Implemented |
| Product identification by name, SKU, and barcode | Implemented |
| Automatic inventory correction on count confirmation | Implemented |
| Inventory transaction creation (type "correction") with count reference | Implemented |
| Count cancellation with no side effects | Implemented |
| Past stock counts listed with date, notes, and variance summary | Implemented |
| Expandable count history with per-product detail view | Implemented |
| Counted quantity minimum clamped to zero | Implemented |

---

## 12. Cash Drawer Module

### Purpose

The Cash Drawer Module provides session-based tracking of physical cash in the register. In a retail environment, cash must be accounted for from the moment the drawer is opened with a starting float through every cash transaction and withdrawal until the drawer is closed and the physical count is reconciled. Without this tracking, the store owner has no way to detect cashier errors, theft, or miscounted change. The module calculates the expected cash in the drawer at any point during the session and compares it to the actual counted amount at close, producing an over/short figure for accountability.

### Business Workflow

```
Drawer Opened
  │   Cashier or manager opens a new drawer session
  │   with a recorded opening float (starting cash).
  ▼
Opening Cash Recorded
  │   The opening float is stored on the session record.
  │   This is the baseline for all subsequent calculations.
  ▼
Sales Processed
  │   Cash sales completed during the session increase
  │   the expected cash in the drawer. Card sales do not
  │   affect the cash calculation. Only completed sales
  │   (not voided or returned) are counted.
  ▼
Paid Outs Recorded
  │   Cash removed from the drawer during the session
  │   (safe drops, petty cash, etc.) is recorded with
  │   an amount and reason. Each paid out reduces the
  │   expected cash total.
  ▼
Drawer Closed
  │   The cashier counts the physical cash in the drawer
  │   and enters the counted amount.
  ▼
Expected vs Actual Cash Calculated
      The system compares the expected cash (opening float
      + cash sales − paid outs) against the actual counted
      cash. The difference is recorded as over or short.
```

### Core Tables

**`drawer_sessions`** — Session records. Each session stores `opening_float` (starting cash), `opened_at` (timestamp), `cashier_id` (optional employee reference), `status` (`"open"` or `"closed"`), and on close: `closed_at`, `closing_count` (actual cash counted), `expected_cash` (calculated), and `over_short` (difference). Only one session can be open at a time.

**`drawer_paid_outs`** — Cash withdrawals during a session. Each record stores `drawer_session_id`, `amount`, `reason` (optional free text), and `created_at`. Multiple paid outs can be recorded per session. They are displayed in reverse chronological order within the session.

**`sales`** — Read during cash calculation. The drawer module filters sales to those with `status: "completed"` and `created_at` on or after the session's `opened_at` timestamp. Voided and returned sales are excluded from the cash total.

**`payments`** — Read to isolate cash payments. Only payments with `payment_method: "cash"` on qualifying sales are summed to calculate cash sales for the session.

### Drawer Lifecycle

The drawer session has two states:

```
(no session) ──► open ──► closed
```

| Status | Meaning | Allowed Actions |
|---|---|---|
| **No session** | No drawer is currently open. The Dashboard shows "CLOSED" and the drawer interface displays the open form. | → Open drawer (with opening float) |
| `open` | A drawer session is active. Cash sales and paid outs are tracked in real time. Summary cards show opening float, cash sales, paid outs, and expected cash. | Record paid outs, close drawer |
| `closed` | The session is finalized with a closing count, expected cash, and over/short. The record is preserved for audit. | Terminal state (start a new session) |

Only one drawer session can be open at a time. The system queries for `status: "open"` on load and throughout the session. A new session can only be opened when no open session exists.

### Opening Cash

The opening float is the physical cash placed in the drawer at the start of a shift or business day. It provides change for the first cash transactions.

**Recording process:**

1. The cashier or manager enters the opening float amount (e.g., $200.00).
2. If an active cashier is selected, the session is linked to that employee via `cashier_id`.
3. The system creates a `drawer_sessions` record with `status: "open"`, `opening_float`, and `opened_at` set to the current timestamp.
4. The opening float becomes the starting value in the expected cash calculation.

The opening float cannot be negative. It is stored as a decimal value and displayed on the session summary throughout the session.

### Paid Outs

Paid outs represent cash physically removed from the drawer during an open session. They cover any withdrawal that is not a customer transaction:

- **Safe drops** — Moving excess cash from the drawer to a safe to reduce theft risk.
- **Petty cash expenses** — Small purchases paid from the register (supplies, delivery fees).
- **Refunds** — Cash refunds given outside the normal returns workflow.
- **Miscellaneous withdrawals** — Any other cash removal that needs to be accounted for.

Each paid out is recorded with:
- **Amount** — The dollar value removed (must be greater than zero).
- **Reason** — Optional free text describing the withdrawal.

Paid outs are listed in a table within the active session showing time, amount, and reason. They directly reduce the expected cash:

```
expected_cash = opening_float + cash_sales − Σ paid_outs
```

### Closing Process

Closing the drawer finalizes the session and produces the reconciliation figures.

**Expected cash formula:**

```
expected_cash = opening_float + cash_sales − total_paid_outs
```

Where:
- `opening_float` = the starting cash entered when the drawer was opened
- `cash_sales` = sum of `payments.amount` where `payment_method = "cash"` for completed sales created during the session
- `total_paid_outs` = sum of all `drawer_paid_outs.amount` for this session

**Closing steps:**

1. The cashier physically counts all cash in the drawer.
2. The counted amount is entered into the closing form.
3. The system calculates the over/short figure:

```
over_short = closing_count − expected_cash
```

4. Before confirmation, the over/short is displayed in real time:
   - **Over** (positive): more cash in the drawer than expected — shown in green.
   - **Short** (negative): less cash than expected — shown in red.

5. On confirmation, the session is updated:
   - `status` → `"closed"`
   - `closed_at` → current timestamp
   - `closing_count` → the entered amount
   - `expected_cash` → the calculated value
   - `over_short` → the difference

6. The session is cleared from the active state and a summary message is displayed.

### Audit and Controls

The cash drawer module provides several accountability controls:

**Cash accountability** — Every dollar in the drawer is tracked from opening to close. The expected cash formula accounts for all inflows (opening float + cash sales) and outflows (paid outs), producing a verifiable target for the physical count.

**Shift reconciliation** — The over/short figure quantifies the accuracy of cash handling for the session. Consistent over/short of zero indicates clean cash handling. The closing message displays expected, counted, and over/short values for immediate review.

**Discrepancy investigation** — When an over/short discrepancy occurs, the session record provides the data needed to investigate:
- `opening_float` — Was the starting cash correct?
- `cash_sales` (derived from payments) — Were all cash sales recorded?
- `paid_outs` — Were all withdrawals documented?
- `closing_count` — Was the physical count accurate?

The session also records `cashier_id`, linking the session to the responsible employee. Combined with the end-of-day report (which includes drawer data), the store owner can review cash handling across shifts.

**Real-time visibility** — While the drawer is open, four summary cards display the current opening float, cash sales, paid outs, and expected cash. These update after every sale and paid out, giving the cashier a live view of how much cash should be in the drawer at any moment.

### Current Capabilities

| Capability | Status |
|---|---|
| Drawer session open with opening float | Implemented |
| Cashier assignment to drawer session | Implemented |
| Single open session enforcement | Implemented |
| Real-time cash sales tracking (completed sales only) | Implemented |
| Paid out recording with amount and reason | Implemented |
| Paid out log displayed during active session | Implemented |
| Expected cash calculation (opening + cash sales − paid outs) | Implemented |
| Live session summary cards (float, sales, paid outs, expected) | Implemented |
| Drawer close with physical cash count entry | Implemented |
| Over/short calculation and display before confirmation | Implemented |
| Over/short recorded on session close | Implemented |
| Drawer status displayed on Dashboard (open/closed with time) | Implemented |
| Drawer data included in end-of-day report | Implemented |

---

## 13. Loyalty Module

### Purpose

The Loyalty Module incentivizes repeat business by awarding points on purchases that customers can later redeem for discounts. Customer retention is significantly cheaper than customer acquisition — a points-based loyalty program gives customers a tangible reason to return. The module tracks point earning, accumulation, and redemption per customer, integrates directly into the POS checkout flow, and provides visibility into each customer's loyalty history through their profile.

### Business Workflow

```
Customer Added
  │   A customer profile is created with name, phone,
  │   and optional email. The phone number serves as
  │   the lookup key at checkout.
  ▼
Sale Completed
  │   At checkout, the cashier looks up a customer by
  │   phone number. The customer is attached to the sale.
  ▼
Points Earned
  │   On sale completion, the customer earns points
  │   based on the discounted subtotal. Points are
  │   recorded as a loyalty transaction.
  ▼
Points Accumulated
  │   The customer's balance grows across purchases.
  │   Balance is calculated as the sum of all loyalty
  │   transactions (positive and negative).
  ▼
Points Redeemed
  │   On a future purchase, the customer redeems points
  │   at checkout. The redemption is validated against
  │   the current balance.
  ▼
Discount Applied
      Redeemed points are converted to a dollar value
      and subtracted from the sale total. The redemption
      is recorded as a negative loyalty transaction.
```

### Core Tables

**`customers`** — Customer profiles. Each record stores `name`, `phone` (used as the lookup key at POS), `email` (optional), and `status` (active/inactive). A customer must exist and be active to earn or redeem loyalty points. The `id` is referenced by both `sales.customer_id` and `loyalty_transactions.customer_id`.

**`loyalty_transactions`** — The ledger of all point movements. Each record stores `customer_id`, `sale_id` (the sale that triggered the transaction), `points` (positive for earning, negative for redemption and reversal), `type` (`"earn"` or `"redeem"`), and `created_at`. The customer's current balance is not stored as a column — it is derived by summing all `points` values for the customer across all transactions.

**`sales`** — Sales are linked to customers via `customer_id`. This link determines which sale triggers loyalty earning and which sale a redemption applies to. Loyalty transactions reference the sale via `sale_id`.

### Loyalty Transaction Types

| Type | Points Sign | Trigger | Description |
|---|---|---|---|
| **Earn** | Positive (+) | Sale completed with a customer attached, no redemption on same sale | Points are awarded based on the discounted subtotal. One earn transaction per qualifying sale. |
| **Redeem** | Negative (−) | Customer redeems points at checkout | Points are deducted from the customer's balance and converted to a dollar discount on the sale total. |
| **Reversal** | Negative (−) | Sale voided or all items returned | A negative `earn` entry is inserted to reverse previously earned points. Uses `type: "earn"` with a negative `points` value to cancel the original earning. |

The customer's current balance at any point is:

```
balance = Σ points  (for all loyalty_transactions where customer_id = customer)
```

This includes positive earns, negative redemptions, and negative reversals. The balance can reach zero but the system does not enforce a floor — a reversal after redemption can produce a negative balance.

### Point Earning Rules

Points are earned when all of the following conditions are met:

1. **Customer attached** — A customer must be looked up by phone number and attached to the sale at checkout. Anonymous sales do not earn points.
2. **No redemption on the same sale** — If the customer redeems points on a sale, no new points are earned on that same sale. This prevents circular earning (redeem → earn → redeem).
3. **Sale completed** — Points are only recorded after the sale is successfully written to the database.

**Earning formula:**

```
earned_points = floor(discounted_subtotal)
```

Points are earned at a rate of 1 point per $1 of the discounted subtotal (subtotal minus discount, before tax). The value is floored to the nearest integer — a $12.75 discounted subtotal earns 12 points.

On customer lookup at POS, the current balance is displayed in a confirmation message (e.g., "Customer: Jane — 245 pts"), giving the cashier visibility before the sale.

### Point Redemption Rules

Points can be redeemed during checkout when a customer is attached to the sale:

**Redemption process:**

1. The cashier looks up the customer by phone number.
2. The customer's current point balance is displayed.
3. The cashier enters the number of points to redeem.
4. The system validates the redemption amount against the balance.
5. Redeemed points are converted to a dollar value and subtracted from the sale total.

**Conversion rate:**

```
dollar_value = redeemed_points / 100
```

100 points = $1.00 discount. For example, redeeming 250 points applies a $2.50 discount.

**Validation rules:**

- The redemption amount must be a positive integer (floored from input).
- The redemption cannot exceed the customer's current balance. If it does, the sale is blocked with an error message showing the actual balance.
- The redemption is applied after discounts and tax in the total calculation:

```
total = discounted_subtotal + tax − redemption_dollar_value
```

- The total is clamped to a minimum of zero.

**Recording:** A `loyalty_transactions` record is created with `type: "redeem"`, `points: -redeemed_amount`, and the `sale_id` of the current sale.

### Return and Void Impact

When a sale that earned loyalty points is voided or has items returned, the earned points are reversed:

**Reversal mechanism:**

1. The system checks if a reversal has already been recorded for this sale (deduplication guard).
2. It queries for `loyalty_transactions` where `sale_id` matches, `type = "earn"`, and `points < 0`. If any exist, the reversal is skipped.
3. If no prior reversal exists, it sums all positive `earn` entries for the sale to determine the total earned.
4. A new `loyalty_transactions` record is inserted with `type: "earn"`, `points: -totalEarned`, and the same `sale_id`.

**Key behaviors:**

- Reversal is performed once per sale, not per return batch or void event.
- The full earned amount is reversed regardless of whether the return is partial or full.
- The deduplication check prevents double-reversing if a sale is partially returned and then later fully returned or voided.
- Reversals use `type: "earn"` (not a separate type), with the negative sign distinguishing them from original earnings.

### Customer Profile Integration

The customer profile provides a complete view of each customer's loyalty relationship:

**Point balance** — Displayed as a KPI card in the expanded customer profile. Calculated as the sum of all `loyalty_transactions.points` for the customer.

**Lifetime earned** — Total positive `earn` transactions across all sales. Displayed separately from the current balance to show total engagement.

**Lifetime redeemed** — Total `redeem` transactions (absolute value). Shows how much value the customer has extracted from the program.

**Per-sale loyalty detail** — Each sale in the customer's purchase history shows points earned and points redeemed on that specific transaction. This is visible in the expanded customer row alongside sale status, payment method, and items.

**Balance at POS** — When a customer is looked up at checkout, their current point balance is shown inline next to their name, and a detailed balance is available in the redemption section.

### Current Capabilities

| Capability | Status |
|---|---|
| Customer creation with name, phone, and optional email | Implemented |
| Customer lookup by phone number at POS | Implemented |
| Customer attachment to sales | Implemented |
| Point earning on completed sales (1 point per $1 discounted subtotal) | Implemented |
| No earning when points are redeemed on the same sale | Implemented |
| Point redemption at checkout (100 points = $1.00) | Implemented |
| Balance validation before redemption | Implemented |
| Redemption applied as dollar discount on sale total | Implemented |
| Point reversal on sale void (deduplicated) | Implemented |
| Point reversal on return (deduplicated) | Implemented |
| Customer point balance displayed at POS on lookup | Implemented |
| Customer profile with balance, lifetime earned, lifetime redeemed | Implemented |
| Per-sale loyalty detail in customer purchase history | Implemented |
| Loyalty earned and redeemed included in end-of-day report | Implemented |
| Loyalty points shown on receipt | Implemented |

---

## 14. Reporting Module

### Purpose

The Reporting Module aggregates transactional data from across the application into actionable metrics and summaries. It enables the store owner to answer operational questions — how much revenue was generated today, which products sell the most, where margins are thin, how cash was handled — without manually reviewing individual records. Reports are generated in real time from live data and support multiple time ranges for trend analysis.

### Business Workflow

```
Transactions Recorded
  │   Sales, payments, inventory movements, returns,
  │   loyalty transactions, and drawer sessions are
  │   recorded throughout daily operations.
  ▼
Data Aggregated
  │   The reporting module queries across multiple tables,
  │   filters by time range, and groups data by relevant
  │   dimensions (date, product, payment method, customer).
  ▼
Metrics Calculated
  │   KPIs are derived: revenue, transaction count, average
  │   sale, items sold, discounts, tax, COGS, gross profit,
  │   margins, cash balances, loyalty activity.
  ▼
Reports Generated
  │   Results are displayed as KPI cards, summary tables,
  │   and ranked product lists. The end-of-day report
  │   consolidates all daily activity into a single view.
  ▼
Management Decisions
      The store owner uses reports to identify top sellers,
      investigate margin issues, reconcile cash, evaluate
      reorder needs, and assess overall business health.
```

### Reporting Categories

#### Inventory Reports

**Inventory valuation** — Displayed on the Dashboard and the Inventory tab. Calculated as `Σ (quantity_on_hand × average_cost)` across all products. Provides the total cost value of stock currently held.

**Low stock alerts** — Products where `quantity_on_hand < reorder_level` are counted and displayed as a KPI on the Dashboard. The Reorder Center provides the full list with per-product quantities and default reorder amounts.

**Inventory movement history** — The Stock Movement Log on the Inventory tab lists all `inventory_transactions` with filterable transaction types (all, sale, receiving, damaged, adjustment). Each entry shows the product, type, quantity change, before/after quantities, and timestamp.

#### Purchasing Reports

**Open purchase orders** — The Dashboard displays a count of POs with status `draft`, `ordered`, or `partially_received`. The Purchasing tab lists all POs with status, supplier, date, and subtotal.

**Supplier activity** — Each supplier's expanded view shows a purchase order breakdown: counts by status (draft, ordered, partially received, received, cancelled) and total value across all POs.

**Receiving history** — Each PO's notes field accumulates timestamped receiving entries (e.g., `[Received 6/15/2026, 2:30 PM] Product A: +10 (10/10)`), providing a detailed receiving log per order.

#### Sales Reports

**Sales analytics** — The primary sales report on the Reports tab. Provides KPI cards (revenue, transactions, average transaction, items sold, discounts given, tax collected), payment method breakdown (cash, card, other with percentage split), daily revenue table, and best-selling products ranked by units sold. Supports four time ranges: Today, Last 7 Days, Last 30 Days, and All Time.

**Sales history** — The Sales History section on the POS tab lists all sales with date, total, cashier, status, and payment method. Supports search filtering. Each sale can be expanded to view line items, initiate returns, or void.

**End-of-day summary** — A comprehensive daily operations report on the Reports tab showing: transactions, gross revenue, average sale, items sold, discounts, returns (units and value), payment breakdown (cash, card, other), loyalty earned and redeemed, cash drawer data (opening float, paid outs, expected cash), top products by units sold, and voided/returned sale counts.

#### Loyalty Reports

**Points earned and redeemed** — The end-of-day report shows today's loyalty points earned and redeemed. The customer profile shows lifetime earned and lifetime redeemed per customer.

**Customer activity** — The Customers tab provides a customer insights table showing visit count, total spent, average spend per visit, last purchase date, and current points balance. Expanding a customer row reveals their full purchase history with per-sale loyalty detail (points earned and redeemed on each transaction).

#### Cash Drawer Reports

**Session data** — While the drawer is open, four real-time summary cards display opening float, cash sales, paid outs, and expected cash. The end-of-day report includes drawer data for the current or most recent session.

**Over/short** — Calculated at drawer close (`closing_count − expected_cash`) and displayed in the closing confirmation message. Stored on the `drawer_sessions` record for historical review.

### Dashboard Metrics

The Dashboard provides an at-a-glance operational summary organized into three sections:

**Today's Operations:**

| Metric | Calculation |
|---|---|
| Revenue Today | Sum of `sales.total` for completed sales created today |
| Transactions | Count of completed sales created today |
| Average Sale | Revenue Today ÷ Transactions |
| Low Stock Items | Count of products where `quantity_on_hand < reorder_level` |

**Business Status:**

| Metric | Calculation |
|---|---|
| Cash Drawer | Current drawer session status (OPEN with time, or CLOSED) |
| Open Purchase Orders | Count of POs with status `draft`, `ordered`, or `partially_received` |
| Active Customers | Count of customers with `status = "active"` |
| Loyalty Points Outstanding | Sum of all `loyalty_transactions.points` (clamped to ≥ 0) |

**Recent Sales:**

A table of the five most recent completed sales showing sale ID (truncated), total, cashier name, and timestamp.

### Data Sources

Reports are derived from the following tables:

| Table | Reports Fed |
|---|---|
| `sales` | Revenue, transaction count, averages, discounts, tax, daily breakdown, end-of-day, profit |
| `sale_items` | Items sold, best-selling products, per-product revenue, COGS calculation, profit by product |
| `payments` | Payment method breakdown (cash/card/other), cash drawer calculation |
| `products` | Inventory valuation (`average_cost`), product names in all reports, low stock detection |
| `inventory` | Current stock levels (`quantity_on_hand`), low stock alerts, inventory valuation |
| `inventory_transactions` | Stock movement history, movement type filtering |
| `purchase_orders` | Open PO count, supplier PO breakdown, receiving history |
| `purchase_order_items` | Supplier activity totals, PO value calculations |
| `customers` | Customer count, customer insights, per-customer spend analysis |
| `loyalty_transactions` | Points earned, redeemed, balance, end-of-day loyalty, customer profile loyalty |
| `return_items` | Return units, return value, profit report adjustments |
| `drawer_sessions` | Drawer status, opening float, expected cash, over/short |
| `drawer_paid_outs` | Paid out totals in drawer calculation and end-of-day |
| `employees` | Cashier names displayed on sales and drawer sessions |

### Report Accuracy

Report accuracy depends on the integrity of the underlying transactional data. Each module contributes:

**Inventory transactions** — Every stock change (sale, receiving, return, adjustment, correction) creates an `inventory_transactions` record with before/after quantities. This provides an auditable chain ensuring that reported stock levels can be verified against the full movement history.

**Sales** — Each sale records `subtotal`, `discount_amount`, `tax`, and `total` as separate fields. The profit report uses sale items and `average_cost` to calculate COGS and margins per product. Voided sales are excluded from revenue calculations. Returned sales are included in gross sales but have their returned items deducted in net sales.

**Returns** — Return items are tracked per-product per-sale with `quantity_returned`. The profit report subtracts returned revenue (`quantity_returned × unit_price`) from gross sales and adjusts COGS to reflect only net sold quantities (`sold_qty − returned_qty`).

**Loyalty transactions** — Points are recorded as discrete ledger entries. The balance is always derived (never stored as a running total), ensuring accuracy even after reversals. End-of-day and customer reports filter by date and customer respectively to produce contextual summaries.

**Drawer sessions** — The expected cash formula (`opening_float + cash_sales − paid_outs`) uses the same payment data as sales reports, ensuring consistency. The over/short figure is calculated once at close and stored for historical accuracy.

### Profit Report

The Profit Report provides a financial performance view with COGS and margin analysis:

**Summary metrics:**

```
Gross Sales     = Σ sale_items.line_total  (for eligible sales)
Discounts       = Σ sales.discount_amount
Returns         = Σ (returned_qty × unit_price)
Net Sales       = Gross Sales − Discounts − Returns
COGS            = Σ ((sold_qty − returned_qty) × average_cost)
Gross Profit    = Net Sales − COGS
Gross Margin    = (Gross Profit ÷ Net Sales) × 100%
```

**Product-level analysis:**
- **Top Profit Products** — Ranked by gross profit (net revenue − COGS), top 10.
- **Lowest Margin Products** — Products with the lowest gross margin percentage, sorted ascending, top 10. Highlights products that sell but generate thin margins.

Both the summary and product tables support the same four time ranges as Sales Analytics (Today, Last 7 Days, Last 30 Days, All Time).

### Current Capabilities

| Capability | Status |
|---|---|
| Dashboard with today's revenue, transactions, average sale, low stock | Implemented |
| Dashboard business status (drawer, open POs, customers, loyalty points) | Implemented |
| Dashboard recent sales table (last 5 completed) | Implemented |
| Inventory valuation KPI (quantity × average cost) | Implemented |
| Low stock alert count on Dashboard and Inventory tab | Implemented |
| Stock movement history with type filtering | Implemented |
| Sales analytics with time range selector (today/7d/30d/all) | Implemented |
| Sales KPI cards (revenue, transactions, avg transaction, items, discounts, tax) | Implemented |
| Payment method breakdown with percentage split | Implemented |
| Daily revenue breakdown table | Implemented |
| Best-selling products ranked by units sold | Implemented |
| End-of-day summary with full daily operations overview | Implemented |
| End-of-day returns (units and value) | Implemented |
| End-of-day loyalty earned and redeemed | Implemented |
| End-of-day cash drawer data | Implemented |
| End-of-day top products by units sold | Implemented |
| End-of-day voided and returned sale counts | Implemented |
| Profit report with gross sales, discounts, returns, net sales, COGS, gross profit, gross margin | Implemented |
| Top profit products (top 10 by gross profit) | Implemented |
| Lowest margin products (top 10 by margin %) | Implemented |
| Profit report time range selector (today/7d/30d/all) | Implemented |
| Customer insights table (visits, spend, avg spend, last purchase, points) | Implemented |
| Per-customer purchase history with loyalty detail | Implemented |
| Supplier PO breakdown (counts by status, total value) | Implemented |
| Open PO count on Dashboard | Implemented |

### Future Reporting Enhancements

The following reporting capabilities are planned for future versions:

- **Scheduled reports** — Automated end-of-day report generation with email delivery or export.
- **Date range picker** — Custom start/end date selection beyond the preset time ranges.
- **Product performance trends** — Sales velocity, sell-through rate, and days-of-supply per product over time.
- **Supplier performance scoring** — Lead time tracking, fill rate (ordered vs received), and cost trend analysis per supplier.
- **Forecasting** — Demand forecasting based on historical sales velocity to inform reorder quantities and purchasing timing.
- **Tax reporting** — Period-based tax liability summaries for filing purposes.
- **Export** — CSV or PDF export for sales, inventory, and profit reports.

---

## 15. Deployment Architecture

### Development Environment

The local development environment runs entirely on the developer's machine:

```
Developer Machine
  │
  ├── Node.js runtime
  ├── npm (package manager)
  ├── Vite dev server (localhost:5173)
  │     Hot module replacement, TypeScript compilation
  │
  ├── .env file
  │     VITE_SUPABASE_URL=<project_url>
  │     VITE_SUPABASE_ANON_KEY=<anon_key>
  │
  └── Git repository
        Source code, migrations, documentation
```

**Setup:** `npm install` installs dependencies. `npm run dev` starts the Vite development server with hot module replacement. The `.env` file provides the Supabase project URL and anon key. The `.env.example` file documents required variables without values.

**Build verification:** `npm run build` runs TypeScript compilation (`tsc -b`) followed by Vite production bundling. This is the same build command Vercel executes on deployment.

### Production Environment

```
┌────────────────────────────────────────────────────┐
│                    Vercel                           │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Static Frontend (CDN)                       │   │
│  │  - React SPA built by Vite                   │   │
│  │  - HTML, JS, CSS served globally             │   │
│  │  - HTTPS provisioned automatically           │   │
│  │  - No server runtime                         │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │                           │
│  Environment Variables  │                           │
│  VITE_SUPABASE_URL      │                           │
│  VITE_SUPABASE_ANON_KEY │                           │
└─────────────────────────┼───────────────────────────┘
                          │ HTTPS
                          ▼
┌────────────────────────────────────────────────────┐
│                   Supabase                          │
│                                                     │
│  ┌────────────────┐  ┌──────────────────────────┐   │
│  │  Auth Service   │  │  PostgREST API           │   │
│  │  JWT issuance   │  │  Auto-generated REST     │   │
│  │  Session mgmt   │  │  endpoints from schema   │   │
│  └────────────────┘  └──────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  PostgreSQL Database                         │   │
│  │  19 tables, RLS policies, auth_business_id() │   │
│  │  Managed backups, connection pooling          │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

The frontend is a static site with no server-side code. All business logic runs in the browser. All data operations go through the Supabase client to the PostgREST API.

### Deployment Flow

```
Developer pushes to main branch
  │
  ▼
GitHub repository receives commit
  │
  ▼
Vercel detects push (GitHub integration)
  │
  ▼
Vercel runs build:
  tsc -b && vite build
  │
  ▼
Vercel deploys static output to CDN
  │
  ▼
Production site updated (zero-downtime)
```

Every push to `main` triggers an automatic deployment. Vercel provides preview deployments for non-main branches. The build process compiles TypeScript, bundles with Vite, and outputs static files. No server provisioning or container management is required.

### Environment Variables

| Variable | Purpose | Set In |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project API URL | `.env` (local), Vercel dashboard (production) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public API key | `.env` (local), Vercel dashboard (production) |

Both variables are prefixed with `VITE_` so Vite exposes them to the frontend bundle at build time. The anon key is safe to include in the frontend — it grants no data access because `REVOKE ALL FROM anon` has been applied to all tables. Data access requires a valid JWT from authentication.

### Database Migrations

SQL migrations are stored in `supabase/migrations/` and tracked in Git:

```
supabase/migrations/
  └── 20260620_rls_tenant_isolation.sql
```

Migrations are applied manually through the Supabase SQL Editor or CLI. The migration file contains the complete RLS setup: the `auth_business_id()` function, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for all 19 tables, tenant isolation policies, owner policies, and anon revocation.

Storing migrations in the repository ensures that security changes are version-controlled, reviewable, and reproducible.

### Production Security

| Layer | Mechanism |
|---|---|
| **Transport** | HTTPS enforced by both Vercel (frontend) and Supabase (API). No unencrypted traffic. |
| **Authentication** | Supabase Auth with email/password. JWT required for all data access. |
| **Authorization** | RLS policies enforce `business_id = auth_business_id()` on every query. |
| **Anon lockout** | `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon` — unauthenticated requests get zero data. |
| **Credentials** | Supabase URL and anon key stored in Vercel environment variables, not in source code. `.env` is gitignored. |
| **Frontend** | No secrets in the client bundle. The anon key is a public identifier, not a secret — RLS is the access control. |

### Disaster Recovery

| Concern | Coverage |
|---|---|
| **Source code** | Git repository on GitHub. Full commit history. Tagged releases (`v1.0.0`). |
| **Database schema** | Migrations stored in `supabase/migrations/` and tracked in Git. |
| **Database data** | Supabase provides automatic daily backups for the PostgreSQL instance. Point-in-time recovery available on paid plans. |
| **Frontend hosting** | Vercel maintains deployment history. Any previous deployment can be instantly promoted to production. |
| **RLS policies** | Fully defined in the migration file. Can be re-applied to a fresh database to restore the security layer. |

### Current Production Status

| Component | Status |
|---|---|
| Frontend deployed on Vercel | Active |
| Automatic deployments from GitHub `main` branch | Active |
| Supabase project provisioned | Active |
| PostgreSQL database with 19 tables | Active |
| RLS policies enforced on all tables | Active |
| HTTPS on all endpoints | Active |
| Environment variables configured | Active |
| Migration tracked in Git | Active |
| Release tagged `v1.0.0` | Complete |

---

## 16. Release History

### Development Timeline

Development began on June 15, 2026 and reached the v1.0.0 release on June 20, 2026. The repository contains 73 commits across 5 days of active development.

### Major Milestones

| Milestone | Commits | Description |
|---|---|---|
| **Foundation** | `ae74734` – `adb24a4` | Initial project setup, React + Vite + Supabase, database schema, inventory management |
| **Sales & POS** | `c28708b` – `8613c13` | Sales module, barcode scanning, void workflow, printable receipts |
| **Purchasing** | `23fc672` – `38a4d41` | Reorder center, end-of-day summary, supplier dashboard, profit reporting |
| **Customers & Loyalty** | `0d8539c` – `d507009` | Customer management, purchase history, insights dashboard, receipt reprints |
| **Operations** | `a2d8e60` – `d3258b7` | Returns, stock counting, discounts, cash drawer, loyalty, sales analytics |
| **Management Controls** | `66823a4` – `acdb2aa` | Supplier, employee, product, customer, and PO management interfaces |
| **Polish & Stability** | `3a8a21b` – `42e9e29` | UI polish, duplicate action blocking, responsive layout, validation fixes |
| **Purchasing v2** | `b4f9cdf` – `29d7e42` | Environment variables, PO printing/signatures/email, supplier catalog, batch reorder |
| **Reporting v2** | `3e60fee` – `dec3d3e` | PO receiving workflow, profit reporting, customer history, supplier performance, end-of-day report |
| **Security & Auth** | `9ba9867` – `6966dd0` | Product categories, auth gate, business isolation, RLS tenant isolation |

### v1.0.0 Release

**Tag:** `v1.0.0`

**Date:** June 20, 2026

**Scope:** First functionally complete release. All core modules implemented and deployed:
- 8 application tabs (Dashboard, POS, Inventory, Purchasing, Customers, Employees, Reports, Settings)
- 19 database tables with full RLS enforcement
- Authentication with email/password login
- Tenant isolation across all data
- Production deployment on Vercel with Supabase backend

---

## 17. Current Status

### Production Readiness

| Area | Status |
|---|---|
| All core modules implemented | Complete |
| Authentication and authorization | Enforced |
| Row-level security on all 19 tables | Enforced |
| Tenant isolation verified | Verified |
| Production deployment on Vercel | Active |
| Supabase backend operational | Active |
| Data integrity (foreign keys, check constraints) | Enforced |

### Build Status

| Check | Result |
|---|---|
| TypeScript compilation (`tsc -b`) | Passing |
| Vite production build (`vite build`) | Passing |
| ESLint (`eslint .`) | Configured |
| Vercel automatic deployment | Active |

### Security Status

| Control | Status |
|---|---|
| Supabase Auth (email/password) | Enabled |
| RLS enabled on all 19 tables | Enabled |
| `auth_business_id()` SECURITY DEFINER function | Deployed |
| Tenant isolation policies on 18 data tables | Deployed |
| Owner isolation on `businesses` table | Deployed |
| `REVOKE ALL FROM anon` on all tables | Applied |
| HTTPS on all endpoints | Enforced |
| Migration tracked in Git | Committed |

### Documentation Status

| Document | Status |
|---|---|
| Technical Documentation v1 (this document) | Complete |
| `.env.example` with required variables | Present |
| SQL migration with full RLS setup | Committed |
| Git commit history (73 commits) | Maintained |
| Release tag `v1.0.0` | Applied |

---

## 18. Known Limitations

### Single Owner Model

Each business has exactly one owner (`businesses.owner_id`). There is no concept of shared ownership or delegated administration. The owner is the only user who can authenticate and access the business data. This is sufficient for single-operator stores but does not support businesses with multiple managers who need independent login credentials.

### No Staff Permissions

Employees are tracked as records in the `employees` table for cashier assignment and reporting, but they do not have Supabase Auth accounts. There is no role-based access control — every authenticated user has full access to all features (inventory, purchasing, settings, reports). A cashier cannot be restricted to POS-only access.

### No Multi-Store Support

The system supports one business per authenticated user. There is no mechanism for a single user to manage multiple stores, switch between businesses, or aggregate reporting across locations. The `auth_business_id()` function returns a single business ID per user.

### Single Payment Per Sale

Each sale records one payment method (cash or card). Split payments (e.g., $20 cash + remainder on card) are not supported. The `payments` table structure supports multiple records per sale, but the checkout flow creates exactly one.

### No Offline Support

The application requires an active internet connection. All data operations go through the Supabase API. There is no local data caching, service worker, or offline queue. If the connection is lost mid-operation, the transaction may partially complete.

### No Automated Backups Beyond Supabase

Database backups rely on Supabase's managed backup service. There is no application-level export, snapshot, or backup mechanism. The store owner cannot independently export their data.

### Browser-Only Interface

The application runs exclusively in a web browser. There is no native mobile app, desktop application, or tablet-optimized interface. While the layout is responsive, it is not purpose-built for touchscreen POS terminals.

### No Receipt Printer Integration

Receipts are generated as browser print views using `html2canvas` and `jspdf`. There is no direct integration with thermal receipt printers or POS hardware. Printing relies on the browser's print dialog.

---

## 19. V2 Roadmap

### Phase 1: Staff Accounts and Permissions

**Goal:** Enable multiple staff members to log in with their own credentials and operate within role-based restrictions.

- **Staff authentication** — Create Supabase Auth accounts for employees, linked to the business via `business_id`.
- **Role definitions** — Define roles (owner, manager, cashier) with specific permission sets.
- **Feature gating** — Restrict access by role: cashiers see POS and cash drawer only; managers access inventory and purchasing; owners access everything including settings and reports.
- **RLS integration** — Extend RLS policies to support staff accounts resolving to the correct `business_id`.

### Phase 2: Inventory Intelligence

**Goal:** Move from reactive stock management to predictive inventory planning.

- **Sales velocity tracking** — Calculate average daily sales per product over configurable periods.
- **Demand forecasting** — Project future stock needs based on historical sales patterns and seasonality.
- **Reorder point optimization** — Suggest reorder levels based on lead time and sales velocity rather than static thresholds.
- **Supplier analytics** — Track supplier lead times, fill rates (ordered vs received), and cost trends over time.
- **Dead stock identification** — Flag products with zero or minimal sales over extended periods.

### Phase 3: Financial Reporting

**Goal:** Provide comprehensive financial visibility beyond the current profit report.

- **Tax reporting** — Period-based tax liability summaries grouped by rate for filing purposes.
- **Expense tracking** — Record business expenses beyond paid outs for full profit and loss reporting.
- **Date range picker** — Custom start/end date selection for all reports.
- **Report export** — CSV and PDF export for sales, inventory, profit, and tax reports.
- **Scheduled reports** — Automated end-of-day report generation with email delivery.

### Phase 4: Multi-Store Operations

**Goal:** Support businesses operating across multiple locations from a single account.

- **Store entity** — Introduce a `stores` table with location-specific settings (address, tax rate, operating hours).
- **Per-store inventory** — Track stock levels independently per location with inter-store transfer support.
- **Consolidated reporting** — Aggregate sales, inventory, and profit data across all locations with per-store drill-down.
- **Store switching** — Allow the owner to switch between stores within a single authenticated session.
- **Staff assignment** — Assign employees to specific store locations.
