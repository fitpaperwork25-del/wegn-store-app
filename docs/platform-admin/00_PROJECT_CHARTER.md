# Wegn Platform Admin
# Project Charter

## Purpose

This document serves as the official entry point for the Wegn Platform Admin project.

Before beginning any planning, design, implementation, or review work, every developer and AI agent must read this document together with the locked governance documents.

## Required Reading Order

1. [00_PROJECT_CHARTER.md](00_PROJECT_CHARTER.md)
2. [01_VISION.md](01_VISION.md)
3. [02_ARCHITECTURE.md](02_ARCHITECTURE.md)
4. [03_MASTER_ROADMAP.md](03_MASTER_ROADMAP.md)
5. [04_GUARDRAILS.md](04_GUARDRAILS.md)
6. [05_DEFINITION_OF_DONE.md](05_DEFINITION_OF_DONE.md)
7. [06_CHANGE_CONTROL.md](06_CHANGE_CONTROL.md)

## Project Principle

Build slowly.
Build correctly.
Protect quality.
Avoid unnecessary complexity.
Never sacrifice the long-term architecture for short-term convenience.

---

## 1. Vision

Wegn is a unified business platform built for the world's underserved markets — places where businesses operate without reliable access to the software tools, financial infrastructure, and operational support that businesses in larger markets take for granted.

The vision of Wegn is to place enterprise-grade business capability into the hands of every small and medium business on the continent and beyond, delivered through a platform that is affordable, simple to use, and built to work in the real conditions those businesses face every day.

Wegn does not build for the ideal case. It builds for the actual case — intermittent connectivity, mixed digital literacy, local payment methods, multiple languages, and country-specific regulatory environments. Every product, every feature, and every decision on the platform is measured against this standard.

The long-term vision is a platform where any business, anywhere, can access the tools it needs to operate professionally, grow sustainably, and participate fully in the digital economy.

---

## 2. Mission

Wegn's mission is to build and operate a shared business platform that delivers practical, high-quality software products to businesses across emerging markets, supported by a trusted network of local partners and powered by technology that adapts to the context of each market it serves.

The platform achieves this mission by:

- Building software products that solve real operational problems for real businesses.
- Making those products available at a price and in a form that is accessible to small and medium businesses.
- Deploying those products through a partner network that provides local presence, trust, and support.
- Continuously improving the platform based on how businesses actually use it, not on assumptions about how they should.

---

## 3. Core Principles

The Wegn Platform is governed by the following principles. These principles inform every product decision, every architectural choice, and every business relationship on the platform.

1. **Market-first** — Every feature begins with a real problem faced by a real business in a real market. Wegn does not build speculatively.

2. **Simplicity over complexity** — The most powerful feature is one that works without explanation. Wegn designs for the user who has no time to learn and no patience for failure.

3. **Reliability before richness** — A platform that works consistently under difficult conditions is more valuable than a platform with many features that fail unpredictably. Stability is not negotiable.

4. **Local by default** — Currency, language, payment methods, taxation, and regulation are not add-ons. They are the foundation. Every product is built to reflect the country it operates in.

5. **Partner-enabled growth** — Wegn does not grow alone. Local partners carry the platform into markets, build trust with businesses, and provide the support that no remote team can replicate.

6. **Tenant safety** — Every business on the platform operates in complete isolation. No business can see, access, or affect another business's data under any circumstance.

7. **Earned trust** — Wegn earns the trust of businesses, partners, and markets by doing what it says it will do, protecting the data it holds, and standing behind the products it delivers.

8. **Partner Ecosystem** — Partners are not resellers. They are co-owners of the markets they serve. Wegn's growth and the growth of its partners are inseparable.

9. **Business-Centric** — The platform exists to serve businesses. Every product, every workflow, and every platform decision must deliver clear, measurable value to the businesses using it.

10. **Offline-Resilient** — In the markets Wegn serves, connectivity is not guaranteed. Products must be designed to function under constrained or intermittent connectivity, and to synchronize reliably when connectivity is restored.

---

## 4. Platform Scope

The Wegn Platform is a shared foundation upon which multiple business software products are built, deployed, and operated.

**In scope:**

- Business registration, configuration, and lifecycle management.
- Subscription management across multiple Wegn products and countries.
- Partner onboarding, territory management, and commission administration.
- Shared platform services including authentication, storage, communications, payments, analytics, and AI assistance.
- Country-specific configuration covering currency, language, taxation, payment methods, and regulatory settings.
- Product delivery through subscriptions that can be activated, upgraded, renewed, and cancelled independently.

**Out of scope:**

- Products or features that serve only one customer and cannot be generalized to other businesses.
- Functionality that belongs to a specific Wegn product rather than to the shared platform.
- Custom integrations or bespoke implementations built for individual business accounts.
- Consumer-facing applications or services not connected to a registered business on the platform.

The platform's scope expands only when a capability is needed by multiple products, multiple countries, or multiple partners — not when it is needed by one.

---

## 5. Target Users

