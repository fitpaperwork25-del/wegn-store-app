# Wegn Platform Admin — Change Control

## Purpose
Ensure every significant change to the Wegn Platform is reviewed, documented, approved, and implemented in a controlled manner.

## Table of Contents
1. [Change Categories](#change-categories)
2. [Approval Rules](#approval-rules)
3. [Documentation Requirements](#documentation-requirements)
4. [Rollback Policy](#rollback-policy)
5. [Change Log](#change-log)

---

## Change Categories (LOCKED)

1. **Critical Bug**
Fixes production issues affecting stability or security.

2. **Enhancement**
Improves an existing feature without changing its core purpose.

3. **New Feature**
Introduces new functionality within the current roadmap phase.

4. **Future Feature**
Ideas approved for a future roadmap phase.

5. **Breaking Change**
Any change that may affect existing functionality, APIs, database structure, permissions, integrations, or user workflows.

## Approval Rules (LOCKED)

- Every Breaking Change requires approval before implementation.
- Every New Feature must belong to the current roadmap phase.
- Future Features are added to the roadmap or backlog.
- Critical Bugs may bypass the roadmap only to restore stability.

## Documentation Requirements (LOCKED)

Before implementation:

- Update the appropriate planning document.
- Define acceptance criteria.
- Define a test plan.

After implementation:

- Update documentation.
- Record the change in the changelog.
- Verify the Definition of Done.

## Rollback Policy (LOCKED)

Every significant implementation should be reversible.

If a deployment introduces unacceptable risk or regressions, the platform must be capable of returning to the previous stable state.

## Change Log

_To be defined._
