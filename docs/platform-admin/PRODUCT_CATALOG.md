# Wegn Platform Admin — Product Catalog

## Purpose

This document defines the Product Catalog architecture within the Wegn Platform Admin Ecosystem Registry. It describes how Wegn products are registered, how their capabilities are modelled, and how this catalog will power future AI-driven orchestration and cross-product intelligence.

---

## Product Registry

The Product Registry is the authoritative list of every product that belongs to the Wegn ecosystem. Each entry in the registry is a `RegisteredProduct` record that describes:

- **Identity** — the product's unique ID, name, code, category, and description.
- **Ownership** — the team or entity responsible for the product.
- **Deployment** — how and where the product is deployed (cloud, on-premise, hybrid).
- **Versioning** — the current deployed version of the product.
- **Operational status** — the live state of the product's environment, database, API, and health.
- **Capabilities** — the discrete functional units the product delivers (see below).
- **Regions** — the countries or regions where the product is available.
- **Subscription model** — whether the product requires a paid subscription.
- **Links** — website, documentation, support contact, and admin URL.

The registry is the single source of truth for product metadata across the entire platform. Any system that needs to know about a Wegn product reads from this registry — it does not maintain its own copy.

### Registered Products

| Product | Code | Category |
|---|---|---|
| Wegn Store | WEGN_STORE | Point of Sale |
| Wegn Partners | WEGN_PARTNERS | Partner Network |
| QR-Wegn | QR_WEGN | Digital Commerce |
| QRBooker | QRBOOKER | Appointments |
| Wegn Events | WEGN_EVENTS | Events |

---

## Capability Registry

Each product in the registry declares a list of capabilities — the discrete functional units the product delivers to its users.

Capabilities serve several purposes:

1. **Documentation** — they make the platform's feature surface visible in one place.
2. **Discoverability** — platform administrators can see which product delivers a given capability without navigating into each product separately.
3. **AI input** — the capability registry is one of the primary inputs the platform's future AI systems will use to understand what each product can and cannot do.
4. **Cross-product mapping** — capabilities that appear in multiple products (e.g., Customers, Payments) reveal natural integration points between products.

### Capability Map

| Capability | Product |
|---|---|
| Calendar | QRBooker |
| Cashier | QR-Wegn |
| Commissions | Wegn Partners |
| Customers | Wegn Store, QRBooker |
| Event Registration | Wegn Events |
| Inventory | Wegn Store |
| Kitchen Display | QR-Wegn |
| Loyalty | Wegn Store |
| Partner Management | Wegn Partners |
| Payments | QRBooker |
| POS | Wegn Store |
| Purchasing | Wegn Store |
| QR Check-in | Wegn Events |
| QR Ordering | QR-Wegn |
| Referrals | Wegn Partners |
| Reports | Wegn Store |
| Restaurant POS | QR-Wegn |
| Scheduling | QRBooker |
| Staff | Wegn Store |
| Tables | QR-Wegn |
| Territories | Wegn Partners |
| Ticket Validation | Wegn Events |
| Training | Wegn Partners |

---

## Future AI Usage

The Product Catalog is a foundational input for the platform's planned AI Command Center. Once the registry is connected to live product data, AI capabilities will include:

**Cross-product intelligence**
The AI will be able to answer questions like "which products support Payments?" or "which products are available in Ethiopia?" by reasoning over the capability and region maps in the registry.

**Capability gap detection**
By comparing the capabilities registered for each product against observed usage patterns, the AI can surface gaps — capabilities declared but not used, or user needs not covered by any registered capability.

**Subscription and billing recommendations**
With knowledge of which products a business has subscribed to and what capabilities those products provide, the AI can identify upsell opportunities, redundant subscriptions, or missing product coverage for that business's industry.

**Operational anomaly detection**
When the registry is connected to live health data, the AI will be able to correlate operational anomalies across products — a database connection failure in one product that coincides with unusual activity in another, for example.

**Partner support recommendations**
Partners supporting businesses that use multiple Wegn products benefit from knowing which capabilities each product provides. The AI can generate capability summaries tailored to each partner's portfolio.

---

## Cross-Product Orchestration

The Product Catalog enables orchestration across the Wegn ecosystem in ways that individual products cannot achieve independently.

**Shared business identity**
A business registered on the platform has a single identity regardless of how many Wegn products it subscribes to. The registry ensures that platform-level operations — subscription changes, business status updates, country configuration changes — can be applied consistently across all products a business uses.

**Unified subscription lifecycle**
A business's subscription to multiple products is managed centrally. The registry defines which products are eligible for subscription in each country, and the billing system uses this information to construct accurate subscription plans and invoices.

**Coordinated notifications**
When a platform-level event occurs — a payment fails, a subscription lapses, a business is suspended — the platform can identify all products that business uses and coordinate the appropriate response across each product's operational state.

**Partner portfolio visibility**
Partners support businesses that may use multiple Wegn products. The registry enables the platform to build a complete portfolio view for each partner — showing all the products their businesses use, the health of each product, and the subscription status — without requiring the partner to check each product separately.

---

## Implementation Status

The Product Catalog is in the **foundation layer**. The registry model and capability declarations are in place. No live product connections have been established.

The next implementation phase will introduce the connection layer — each product's status endpoint will be called on a schedule, and the registry will be updated with real operational data.
