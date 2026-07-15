import { test } from "node:test";
import assert from "node:assert/strict";
import { getPoItemReceiptStatus } from "./purchasingHelpers.ts";

test("getPoItemReceiptStatus reflects a full receipt as fully received with nothing remaining", () => {
  // Regression: a PO ordered for 20, fully received, must show Received: 20 /
  // Remaining: 0 - not the pre-receive snapshot of Received: 0 / Remaining: 20.
  const status = getPoItemReceiptStatus({ quantity: 20, quantity_received: 20 });
  assert.deepEqual(status, { received: 20, remaining: 0 });
});

test("getPoItemReceiptStatus treats a null quantity_received as 0 received, fully remaining", () => {
  const status = getPoItemReceiptStatus({ quantity: 20, quantity_received: null });
  assert.deepEqual(status, { received: 0, remaining: 20 });
});

test("getPoItemReceiptStatus reflects a partial receipt", () => {
  const status = getPoItemReceiptStatus({ quantity: 20, quantity_received: 12 });
  assert.deepEqual(status, { received: 12, remaining: 8 });
});
