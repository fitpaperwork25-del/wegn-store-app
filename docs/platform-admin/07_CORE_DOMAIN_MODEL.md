# Wegn Platform Admin — Core Domain Model

## Purpose

Define the primary business entities that form the foundation of the Wegn Platform.

## Table of Contents
1. [Core Entities](#core-entities)

---

## Core Entities (LOCKED)

1. **Business**
The primary customer of the Wegn ecosystem.

**Definition:**
A Business is any organization or individual that uses one or more Wegn products and represents the primary customer within the Wegn ecosystem.

**Examples:**
- Restaurant
- Grocery Store
- Pharmacy
- Salon
- Hotel
- School
- Church
- NGO
- Individual Professional

2. **Product**
A Wegn software product or service.

**Definition:**
A Product is a Wegn software solution or service that delivers specific business capabilities to customers and operates on the shared Wegn Platform.

**Examples:**
- Wegn-Store
- QR-Wegn
- QRBooker
- Wegn Events
- Future Wegn Products

3. **Partner**
An approved organization or individual responsible for supporting businesses within an assigned territory.

**Definition:**
A Partner is an approved organization or individual authorized by Wegn to represent the Wegn ecosystem within an assigned territory.

A Partner may sell, deploy, support, and manage one or more Wegn products for businesses within their assigned region.

Partners represent Wegn as a whole, not an individual product.

**Examples:**
- Country Partner
- Regional Distributor
- Certified Reseller
- Franchise Operator

4. **Subscription**
Represents a business's active relationship with one or more Wegn products.

**Definition:**
A Subscription represents a Business's active relationship with a specific Wegn Product.

A Business may have one or many active Subscriptions, allowing products to be purchased, activated, upgraded, renewed, or cancelled independently.

This model supports individual products, bundled offerings, country-specific pricing, free trials, and future enterprise plans.

**Examples:**
- Wegn-Store Subscription
- QR-Wegn Subscription
- QRBooker Subscription
- Wegn Events Subscription

5. **User**
Any authenticated person interacting with the platform.

**Definition:**
A User is an authenticated individual who interacts with the Wegn Platform.

A User may have one or more roles across one or more Businesses, Partners, or Platform functions.

A User belongs to the Wegn Platform rather than to a single Business, enabling secure multi-business access and future platform growth.

**Examples:**
- Business Owner
- Store Manager
- Cashier
- Staff Member
- Partner Representative
- Wegn Support
- Platform Administrator

6. **Country**
Represents the country-specific configuration used throughout the platform.

**Definition:**
A Country represents the country-specific configuration used throughout the Wegn Platform.

Each Country provides the default business environment for organizations operating within its territory, including localization, payment methods, taxation, currency, language, regional settings, and future regulatory requirements.

This allows every Wegn Product to automatically adapt to the country in which a Business operates.

**Examples:**
- Ethiopia
- Uganda
- Kenya
- United States
- Canada
