import { test } from "node:test";
import assert from "node:assert/strict";
import { determineRole } from "./resolveRole.ts";

const BUSINESS_A = "11111111-1111-1111-1111-111111111111";
const BUSINESS_B = "22222222-2222-2222-2222-222222222222";

test("owner identity is always granted the owner role, regardless of any employee claim", () => {
  const result = determineRole({
    isOwner: true,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: "some-employee-id",
    employeeLookup: null,
  });
  assert.deepEqual(result, { ok: true, role: "owner", employeeId: null });
});

test("non-owner with no employee claim is rejected, not granted a default role", () => {
  const result = determineRole({
    isOwner: false,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: null,
    employeeLookup: null,
  });
  assert.deepEqual(result, { ok: false, reason: "not_owner_and_no_employee_claim" });
});

test("employee id that doesn't resolve to any row is rejected", () => {
  const result = determineRole({
    isOwner: false,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: "does-not-exist",
    employeeLookup: null,
  });
  assert.deepEqual(result, { ok: false, reason: "employee_not_found" });
});

test("employee belonging to a different business is rejected - tenant isolation", () => {
  const result = determineRole({
    isOwner: false,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: "emp-1",
    employeeLookup: { id: "emp-1", business_id: BUSINESS_B, role: "manager", status: "active" },
  });
  assert.deepEqual(result, { ok: false, reason: "employee_business_mismatch" });
});

test("inactive employee is rejected even with a matching business and valid role", () => {
  const result = determineRole({
    isOwner: false,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: "emp-1",
    employeeLookup: { id: "emp-1", business_id: BUSINESS_A, role: "manager", status: "inactive" },
  });
  assert.deepEqual(result, { ok: false, reason: "employee_inactive" });
});

test("employee with an unrecognized role value is rejected, not silently defaulted", () => {
  const result = determineRole({
    isOwner: false,
    verifiedBusinessId: BUSINESS_A,
    requestedEmployeeId: "emp-1",
    employeeLookup: { id: "emp-1", business_id: BUSINESS_A, role: "district_manager", status: "active" },
  });
  assert.deepEqual(result, { ok: false, reason: "unknown_role" });
});

for (const role of ["manager", "cashier", "inventory_clerk"] as const) {
  test(`active employee with role "${role}" in the correct business resolves to that role`, () => {
    const result = determineRole({
      isOwner: false,
      verifiedBusinessId: BUSINESS_A,
      requestedEmployeeId: "emp-1",
      employeeLookup: { id: "emp-1", business_id: BUSINESS_A, role, status: "active" },
    });
    assert.deepEqual(result, { ok: true, role, employeeId: "emp-1" });
  });
}
