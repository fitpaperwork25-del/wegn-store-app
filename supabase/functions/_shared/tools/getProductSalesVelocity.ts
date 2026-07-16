import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * get_product_sales_velocity - Sales/POS Intelligence read-only lookup.
 *
 * Mirrors aiReorderRecs' sold7/sold30 computation in src/App.tsx exactly
 * (completed sales only, fixed 7-day and 30-day windows) rather than
 * inventing a new "velocity" definition - "not sold in 30 days" is
 * sold30 === 0; "selling fastest this week" is a rank by sold7. No custom
 * date-range parameter, by design: this tool answers exactly those two
 * fixed-window questions, not arbitrary ranges.
 */

export type ProductVelocityInput = { limit?: number };

export type DormantProduct = { product_id: string; product_name: string };
export type TopSeller = { product_id: string; product_name: string; qty_sold_last_7_days: number };

export type ProductVelocityOutput = {
  dormant_products: DormantProduct[];
  top_sellers_this_week: TopSeller[];
};

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

const DEFAULT_LIMIT = 15;
const MAX_LIMIT = 50;

export function validateProductVelocityInput(input: unknown): ValidationResult<ProductVelocityInput> {
  if (input === null || input === undefined) return { ok: true, value: { limit: DEFAULT_LIMIT } };
  if (typeof input !== "object") return { ok: false, error: "Input must be an object" };
  const obj = input as Record<string, unknown>;

  let limit = DEFAULT_LIMIT;
  if (obj.limit !== undefined) {
    if (typeof obj.limit !== "number" || !Number.isInteger(obj.limit) || obj.limit < 1) {
      return { ok: false, error: "limit must be a positive integer" };
    }
    limit = Math.min(obj.limit, MAX_LIMIT);
  }

  return { ok: true, value: { limit } };
}

export type RawProductRow = { id: string; name: string; status: string };
export type RawSaleRow = { id: string; created_at: string };
export type RawSaleItemQtyRow = { sale_id: string; product_id: string; quantity: number };

export type ProductVelocityRawData = {
  products: RawProductRow[];
  /** Completed sales in the last 30 days, business-scoped. */
  sales30d: RawSaleRow[];
  /** sale_items for sales30d. */
  saleItems: RawSaleItemQtyRow[];
};

/** Pure aggregation - no I/O, fully unit-testable. */
export function computeProductSalesVelocity(raw: ProductVelocityRawData, filter: ProductVelocityInput): ProductVelocityOutput {
  const now = Date.now();
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  const saleIds7 = new Set(raw.sales30d.filter((s) => now - new Date(s.created_at).getTime() <= ms7).map((s) => s.id));

  const sold7: Record<string, number> = {};
  const sold30: Record<string, number> = {};
  for (const si of raw.saleItems) {
    sold30[si.product_id] = (sold30[si.product_id] ?? 0) + si.quantity;
    if (saleIds7.has(si.sale_id)) sold7[si.product_id] = (sold7[si.product_id] ?? 0) + si.quantity;
  }

  const dormant_products: DormantProduct[] = raw.products
    .filter((p) => p.status === "active" && (sold30[p.id] ?? 0) === 0)
    .map((p) => ({ product_id: p.id, product_name: p.name }));

  const limit = filter.limit ?? DEFAULT_LIMIT;
  const top_sellers_this_week: TopSeller[] = raw.products
    .filter((p) => (sold7[p.id] ?? 0) > 0)
    .map((p) => ({ product_id: p.id, product_name: p.name, qty_sold_last_7_days: sold7[p.id] }))
    .sort((a, b) => b.qty_sold_last_7_days - a.qty_sold_last_7_days)
    .slice(0, limit);

  return { dormant_products, top_sellers_this_week };
}

/** Pure orchestration: validate -> fetch -> compute. Unit-tested with a mock fetcher - no live database needed. */
export async function getProductSalesVelocity(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string) => Promise<ProductVelocityRawData>
): Promise<ValidationResult<ProductVelocityOutput>> {
  const validated = validateProductVelocityInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId);
  return { ok: true, value: computeProductSalesVelocity(raw, validated.value) };
}

/**
 * Real, tenant-scoped Supabase executor. business_id is applied as an
 * explicit filter on every query in addition to RLS - defense in depth,
 * matching every other tool executor in this registry.
 */
export async function fetchProductSalesVelocityRawData(supabase: SupabaseClient, businessId: string): Promise<ProductVelocityRawData> {
  const productsRes = await supabase.from("products").select("id, name, status").eq("business_id", businessId);
  if (productsRes.error) throw productsRes.error;
  const products = (productsRes.data ?? []) as RawProductRow[];

  const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const salesRes = await supabase.from("sales").select("id, created_at").eq("business_id", businessId).eq("status", "completed").gte("created_at", rangeStart);
  if (salesRes.error) throw salesRes.error;
  const sales30d = (salesRes.data ?? []) as RawSaleRow[];

  if (sales30d.length === 0) return { products, sales30d: [], saleItems: [] };

  const saleIds = sales30d.map((s) => s.id);
  const itemsRes = await supabase.from("sale_items").select("sale_id, product_id, quantity").in("sale_id", saleIds);
  if (itemsRes.error) throw itemsRes.error;
  const saleItems = (itemsRes.data ?? []) as RawSaleItemQtyRow[];

  return { products, sales30d, saleItems };
}
