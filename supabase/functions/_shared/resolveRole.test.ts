import { test } from "node:test";
import assert from "node:assert/strict";
import { determineRole } from "./resolveRole.ts";

test("owner role from auth_user_role() is granted the owner role with no employeeId", () => {
  const result = determineRole("owner", null);
  assert.deepEqual(result, { ok: true, role: "owner", employeeId: null });
});

test("owner role from auth_user_role() ignores any employeeId passed alongside it", () => {
  // Regression guard for the original C-1 bug shape: even if some caller
  // still threads an employeeId through, an owner-resolved role must never
  // carry a stray employeeId - owner is never "acting as" an employee row.
  const result = determineRole("owner", "some-employee-id");
  assert.deepEqual(result, { ok: true, role: "owner", employeeId: null });
});

test("null role (auth_user_role() resolved nothing) is rejected, not granted a default role", () => {
  const result = determineRole(null, null);
  assert.deepEqual(result, { ok: false, reason: "not_authenticated" });
});

test("a bare device session (auth_user_role() = 'device') is rejected - not a Copilot-eligible role", () => {
  const result = determineRole("device", null);
  assert.deepEqual(result, { ok: false, reason: "unknown_role" });
});

test("an unrecognized role value is rejected, not silently defaulted", () => {
  const result = determineRole("district_manager", null);
  assert.deepEqual(result, { ok: false, reason: "unknown_role" });
});

for (const role of ["manager", "cashier", "inventory_clerk"] as const) {
  test(`role "${role}" from auth_user_role() resolves to that role with its own employeeId`, () => {
    const result = determineRole(role, "emp-1");
    assert.deepEqual(result, { ok: true, role, employeeId: "emp-1" });
  });
}

test(
  "C-1 regression: a lower-privileged caller's own resolved role cannot be overridden by " +
    "an employeeId belonging to someone else - determineRole only ever reads the resolved " +
    "role string, never an employeeId, to decide the role",
  () => {
    // A cashier's own auth_user_role() result is "cashier", full stop - no
    // parameter to this function lets a caller substitute a different
    // employee's id to obtain a different role. This is the structural
    // fix: the vulnerable version of this function accepted a client-
    // supplied employeeId and used it to look up (and grant) a DIFFERENT
    // employee's role. That employeeLookup parameter no longer exists.
    const asCashier = determineRole("cashier", "cashiers-own-employee-id");
    assert.deepEqual(asCashier, { ok: true, role: "cashier", employeeId: "cashiers-own-employee-id" });

    const asCashierWithSomeoneElsesId = determineRole("cashier", "managers-employee-id");
    // Even if an employeeId belonging to a different employee is threaded
    // through, the granted ROLE still comes only from the resolved role
    // string - "cashier" in, "cashier" out, never "manager".
    assert.equal(asCashierWithSomeoneElsesId.ok && asCashierWithSomeoneElsesId.role, "cashier");
  }
);
