# Wegn Platform Admin — Partners Module

## Purpose

Defines the scope, responsibilities, and integration boundaries of the Partners module within the Wegn Platform Admin. This document establishes what the Partners module will manage, how it connects to the wider platform, and where its boundary with the existing Wegn Partners platform lies.

---

## Module Scope

The Partners module is the administrative interface through which the Wegn team manages the partner ecosystem. It covers the full lifecycle of a partner relationship — from application and onboarding through to active territory management, referral tracking, and commission administration.

---

## Capabilities

### Partner Profiles

Each partner has a profile record that captures:

- Partner name, type, and contact details.
- Assigned territory or territories.
- Partner status (Pending, Active, Suspended, Inactive).
- Onboarding completion status.
- Agreement and compliance records.
- Performance summary.

Partner profiles are created by the platform admin team and are not self-registered.

---

### Partner Status

Partners move through a defined status lifecycle:

- **Pending** — Application received, under review.
- **Active** — Approved, onboarded, and operating within their assigned territory.
- **Suspended** — Temporarily restricted, pending review or resolution.
- **Inactive** — No longer operating; territory unassigned.

Status transitions are managed by platform administrators and recorded in the audit log.

---

### Territories

Territories define the geographic boundaries within which a partner operates.

- Each territory is assigned to one partner at a time.
- Territory boundaries are defined at the country or sub-country level.
- Territory assignment and reassignment are managed by the platform admin.
- A partner's visibility into business data and commissions is scoped to their assigned territory.

---

### Referrals

The Referrals section tracks businesses that a partner has introduced to the platform.

- Each referral is linked to a partner and a business record.
- Referral status follows the business activation lifecycle.
- Commission eligibility is determined based on referral status and partner agreement terms.

---

### Commissions

Commissions are earned by partners based on the active subscriptions they manage within their territory.

- Commission calculations are based on subscription value and partner agreement terms.
- The Commissions section provides a running ledger of earned, pending, and disbursed amounts.
- Commission disbursement is initiated by the platform admin after review.
- All commission records are immutable once confirmed.

---

### Onboarding Workflow

New partners go through a structured onboarding process before they are activated:

1. Application review and approval.
2. Agreement signing and compliance confirmation.
3. Territory assignment.
4. Platform access provisioning.
5. Onboarding training and verification.
6. Partner activation.

The Partners module tracks onboarding progress and surfaces incomplete steps to the platform admin team.

---

### Partner Settings

Global configuration for the partner program, including:

- Commission rate structures by partner tier or agreement.
- Notification and communication preferences.
- Territory definition and boundary management.
- Access control levels for partner-facing tools.

---

## Integration Boundary with Wegn Partners Platform

The Wegn Partners platform is a separate, partner-facing application through which partners log in, view their territory, track their referrals, and access their commission statements.

The Platform Admin Partners module is the **administrative backend** for that ecosystem. It does not duplicate the partner-facing experience — it governs it.

**Platform Admin manages:**
- Partner records, status, and profile data.
- Territory assignment and configuration.
- Commission ledger and disbursement approvals.
- Referral records linked to business activations.
- Onboarding workflow progress and approval gates.

**Wegn Partners platform manages:**
- Partner login and authenticated session.
- Partner-facing territory and referral views.
- Commission statement display.
- Partner support and communication tools.

Data flows from the Platform Admin to the Wegn Partners platform. Partners do not write back to the Platform Admin directly — all administrative actions originate from the platform admin team.

---

## What Is Not in Scope

- Partner self-registration (partners are approved and created by the platform admin team).
- Partner-facing UI or login flows (those belong to the Wegn Partners platform).
- Business-level financial transactions (handled by the Billing module).
- Country configuration (handled by Platform Settings).

---

## Implementation Status

This module is in the **planning layer** only. The foundation UI has been established. Data connection to the Wegn Partners platform has not been configured. No partner data is loaded or displayed.

The full implementation is planned as part of Phase 4 — Partner Network in the platform charter roadmap.