The Wegn Platform serves four distinct user groups, each with a different relationship to the platform.

**Business Owners**
The primary user of the Wegn Platform. A business owner registers their business, selects the products they need, manages their subscription, and uses those products to run their day-to-day operations. Business owners expect software that is fast, reliable, and easy to understand without training.

**Business Staff**
Employees, managers, cashiers, and other team members who use Wegn products as part of their daily work. Staff users operate within the permissions their business owner has granted them. They need software that supports their specific role without exposing capabilities that are not theirs to use.

**Partners**
Approved organizations or individuals who represent Wegn in an assigned territory. Partners onboard businesses, provide local support, and earn commissions based on the subscriptions they manage. Partners need visibility into their territory's performance and the tools to support the businesses in their portfolio.

**Platform Administrators**
The Wegn team members responsible for operating, monitoring, and improving the platform. Platform administrators need visibility across all businesses, countries, and partners, and the ability to manage platform configuration, resolve issues, and enforce governance.

---

## 6. Supported Industries

The Wegn Platform is designed to serve a broad range of business types operating in everyday commerce. The platform is intentionally industry-agnostic at its foundation, with individual Wegn products targeting specific operational needs.

Industries currently served or planned for near-term support include:

- **Retail** — Grocery stores, general merchandise, clothing and fashion, electronics, and specialty retail of all kinds.
- **Food & Beverage** — Restaurants, cafes, fast food outlets, catering services, and food production businesses.
- **Health & Pharmacy** — Pharmacies, health clinics, optical stores, and health product retailers.
- **Professional Services** — Salons, barbershops, repair workshops, laundries, and other appointment- or service-based businesses.
- **Hospitality** — Hotels, guesthouses, lodges, and accommodation providers.
- **Education** — Schools, tutoring centres, training providers, and educational institutions.
- **Faith & Community Organizations** — Churches, mosques, NGOs, and community-serving bodies that manage membership, donations, or events.
- **Healthcare** — Medical practices, dental clinics, and allied health providers.
- **Agriculture & Supply** — Suppliers, distributors, and agribusiness operators managing inventory and orders.

The platform's country configuration and product design ensure that each industry is served within the regulatory, currency, and operational context of the country in which the business operates.

---

## 7. Multi-Country Strategy

The Wegn Platform is built from the ground up to operate across multiple countries simultaneously, with each country configured as a distinct operating environment rather than a regional variation of a single default.

Each country on the platform has its own:

- Currency and pricing configuration.
- Supported payment methods, including local mobile money providers where applicable.
- Tax and regulatory settings.
- Language and localization defaults.
- Available Wegn products and subscription offerings.
- Assigned partner network and territory structure.

This approach means that a business in Ethiopia and a business in Uganda can both use the same Wegn product, but each operates in an environment that reflects the real conditions of its own country — not a generalized approximation.

The multi-country strategy also governs how the platform grows. New countries are onboarded as complete operating environments, not as lightweight add-ons. Before a country goes live, its configuration — currency, payments, tax, language, partner structure, and product availability — is validated and approved. This protects the quality and reliability of the platform in every market it serves.

The long-term ambition is to operate across all major markets in Sub-Saharan Africa, with targeted expansion into other emerging market regions as the platform matures and partner capacity grows.

---

## 8. Partner Ecosystem

Partners are the most important channel through which Wegn reaches businesses in new markets. No remote platform team can replicate the local knowledge, trust, and presence that a well-selected partner brings to a territory.

The Wegn partner ecosystem is built on the following principles:

**Territory ownership** — Each approved partner is assigned a defined geographic territory within which they have the authority and responsibility to represent Wegn, onboard businesses, and provide local support. Territory boundaries are clear and respected.

**Long-term relationships** — Wegn does not treat partners as transactional channels. The expectation is a long-term business relationship in which partner growth and platform growth are aligned.

**Performance-based rewards** — Partners earn commissions based on the subscriptions they generate and maintain within their territory. The commission structure is transparent and governed by the partner agreement.

**Quality over volume** — Partners are approved based on capability, market knowledge, and alignment with Wegn's values — not simply on the size of their network. A smaller number of high-quality partners in a territory is preferred over a large number of underperforming ones.

**Platform access** — Partners have access to the platform tools and data they need to support the businesses in their portfolio, within the boundaries of their territory and their authorized scope.

The partner ecosystem is a competitive advantage for Wegn. Building, maintaining, and growing this ecosystem is a long-term strategic priority for the platform.

---

## 9. AI-First Philosophy

Wegn is building an AI-first platform — not in the sense that AI is the product, but in the sense that AI is embedded into the platform's workflows to make every business owner more capable, every partner more effective, and every platform operation more efficient.

The AI-first philosophy is grounded in the following beliefs:

**AI should reduce effort, not add complexity.** The businesses Wegn serves do not have time to learn new tools. AI assistance is most valuable when it works invisibly — extracting information from a supplier invoice, suggesting the right product match, or surfacing a relevant insight — without requiring the user to understand or interact with the AI directly.

