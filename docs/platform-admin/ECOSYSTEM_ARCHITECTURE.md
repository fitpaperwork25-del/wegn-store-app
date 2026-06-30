# Wegn Platform Admin — Ecosystem Architecture

## Purpose

This document defines the architecture, responsibilities, and long-term vision of the Wegn Ecosystem Registry — the component within the Platform Admin that tracks, monitors, and orchestrates every Wegn product.

---

## Purpose of the Ecosystem Registry

The Ecosystem Registry is the authoritative record of every product that belongs to the Wegn platform. It serves as the single source of truth for:

- Which Wegn products exist.
- The operational status of each product's environment, database, and API.
- The last known synchronization state between each product and the platform.
- The connection model through which the platform interacts with each product.

The registry does not replace each product's own administration — it provides the platform-level view that no individual product can provide for itself.

As the platform grows, the Ecosystem Registry becomes the foundation upon which cross-product intelligence, monitoring, and orchestration are built.

---

## Product Independence

Each Wegn product — Wegn Store, Wegn Partners, QR-Wegn, QRBooker, Wegn Events, and future products — is an independent application with its own:

- Codebase and deployment pipeline.
- Database and data model.
- Authentication and authorization layer.
- Business logic and user interface.

Products are not coupled to one another. A failure in one product does not propagate to others. A deployment of one product does not require a deployment of any other.

The Platform Admin is not embedded into any product. It sits above all products and interacts with each through a defined connection boundary.

---

## Central Orchestration

While each product is independent, the Platform Admin provides the orchestration layer that coordinates platform-wide concerns:

- **Identity and access** — Platform administrators manage who has access to which products and at what level.
- **Business registry** — A business registered on the platform can be subscribed to multiple products without re-registering in each one.
- **Subscription and billing** — Subscription state for all products is managed centrally, not within each product independently.
- **Partner oversight** — Partner territories, referrals, and commissions span multiple products and are governed from a single point.
- **Audit and compliance** — Platform-wide audit logs capture administrative actions across all products from one place.
- **Country configuration** — Currency, language, payment methods, and regulatory settings are configured once and shared across all products operating in that country.

Orchestration does not mean control of product internals. Products own their own business logic. The platform orchestrates the shared concerns that cross product boundaries.

---

## Future AI Command Center

The Ecosystem Registry is the foundation for the platform's future AI capabilities. Once the registry accurately reflects the real-time state of every connected product, it becomes possible to:

- Surface anomalies across products that no single product would detect on its own.
- Generate cross-product business insights for platform administrators and partners.
- Automate routine operational decisions based on platform-wide patterns.
- Provide AI-assisted recommendations for subscription management, partner performance, and business health.

The AI Command Center is not a separate product. It is a capability that emerges from the combination of the Ecosystem Registry, connected product data, and AI services. It cannot be built until the registry is complete and the product connections are stable.

---

## Connection Model

Each product connects to the Platform Admin through a defined integration boundary. The connection model has three layers:

**Status layer**
The minimum connection. The product exposes its current operational status — environment, database health, API availability, and last activity — to the registry. The platform reads this status but does not write to the product through this layer.

**Data layer**
The platform reads structured data from the product — businesses, subscriptions, users, activity — for the purpose of platform-level reporting, billing, and partner oversight. Data flows from product to platform. The platform does not push data into the product's primary data store.

**Command layer**
The platform sends operational instructions to the product — activating a subscription, suspending a business, applying a configuration change. Commands are discrete, audited, and confirmable. The product executes the command and reports back the result.

Not all products will implement all three layers simultaneously. The connection model is adopted progressively, starting with the status layer.

---

## Security Principles

**Least privilege** — The Platform Admin accesses only the data it needs for a specific administrative function. It does not have unrestricted access to any product's database.

**Audit trail** — Every interaction between the Platform Admin and a connected product is logged with the initiating administrator, the action taken, the target, and the outcome.

**Isolated credentials** — Each product connection uses its own credentials, scoped to that product only. A compromised connection to one product cannot be used to access another.

**No direct database writes** — The Platform Admin does not write directly to a product's database. All writes are performed through the product's own API or service layer, ensuring that the product's validation, business rules, and event model are always respected.

**Read-first, act-second** — Before any command is sent to a product, the Platform Admin reads the current state and presents it to the administrator for confirmation. Blind commands are not permitted.

---

## Implementation Status

The Ecosystem Registry is in the **foundation layer** only. The UI has been established. No products are connected. Status data is not yet collected.

Product connections will be implemented as each product matures its integration boundary. The order of connection follows the product's operational readiness, not a fixed schedule.
