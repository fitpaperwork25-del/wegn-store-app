# Wegn Platform Admin — Architecture

## Purpose
Documents the technical structure of the platform: data model, services, integrations, and boundaries between components. This is the reference for understanding how the system is built.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Modules](#core-modules)
3. [Architecture Principles](#architecture-principles)
4. [Data Model](#data-model)
5. [Authentication & Authorization](#authentication--authorization)
6. [Frontend](#frontend)
7. [Backend & Database](#backend--database)
8. [Integrations](#integrations)
9. [Deployment & Hosting](#deployment--hosting)

---

## Architecture Overview

Wegn Platform Admin is organized into independent modules. Each module has a clear responsibility and communicates with the others through well-defined interfaces.

The architecture should prioritize simplicity, scalability, and maintainability.

## Core Modules (LOCKED)

1. **Dashboard**
Overall platform overview, health, alerts, and activity.

2. **Clients**
Manage every business using any Wegn product.

3. **Products**
Manage all Wegn products (Wegn-Store, QR-Wegn, QRBooker, Wegn Events, and future products).

4. **Deployments**
Track onboarding, setup progress, and customer activation.

5. **Operations**
Monitor live customer activity and perform remote support actions.

6. **Billing**
Manage subscriptions, plans, invoices, and country-specific payment methods.

7. **Support**
Communication history, notes, issues, and customer success.

8. **Analytics**
Platform-wide reporting and business insights.

9. **Platform Settings**
Global configuration, countries, permissions, feature flags, and system administration.

## Architecture Principles (LOCKED)

- Each module has a single responsibility.
- Modules should be loosely coupled.
- New products should plug into the platform without redesign.
- Country-specific configuration should not require code changes.
- The architecture should remain simple and easy to understand.

**Shared Platform Services**

All Wegn products should rely on a common set of shared platform services whenever practical.

Examples include authentication, customer management, billing, notifications, permissions, audit logging, AI services, and country configuration.

Individual products should focus on their business-specific functionality rather than duplicating shared capabilities.

## Data Model

_To be defined._

## Authentication & Authorization

_To be defined._

## Frontend

_To be defined._

## Backend & Database

_To be defined._

## Integrations

_To be defined._

## Deployment & Hosting

_To be defined._