**AI should serve the user, not the other way around.** Every AI output on the platform is a suggestion or a draft. The business owner confirms, adjusts, or rejects it. AI does not make decisions; it prepares options for humans to act on.

**AI is most powerful when it understands context.** The platform's investment in structured business data — products, suppliers, subscriptions, country configuration — creates the foundation that AI needs to provide relevant, accurate, and useful assistance. Garbage in, garbage out. Quality data in, intelligent assistance out.

**AI capabilities are introduced progressively.** The platform begins AI assistance in well-defined, lower-risk workflows such as document extraction and receiving assistance, and expands into more complex advisory and predictive functions as the foundation matures.

**AI must be trustworthy.** In markets where software trust is hard-won, an AI that produces unreliable results does more damage than no AI at all. Quality, accuracy, and transparency are non-negotiable standards for every AI capability on the platform.

---

## 10. Long-Term Roadmap

The Wegn Platform is built in phases, each of which delivers a stable, complete foundation before the next phase begins. No phase is considered complete until it meets the platform's Definition of Done. No new phase begins until the current phase is locked.

**Phase 1 — Core Foundation**
Establish the foundational platform: business registration, product and inventory management, point of sale, purchasing and receiving, and the FEFO (First Expired, First Out) inventory model. This is the baseline from which all subsequent phases build.

**Phase 2 — Subscriptions & Billing**
Introduce subscription management, country-specific pricing, payment collection, invoicing, and the billing lifecycle. The platform becomes commercially operable.

**Phase 3 — Multi-Country Operations**
Extend the platform to support multiple countries simultaneously, each with its own currency, payment methods, tax configuration, language, and regulatory settings.

**Phase 4 — Partner Network**
Build the partner onboarding, territory management, commission, and portfolio visibility capabilities that enable the partner ecosystem to operate at scale.

**Phase 5 — AI Services**
Embed AI assistance into core platform workflows, beginning with document extraction and smart receiving, and expanding into business insights and operational recommendations.

**Phase 6 — Multi-Product Platform**
Enable the platform to support multiple distinct Wegn products under a single shared infrastructure, with each product independently subscribable and independently configurable.

**Phase 7 — Advanced Analytics**
Deliver comprehensive analytics for business owners, partners, and platform administrators, including self-service reporting, trend analysis, and predictive insights.

**Phase 8 — Ecosystem Integrations**
Expand platform integrations to include regional payment networks, mobile money providers, third-party logistics, and other ecosystem participants relevant to the markets Wegn serves.

**Phase 9 — Enterprise & Multi-Location**
Introduce capabilities for larger businesses operating across multiple locations, with consolidated reporting, shared inventory, and enterprise-level account management.

**Phase 10 — Platform Maturity**
Consolidate all platform capabilities into a stable, scalable, and fully governed platform ready for sustained long-term operation across all target markets.

The full roadmap detail, including rules and governance, is defined in [03_MASTER_ROADMAP.md](03_MASTER_ROADMAP.md).

---

## 11. Success Metrics

The Wegn Platform measures success across four dimensions: business adoption, platform reliability, partner performance, and financial sustainability.

**Business adoption**
- Number of active businesses on the platform across all countries.
- Business activation rate — the proportion of registered businesses that reach active operational status.
- Product adoption rate — the proportion of active businesses using each Wegn product.
- Business retention rate — the proportion of active businesses that renew their subscription at each billing cycle.

**Platform reliability**
- Uptime and availability across all markets and products.
- Rate of critical incidents and mean time to resolution.
- Data integrity rate — the proportion of business records that are complete, accurate, and consistent.
- Percentage of platform workflows completed without error or manual intervention.

**Partner performance**
- Number of active approved partners across all territories.
- Business activations attributed to partner onboarding.
- Partner retention rate — the proportion of partners who remain active year over year.
- Territory coverage — the proportion of target markets with an active partner in place.

**Financial sustainability**
- Subscription revenue across all countries and products.
- Revenue growth rate by country and product.
- Partner commission disbursement accuracy and timeliness.
- Cost per activated business — the total platform cost required to bring one business to operational status.

---

## 12. Definition of Success

The Wegn Platform is successful when:

A business owner in an underserved market can register their business, subscribe to a Wegn product, and begin operating professionally — without requiring technical knowledge, without a lengthy onboarding process, and without encountering barriers created by the platform itself.

That business can run day-to-day operations reliably, with confidence that their data is safe, their records are accurate, and the platform will be there when they need it.

When that business grows, the platform grows with it — adding products, adding users, and adapting to the business's evolving needs without requiring the business to start over or migrate away.

When a new country is opened, it is opened completely — with the correct currency, language, payment methods, and partner network in place from day one, not added incrementally as afterthoughts.

When a partner onboards a new business, they do so with the tools, visibility, and support they need to do it well — and they are rewarded fairly and transparently for the growth they enable.

And when the platform team reviews what has been built, they can say with confidence: it is correct, it is complete, it is governed, and it is ready for what comes next.

That is success.
