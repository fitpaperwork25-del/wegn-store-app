/**
 * Generic inventory tracking capture pipeline, shared by Purchase Order
 * Receive and Smart Receive.
 *
 * TrackingMode is the single extension point: today there is one real
 * capability (expiration_batch, backed by inventory_batches - a
 * quantity-based batch/lot/expiration store, deliberately left
 * un-generalized). A future capability (serial numbers, warranty,
 * regulated-product metadata) is added by extending TrackingMode and
 * TrackingCaptureInput with a new arm and giving buildTrackingRecord() a
 * new case - almost always backed by its own table, since a unit-level
 * capability like serial numbers has a fundamentally different shape than
 * a quantity-based batch. Neither receiving flow's per-line loop, nor
 * FEFO, nor the inventory_batches pipeline needs to change when that
 * happens - both loops only ever call buildTrackingRecord() once per line
 * and persist whatever it returns.
 */

export type TrackingMode = "none" | "expiration_batch";

export type TrackingSource =
  | { kind: "purchase_order"; purchaseOrderId: string; purchaseOrderItemId: string }
  | { kind: "receiving_session"; receivingSessionId: string; receivingSessionItemId: string };

export type TrackingContext = {
  businessId: string;
  productId: string;
  supplierId: string | null;
  supplierName: string | null;
};

export type ExpirationBatchCaptureInput = {
  mode: "expiration_batch";
  /** Single "Batch / Lot Number" field per the approved PO Receive UI - lotNumber stays null unless a caller (e.g. Smart Receive's richer AI-extraction review screen) supplies it separately. */
  batchNumber: string;
  lotNumber?: string | null;
  manufacturedDate?: string | null;
  expirationDate: string;
  quantityReceived: number;
  unitCost: number;
};

export type TrackingCaptureInput = { mode: "none" } | ExpirationBatchCaptureInput;

export type InventoryBatchInsertRow = {
  business_id: string;
  product_id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  batch_number: string | null;
  lot_number: string | null;
  manufactured_date: string | null;
  expiration_date: string | null;
  quantity_received: number;
  quantity_remaining: number;
  unit_cost: number;
  status: "active";
  receiving_session_id: string | null;
  receiving_session_item_id: string | null;
  purchase_order_id: string | null;
  purchase_order_item_id: string | null;
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Required-field rule for the expiration_batch mode - Batch/Lot Number and Expiration Date are required; Manufacture Date is optional. */
export function validateExpirationBatchCapture(input: { batchNumber: string; expirationDate: string }): ValidationResult<true> {
  if (!input.batchNumber || !input.batchNumber.trim()) {
    return { ok: false, error: "Batch / Lot Number is required for a product with expiration/batch tracking enabled." };
  }
  if (!input.expirationDate || !input.expirationDate.trim()) {
    return { ok: false, error: "Expiration Date is required for a product with expiration/batch tracking enabled." };
  }
  return { ok: true, value: true };
}

function sourceColumns(source: TrackingSource): Pick<InventoryBatchInsertRow, "receiving_session_id" | "receiving_session_item_id" | "purchase_order_id" | "purchase_order_item_id"> {
  if (source.kind === "purchase_order") {
    return { receiving_session_id: null, receiving_session_item_id: null, purchase_order_id: source.purchaseOrderId, purchase_order_item_id: source.purchaseOrderItemId };
  }
  return { receiving_session_id: source.receivingSessionId, receiving_session_item_id: source.receivingSessionItemId, purchase_order_id: null, purchase_order_item_id: null };
}

/** Pure row-shaping for the expiration_batch mode - the one real implementation behind buildTrackingRecord() today. */
export function buildInventoryBatchRow(input: ExpirationBatchCaptureInput, source: TrackingSource, ctx: TrackingContext): InventoryBatchInsertRow {
  return {
    business_id: ctx.businessId,
    product_id: ctx.productId,
    supplier_id: ctx.supplierId,
    supplier_name: ctx.supplierName,
    batch_number: input.batchNumber || null,
    lot_number: input.lotNumber || null,
    manufactured_date: input.manufacturedDate || null,
    expiration_date: input.expirationDate || null,
    quantity_received: input.quantityReceived,
    quantity_remaining: input.quantityReceived,
    unit_cost: input.unitCost,
    status: "active",
    ...sourceColumns(source),
  };
}

/**
 * Dispatch point for the tracking model. Both PO Receive and Smart Receive
 * call this once per line and store whatever it returns (null for "none").
 * Adding a future mode means adding a new case here, not changing either
 * caller.
 */
export function buildTrackingRecord(input: TrackingCaptureInput, source: TrackingSource, ctx: TrackingContext): InventoryBatchInsertRow | null {
  switch (input.mode) {
    case "expiration_batch":
      return buildInventoryBatchRow(input, source, ctx);
    case "none":
      return null;
  }
}
