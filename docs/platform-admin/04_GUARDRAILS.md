# Wegn Platform Admin — Guardrails

## Purpose
Defines hard constraints that govern all development decisions: what must not be broken, what must not be shipped without review, and what requires explicit sign-off. Guardrails take precedence over roadmap priorities.

## Table of Contents
1. [Development Guardrails](#development-guardrails)
2. [Data Integrity Rules](#data-integrity-rules)
3. [Security Constraints](#security-constraints)
4. [Performance Thresholds](#performance-thresholds)
5. [Dependency Rules](#dependency-rules)
6. [Review Requirements](#review-requirements)

---

## Development Guardrails (LOCKED)

1. **Vision First**
Every decision must align with the approved Vision before implementation begins.

2. **One Phase at a Time**
Do not begin work from a future roadmap phase until the current phase is approved and locked.

3. **Stability Before Features**
Never add new functionality if it risks breaking existing production functionality.

4. **Documentation First**
Major features require approved documentation before implementation.

5. **Simplicity Wins**
Always choose the simplest solution that satisfies the requirement.
Avoid unnecessary complexity.

6. **Reuse Before Building**
Use existing shared platform services whenever practical before creating new components.

7. **Test Before Completion**
No feature is considered complete until testing and acceptance criteria have passed.

8. **No Scope Creep**
Ideas discovered during development must be added to the roadmap or backlog, not implemented immediately.

9. **Security Always**
Protect customer data, tenant isolation, authentication, and permissions in every change.

10. **Leave It Better**
Every completed phase should improve the overall quality of the platform without creating technical debt.

11. **Think Before Building**
Before writing code, the AI agent must:

- Review the Vision.
- Review the Architecture.
- Review the Roadmap.
- Verify the request belongs to the current phase.
- Explain its implementation plan.
- Wait for approval before making structural changes.

## Data Integrity Rules

_To be defined._

## Security Constraints

_To be defined._

## Performance Thresholds

_To be defined._

## Dependency Rules

_To be defined._

## Review Requirements

_To be defined._
