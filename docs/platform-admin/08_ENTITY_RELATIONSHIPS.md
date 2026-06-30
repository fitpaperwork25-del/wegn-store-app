# Wegn Platform Admin — Entity Relationships

## Purpose

This document defines how the approved core entities relate to one another.

No database schema, tables, foreign keys, or implementation details are to be included.

This document exists solely to define business relationships before technical design begins.

## Table of Contents
1. [Entities Covered](#entities-covered)
2. [Relationships](#relationships)

---

## Entities Covered

- Business
- Product
- Partner
- Subscription
- User
- Country

## Relationships

### 1. Country → Business (LOCKED)

**Relationship:**
- One Country may have many Businesses.
- Each Business belongs to one Country.

**Business Reason:**
A Business operates within a single country and inherits that country's localization, taxation, currency, payment ecosystem, and regulatory configuration.

---

### 2. Business → Subscription (LOCKED)

**Relationship:**
- One Business may have many Subscriptions.
- Each Subscription belongs to one Business.

**Business Reason:**
A Business may subscribe to multiple Wegn Products independently, allowing each product to be activated, upgraded, renewed, suspended, or cancelled without affecting other subscriptions.

---

### 3. Product → Subscription (LOCKED)

**Relationship:**
- One Product may have many Subscriptions.
- Each Subscription belongs to one Product.

**Business Reason:**
A Wegn Product may be subscribed to by many Businesses. Each Subscription represents one Business's access to one specific Wegn Product.

---

### 4. Business → User (LOCKED)

**Relationship:**
- One Business may have many Users.
- Each User belongs to one Business.

**Business Reason:**
A Business may have multiple people using the platform (owner, managers, cashiers, inventory staff, accountants, etc.). Every User operates within the context of a single Business.

---

### 5. Subscription → Country (LOCKED)

**Relationship:**
- One Country may support many Subscription offerings.
- Each Subscription offering belongs to one Country.

**Business Reason:**
Subscriptions are country-specific because pricing, currencies, taxes, payment methods, regulations, and available features may differ between countries.

---

### 6. Country → Product (LOCKED)

**Relationship:**
- One Country may offer many Products.
- Each Product belongs to one Country.

**Business Reason:**
Products available, pricing, taxes, languages, regulations, and enabled features may vary by country. Every Product is therefore defined within the context of a single Country.
