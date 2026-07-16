import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  validateSearchProductsInput,
  sanitizeForPostgrestFilter,
  SEARCH_PRODUCTS_DEFAULT_LIMIT,
  type SearchProductsInput,
  type ValidationResult,
} from "./searchProducts.ts";

/**
 * get_product_details - the "later milestone" search_products' own doc
 * comment names for cost/margin data. Reuses search_products' input
 * validation, query sanitization, and name/SKU/barcode matching directly
 * (same file, same functions) rather than reimplementing them - the only
 * difference is the extra columns fetched and the pricing-policy math
 * layered on top.
 *
 * The break-even/minimum-safe/target-price formula is an exact mirror of
 * the live calculation in src/components/CatalogManagementPanel.tsx's Edit
 * Product form (lines ~451-468 at time of writing) - not a new business
 * rule. current_margin_percent is the one new, standard-arithmetic
 * addition: the margin the listed selling price actually achieves over
 * break-even.
 */

export type GetProductDetailsInput = SearchProductsInput;

export type ProductDetailRow = {
  product_id: string;
  product_name: string;
  sku: string | null;
  barcode: string | null;
  status: string;
  selling_price: number;
  quantity_on_hand: number;
  supplier_id: string | null;
  supplier_name: string | null;
  category_id: string | null;
  category_name: string | null;
  cost_price: number | null;
  average_cost: number;
  estimated_overhead_pct: number;
  break_even_price: number;
  minimum_margin_percent: number | null;
  minimum_safe_price: number | null;
  target_margin_percent: number | null;
  target_price: number | null;
  current_margin_percent: number | null;
};

export type GetProductDetailsOutput = { products: ProductDetailRow[] };

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type RawProductDetailRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  status: string;
  selling_price: number;
  quantity_on_hand: number;
  supplier_id: string | null;
  category_id: string | null;
  cost_price: number | null;
  average_cost: number;
  estimated_overhead_pct: number;
  target_margin_percent: number | null;
  minimum_margin_percent: number | null;
};
export type RawSupplierRow = { id: string; name: string };
export type RawCategoryRow = { id: string; name: string };

export type ProductDetailsRawData = {
  products: RawProductDetailRow[];
  suppliers: RawSupplierRow[];
  categories: RawCategoryRow[];
};

/** Pure shape/pricing-math - no I/O, fully unit-testable. */
export function computeProductDetails(raw: ProductDetailsRawData): GetProductDetailsOutput {
  const supplierNameById = new Map(raw.suppliers.map((s) => [s.id, s.name]));
  const categoryNameById = new Map(raw.categories.map((c) => [c.id, c.name]));

  const products: ProductDetailRow[] = raw.products.map((p) => {
    // Exact mirror of CatalogManagementPanel.tsx's Edit Product form calculation.
    const oh = p.estimated_overhead_pct ?? 0;
    const breakEven = round2(p.average_cost * (1 + oh / 100));
    const minimum_safe_price = p.minimum_margin_percent !== null && p.minimum_margin_percent > 0 ? round2(breakEven * (1 + p.minimum_margin_percent / 100)) : null;
    const target_price = p.target_margin_percent !== null && p.target_margin_percent > 0 ? round2(breakEven * (1 + p.target_margin_percent / 100)) : null;
    const current_margin_percent = p.selling_price > 0 ? round2(((p.selling_price - breakEven) / p.selling_price) * 100) : null;

    return {
      product_id: p.id,
      product_name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      status: p.status,
      selling_price: p.selling_price,
      quantity_on_hand: p.quantity_on_hand,
      supplier_id: p.supplier_id,
      supplier_name: p.supplier_id ? supplierNameById.get(p.supplier_id) ?? "Unknown supplier" : null,
      category_id: p.category_id,
      category_name: p.category_id ? categoryNameById.get(p.category_id) ?? "Unknown category" : null,
      cost_price: p.cost_price,
      average_cost: p.average_cost,
      estimated_overhead_pct: oh,
      break_even_price: breakEven,
      minimum_margin_percent: p.minimum_margin_percent,
      minimum_safe_price,
      target_margin_percent: p.target_margin_percent,
      target_price,
      current_margin_percent,
    };
  });

  return { products };
}

