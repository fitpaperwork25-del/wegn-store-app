import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_purchase_orders - Purchase Order live-data read-only lookup.
 *
 * Deliberately has no date/"as of when" filter: purchase_orders has no
 * column recording when a status last changed (created_at is creation
 * time only, usually while still draft - see the investigation report).
 * This tool answers current-status and content questions only; it must
 * never be asked to guess when something happened.
 */

export type PurchaseOrderStatusFilter = "draft" | "ordered" | "partially_received" | "received" | "cancelled" | "open" | "all";

export type GetPurchaseOrdersInput = {
  poNumber?: string;
  supplierName?: string;
  status?: PurchaseOrderStatusFilter;
  productName?: string;
  minSubtotal?: number;
  maxSubtotal?: number;
};

export type PurchaseOrderRow = {
  po_number: string;
  status: string;
  supplier_id: string;
  supplier_name: string;
  subtotal: number;
  notes: string | null;
  created_at: string;
  item_count: number;
  matched_products: string[];
};

export type GetPurchaseOrdersOutput = {
  purchase_orders: PurchaseOrderRow[];
  totals: { count: number; subtotal_sum: number };
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Matches getPurchasingDashboardSummary()'s "open" definition in src/lib/purchasing/purchasingHelpers.ts - duplicated here (not imported) because Deno edge functions in this codebase never cross-import from src/. */
export const OPEN_STATUSES = ["draft", "ordered", "partially_received"] as const;

const STATUS_VALUES = ["draft", "ordered", "partially_received", "received", "cancelled", "open", "all"] as const;

export function validateGetPurchaseOrdersInput(input: unknown): ValidationResult<GetPurchaseOrdersInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: GetPurchaseOrdersInput = {};

  if (obj.poNumber !== undefined) {
    if (typeof obj.poNumber !== "string" || obj.poNumber.trim().length === 0) {
      return { ok: false, error: "poNumber must be a non-empty string when provided" };
    }
    if (obj.poNumber.length > 100) return { ok: false, error: "poNumber must be 100 characters or fewer" };
    result.poNumber = obj.poNumber.trim();
  }

  if (obj.supplierName !== undefined) {
    if (typeof obj.supplierName !== "string" || obj.supplierName.trim().length === 0) {
      return { ok: false, error: "supplierName must be a non-empty string when provided" };
    }
    if (obj.supplierName.length > 200) return { ok: false, error: "supplierName must be 200 characters or fewer" };
    result.supplierName = obj.supplierName.trim();
  }

  if (obj.status !== undefined) {
    if (typeof obj.status !== "string" || !(STATUS_VALUES as readonly string[]).includes(obj.status)) {
      return { ok: false, error: `status must be one of ${STATUS_VALUES.join(", ")}` };
    }
    result.status = obj.status as PurchaseOrderStatusFilter;
  }

  if (obj.productName !== undefined) {
    if (typeof obj.productName !== "string" || obj.productName.trim().length === 0) {
      return { ok: false, error: "productName must be a non-empty string when provided" };
    }
    if (obj.productName.length > 200) return { ok: false, error: "productName must be 200 characters or fewer" };
    result.productName = obj.productName.trim();
  }

  if (obj.minSubtotal !== undefined) {
    if (typeof obj.minSubtotal !== "number" || !Number.isFinite(obj.minSubtotal) || obj.minSubtotal < 0) {
      return { ok: false, error: "minSubtotal must be a non-negative number" };
    }
    result.minSubtotal = obj.minSubtotal;
  }

  if (obj.maxSubtotal !== undefined) {
    if (typeof obj.maxSubtotal !== "number" || !Number.isFinite(obj.maxSubtotal) || obj.maxSubtotal < 0) {
      return { ok: false, error: "maxSubtotal must be a non-negative number" };
    }
    result.maxSubtotal = obj.maxSubtotal;
  }

  if (result.minSubtotal !== undefined && result.maxSubtotal !== undefined && result.minSubtotal > result.maxSubtotal) {
    return { ok: false, error: "minSubtotal must not be greater than maxSubtotal" };
  }

  return { ok: true, value: result };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type RawSupplierRow = { id: string; name: string };
export type RawPurchaseOrderRow = {
  id: string;
  po_number: string;
  status: string;
  supplier_id: string;
  subtotal: number | null;
  notes: string | null;
  created_at: string;
};
export type RawPoItemProductRow = { purchase_order_id: string; product_name: string };

export type PurchaseOrdersRawData = {
  purchaseOrders: RawPurchaseOrderRow[];
  suppliers: RawSupplierRow[];
  itemProducts: RawPoItemProductRow[];
};

/**
 * Pure filter/shape - no I/O, fully unit-testable. The heavy filtering
 * (status, subtotal range, PO number, supplier) already happened
 * server-side in the executor's query; this only applies the productName
 * intersection (which needs the item/product join already fetched) and
 * computes exact totals over the final set.
 */
export function computePurchaseOrders(raw: PurchaseOrdersRawData, filter: GetPurchaseOrdersInput): GetPurchaseOrdersOutput {
  const supplierNameById = new Map(raw.suppliers.map((s) => [s.id, s.name]));

  const productsByPoId = new Map<string, string[]>();
  for (const row of raw.itemProducts) {
    const list = productsByPoId.get(row.purchase_order_id) ?? [];
    list.push(row.product_name);
    productsByPoId.set(row.purchase_order_id, list);
  }

  const needle = filter.productName?.toLowerCase();
  const purchase_orders: PurchaseOrderRow[] = [];

  for (const po of raw.purchaseOrders) {
    const products = productsByPoId.get(po.id) ?? [];
    let matched_products: string[] = [];
    if (needle) {
      matched_products = products.filter((p) => p.toLowerCase().includes(needle));
      if (matched_products.length === 0) continue;
    }
    purchase_orders.push({
      po_number: po.po_number,
      status: po.status,
      supplier_id: po.supplier_id,
      supplier_name: supplierNameById.get(po.supplier_id) ?? "Unknown supplier",
      subtotal: po.subtotal ?? 0,
      notes: po.notes,
      created_at: po.created_at,
      item_count: products.length,
      matched_products,
    });
  }

  const subtotal_sum = round2(purchase_orders.reduce((sum, r) => sum + r.subtotal, 0));

  return { purchase_orders, totals: { count: purchase_orders.length, subtotal_sum } };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getPurchaseOrders(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string, filter: GetPurchaseOrdersInput) => Promise<PurchaseOrdersRawData>
): Promise<ValidationResult<GetPurchaseOrdersOutput>> {
  const validated = validateGetPurchaseOrdersInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId, validated.value);
  return { ok: true, value: computePurchaseOrders(raw, validated.value) };
}

