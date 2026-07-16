import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_low_stock_products - Inventory Reorder Alerts read-only lookup.
 *
 * The low-stock filter/sort rule mirrors getLowStockProducts() in
 * src/lib/product/productHelpers.ts exactly (active products below
 * reorder_level, sorted most-short-of-target first). The suggested
 * reorder quantity mirrors aiReorderRecs' velocity formula in App.tsx
 * exactly (7-day velocity preferred, falling back to a 30-day average;
 * target = 30 days of forward cover above reorder_level). Neither is a
 * new business rule - both are reimplemented here (not imported) because
 * Deno edge functions in this codebase never cross-import from src/.
 */

export type LowStockInput = { supplierName?: string };

export type LowStockProductRow = {
  product_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  quantity_on_hand: number;
  reorder_level: number;
  supplier_id: string | null;
  supplier_name: string | null;
  suggested_reorder_qty: number;
  sold_last_7_days: number;
  sold_last_30_days: number;
  has_sales_data: boolean;
};

export type LowStockOutput = {
  low_stock_products: LowStockProductRow[];
  totals: { count: number };
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateLowStockInput(input: unknown): ValidationResult<LowStockInput> {
  if (input === null || input === undefined) return { ok: true, value: {} };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;
  const result: LowStockInput = {};

  if (obj.supplierName !== undefined) {
    if (typeof obj.supplierName !== "string" || obj.supplierName.trim().length === 0) {
      return { ok: false, error: "supplierName must be a non-empty string when provided" };
    }
    if (obj.supplierName.length > 200) return { ok: false, error: "supplierName must be 200 characters or fewer" };
    result.supplierName = obj.supplierName.trim();
  }

  return { ok: true, value: result };
}

export type RawProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  reorder_level: number | null;
  supplier_id: string | null;
  quantity_on_hand: number;
};
export type RawSupplierRow = { id: string; name: string };
export type RawSaleRow = { id: string; created_at: string };
export type RawSaleItemRow = { sale_id: string; product_id: string; quantity: number };

export type LowStockRawData = {
  /** Already server-filtered: business_id, status='active'. */
  products: RawProductRow[];
  suppliers: RawSupplierRow[];
  /** Completed sales in the last 30 days, business-scoped. */
  sales30d: RawSaleRow[];
  /** sale_items for sales30d. */
  saleItems: RawSaleItemRow[];
};

/** Pure filter/sort/aggregate - no I/O, fully unit-testable. */
export function computeLowStockProducts(raw: LowStockRawData, filter: LowStockInput): LowStockOutput {
  const supplierNameById = new Map(raw.suppliers.map((s) => [s.id, s.name]));

  const now = Date.now();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  const saleIds7 = new Set(raw.sales30d.filter((s) => now - new Date(s.created_at).getTime() <= ms7).map((s) => s.id));

  const sold7: Record<string, number> = {};
  const sold30: Record<string, number> = {};
  for (const si of raw.saleItems) {
    sold30[si.product_id] = (sold30[si.product_id] ?? 0) + si.quantity;
    if (saleIds7.has(si.sale_id)) sold7[si.product_id] = (sold7[si.product_id] ?? 0) + si.quantity;
  }

  // getLowStockProducts()'s exact rule: active + reorder_level set + on hand below it.
  let candidates = raw.products.filter((p) => p.reorder_level !== null && p.quantity_on_hand < p.reorder_level);

  if (filter.supplierName) {
    const needle = filter.supplierName.toLowerCase();
    const matchingSupplierIds = new Set(raw.suppliers.filter((s) => s.name.toLowerCase().includes(needle)).map((s) => s.id));
    candidates = candidates.filter((p) => p.supplier_id && matchingSupplierIds.has(p.supplier_id));
  }

  // getLowStockProducts()'s exact sort: most-short-of-target first.
  const sorted = [...candidates].sort((a, b) => (a.quantity_on_hand - (a.reorder_level ?? 0)) - (b.quantity_on_hand - (b.reorder_level ?? 0)));

  const low_stock_products: LowStockProductRow[] = sorted.map((p) => {
    const reorderLevel = p.reorder_level ?? 0;
    const s7 = sold7[p.id] ?? 0;
    const s30 = sold30[p.id] ?? 0;
    const hasData = s30 > 0;

    // aiReorderRecs' exact velocity formula.
    let suggested_reorder_qty = 0;
    if (hasData) {
      const velocity = s7 > 0 ? s7 / 7 : s30 / 30;
      const targetStock = Math.ceil(velocity * 30) + reorderLevel;
      suggested_reorder_qty = Math.max(1, Math.ceil(targetStock - p.quantity_on_hand));
    }

    return {
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      quantity_on_hand: p.quantity_on_hand,
      reorder_level: reorderLevel,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_id ? supplierNameById.get(p.supplier_id) ?? "Unknown supplier" : null,
      suggested_reorder_qty,
      sold_last_7_days: s7,
      sold_last_30_days: s30,
      has_sales_data: hasData,
    };
  });

  return { low_stock_products, totals: { count: low_stock_products.length } };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getLowStockProducts(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string) => Promise<LowStockRawData>
): Promise<ValidationResult<LowStockOutput>> {
  const validated = validateLowStockInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId);
  return { ok: true, value: computeLowStockProducts(raw, validated.value) };
}

function extractQuantityOnHand(inv: { quantity_on_hand: number } | { quantity_on_hand: number }[] | null): number {
  if (!inv) return 0;
  if (Array.isArray(inv)) return inv[0]?.quantity_on_hand ?? 0;
  return inv.quantity_on_hand ?? 0;
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter on every query in addition to RLS - defense in depth,
 * matching every other tool executor in this registry.
 */
export async function fetchLowStockProductsRawData(supabase: SupabaseClient, businessId: string): Promise<LowStockRawData> {
  const productsRes = await supabase
    .from("products")
    .select("id, name, sku, barcode, reorder_level, supplier_id, inventory(quantity_on_hand)")
    .eq("business_id", businessId)
    .eq("status", "active");
  if (productsRes.error) throw productsRes.error;
  const products = ((productsRes.data ?? []) as { id: string; name: string; sku: string | null; barcode: string | null; reorder_level: number | null; supplier_id: string | null; inventory: { quantity_on_hand: number } | { quantity_on_hand: number }[] | null }[]).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    reorder_level: row.reorder_level,
    supplier_id: row.supplier_id,
    quantity_on_hand: extractQuantityOnHand(row.inventory),
  }));

  const suppliersRes = await supabase.from("suppliers").select("id, name").eq("business_id", businessId);
  if (suppliersRes.error) throw suppliersRes.error;
  const suppliers = (suppliersRes.data ?? []) as RawSupplierRow[];

  const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const salesRes = await supabase.from("sales").select("id, created_at").eq("business_id", businessId).eq("status", "completed").gte("created_at", rangeStart);
  if (salesRes.error) throw salesRes.error;
  const sales30d = (salesRes.data ?? []) as RawSaleRow[];

  if (sales30d.length === 0) return { products, suppliers, sales30d: [], saleItems: [] };

  const saleIds = sales30d.map((s) => s.id);
  const itemsRes = await supabase.from("sale_items").select("sale_id, product_id, quantity").in("sale_id", saleIds);
  if (itemsRes.error) throw itemsRes.error;
  const saleItems = (itemsRes.data ?? []) as RawSaleItemRow[];

  return { products, suppliers, sales30d, saleItems };
}