/** Pure orchestration: reuses validateSearchProductsInput directly - not a reimplementation. */
export async function getProductDetails(
  rawInput: unknown,
  ctx: { businessId: string },
  fetcher: (businessId: string, input: SearchProductsInput) => Promise<ProductDetailsRawData>
): Promise<ValidationResult<GetProductDetailsOutput>> {
  const validated = validateSearchProductsInput(rawInput);
  if (!validated.ok) return validated;
  const raw = await fetcher(ctx.businessId, validated.value);
  return { ok: true, value: computeProductDetails(raw) };
}

function extractQuantityOnHand(inv: { quantity_on_hand: number } | { quantity_on_hand: number }[] | null): number {
  if (!inv) return 0;
  if (Array.isArray(inv)) return inv[0]?.quantity_on_hand ?? 0;
  return inv.quantity_on_hand ?? 0;
}

/**
 * Real, tenant-scoped Supabase executor. Reuses sanitizeForPostgrestFilter
 * and the same name/SKU/barcode .or() matching pattern search_products'
 * own executor uses - only the selected column list (and the supplier/
 * category name lookups) differ. business_id is applied as an explicit
 * filter in addition to RLS - defense in depth, matching every other tool
 * executor in this registry.
 */
export async function fetchProductDetailsRawData(supabase: SupabaseClient, businessId: string, input: SearchProductsInput): Promise<ProductDetailsRawData> {
  const pattern = `%${sanitizeForPostgrestFilter(input.query)}%`;
  const limit = input.limit ?? SEARCH_PRODUCTS_DEFAULT_LIMIT;

  const productsRes = await supabase
    .from("products")
    .select("id, name, sku, barcode, selling_price, status, cost_price, average_cost, estimated_overhead_pct, target_margin_percent, minimum_margin_percent, supplier_id, category_id, inventory(quantity_on_hand)")
    .eq("business_id", businessId)
    .or(`name.ilike.${pattern},sku.ilike.${pattern},barcode.ilike.${pattern}`)
    .limit(limit);
  if (productsRes.error) throw productsRes.error;

  const products = (
    (productsRes.data ?? []) as {
      id: string;
      name: string;
      sku: string | null;
      barcode: string | null;
      selling_price: number;
      status: string;
      cost_price: number | null;
      average_cost: number;
      estimated_overhead_pct: number;
      target_margin_percent: number | null;
      minimum_margin_percent: number | null;
      supplier_id: string | null;
      category_id: string | null;
      inventory: { quantity_on_hand: number } | { quantity_on_hand: number }[] | null;
    }[]
  ).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    status: row.status,
    selling_price: row.selling_price,
    quantity_on_hand: extractQuantityOnHand(row.inventory),
    supplier_id: row.supplier_id,
    category_id: row.category_id,
    cost_price: row.cost_price,
    average_cost: row.average_cost,
    estimated_overhead_pct: row.estimated_overhead_pct,
    target_margin_percent: row.target_margin_percent,
    minimum_margin_percent: row.minimum_margin_percent,
  }));

  if (products.length === 0) return { products: [], suppliers: [], categories: [] };

  const suppliersRes = await supabase.from("suppliers").select("id, name").eq("business_id", businessId);
  if (suppliersRes.error) throw suppliersRes.error;
  const suppliers = (suppliersRes.data ?? []) as RawSupplierRow[];

  const categoriesRes = await supabase.from("categories").select("id, name").eq("business_id", businessId);
  if (categoriesRes.error) throw categoriesRes.error;
  const categories = (categoriesRes.data ?? []) as RawCategoryRow[];

  return { products, suppliers, categories };
}