function extractProductName(products: { name: string } | { name: string }[] | null): string | null {
  if (!products) return null;
  if (Array.isArray(products)) return products[0]?.name ?? null;
  return products.name ?? null;
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter in addition to RLS - defense in depth, matching every
 * other tool executor in this registry. Status/subtotal/PO-number/supplier
 * filters are applied as real query predicates (server-side filtering),
 * not fetched-then-filtered in memory.
 */
export async function fetchPurchaseOrdersRawData(
  supabase: SupabaseClient,
  businessId: string,
  filter: GetPurchaseOrdersInput
): Promise<PurchaseOrdersRawData> {
  const suppliersRes = await supabase.from("suppliers").select("id, name").eq("business_id", businessId);
  if (suppliersRes.error) throw suppliersRes.error;
  const suppliers = (suppliersRes.data ?? []) as RawSupplierRow[];

  let supplierIdFilter: string[] | null = null;
  if (filter.supplierName) {
    const needle = filter.supplierName.toLowerCase();
    supplierIdFilter = suppliers.filter((s) => s.name.toLowerCase().includes(needle)).map((s) => s.id);
    if (supplierIdFilter.length === 0) {
      return { purchaseOrders: [], suppliers, itemProducts: [] };
    }
  }

  let query = supabase.from("purchase_orders").select("id, po_number, status, supplier_id, subtotal, notes, created_at").eq("business_id", businessId);

  if (filter.status && filter.status !== "all") {
    query = filter.status === "open" ? query.in("status", OPEN_STATUSES) : query.eq("status", filter.status);
  }
  if (filter.poNumber) query = query.ilike("po_number", `%${filter.poNumber}%`);
  if (filter.minSubtotal !== undefined) query = query.gte("subtotal", filter.minSubtotal);
  if (filter.maxSubtotal !== undefined) query = query.lte("subtotal", filter.maxSubtotal);
  if (supplierIdFilter) query = query.in("supplier_id", supplierIdFilter);

  const poRes = await query;
  if (poRes.error) throw poRes.error;
  const purchaseOrders = (poRes.data ?? []) as RawPurchaseOrderRow[];

  if (purchaseOrders.length === 0) {
    return { purchaseOrders: [], suppliers, itemProducts: [] };
  }

  const itemsRes = await supabase
    .from("purchase_order_items")
    .select("purchase_order_id, products(name)")
    .in(
      "purchase_order_id",
      purchaseOrders.map((po) => po.id)
    );
  if (itemsRes.error) throw itemsRes.error;

  const itemProducts: RawPoItemProductRow[] = ((itemsRes.data ?? []) as { purchase_order_id: string; products: { name: string } | { name: string }[] | null }[])
    .map((row) => ({ purchase_order_id: row.purchase_order_id, product_name: extractProductName(row.products) }))
    .filter((r): r is RawPoItemProductRow => r.product_name !== null);

  return { purchaseOrders, suppliers, itemProducts };
}
